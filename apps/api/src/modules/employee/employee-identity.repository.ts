import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import { EncryptionService } from '../../common/encryption/encryption.service';
import type { UpdateEmployeeProfileDto, EmployeeProfileSnapshot } from './employee.types';

type EmployeeIdentityRow = {
  id: string;
  tenant_id: string;
  employee_id: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  nik_encrypted: string | null;
  bpjs_health_encrypted: string | null;
  bpjs_employment_encrypted: string | null;
  bpjs_pension_encrypted: string | null;
  bpjs_accident_encrypted: string | null;
};

type EmployeeProfileRow = {
  e_id: string;
  e_tenant_id: string;
  e_display_name: string;
  e_email: string;
  e_phone: string | null;
  e_date_of_birth: string | null;
  e_gender: string | null;
  e_hire_date: string;
  i_address: string | null;
  i_city: string | null;
  i_province: string | null;
  i_postal_code: string | null;
  i_nik_encrypted: string | null;
  i_bpjs_health_encrypted: string | null;
  i_bpjs_employment_encrypted: string | null;
  i_bpjs_pension_encrypted: string | null;
  i_bpjs_accident_encrypted: string | null;
};

@Injectable()
export class EmployeeIdentityRepository {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly encryption: EncryptionService,
  ) {}

  async findProfileByEmployeeId(tenantId: string, employeeId: string): Promise<EmployeeProfileSnapshot | null> {
    const [row] = await this.db.queryWithTenant<EmployeeProfileRow>(tenantId, `
      SELECT
        e.id AS e_id,
        e.tenant_id AS e_tenant_id,
        e.display_name AS e_display_name,
        e.email AS e_email,
        e.phone AS e_phone,
        e.date_of_birth AS e_date_of_birth,
        e.gender AS e_gender,
        e.hire_date AS e_hire_date,
        i.address AS i_address,
        i.city AS i_city,
        i.province AS i_province,
        i.postal_code AS i_postal_code,
        i.nik_encrypted AS i_nik_encrypted,
        i.bpjs_health_encrypted AS i_bpjs_health_encrypted,
        i.bpjs_employment_encrypted AS i_bpjs_employment_encrypted,
        i.bpjs_pension_encrypted AS i_bpjs_pension_encrypted,
        i.bpjs_accident_encrypted AS i_bpjs_accident_encrypted
      FROM employees e
      LEFT JOIN employee_identities i ON i.employee_id = e.id
      WHERE e.id = $1 AND e.tenant_id = $2
    `, [employeeId, tenantId]);

    if (!row) return null;

    return {
      id: row.e_id,
      tenantId: row.e_tenant_id,
      employeeId: row.e_id,
      displayName: row.e_display_name,
      email: row.e_email,
      phone: row.e_phone,
      dateOfBirth: row.e_date_of_birth,
      gender: row.e_gender,
      hireDate: row.e_hire_date,
      address: row.i_address,
      city: row.i_city,
      province: row.i_province,
      postalCode: row.i_postal_code,
      nik: row.i_nik_encrypted ? this.encryption.decrypt(row.i_nik_encrypted) : null,
      bpjsHealth: row.i_bpjs_health_encrypted ? this.encryption.decrypt(row.i_bpjs_health_encrypted) : null,
      bpjsEmployment: row.i_bpjs_employment_encrypted ? this.encryption.decrypt(row.i_bpjs_employment_encrypted) : null,
      bpjsPension: row.i_bpjs_pension_encrypted ? this.encryption.decrypt(row.i_bpjs_pension_encrypted) : null,
      bpjsAccident: row.i_bpjs_accident_encrypted ? this.encryption.decrypt(row.i_bpjs_accident_encrypted) : null,
    };
  }

  async updateProfile(
    tenantId: string,
    employeeId: string,
    dto: UpdateEmployeeProfileDto,
  ): Promise<EmployeeProfileSnapshot | null> {
    const [existing] = await this.db.queryWithTenant<EmployeeIdentityRow>(tenantId, `
      SELECT * FROM employee_identities
      WHERE employee_id = $1 AND tenant_id = $2
    `, [employeeId, tenantId]);

    if (!existing) {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO employee_identities (
          tenant_id, employee_id, address, city, province, postal_code,
          nik_encrypted, bpjs_health_encrypted, bpjs_employment_encrypted,
          bpjs_pension_encrypted, bpjs_accident_encrypted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        tenantId,
        employeeId,
        dto.address ?? null,
        dto.city ?? null,
        dto.province ?? null,
        dto.postalCode ?? null,
        dto.nik ? this.encryption.encrypt(dto.nik) : null,
        dto.bpjsHealth ? this.encryption.encrypt(dto.bpjsHealth) : null,
        dto.bpjsEmployment ? this.encryption.encrypt(dto.bpjsEmployment) : null,
        dto.bpjsPension ? this.encryption.encrypt(dto.bpjsPension) : null,
        dto.bpjsAccident ? this.encryption.encrypt(dto.bpjsAccident) : null,
      ]);
    } else {
      await this.db.queryWithTenant(tenantId, `
        UPDATE employee_identities
        SET
          address = COALESCE($1, address),
          city = COALESCE($2, city),
          province = COALESCE($3, province),
          postal_code = COALESCE($4, postal_code),
          nik_encrypted = COALESCE($5, nik_encrypted),
          bpjs_health_encrypted = COALESCE($6, bpjs_health_encrypted),
          bpjs_employment_encrypted = COALESCE($7, bpjs_employment_encrypted),
          bpjs_pension_encrypted = COALESCE($8, bpjs_pension_encrypted),
          bpjs_accident_encrypted = COALESCE($9, bpjs_accident_encrypted),
          updated_at = NOW()
        WHERE employee_id = $10 AND tenant_id = $11
      `, [
        dto.address ?? null,
        dto.city ?? null,
        dto.province ?? null,
        dto.postalCode ?? null,
        dto.nik ? this.encryption.encrypt(dto.nik) : null,
        dto.bpjsHealth ? this.encryption.encrypt(dto.bpjsHealth) : null,
        dto.bpjsEmployment ? this.encryption.encrypt(dto.bpjsEmployment) : null,
        dto.bpjsPension ? this.encryption.encrypt(dto.bpjsPension) : null,
        dto.bpjsAccident ? this.encryption.encrypt(dto.bpjsAccident) : null,
        employeeId,
        tenantId,
      ]);
    }

    return this.findProfileByEmployeeId(tenantId, employeeId);
  }
}
