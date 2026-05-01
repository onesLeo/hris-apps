import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  ShiftSnapshot,
  ShiftAssignmentSnapshot,
  AttendanceRecordSnapshot,
  ClockEventSnapshot,
  AttendancePolicySnapshot,
} from './attendance.types';
import type { ClockEventDto, CreateShiftDto, AssignShiftDto, AttendancePolicyRules } from './attendance.dto';

// ─── Raw DB Row Types ───────────────────────────────────────────────────────────

type ShiftRow = {
  id: string; tenant_id: string; name: string; code: string;
  start_time: string; end_time: string; break_minutes: number;
  grace_late_minutes: number; is_active: boolean;
};

type ShiftAssignmentRow = {
  id: string; tenant_id: string; employee_id: string; employee_name: string;
  shift_id: string; shift_name: string; shift_code: string;
  effective_from: string; effective_to: string | null;
};

type AttendanceRecordRow = {
  id: string; tenant_id: string; employee_id: string; employee_name: string;
  work_date: string; shift_id: string | null; shift_name: string | null;
  clock_in: string | null; clock_out: string | null; worked_minutes: number | null;
  late_minutes: number; overtime_minutes: number; is_absent: boolean;
  is_leave: boolean; notes: string | null;
};

type ClockEventRow = {
  id: string; employee_id: string; event_time: string;
  direction: 'in' | 'out'; source: string;
};

type TodaySummaryRow = {
  present_today: string; late_today: string; absent_today: string;
};

type AttendancePolicyRow = {
  id: string; tenant_id: string; location_id: string; location_name: string;
  name: string; rules: string; is_active: boolean;
};

