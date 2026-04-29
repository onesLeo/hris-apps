import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  ExistingPayrollRunSnapshot,
  PayrollPeriodSnapshot,
  PayrollRunSnapshot,
  StartPayrollRunResult,
} from './start-payroll-run.use-case';
import { PayrollRunError } from './start-payroll-run.use-case';
import type {
  CalculatePayrollRunItemResult as CalculatePayrollRunItemPersistenceResult,
  CalculatePayrollRunItemSnapshot,
} from './calculate-payroll-run-item.use-case';
import type {
  FinalizePayrollRunResult,
  FinalizePayrollRunSnapshot,
} from './finalize-payroll-run.use-case';

type PayrollPeriodRow = {
  id: string;
  tenant_id: string;
  label: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: PayrollPeriodSnapshot['status'];
};

type PayrollRunRow = {
  id: string;
  tenant_id: string;
  period_id: string;
  location_id: string | null;
  status: PayrollRunSnapshot['status'];
  initiated_by: string;
  started_at: string;
  finalised_at: string | null;
};

type FinalizePayrollRunRow = {
  id: string;
  tenant_id: string;
  period_id: string;
  location_id: string | null;
  status: PayrollRunSnapshot['status'];
  initiated_by: string;
  started_at: string;
  finalised_at: string | null;
  period_label: string;
  period_status: PayrollPeriodSnapshot['status'];
  period_start_date: string;
  period_end_date: string;
  period_pay_date: string;
};

type FinalizePayrollRunItemCountRow = {
  item_count: number | string;
};

type CalculatePayrollRunRow = {
  id: string;
  tenant_id: string;
  period_id: string;
  location_id: string | null;
  status: PayrollRunSnapshot['status'];
  initiated_by: string;
  started_at: string;
  finalised_at: string | null;
  period_label: string;
  period_status: PayrollPeriodSnapshot['status'];
  period_start_date: string;
  period_end_date: string;
  period_pay_date: string;
  existing_item_id: string | null;
  existing_item_locked: boolean | null;
};

