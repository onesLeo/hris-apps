import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestContext } from '../../common/context/request-context';
import { DATABASE_SERVICE, IDatabaseService } from '../../common/database/database.types';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import type {
  EmployeeListQuery,
  EmployeeRow,
  EmployeeProfileSnapshot,
  HireEmployeeDto,
  LifecycleEventRow,
  PromoteEmployeeDto,
  RehireEmployeeDto,
  ResignEmployeeDto,
  SecondmentDto,
  SpellRow,
  TerminateEmployeeDto,
  TransferEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeProfileDto,
} from './employee.types';
import { EmployeeIdentityRepository } from './employee-identity.repository';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly encryption: EncryptionService,
    private readonly events: EventEmitter2,
    private readonly logger: StructuredLoggerService,
    private readonly identityRepository: EmployeeIdentityRepository,
  ) {
    this.logger.setContext('EmployeeService');
  }

  async hire(tenantId: string, dto: HireEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const displayName = `${dto.firstName} ${dto.lastName}`;

    const [employee] = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      INSERT INTO employees (
        tenant_id, employee_number, first_name, last_name, display_name,
        email, phone, date_of_birth, gender, nationality, status, hire_date, manager_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      tenantId, dto.employeeNumber, dto.firstName, dto.lastName, displayName,
      dto.email, dto.phone ?? null, dto.dateOfBirth ?? null,
      dto.gender ?? null, dto.nationality ?? null, dto.status ?? 'active',
      dto.hireDate,
      dto.managerId ?? null,
    ]);

    if (!employee) throw new BadRequestException('Failed to create employee record');

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from,
        probation_end_date, notice_period_days, job_grade
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      tenantId, employee.id, dto.departmentId, dto.locationId,
      dto.jobTitle, dto.employmentType ?? 'full_time',
      dto.workArrangement ?? 'office', dto.hireDate,
      dto.probationEndDate ?? null, dto.noticePeriodDays ?? null, dto.jobGrade ?? null,
    ]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'hired',$3,$4,$5)
    `, [
      tenantId, employee.id,
      JSON.stringify({ jobTitle: dto.jobTitle, departmentId: dto.departmentId }),
      dto.hireDate, actorId,
    ]);

    this.events.emit('employee.hired', {
      tenantId, employeeId: employee.id, employeeNumber: dto.employeeNumber,
      displayName, jobTitle: dto.jobTitle,
      departmentId: dto.departmentId, locationId: dto.locationId,
      hireDate: dto.hireDate, actorId,
    });

    this.logger.log('employee hired', { employeeId: employee.id });
    return this.getById(tenantId, employee.id);
  }

  async list(tenantId: string, query: EmployeeListQuery): Promise<{ data: EmployeeRow[]; nextCursor: string | null }> {
    const limit = Math.min(query.limit ?? 20, 100);
    const params: unknown[] = [tenantId];
    const conditions: string[] = ['e.tenant_id = $1'];
    let i = 2;

    if (query.status) { conditions.push(`e.status = $${i++}`); params.push(query.status); }
    if (query.departmentId) { conditions.push(`s.department_id = $${i++}`); params.push(query.departmentId); }
    if (query.locationId) { conditions.push(`s.location_id = $${i++}`); params.push(query.locationId); }
    if (query.search) {
      conditions.push(`(e.display_name ILIKE $${i} OR e.employee_number ILIKE $${i} OR e.email ILIKE $${i})`);
      params.push(`%${query.search}%`); i++;
    }
    if (query.cursor) { conditions.push(`e.id > $${i++}`); params.push(query.cursor); }

    const where = conditions.join(' AND ');
    const rows = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      SELECT e.*,
        s.job_title, s.department_id, s.employment_type, s.work_arrangement,
        s.location_id, s.probation_end_date, s.notice_period_days, s.job_grade,
        d.name AS department_name,
        l.name AS location_name,
        m.display_name AS manager_display_name
      FROM employees e
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN locations   l ON l.id = s.location_id
      LEFT JOIN employees   m ON m.id = e.manager_id
      WHERE ${where}
      ORDER BY e.id
      LIMIT $${i}
    `, [...params, limit + 1]);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    return { data, nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null };
  }

  async getById(tenantId: string, id: string): Promise<EmployeeRow> {
    const [row] = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      SELECT e.*,
        s.job_title, s.department_id, s.employment_type, s.work_arrangement,
        s.location_id, s.probation_end_date, s.notice_period_days, s.job_grade,
        d.name AS department_name,
        l.name AS location_name,
        m.display_name AS manager_display_name
      FROM employees e
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN locations   l ON l.id = s.location_id
      LEFT JOIN employees   m ON m.id = e.manager_id
      WHERE e.id = $1 AND e.tenant_id = $2
    `, [id, tenantId]);

    if (!row) throw new NotFoundException(`Employee ${id} not found`);
    return row;
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto): Promise<EmployeeRow> {
    const fields: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (dto.firstName !== undefined) { fields.push(`first_name = $${i++}`); params.push(dto.firstName); }
    if (dto.lastName !== undefined)  { fields.push(`last_name = $${i++}`);  params.push(dto.lastName); }
    if (dto.email !== undefined)     { fields.push(`email = $${i++}`);      params.push(dto.email); }
    if (dto.phone !== undefined)     { fields.push(`phone = $${i++}`);      params.push(dto.phone); }
    if (dto.dateOfBirth !== undefined) { fields.push(`date_of_birth = $${i++}`); params.push(dto.dateOfBirth); }
    if (dto.gender !== undefined)    { fields.push(`gender = $${i++}`);     params.push(dto.gender); }
    if (dto.nationality !== undefined) { fields.push(`nationality = $${i++}`); params.push(dto.nationality); }

    if (fields.length === 0) return this.getById(tenantId, id);

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const current = await this.getById(tenantId, id);
      const firstName = dto.firstName ?? current.first_name;
      const lastName = dto.lastName ?? current.last_name;
      fields.push(`display_name = $${i++}`);
      params.push(`${firstName} ${lastName}`);
    }

    fields.push(`updated_at = NOW()`);
    params.push(id, tenantId);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employees SET ${fields.join(', ')}
      WHERE id = $${i++} AND tenant_id = $${i}
    `, params);

    return this.getById(tenantId, id);
  }

  async transfer(tenantId: string, id: string, dto: TransferEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const current = await this.getById(tenantId, id);

    this.events.emit('employee.transferred', {
      tenantId,
      employeeId: id,
      displayName: current.display_name,
      departmentId: dto.departmentId,
      locationId: dto.locationId,
      fromDepartmentId: current.department_id,
      fromLocationId: current.location_id,
      jobTitle: dto.jobTitle ?? current.job_title ?? '',
      workArrangement: dto.workArrangement ?? current.work_arrangement ?? 'office',
      effectiveDate: dto.effectiveDate,
      actorId,
    });

    this.logger.log('transfer workflow initiated', { employeeId: id });
    return current;
  }

  async promote(tenantId: string, id: string, dto: PromoteEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const current = await this.getById(tenantId, id);

    this.events.emit('employee.promoted', {
      tenantId,
      employeeId: id,
      displayName: current.display_name,
      newJobTitle: dto.jobTitle,
      oldJobTitle: current.job_title,
      departmentId: dto.departmentId ?? current.department_id,
      locationId: current.location_id,
      effectiveDate: dto.effectiveDate,
      actorId,
    });

    this.logger.log('promotion workflow initiated', { employeeId: id });
    return current;
  }

  async resign(tenantId: string, id: string, dto: ResignEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';

    await this.db.queryWithTenant(tenantId, `
      UPDATE employees
      SET status = 'inactive', termination_date = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [dto.lastWorkingDate, id, tenantId]);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [dto.lastWorkingDate, id]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'resigned',$3,$4,$5)
    `, [tenantId, id, JSON.stringify({
      resignationDate: dto.resignationDate,
      lastWorkingDate: dto.lastWorkingDate,
      reason: dto.reason,
    }), dto.resignationDate, actorId]);

    this.events.emit('employee.resigned', {
      tenantId, employeeId: id,
      resignationDate: dto.resignationDate,
      lastWorkingDate: dto.lastWorkingDate,
      reason: dto.reason, actorId,
    });

    this.logger.log('employee resigned', { employeeId: id });
    return this.getById(tenantId, id);
  }

  async terminate(tenantId: string, id: string, dto: TerminateEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const current = await this.getById(tenantId, id);

    this.events.emit('employee.terminated', {
      tenantId,
      employeeId: id,
      displayName: current.display_name,
      terminationDate: dto.terminationDate,
      reason: dto.reason,
      actorId,
    });

    this.logger.log('termination workflow initiated', { employeeId: id });
    return current;
  }

  async suspend(tenantId: string, id: string): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const today = new Date().toISOString().slice(0, 10);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employees
      SET status = 'suspended', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'suspended','{}', $3,$4)
    `, [tenantId, id, today, actorId]);

    this.logger.log('employee suspended', { employeeId: id });
    return this.getById(tenantId, id);
  }

  async getHistory(tenantId: string, id: string): Promise<{ spells: SpellRow[]; events: LifecycleEventRow[] }> {
    await this.getById(tenantId, id); // 404 if not found

    const [spells, events] = await Promise.all([
      this.db.queryWithTenant<SpellRow>(tenantId, `
        SELECT * FROM employment_spells
        WHERE employee_id = $1
        ORDER BY effective_from DESC
      `, [id]),
      this.db.queryWithTenant<LifecycleEventRow>(tenantId, `
        SELECT * FROM employee_lifecycle_events
        WHERE employee_id = $1
        ORDER BY effective_date DESC, created_at DESC
      `, [id]),
    ]);

    return { spells, events };
  }

  // Called during hire or profile update to persist encrypted tax profile.
  async upsertTaxProfile(
    tenantId: string,
    employeeId: string,
    npwp: string | null,
    ptkpCategoryId: string | null,
  ): Promise<void> {
    const npwpEncrypted = npwp ? this.encryption.encrypt(npwp) : null;

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_tax_profiles (tenant_id, employee_id, npwp_encrypted, ptkp_category_id, is_npwp_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id)
      DO UPDATE SET
        npwp_encrypted   = EXCLUDED.npwp_encrypted,
        ptkp_category_id = EXCLUDED.ptkp_category_id,
        is_npwp_active   = (EXCLUDED.npwp_encrypted IS NOT NULL),
        updated_at       = NOW()
    `, [tenantId, employeeId, npwpEncrypted, ptkpCategoryId, npwp !== null]);
  }

  async initializePayrollSetup(
    tenantId: string,
    employeeId: string,
    input: {
      npwp?: string | null;
      ptkpCategoryCode?: string | null;
    },
  ): Promise<{ ptkpCategoryCode: string | null }> {
    const resolvedPtkpCategoryCode = input.ptkpCategoryCode?.trim() || 'TK/0';
    const [category] = await this.db.queryWithTenant<{ id: string; code: string }>(tenantId, `
      SELECT id, code
      FROM ptkp_categories
      WHERE code = $1
      LIMIT 1
    `, [resolvedPtkpCategoryCode]);

    await this.upsertTaxProfile(tenantId, employeeId, input.npwp ?? null, category?.id ?? null);

    return {
      ptkpCategoryCode: category?.code ?? null,
    };
  }

  async initializeAccessProvisioning(
    tenantId: string,
    employeeId: string,
  ): Promise<{ userId: string; keycloakId: string; roleName: string }> {
    const employee = await this.getById(tenantId, employeeId);
    const employeeEmail = employee.email.trim();

    if (!employeeEmail) {
      throw new BadRequestException('Employee email is required for access provisioning');
    }

    const existingUserId = employee.user_id;
    const [linkedUser] = existingUserId
      ? await this.db.queryWithTenant<{ id: string; keycloak_id: string; email: string; display_name: string; status: string }>(tenantId, `
          SELECT id, keycloak_id, email, display_name, status
          FROM users
          WHERE id = $1 AND tenant_id = $2
          LIMIT 1
        `, [existingUserId, tenantId])
      : [];
    const [emailUser] = !linkedUser
      ? await this.db.queryWithTenant<{ id: string; keycloak_id: string; email: string; display_name: string; status: string }>(tenantId, `
          SELECT id, keycloak_id, email, display_name, status
          FROM users
          WHERE email = $1 AND tenant_id = $2
          LIMIT 1
        `, [employeeEmail, tenantId])
      : [];

    let user = linkedUser ?? emailUser ?? null;
    if (!user) {
      const keycloakId = `provisioned:${tenantId}:${employeeId}`;
      const [createdUser] = await this.db.queryWithTenant<{ id: string; keycloak_id: string; email: string; display_name: string; status: string }>(tenantId, `
        INSERT INTO users (
          tenant_id, keycloak_id, email, display_name, status, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,'active',NOW(),NOW())
        RETURNING id, keycloak_id, email, display_name, status
      `, [tenantId, keycloakId, employeeEmail, employee.display_name]);

      user = createdUser ?? null;
    } else if (user.email !== employeeEmail || user.display_name !== employee.display_name || user.status !== 'active') {
      const [updatedUser] = await this.db.queryWithTenant<{ id: string; keycloak_id: string; email: string; display_name: string; status: string }>(tenantId, `
        UPDATE users
        SET email = $1,
            display_name = $2,
            status = 'active',
            updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING id, keycloak_id, email, display_name, status
      `, [employeeEmail, employee.display_name, user.id, tenantId]);

      user = updatedUser ?? user;
    }

    const [role] = await this.db.queryWithTenant<{ id: string; name: string }>(tenantId, `
      SELECT id, name
      FROM roles
      WHERE name = 'employee'
      LIMIT 1
    `);

    if (!role) {
      throw new BadRequestException('Employee role is not configured');
    }
    if (!user) {
      throw new BadRequestException('Failed to provision employee access');
    }

    const [existingRole] = await this.db.queryWithTenant<{ id: string }>(tenantId, `
      SELECT id
      FROM user_roles
      WHERE tenant_id = $1
        AND user_id = $2
        AND role_id = $3
        AND scope_type = 'tenant'
        AND scope_entity_id IS NULL
      LIMIT 1
    `, [tenantId, user.id, role.id]);

    if (!existingRole) {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO user_roles (
          tenant_id, user_id, role_id, scope_type, scope_entity_id, granted_at, granted_by
        ) VALUES ($1,$2,$3,'tenant',NULL,NOW(),NULL)
      `, [tenantId, user.id, role.id]);
    }

    await this.db.queryWithTenant(tenantId, `
      UPDATE employees
      SET user_id = $1,
          updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [user.id, employeeId, tenantId]);

    return {
      userId: user.id,
      keycloakId: user.keycloak_id,
      roleName: role.name,
    };
  }

  async initializeAttendanceProfile(
    tenantId: string,
    employeeId: string,
  ): Promise<{
    profileId: string;
    locationId: string;
    departmentId: string;
    timezone: string;
    clockingMethod: string;
  }> {
    const employee = await this.getById(tenantId, employeeId);
    if (!employee.department_id || !employee.location_id) {
      throw new BadRequestException('Employee department and location are required for attendance profile initialization');
    }

    const [location] = await this.db.queryWithTenant<{ id: string; timezone: string; clocking_method: string }>(tenantId, `
      SELECT id, timezone, clocking_method
      FROM locations
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1
    `, [employee.location_id, tenantId]);

    if (!location) {
      throw new BadRequestException('Employee location is not available for attendance profile initialization');
    }

    const [profile] = await this.db.queryWithTenant<{
      id: string;
      tenant_id: string;
      employee_id: string;
      department_id: string;
      location_id: string;
      timezone: string;
      clocking_method: string;
      initialized_at: string;
    }>(tenantId, `
      INSERT INTO employee_attendance_profiles (
        tenant_id, employee_id, department_id, location_id, timezone, clocking_method, initialized_at, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      ON CONFLICT (employee_id)
      DO UPDATE SET
        department_id = EXCLUDED.department_id,
        location_id = EXCLUDED.location_id,
        timezone = EXCLUDED.timezone,
        clocking_method = EXCLUDED.clocking_method,
        initialized_at = EXCLUDED.initialized_at,
        updated_at = NOW()
      RETURNING id, tenant_id, employee_id, department_id, location_id, timezone, clocking_method, initialized_at
    `, [
      tenantId,
      employeeId,
      employee.department_id,
      employee.location_id,
      location.timezone,
      location.clocking_method,
      new Date().toISOString(),
    ]);

    if (!profile) {
      throw new BadRequestException('Failed to initialize employee attendance profile');
    }

    return {
      profileId: profile.id,
      locationId: profile.location_id,
      departmentId: profile.department_id,
      timezone: profile.timezone,
      clockingMethod: profile.clocking_method,
    };
  }

  // Called during hire or profile update to persist encrypted bank account.
  async addBankAccount(
    tenantId: string,
    employeeId: string,
    bankName: string,
    accountNumber: string,
    accountHolderName: string,
    isPrimary: boolean,
  ): Promise<void> {
    const accountNumberEncrypted = this.encryption.encrypt(accountNumber);

    if (isPrimary) {
      await this.db.queryWithTenant(tenantId, `
        UPDATE employee_bank_accounts
        SET is_primary = FALSE
        WHERE employee_id = $1
      `, [employeeId]);
    }

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_bank_accounts (
        tenant_id, employee_id, bank_name, account_number_encrypted,
        account_holder_name, is_primary
      ) VALUES ($1,$2,$3,$4,$5,$6)
    `, [tenantId, employeeId, bankName, accountNumberEncrypted, accountHolderName, isPrimary]);
  }

  async rehire(tenantId: string, id: string, dto: RehireEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const current = await this.getById(tenantId, id);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employees
      SET status = 'active', hire_date = $1, termination_date = NULL, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [dto.newHireDate, id, tenantId]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from,
        probation_end_date, notice_period_days, job_grade
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      tenantId, id, dto.departmentId, dto.locationId,
      dto.jobTitle,
      current.employment_type ?? 'full_time',
      dto.workArrangement ?? 'office',
      dto.newHireDate,
      null, null, null,
    ]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'rehired',$3,$4,$5)
    `, [tenantId, id, JSON.stringify({
      jobTitle: dto.jobTitle,
      departmentId: dto.departmentId,
      locationId: dto.locationId,
    }), dto.newHireDate, actorId]);

    this.events.emit('employee.rehired', {
      tenantId, employeeId: id,
      newHireDate: dto.newHireDate,
      jobTitle: dto.jobTitle,
      departmentId: dto.departmentId,
      locationId: dto.locationId,
      actorId,
    });

    this.logger.log('employee rehired', { employeeId: id });
    return this.getById(tenantId, id);
  }

  async secondment(tenantId: string, id: string, dto: SecondmentDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const current = await this.getById(tenantId, id);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [dto.startDate, id]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from, effective_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      tenantId, id, dto.hostDepartmentId, dto.hostLocationId,
      dto.jobTitleAtHost ?? current.job_title ?? '',
      current.employment_type ?? 'full_time',
      current.work_arrangement ?? 'office',
      dto.startDate,
      dto.expectedReturnDate,
    ]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'seconded',$3,$4,$5)
    `, [tenantId, id, JSON.stringify({
      fromDepartmentId: current.department_id,
      hostDepartmentId: dto.hostDepartmentId,
      hostLocationId: dto.hostLocationId,
      expectedReturnDate: dto.expectedReturnDate,
    }), dto.startDate, actorId]);

    this.events.emit('employee.seconded', {
      tenantId, employeeId: id,
      hostDepartmentId: dto.hostDepartmentId,
      hostLocationId: dto.hostLocationId,
      startDate: dto.startDate,
      expectedReturnDate: dto.expectedReturnDate,
      actorId,
    });

    this.logger.log('employee seconded', { employeeId: id });
    return this.getById(tenantId, id);
  }

  private async resolveEmployeeIdFromUserId(tenantId: string, userId: string): Promise<string | null> {
    const [row] = await this.db.queryWithTenant<{ employee_id: string }>(tenantId, `
      SELECT id AS employee_id FROM employees
      WHERE user_id = $1 AND tenant_id = $2
      LIMIT 1
    `, [userId, tenantId]);

    return row?.employee_id ?? null;
  }

  async getMyProfile(tenantId: string, userId: string): Promise<EmployeeProfileSnapshot> {
    const employeeId = await this.resolveEmployeeIdFromUserId(tenantId, userId);
    if (!employeeId) {
      throw new NotFoundException('No employee record found for current user');
    }

    const profile = await this.identityRepository.findProfileByEmployeeId(tenantId, employeeId);
    if (!profile) {
      throw new NotFoundException('Employee profile not found');
    }

    return profile;
  }

  async updateMyProfile(
    tenantId: string,
    userId: string,
    dto: UpdateEmployeeProfileDto,
  ): Promise<EmployeeProfileSnapshot> {
    const employeeId = await this.resolveEmployeeIdFromUserId(tenantId, userId);
    if (!employeeId) {
      throw new NotFoundException('No employee record found for current user');
    }

    const updated = await this.identityRepository.updateProfile(tenantId, employeeId, dto);
    if (!updated) {
      throw new NotFoundException('Failed to update employee profile');
    }

    return updated;
  }
}
