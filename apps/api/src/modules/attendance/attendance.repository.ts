import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type { ShiftSnapshot, AttendanceRecordSnapshot, ClockEventSnapshot } from './attendance.types';
import type { ClockEventDto } from './attendance.dto';

type ShiftRow = {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  grace_late_minutes: number;
  is_active: boolean;
};

type AttendanceRecordRow = {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  work_date: string;
  shift_id: string | null;
  shift_name: string | null;
  clock_in: string | null;
  clock_out: string | null;
  worked_minutes: number | null;
  late_minutes: number;
  overtime_minutes: number;
  is_absent: boolean;
  is_leave: boolean;
  notes: string | null;
};

type ClockEventRow = {
  id: string;
  employee_id: string;
  event_time: string;
  direction: 'in' | 'out';
  source: string;
};

type TodaySummaryRow = {
  present_today: string;
  late_today: string;
  absent_today: string;
};

@Injectable()
export class AttendanceRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async findShifts(tenantId: string): Promise<ShiftSnapshot[]> {
    const rows = await this.db.queryWithTenant<ShiftRow>(tenantId, `
      SELECT id, tenant_id, name, code, start_time, end_time, break_minutes, grace_late_minutes, is_active
      FROM shifts
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY start_time ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      code: row.code,
      startTime: row.start_time,
      endTime: row.end_time,
      breakMinutes: row.break_minutes,
      graceLateMinutes: row.grace_late_minutes,
      isActive: row.is_active,
    }));
  }

  async findAttendanceRecords(
    tenantId: string,
    filters: { employeeId?: string; fromDate?: string; toDate?: string; limit?: number },
  ): Promise<AttendanceRecordSnapshot[]> {
    const conditions: string[] = ['ar.tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters.employeeId) {
      conditions.push(`ar.employee_id = $${idx++}`);
      params.push(filters.employeeId);
    }

    if (filters.fromDate) {
      conditions.push(`ar.work_date >= $${idx++}`);
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      conditions.push(`ar.work_date <= $${idx++}`);
      params.push(filters.toDate);
    }

    const limitClause = filters.limit ? `LIMIT $${idx++}` : 'LIMIT 200';
    if (filters.limit) {
      params.push(filters.limit);
    }

    const rows = await this.db.queryWithTenant<AttendanceRecordRow>(tenantId, `
      SELECT ar.id, ar.tenant_id, ar.employee_id,
        e.display_name AS employee_name,
        ar.work_date, ar.shift_id, s.name AS shift_name,
        ar.clock_in, ar.clock_out, ar.worked_minutes,
        ar.late_minutes, ar.overtime_minutes, ar.is_absent, ar.is_leave, ar.notes
      FROM attendance_records ar
      JOIN employees e ON e.id = ar.employee_id
      LEFT JOIN shifts s ON s.id = ar.shift_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ar.work_date DESC
      ${limitClause}
    `, params);

    return rows.map(mapAttendanceRecordRow);
  }

  async findTodaySummary(tenantId: string): Promise<{ presentToday: number; lateToday: number; absentToday: number }> {
    const [row] = await this.db.queryWithTenant<TodaySummaryRow>(tenantId, `
      SELECT
        COUNT(*) FILTER (WHERE is_absent = FALSE AND is_leave = FALSE AND clock_in IS NOT NULL) AS present_today,
        COUNT(*) FILTER (WHERE late_minutes > 0) AS late_today,
        COUNT(*) FILTER (WHERE is_absent = TRUE) AS absent_today
      FROM attendance_records
      WHERE tenant_id = $1 AND work_date = CURRENT_DATE
    `, [tenantId]);

    return {
      presentToday: Number(row?.present_today ?? 0),
      lateToday: Number(row?.late_today ?? 0),
      absentToday: Number(row?.absent_today ?? 0),
    };
  }

  async insertClockEvent(tenantId: string, data: ClockEventDto): Promise<ClockEventSnapshot> {
    const [row] = await this.db.queryWithTenant<ClockEventRow>(tenantId, `
      INSERT INTO clock_events (tenant_id, employee_id, event_time, direction, source, device_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, employee_id, event_time, direction, source
    `, [tenantId, data.employeeId, data.eventTime, data.direction, data.source ?? 'manual', data.deviceId ?? null]);

    if (!row) {
      throw new Error('Failed to insert clock event');
    }

    return {
      id: row.id,
      employeeId: row.employee_id,
      eventTime: row.event_time,
      direction: row.direction,
      source: row.source,
    };
  }

  async upsertAttendanceRecord(
    tenantId: string,
    employeeId: string,
    workDate: string,
    direction: 'in' | 'out',
    eventTime: string,
  ): Promise<void> {
    if (direction === 'in') {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO attendance_records (tenant_id, employee_id, work_date, clock_in, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (employee_id, work_date)
        DO UPDATE SET clock_in = EXCLUDED.clock_in, updated_at = NOW()
      `, [tenantId, employeeId, workDate, eventTime]);
    } else {
      // Calculate worked_minutes as difference between clock_in and clock_out
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO attendance_records (tenant_id, employee_id, work_date, clock_out, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (employee_id, work_date)
        DO UPDATE SET
          clock_out = EXCLUDED.clock_out,
          worked_minutes = CASE
            WHEN attendance_records.clock_in IS NOT NULL
            THEN EXTRACT(EPOCH FROM ($4::timestamptz - attendance_records.clock_in)) / 60
            ELSE NULL
          END,
          updated_at = NOW()
      `, [tenantId, employeeId, workDate, eventTime]);
    }
  }
}

function mapAttendanceRecordRow(row: AttendanceRecordRow): AttendanceRecordSnapshot {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    workDate: row.work_date,
    shiftId: row.shift_id,
    shiftName: row.shift_name,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    workedMinutes: row.worked_minutes,
    lateMinutes: row.late_minutes,
    overtimeMinutes: row.overtime_minutes,
    isAbsent: row.is_absent,
    isLeave: row.is_leave,
    notes: row.notes,
  };
}