@Injectable()
export class PayrollRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async loadStartSnapshot(tenantId: string, periodId: string, locationId: string | null): Promise<{
    period: PayrollPeriodSnapshot | null;
    existingRun: ExistingPayrollRunSnapshot | null;
  }> {
    const [period] = await this.db.queryWithTenant<PayrollPeriodRow>(tenantId, `
      SELECT id, tenant_id, label, start_date, end_date, pay_date, status
      FROM payroll_periods
      WHERE id = $1 AND tenant_id = $2
    `, [periodId, tenantId]);

    if (!period) {
      return { period: null, existingRun: null };
    }

    const [existingRun] = await this.db.queryWithTenant<PayrollRunRow>(tenantId, `
      SELECT id, tenant_id, period_id, location_id, status, initiated_by, started_at, finalised_at
      FROM payroll_runs
      WHERE period_id = $1
        AND tenant_id = $2
        AND location_id IS NOT DISTINCT FROM $3
        AND status IN ('draft', 'calculating', 'review', 'approved')
      ORDER BY started_at DESC
      LIMIT 1
    `, [periodId, tenantId, locationId]);

    return {
      period: {
        id: period.id,
        tenantId: period.tenant_id,
        label: period.label,
        startDate: period.start_date,
        endDate: period.end_date,
        payDate: period.pay_date,
        status: period.status,
      },
      existingRun: existingRun
        ? {
            id: existingRun.id,
            tenantId: existingRun.tenant_id,
            periodId: existingRun.period_id,
            locationId: existingRun.location_id,
            status: existingRun.status,
          }
        : null,
    };
  }

  async saveStartResult(
    tenantId: string,
    result: StartPayrollRunResult,
  ): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.execute(sql`
        INSERT INTO payroll_runs (
          id, period_id, tenant_id, location_id, status, initiated_by, started_at, finalised_at
        ) VALUES (
          ${result.run.id},
          ${result.run.periodId},
          ${result.run.tenantId},
          ${result.run.locationId},
          ${result.run.status},
          ${result.run.initiatedBy},
          ${result.run.startedAt},
          ${result.run.finalisedAt}
        )
      `);
    });
  }

  async loadFinalizeSnapshot(tenantId: string, payrollRunId: string): Promise<FinalizePayrollRunSnapshot> {
    const [row] = await this.db.queryWithTenant<FinalizePayrollRunRow>(tenantId, `
      SELECT
        r.id,
        r.tenant_id,
        r.period_id,
        r.location_id,
        r.status,
        r.initiated_by,
        r.started_at,
        r.finalised_at,
        p.label AS period_label,
        p.status AS period_status,
        p.start_date AS period_start_date,
        p.end_date AS period_end_date,
        p.pay_date AS period_pay_date
      FROM payroll_runs r
      INNER JOIN payroll_periods p ON p.id = r.period_id
      WHERE r.id = $1 AND r.tenant_id = $2
    `, [payrollRunId, tenantId]);

    if (!row) {
      throw new PayrollRunError('RUN_NOT_FOUND', `Payroll run ${payrollRunId} not found`);
    }

    const [countRow] = await this.db.queryWithTenant<FinalizePayrollRunItemCountRow>(tenantId, `
      SELECT COUNT(id)::int AS item_count
      FROM payroll_run_items
      WHERE run_id = $1
    `, [payrollRunId]);

    return {
      run: {
        id: row.id,
        tenantId: row.tenant_id,
        periodId: row.period_id,
        locationId: row.location_id,
        status: row.status,
        initiatedBy: row.initiated_by,
        startedAt: row.started_at,
        finalisedAt: row.finalised_at,
      },
      period: {
        id: row.period_id,
        tenantId: row.tenant_id,
        label: row.period_label,
        startDate: row.period_start_date,
        endDate: row.period_end_date,
        payDate: row.period_pay_date,
        status: row.period_status,
      },
      itemCount: countRow ? (typeof countRow.item_count === 'string' ? Number(countRow.item_count) : countRow.item_count) : 0,
    };
  }

  async saveFinalizeResult(
    tenantId: string,
    actorId: string,
    result: FinalizePayrollRunResult,
  ): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE payroll_runs
          SET
            status = ${result.run.status},
            approved_by = ${actorId},
            finalised_at = ${result.run.finalisedAt}
          WHERE id = ${result.run.id}
            AND tenant_id = ${tenantId}
        `);

        await tx.execute(sql`
          UPDATE payroll_run_items
          SET
            locked = TRUE,
            updated_at = ${result.run.finalisedAt}
          WHERE run_id = ${result.run.id}
            AND locked = FALSE
        `);
      });
    });
  }

  async loadCalculateSnapshot(
    tenantId: string,
    payrollRunId: string,
    employeeId: string,
  ): Promise<CalculatePayrollRunItemSnapshot> {
    const [row] = await this.db.queryWithTenant<CalculatePayrollRunRow>(tenantId, `
      SELECT
        r.id,
        r.tenant_id,
        r.period_id,
        r.location_id,
        r.status,
        r.initiated_by,
        r.started_at,
        r.finalised_at,
        p.label AS period_label,
        p.status AS period_status,
        p.start_date AS period_start_date,
        p.end_date AS period_end_date,
        p.pay_date AS period_pay_date,
        i.id AS existing_item_id,
        i.locked AS existing_item_locked
      FROM payroll_runs r
      INNER JOIN payroll_periods p ON p.id = r.period_id
      LEFT JOIN payroll_run_items i
        ON i.run_id = r.id
       AND i.employee_id = $3
      WHERE r.id = $1 AND r.tenant_id = $2
    `, [payrollRunId, tenantId, employeeId]);

    if (!row) {
      throw new PayrollRunError('RUN_NOT_FOUND', `Payroll run ${payrollRunId} not found`);
    }

    return {
      run: {
        id: row.id,
        tenantId: row.tenant_id,
        periodId: row.period_id,
        locationId: row.location_id,
        status: row.status,
        initiatedBy: row.initiated_by,
        startedAt: row.started_at,
        finalisedAt: row.finalised_at,
      },
      period: {
        id: row.period_id,
        tenantId: row.tenant_id,
        label: row.period_label,
        startDate: row.period_start_date,
        endDate: row.period_end_date,
        payDate: row.period_pay_date,
        status: row.period_status,
      },
      existingItemId: row.existing_item_id,
      existingItemLocked: row.existing_item_locked,
    };
  }

  async saveCalculatedItem(
    tenantId: string,
    result: CalculatePayrollRunItemPersistenceResult,
  ): Promise<void> {
    try {
      await this.db.withTenant(tenantId, async (db) => {
        await db.execute(sql`
          INSERT INTO payroll_run_items (
            id,
            run_id,
            employee_id,
            currency,
            base_salary,
            attendance_deduction_amount,
            earnings_total,
            gross_pay,
            bpjs_employee_total,
            bpjs_employer_total,
            pph21_amount,
            other_deductions_total,
            employer_contributions,
            net_pay,
            salary_proration_json,
            components,
            tax_detail,
            locked,
            created_at,
            updated_at
          ) VALUES (
            ${result.item.id},
            ${result.item.runId},
            ${result.item.employeeId},
            ${result.item.currency},
            ${result.item.baseSalary},
            ${result.item.attendanceDeductionAmount},
            ${result.item.earningsTotal},
            ${result.item.grossPay},
            ${result.item.bpjsEmployeeTotal},
            ${result.item.bpjsEmployerTotal},
            ${result.item.pph21Amount},
            ${result.item.otherDeductionsTotal},
            ${result.item.employerContributions},
            ${result.item.netPay},
            ${result.item.salaryProrationJson},
            ${result.item.components},
            ${result.item.taxDetail},
            ${result.item.locked},
            ${result.item.createdAt},
            ${result.item.updatedAt}
          )
        `);
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
        throw new PayrollRunError('ITEM_ALREADY_EXISTS', `Payroll run item for employee ${result.item.employeeId} already exists`);
      }
      throw error;
    }
  }
}