@Injectable()
export class AttendanceRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  // ─── Shifts ─────────────────────────────────────────────────────────────────

  async findShifts(tenantId: string): Promise<ShiftSnapshot[]> {
    const rows = await this.db.queryWithTenant<ShiftRow>(tenantId, `
      SELECT id, tenant_id, name, code, start_time, end_time, break_minutes, grace_late_minutes, is_active
      FROM shifts
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY start_time ASC
    `, [tenantId]);

    return rows.map(mapShiftRow);
  }

  async createShift(tenantId: string, data: CreateShiftDto): Promise<ShiftSnapshot> {
    const [row] = await this.db.queryWithTenant<ShiftRow>(tenantId, `
      INSERT INTO shifts (tenant_id, name, code, start_time, end_time, break_minutes, grace_late_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, tenant_id, name, code, start_time, end_time, break_minutes, grace_late_minutes, is_active
    `, [tenantId, data.name, data.code, data.startTime, data.endTime, data.breakMinutes ?? 60, data.graceLateMinutes ?? 15]);

    if (!row) throw new Error('Failed to create shift');
    return mapShiftRow(row);
  }

  // ─── Shift Assignments ──────────────────────────────────────────────────────

  async findShiftAssignments(tenantId: string, filters: {
    employeeId?: string; shiftId?: string; activeOnly?: boolean;
  }): Promise<ShiftAssignmentSnapshot[]> {
    const conditions: string[] = ['sa.tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let idx = 2;

    if (filters.employeeId) {
      conditions.push(`sa.employee_id = $${idx++}`);
      params.push(filters.employeeId);
    }
    if (filters.shiftId) {
      conditions.push(`sa.shift_id = $${idx++}`);
      params.push(filters.shiftId);
    }
    if (filters.activeOnly) {
      conditions.push(`(sa.effective_to IS NULL OR sa.effective_to >= CURRENT_DATE)`);
    }

    const rows = await this.db.queryWithTenant<ShiftAssignmentRow>(tenantId, `
      SELECT sa.id, sa.tenant_id, sa.employee_id,
        e.display_name AS employee_name,
        sa.shift_id, s.name AS shift_name, s.code AS shift_code,
        sa.effective_from, sa.effective_to
      FROM shift_assignments sa
      JOIN employees e ON e.id = sa.employee_id
      JOIN shifts s ON s.id = sa.shift_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sa.effective_from DESC
    `, params);

    return rows.map(mapShiftAssignmentRow);
  }

  async findCurrentShiftForEmployee(tenantId: string, employeeId: string): Promise<ShiftSnapshot | null> {
    const [row] = await this.db.queryWithTenant<ShiftRow>(tenantId, `
      SELECT s.id, s.tenant_id, s.name, s.code, s.start_time, s.end_time,
             s.break_minutes, s.grace_late_minutes, s.is_active
      FROM shift_assignments sa
      JOIN shifts s ON s.id = sa.shift_id
      WHERE sa.tenant_id = $1 AND sa.employee_id = $2
        AND sa.effective_from <= CURRENT_DATE
        AND (sa.effective_to IS NULL OR sa.effective_to >= CURRENT_DATE)
      ORDER BY sa.effective_from DESC
      LIMIT 1
    `, [tenantId, employeeId]);

    return row ? mapShiftRow(row) : null;
  }

  async assignShift(tenantId: string, data: AssignShiftDto): Promise<ShiftAssignmentSnapshot> {
    const [row] = await this.db.queryWithTenant<ShiftAssignmentRow>(tenantId, `
      WITH inserted AS (
        INSERT INTO shift_assignments (tenant_id, employee_id, shift_id, effective_from, effective_to)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      )
      SELECT i.id, i.tenant_id, i.employee_id,
        e.display_name AS employee_name,
        i.shift_id, s.name AS shift_name, s.code AS shift_code,
        i.effective_from, i.effective_to
      FROM inserted i
      JOIN employees e ON e.id = i.employee_id
      JOIN shifts s ON s.id = i.shift_id
    `, [tenantId, data.employeeId, data.shiftId, data.effectiveFrom, data.effectiveTo ?? null]);

    if (!row) throw new Error('Failed to assign shift');
    return mapShiftAssignmentRow(row);
  }

  // ─── Attendance Policies ──────────────────────────────────────────────────────

  async findPolicies(tenantId: string): Promise<AttendancePolicySnapshot[]> {
    const rows = await this.db.queryWithTenant<AttendancePolicyRow>(tenantId, `
      SELECT ap.id, ap.tenant_id, ap.location_id, l.name AS location_name,
             ap.name, ap.rules::text, ap.is_active
      FROM attendance_policies ap
      JOIN locations l ON l.id = ap.location_id
      WHERE ap.tenant_id = $1
      ORDER BY l.name ASC
    `, [tenantId]);

    return rows.map(mapPolicyRow);
  }

  async findPolicyForLocation(tenantId: string, locationId: string): Promise<AttendancePolicySnapshot | null> {
    const [row] = await this.db.queryWithTenant<AttendancePolicyRow>(tenantId, `
      SELECT ap.id, ap.tenant_id, ap.location_id, l.name AS location_name,
             ap.name, ap.rules::text, ap.is_active
      FROM attendance_policies ap
      JOIN locations l ON l.id = ap.location_id
      WHERE ap.tenant_id = $1 AND ap.location_id = $2 AND ap.is_active = TRUE
      LIMIT 1
    `, [tenantId, locationId]);

    return row ? mapPolicyRow(row) : null;
  }

  async upsertPolicy(tenantId: string, locationId: string, name: string, rules: AttendancePolicyRules): Promise<AttendancePolicySnapshot> {
    const [row] = await this.db.queryWithTenant<AttendancePolicyRow>(tenantId, `
      INSERT INTO attendance_policies (tenant_id, location_id, name, rules)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (tenant_id, location_id)
      DO UPDATE SET name = EXCLUDED.name, rules = EXCLUDED.rules, updated_at = NOW()
      RETURNING id, tenant_id, location_id, '' AS location_name, name, rules::text, is_active
    `, [tenantId, locationId, name, JSON.stringify(rules)]);

    if (!row) throw new Error('Failed to upsert attendance policy');
    return mapPolicyRow(row);
  }

  // ─── Attendance Records ─────────────────────────────────────────────────────

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
    if (filters.limit) params.push(filters.limit);

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

  // ─── Clock Events ───────────────────────────────────────────────────────────

  /**
   * Check for duplicate clock events within a 2-minute window.
   * Returns true if a duplicate is found.
   */
  async isDuplicateClockEvent(tenantId: string, employeeId: string, direction: string, eventTime: string): Promise<boolean> {
    const [row] = await this.db.queryWithTenant<{ count: string }>(tenantId, `
      SELECT COUNT(*)::text AS count FROM clock_events
      WHERE tenant_id = $1 AND employee_id = $2 AND direction = $3
        AND event_time BETWEEN ($4::timestamptz - INTERVAL '2 minutes') AND ($4::timestamptz + INTERVAL '2 minutes')
    `, [tenantId, employeeId, direction, eventTime]);

    return Number(row?.count ?? 0) > 0;
  }

  async insertClockEvent(tenantId: string, data: ClockEventDto): Promise<ClockEventSnapshot> {
    const [row] = await this.db.queryWithTenant<ClockEventRow>(tenantId, `
      INSERT INTO clock_events (tenant_id, employee_id, event_time, direction, source, device_id, raw_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING id, employee_id, event_time, direction, source
    `, [tenantId, data.employeeId, data.eventTime, data.direction, data.source ?? 'manual', data.deviceId ?? null, data.rawPayload ? JSON.stringify(data.rawPayload) : null]);

    if (!row) throw new Error('Failed to insert clock event');
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

// ─── Row Mappers ────────────────────────────────────────────────────────────────

function mapShiftRow(row: ShiftRow): ShiftSnapshot {
  return {
    id: row.id, tenantId: row.tenant_id, name: row.name, code: row.code,
    startTime: row.start_time, endTime: row.end_time,
    breakMinutes: row.break_minutes, graceLateMinutes: row.grace_late_minutes,
    isActive: row.is_active,
  };
}

function mapShiftAssignmentRow(row: ShiftAssignmentRow): ShiftAssignmentSnapshot {
  return {
    id: row.id, tenantId: row.tenant_id, employeeId: row.employee_id,
    employeeName: row.employee_name, shiftId: row.shift_id,
    shiftName: row.shift_name, shiftCode: row.shift_code,
    effectiveFrom: row.effective_from, effectiveTo: row.effective_to,
  };
}

function mapAttendanceRecordRow(row: AttendanceRecordRow): AttendanceRecordSnapshot {
  return {
    id: row.id, tenantId: row.tenant_id, employeeId: row.employee_id,
    employeeName: row.employee_name, workDate: row.work_date,
    shiftId: row.shift_id, shiftName: row.shift_name,
    clockIn: row.clock_in, clockOut: row.clock_out,
    workedMinutes: row.worked_minutes, lateMinutes: row.late_minutes,
    overtimeMinutes: row.overtime_minutes, isAbsent: row.is_absent,
    isLeave: row.is_leave, notes: row.notes,
  };
}

function mapPolicyRow(row: AttendancePolicyRow): AttendancePolicySnapshot {
  const rules = typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules;
  return {
    id: row.id, tenantId: row.tenant_id, locationId: row.location_id,
    locationName: row.location_name, name: row.name, rules, isActive: row.is_active,
  };
}
