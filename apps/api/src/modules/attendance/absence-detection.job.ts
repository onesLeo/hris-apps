import { Inject, Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';

export const ABSENCE_DETECTION_QUEUE = 'absence-detection';

export type AbsenceDetectionJobData = {
  tenantId: string;
  workDate: string;   // YYYY-MM-DD — the date to audit
};

type ActiveEmployeeRow = {
  employee_id: string;
  location_id: string;
  timezone: string;
};

/**
 * BullMQ processor: runs daily (scheduled externally via BullMQ repeatable jobs).
 * For each active employee, if they have no attendance record for workDate AND
 * it is not a holiday AND it is a weekday, inserts an absence record.
 */
@Processor(ABSENCE_DETECTION_QUEUE)
@Injectable()
export class AbsenceDetectionJob extends WorkerHost {
  private readonly logger = new Logger(AbsenceDetectionJob.name);

  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {
    super();
  }

  async process(job: Job<AbsenceDetectionJobData>): Promise<void> {
    const { tenantId, workDate } = job.data;
    this.logger.log(`Absence detection — tenant=${tenantId} date=${workDate}`);

    const workDayOfWeek = new Date(workDate).getUTCDay(); // 0=Sun, 6=Sat
    if (workDayOfWeek === 0 || workDayOfWeek === 6) {
      this.logger.debug(`Skipping weekend ${workDate}`);
      return;
    }

    const activeEmployees = await this.getActiveEmployeesWithoutRecord(tenantId, workDate);
    if (activeEmployees.length === 0) return;

    const absentEmployees = await this.filterNonHoliday(tenantId, workDate, activeEmployees);
    if (absentEmployees.length === 0) return;

    await this.insertAbsenceRecords(tenantId, workDate, absentEmployees);
    this.logger.log(`Marked ${absentEmployees.length} absence(s) for ${workDate}`);
  }

  private async getActiveEmployeesWithoutRecord(
    tenantId: string, workDate: string,
  ): Promise<ActiveEmployeeRow[]> {
    return this.db.queryWithTenant<ActiveEmployeeRow>(tenantId, `
      SELECT
        e.id            AS employee_id,
        eap.location_id,
        eap.timezone
      FROM employees e
      JOIN employee_attendance_profiles eap ON eap.employee_id = e.id
      WHERE e.tenant_id = $1
        AND e.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM attendance_records ar
          WHERE ar.employee_id = e.id
            AND ar.work_date = $2::date
        )
    `, [tenantId, workDate]);
  }

  private async filterNonHoliday(
    tenantId: string, workDate: string, employees: ActiveEmployeeRow[],
  ): Promise<ActiveEmployeeRow[]> {
    const locationIds = [...new Set(employees.map((e) => e.location_id))];
    const results: ActiveEmployeeRow[] = [];

    for (const locationId of locationIds) {
      const isHoliday = await this.checkIsHoliday(tenantId, workDate, locationId);
      if (!isHoliday) {
        results.push(...employees.filter((e) => e.location_id === locationId));
      }
    }

    return results;
  }

  private async checkIsHoliday(tenantId: string, date: string, locationId: string): Promise<boolean> {
    const [companyRow] = await this.db.queryWithTenant<{ count: string }>(tenantId, `
      SELECT COUNT(*) AS count FROM company_holidays
      WHERE tenant_id = $1 AND date = $2::date
        AND (location_id IS NULL OR location_id = $3)
        AND is_working_day = FALSE
    `, [tenantId, date, locationId]);

    if (Number(companyRow?.count ?? 0) > 0) return true;

    const [pubRow] = await this.db.queryWithTenant<{ count: string }>(tenantId, `
      SELECT COUNT(*) AS count
      FROM public_holidays ph
      JOIN location_holiday_calendars lhc ON lhc.holiday_calendar_id = ph.holiday_calendar_id
      WHERE lhc.tenant_id = $1
        AND lhc.location_id = $2
        AND ph.date = $3::date
        AND (lhc.effective_to IS NULL OR lhc.effective_to >= $3::date)
    `, [tenantId, locationId, date]);

    return Number(pubRow?.count ?? 0) > 0;
  }

  private async insertAbsenceRecords(
    tenantId: string, workDate: string, employees: ActiveEmployeeRow[],
  ): Promise<void> {
    for (const emp of employees) {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO attendance_records
          (tenant_id, employee_id, work_date, is_absent, late_minutes, overtime_minutes, updated_at)
        VALUES ($1, $2, $3, TRUE, 0, 0, NOW())
        ON CONFLICT (employee_id, work_date) DO NOTHING
      `, [tenantId, emp.employee_id, workDate]);
    }
  }
}
