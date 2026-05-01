import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';

type LeaveTypeRow = {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  days_per_year: number | null;
  carry_over_days: number;
};

type EmployeeRow = {
  id: string;
  tenant_id: string;
  display_name: string;
  hire_date: string;
  status: string;
};

type LeaveBalanceExistsRow = {
  count: string;
};

export type AccrualResult = {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  year: number;
  entitledDays: number;
  carriedOverDays: number;
  action: 'created' | 'skipped_existing' | 'skipped_no_entitlement';
};

/**
 * Leave Accrual Service
 *
 * Handles automatic granting of leave entitlements:
 * - Annual accrual: creates leave_balances rows for the target year
 * - Carry-over: moves unused days from previous year (up to carry_over_days limit)
 * - Proration: calculates partial entitlement for mid-year hires
 */
@Injectable()
export class LeaveAccrualService {
  private readonly logger = new Logger(LeaveAccrualService.name);

  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  /**
   * Run annual accrual for all active employees of a tenant.
   * Creates leave_balances rows for each (employee, leave_type, year) combination
   * that doesn't already exist.
   *
   * @param tenantId - The tenant to process
   * @param year - The target year (e.g., 2026)
   * @param enableCarryOver - Whether to carry over unused days from the previous year
   */
  async runAnnualAccrual(tenantId: string, year: number, enableCarryOver = true): Promise<AccrualResult[]> {
    this.logger.log(`Starting annual leave accrual for tenant ${tenantId}, year ${year}`);

    // 1. Get all active leave types for the tenant
    const leaveTypes = await this.db.queryWithTenant<LeaveTypeRow>(tenantId, `
      SELECT id, tenant_id, code, name, days_per_year, carry_over_days
      FROM leave_types
      WHERE tenant_id = $1 AND is_active = TRUE AND days_per_year IS NOT NULL
      ORDER BY code ASC
    `, [tenantId]);

    if (leaveTypes.length === 0) {
      this.logger.log('No leave types with annual entitlement found; skipping.');
      return [];
    }

    // 2. Get all active employees
    const employees = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      SELECT id, tenant_id, display_name, hire_date, status
      FROM employees
      WHERE tenant_id = $1 AND status IN ('active', 'on_leave')
      ORDER BY employee_number ASC
    `, [tenantId]);

    if (employees.length === 0) {
      this.logger.log('No active employees found; skipping.');
      return [];
    }

    const results: AccrualResult[] = [];

    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const result = await this.processAccrual(tenantId, employee, leaveType, year, enableCarryOver);
        results.push(result);
      }
    }

    const created = results.filter(r => r.action === 'created').length;
    const skipped = results.filter(r => r.action === 'skipped_existing').length;
    this.logger.log(`Accrual complete: ${created} created, ${skipped} skipped (already exist).`);

    return results;
  }

  /**
   * Run accrual for a single employee (e.g., on hire or mid-year).
   */
  async runAccrualForEmployee(tenantId: string, employeeId: string, year: number): Promise<AccrualResult[]> {
    const [employee] = await this.db.queryWithTenant<EmployeeRow>(tenantId, `
      SELECT id, tenant_id, display_name, hire_date, status
      FROM employees
      WHERE tenant_id = $1 AND id = $2
    `, [tenantId, employeeId]);

    if (!employee) return [];

    const leaveTypes = await this.db.queryWithTenant<LeaveTypeRow>(tenantId, `
      SELECT id, tenant_id, code, name, days_per_year, carry_over_days
      FROM leave_types
      WHERE tenant_id = $1 AND is_active = TRUE AND days_per_year IS NOT NULL
    `, [tenantId]);

    const results: AccrualResult[] = [];
    for (const leaveType of leaveTypes) {
      const result = await this.processAccrual(tenantId, employee, leaveType, year, false);
      results.push(result);
    }
    return results;
  }

  private async processAccrual(
    tenantId: string,
    employee: EmployeeRow,
    leaveType: LeaveTypeRow,
    year: number,
    enableCarryOver: boolean,
  ): Promise<AccrualResult> {
    const daysPerYear = leaveType.days_per_year;
    if (!daysPerYear) {
      return {
        employeeId: employee.id,
        employeeName: employee.display_name,
        leaveTypeId: leaveType.id,
        leaveTypeCode: leaveType.code,
        year,
        entitledDays: 0,
        carriedOverDays: 0,
        action: 'skipped_no_entitlement',
      };
    }

    // Check if balance already exists
    const [existing] = await this.db.queryWithTenant<LeaveBalanceExistsRow>(tenantId, `
      SELECT COUNT(*)::text AS count FROM leave_balances
      WHERE tenant_id = $1 AND employee_id = $2 AND leave_type_id = $3 AND year = $4
    `, [tenantId, employee.id, leaveType.id, year]);

    if (Number(existing?.count ?? 0) > 0) {
      return {
        employeeId: employee.id,
        employeeName: employee.display_name,
        leaveTypeId: leaveType.id,
        leaveTypeCode: leaveType.code,
        year,
        entitledDays: 0,
        carriedOverDays: 0,
        action: 'skipped_existing',
      };
    }

    // Calculate prorated entitlement for mid-year hires
    const hireDate = new Date(employee.hire_date);
    const yearStart = new Date(year, 0, 1);
    let entitledDays = daysPerYear;

    if (hireDate > yearStart) {
      // Prorate: months remaining / 12, rounded up
      const monthsRemaining = 12 - hireDate.getMonth();
      entitledDays = Math.ceil((daysPerYear * monthsRemaining) / 12);
    }

    // Calculate carry-over from previous year
    let carriedOverDays = 0;
    if (enableCarryOver && leaveType.carry_over_days > 0) {
      const prevYear = year - 1;
      const [prevBalance] = await this.db.queryWithTenant<{
        entitled_days: number; taken_days: number; pending_days: number; carried_over_days: number;
      }>(tenantId, `
        SELECT entitled_days, taken_days, pending_days, carried_over_days
        FROM leave_balances
        WHERE tenant_id = $1 AND employee_id = $2 AND leave_type_id = $3 AND year = $4
      `, [tenantId, employee.id, leaveType.id, prevYear]);

      if (prevBalance) {
        const unused = prevBalance.entitled_days + prevBalance.carried_over_days
          - prevBalance.taken_days - prevBalance.pending_days;
        carriedOverDays = Math.min(Math.max(unused, 0), leaveType.carry_over_days);
      }
    }

    // Insert the new balance
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, year, entitled_days, taken_days, pending_days, carried_over_days)
      VALUES ($1, $2, $3, $4, $5, 0, 0, $6)
      ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
    `, [tenantId, employee.id, leaveType.id, year, entitledDays, carriedOverDays]);

    return {
      employeeId: employee.id,
      employeeName: employee.display_name,
      leaveTypeId: leaveType.id,
      leaveTypeCode: leaveType.code,
      year,
      entitledDays,
      carriedOverDays,
      action: 'created',
    };
  }
}
