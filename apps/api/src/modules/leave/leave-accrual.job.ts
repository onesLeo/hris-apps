import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';

export const LEAVE_ACCRUAL_QUEUE = 'leave-accrual';

export type LeaveAccrualJobData = {
  tenantId: string;
  accrualDate: string;   // YYYY-MM-DD — the month-end or year-end date triggering accrual
  frequency: 'monthly' | 'annual';
};

type LeaveTypeRow = {
  id: string;
  days_per_year: number | null;
  carry_over_days: number;
  accrual_frequency: string;
};

type BalanceRow = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  entitled_days: number;
  carried_over_days: number;
  taken_days: number;
  pending_days: number;
};

/**
 * BullMQ processor: run monthly (or annually) to:
 *   - Monthly: add 1/12 of yearly entitlement to entitled_days for monthly-accrual leave types
 *   - Annual: initialise new-year balances + carry over unused days (capped by carry_over_days)
 */
@Processor(LEAVE_ACCRUAL_QUEUE)
@Injectable()
export class LeaveAccrualJob extends WorkerHost {
  private readonly logger = new Logger(LeaveAccrualJob.name);

  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {
    super();
  }

  async process(job: Job<LeaveAccrualJobData>): Promise<void> {
    const { tenantId, accrualDate, frequency } = job.data;
    this.logger.log(`Leave accrual — tenant=${tenantId} date=${accrualDate} freq=${frequency}`);

    if (frequency === 'monthly') {
      await this.runMonthlyAccrual(tenantId, accrualDate);
    } else {
      await this.runAnnualRollover(tenantId, accrualDate);
    }
  }

  // ── Monthly accrual ────────────────────────────────────────────────────────

  private async runMonthlyAccrual(tenantId: string, accrualDate: string): Promise<void> {
    const year = new Date(accrualDate).getFullYear();

    const leaveTypes = await this.db.queryWithTenant<LeaveTypeRow>(tenantId, `
      SELECT id, days_per_year, carry_over_days, accrual_frequency
      FROM leave_types
      WHERE tenant_id = $1 AND is_active = TRUE AND accrual_frequency = 'monthly' AND days_per_year IS NOT NULL
    `, [tenantId]);

    for (const lt of leaveTypes) {
      if (!lt.days_per_year) continue;
      const monthlyGrant = Math.round((lt.days_per_year / 12) * 100) / 100;

      // Ensure balances exist for every active employee then increment
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, year, entitled_days)
        SELECT $1, e.id, $2, $3, 0
        FROM employees e
        WHERE e.tenant_id = $1 AND e.status = 'active'
        ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
      `, [tenantId, lt.id, year]);

      await this.db.queryWithTenant(tenantId, `
        UPDATE leave_balances
        SET entitled_days = entitled_days + $1, updated_at = NOW()
        WHERE tenant_id = $2 AND leave_type_id = $3 AND year = $4
      `, [monthlyGrant, tenantId, lt.id, year]);
    }

    this.logger.log(`Monthly accrual done for ${leaveTypes.length} leave type(s) — tenant=${tenantId}`);
  }

  // ── Annual rollover ────────────────────────────────────────────────────────

  private async runAnnualRollover(tenantId: string, accrualDate: string): Promise<void> {
    const prevYear = new Date(accrualDate).getFullYear() - 1;
    const newYear = prevYear + 1;

    const leaveTypes = await this.db.queryWithTenant<LeaveTypeRow>(tenantId, `
      SELECT id, days_per_year, carry_over_days, accrual_frequency
      FROM leave_types
      WHERE tenant_id = $1 AND is_active = TRUE
    `, [tenantId]);

    for (const lt of leaveTypes) {
      const prevBalances = await this.db.queryWithTenant<BalanceRow>(tenantId, `
        SELECT id, employee_id, leave_type_id, year, entitled_days, carried_over_days, taken_days, pending_days
        FROM leave_balances
        WHERE tenant_id = $1 AND leave_type_id = $2 AND year = $3
      `, [tenantId, lt.id, prevYear]);

      for (const bal of prevBalances) {
        const remaining = Math.max(0, bal.entitled_days + bal.carried_over_days - bal.taken_days - bal.pending_days);
        const carryOver = Math.min(remaining, lt.carry_over_days);
        const newEntitlement = lt.accrual_frequency === 'annual' ? (lt.days_per_year ?? 0) : 0;

        await this.db.queryWithTenant(tenantId, `
          INSERT INTO leave_balances
            (tenant_id, employee_id, leave_type_id, year, entitled_days, carried_over_days, taken_days, pending_days)
          VALUES ($1, $2, $3, $4, $5, $6, 0, 0)
          ON CONFLICT (employee_id, leave_type_id, year)
          DO UPDATE SET
            entitled_days     = EXCLUDED.entitled_days,
            carried_over_days = EXCLUDED.carried_over_days,
            updated_at        = NOW()
        `, [tenantId, bal.employee_id, lt.id, newYear, newEntitlement, carryOver]);
      }
    }

    this.logger.log(`Annual rollover done for ${prevYear}→${newYear} — tenant=${tenantId}`);
  }
}
