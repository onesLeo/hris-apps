import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestContext } from '../../common/context/request-context';
import { DATABASE_SERVICE, IDatabaseService } from '../../common/database/database.types';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import type {
  EmployeeListQuery,
  EmployeeRow,
  HireEmployeeDto,
  LifecycleEventRow,
  PromoteEmployeeDto,
  ResignEmployeeDto,
  SpellRow,
  TerminateEmployeeDto,
  TransferEmployeeDto,
  UpdateEmployeeDto,
} from './employee.types';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly encryption: EncryptionService,
    private readonly events: EventEmitter2,
    private readonly logger: StructuredLoggerService,
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
        email, phone, date_of_birth, gender, nationality, status, hire_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11)
      RETURNING *
    `, [
      tenantId, dto.employeeNumber, dto.firstName, dto.lastName, displayName,
      dto.email, dto.phone ?? null, dto.dateOfBirth ?? null,
      dto.gender ?? null, dto.nationality ?? null, dto.hireDate,
    ]);

    if (!employee) throw new BadRequestException('Failed to create employee record');

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [
      tenantId, employee.id, dto.departmentId, dto.locationId,
      dto.jobTitle, dto.employmentType ?? 'full_time',
      dto.workArrangement ?? 'office', dto.hireDate,
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
        s.location_id,
        d.name AS department_name,
        l.name AS location_name
      FROM employees e
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN locations   l ON l.id = s.location_id
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
        s.location_id,
        d.name AS department_name,
        l.name AS location_name
      FROM employees e
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN locations   l ON l.id = s.location_id
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

    // Close current spell
    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [dto.effectiveDate, id]);

    // Open new spell
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [
      tenantId, id, dto.departmentId, dto.locationId,
      dto.jobTitle ?? current.job_title ?? '',
      current.employment_type ?? 'full_time',
      dto.workArrangement ?? current.work_arrangement ?? 'office',
      dto.effectiveDate,
    ]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'transferred',$3,$4,$5)
    `, [tenantId, id, JSON.stringify({
      fromDepartmentId: current.department_id,
      toDepartmentId: dto.departmentId,
      fromLocationId: current.location_id,
      toLocationId: dto.locationId,
    }), dto.effectiveDate, actorId]);

    this.events.emit('employee.transferred', {
      tenantId, employeeId: id,
      fromDepartmentId: current.department_id, toDepartmentId: dto.departmentId,
      fromLocationId: current.location_id, toLocationId: dto.locationId,
      effectiveDate: dto.effectiveDate, actorId,
    });

    this.logger.log('employee transferred', { employeeId: id });
    return this.getById(tenantId, id);
  }

  async promote(tenantId: string, id: string, dto: PromoteEmployeeDto): Promise<EmployeeRow> {
    const ctx = RequestContext.get();
    const actorId = ctx?.userId ?? 'system';
    const current = await this.getById(tenantId, id);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [dto.effectiveDate, id]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [
      tenantId, id,
      dto.departmentId ?? current.department_id,
      current.location_id,
      dto.jobTitle,
      current.employment_type ?? 'full_time',
      current.work_arrangement ?? 'office',
      dto.effectiveDate,
    ]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'promoted',$3,$4,$5)
    `, [tenantId, id, JSON.stringify({
      fromJobTitle: current.job_title,
      toJobTitle: dto.jobTitle,
    }), dto.effectiveDate, actorId]);

    this.events.emit('employee.promoted', {
      tenantId, employeeId: id,
      fromJobTitle: current.job_title, toJobTitle: dto.jobTitle,
      departmentId: dto.departmentId ?? current.department_id,
      locationId: current.location_id,
      effectiveDate: dto.effectiveDate, actorId,
    });

    this.logger.log('employee promoted', { employeeId: id });
    return this.getById(tenantId, id);
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

    await this.db.queryWithTenant(tenantId, `
      UPDATE employees
      SET status = 'terminated', termination_date = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [dto.terminationDate, id, tenantId]);

    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [dto.terminationDate, id]);

    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'terminated',$3,$4,$5)
    `, [tenantId, id, JSON.stringify({ reason: dto.reason }), dto.terminationDate, actorId]);

    this.events.emit('employee.terminated', {
      tenantId, employeeId: id,
      terminationDate: dto.terminationDate,
      reason: dto.reason, actorId,
    });

    this.logger.log('employee terminated', { employeeId: id });
    return this.getById(tenantId, id);
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
}
