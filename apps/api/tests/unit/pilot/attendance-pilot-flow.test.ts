import assert from 'node:assert/strict';
import test from 'node:test';

import { RequestContext } from '../../../src/common/context/request-context.ts';
import { AttendanceController } from '../../../src/modules/attendance/attendance.controller.ts';
import { AttendanceRepository } from '../../../src/modules/attendance/attendance.repository.ts';
import { AttendanceService } from '../../../src/modules/attendance/attendance.service.ts';

const TENANT_ID = 'tenant-pilot';
const USER_ID = 'dev-hr-manager';
const REQUEST_ID = 'pilot-attendance-flow';
const WORK_DATE = '2026-05-02';
const CLOCK_IN_TIME = '2026-05-02T08:00:00.000Z';
const CLOCK_OUT_TIME = '2026-05-02T17:00:00.000Z';

type EmployeeSeed = {
  id: string;
  tenant_id: string;
  display_name: string;
};

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

type ShiftAssignmentRow = {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  shift_id: string;
  shift_name: string;
  shift_code: string;
  effective_from: string;
  effective_to: string | null;
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
  tenant_id: string;
  employee_id: string;
  event_time: string;
  direction: 'in' | 'out';
  source: string;
};

type Store = {
  employees: Map<string, EmployeeSeed>;
  shifts: Map<string, ShiftRow>;
  assignments: Map<string, ShiftAssignmentRow>;
  attendanceRecords: Map<string, AttendanceRecordRow>;
  clockEvents: ClockEventRow[];
};

function createStore(): Store {
  return {
    employees: new Map([
      ['employee-1', { id: 'employee-1', tenant_id: TENANT_ID, display_name: 'Siti Aminah' }],
    ]),
    shifts: new Map(),
    assignments: new Map(),
    attendanceRecords: new Map(),
    clockEvents: [],
  };
}

function nextIdFactory() {
  let counter = 0;
  return (prefix: string) => `${prefix}-${String(++counter).padStart(2, '0')}`;
}

function attendanceRecordKey(employeeId: string, workDate: string): string {
  return `${employeeId}::${workDate}`;
}

function minutesBetween(later: string, earlier: string): number {
  return Math.round((new Date(later).getTime() - new Date(earlier).getTime()) / 60000);
}

class FakeAttendanceDb {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async queryWithTenant<T>(tenantId: string, sql: string, params: unknown[]): Promise<T[]> {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    if (normalized.includes('INSERT INTO shifts') && normalized.includes('RETURNING id, tenant_id, name, code, start_time, end_time, break_minutes, grace_late_minutes, is_active')) {
      const [name, code, startTime, endTime, breakMinutes, graceLateMinutes] = params.slice(1) as [string, string, string, string, number, number];
      const row: ShiftRow = {
        id: this.nextId('shift'),
        tenant_id: tenantId,
        name,
        code,
        start_time: startTime,
        end_time: endTime,
        break_minutes: Number(breakMinutes ?? 60),
        grace_late_minutes: Number(graceLateMinutes ?? 15),
        is_active: true,
      };
      this.store.shifts.set(row.id, row);
      return [row as T];
    }

    if (normalized.includes('FROM shifts') && normalized.includes('WHERE tenant_id = $1 AND is_active = TRUE')) {
      return [...this.store.shifts.values()]
        .filter((shift) => shift.tenant_id === tenantId && shift.is_active)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)) as T[];
    }

    if (normalized.includes('WITH inserted AS ( INSERT INTO shift_assignments')) {
      const [employeeId, shiftId, effectiveFrom, effectiveTo] = params.slice(1) as [string, string, string, string | null];
      const employee = this.store.employees.get(employeeId);
      const shift = this.store.shifts.get(shiftId);
      if (!employee || !shift || employee.tenant_id !== tenantId || shift.tenant_id !== tenantId) {
        return [];
      }

      const row: ShiftAssignmentRow = {
        id: this.nextId('assignment'),
        tenant_id: tenantId,
        employee_id: employeeId,
        employee_name: employee.display_name,
        shift_id: shiftId,
        shift_name: shift.name,
        shift_code: shift.code,
        effective_from: effectiveFrom,
        effective_to: effectiveTo ?? null,
      };
      this.store.assignments.set(row.id, row);
      return [row as T];
    }

    if (normalized.includes('FROM shift_assignments sa JOIN shifts s ON s.id = sa.shift_id WHERE sa.tenant_id = $1 AND sa.employee_id = $2')) {
      const employeeId = String(params[1] ?? '');
      const candidate = [...this.store.assignments.values()]
        .filter((assignment) => assignment.tenant_id === tenantId && assignment.employee_id === employeeId)
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from))
        .find((assignment) => assignment.effective_from <= WORK_DATE && (!assignment.effective_to || assignment.effective_to >= WORK_DATE));

      if (!candidate) {
        return [];
      }

      const shift = this.store.shifts.get(candidate.shift_id);
      if (!shift) {
        return [];
      }

      return [{
        id: shift.id,
        tenant_id: shift.tenant_id,
        name: shift.name,
        code: shift.code,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_minutes: shift.break_minutes,
        grace_late_minutes: shift.grace_late_minutes,
        is_active: shift.is_active,
      } as T];
    }

    if (normalized.includes('SELECT sa.id, sa.tenant_id, sa.employee_id,') && normalized.includes('FROM shift_assignments sa')) {
      const employeeId = String(params[1] ?? '');
      const shiftId = params.length > 2 ? String(params[2] ?? '') : undefined;
      const rows = [...this.store.assignments.values()]
        .filter((assignment) => assignment.tenant_id === tenantId && assignment.employee_id === employeeId)
        .filter((assignment) => !shiftId || assignment.shift_id === shiftId)
        .filter((assignment) => assignment.effective_from <= WORK_DATE && (!assignment.effective_to || assignment.effective_to >= WORK_DATE))
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from));

      return rows.map((assignment) => ({
        id: assignment.id,
        tenant_id: assignment.tenant_id,
        employee_id: assignment.employee_id,
        employee_name: assignment.employee_name,
        shift_id: assignment.shift_id,
        shift_name: assignment.shift_name,
        shift_code: assignment.shift_code,
        effective_from: assignment.effective_from,
        effective_to: assignment.effective_to,
      }) as T);
    }

    if (normalized.includes('SELECT COUNT(*)::text AS count FROM clock_events')) {
      const employeeId = String(params[1] ?? '');
      const direction = String(params[2] ?? '');
      const eventTime = String(params[3] ?? '');
      const windowStart = new Date(new Date(eventTime).getTime() - 2 * 60000);
      const windowEnd = new Date(new Date(eventTime).getTime() + 2 * 60000);
      const count = this.store.clockEvents.filter((event) => (
        event.tenant_id === tenantId
        && event.employee_id === employeeId
        && event.direction === direction
        && new Date(event.event_time) >= windowStart
        && new Date(event.event_time) <= windowEnd
      )).length;
      return [{ count: String(count) } as T];
    }

    if (normalized.includes('INSERT INTO clock_events') && normalized.includes('RETURNING id, employee_id, event_time, direction, source')) {
      const [employeeId, eventTime, direction, source, deviceId, rawPayload] = params.slice(1) as [string, string, 'in' | 'out', string | null, string | null, string | null];
      const row: ClockEventRow = {
        id: this.nextId('clock'),
        tenant_id: tenantId,
        employee_id: employeeId,
        event_time: eventTime,
        direction,
        source: source ?? 'manual',
      };
      this.store.clockEvents.push(row);
      return [{
        id: row.id,
        employee_id: row.employee_id,
        event_time: row.event_time,
        direction: row.direction,
        source: row.source,
      } as T];
    }

    if (normalized.includes('INSERT INTO attendance_records (tenant_id, employee_id, work_date, clock_in, updated_at)')) {
      const [employeeId, workDate, clockIn] = params.slice(1) as [string, string, string];
      const employee = this.store.employees.get(employeeId);
      if (!employee) {
        return [];
      }

      const key = attendanceRecordKey(employeeId, workDate);
      const existing = this.store.attendanceRecords.get(key);
      const row: AttendanceRecordRow = existing ?? {
        id: this.nextId('attendance'),
        tenant_id: tenantId,
        employee_id: employeeId,
        employee_name: employee.display_name,
        work_date: workDate,
        shift_id: null,
        shift_name: null,
        clock_in: null,
        clock_out: null,
        worked_minutes: null,
        late_minutes: 0,
        overtime_minutes: 0,
        is_absent: false,
        is_leave: false,
        notes: null,
      };
      row.clock_in = clockIn;
      row.employee_name = employee.display_name;
      this.store.attendanceRecords.set(key, row);
      return [];
    }

    if (normalized.includes('INSERT INTO attendance_records (tenant_id, employee_id, work_date, clock_out, updated_at)')) {
      const [employeeId, workDate, clockOut] = params.slice(1) as [string, string, string];
      const employee = this.store.employees.get(employeeId);
      if (!employee) {
        return [];
      }

      const key = attendanceRecordKey(employeeId, workDate);
      const existing = this.store.attendanceRecords.get(key) ?? {
        id: this.nextId('attendance'),
        tenant_id: tenantId,
        employee_id: employeeId,
        employee_name: employee.display_name,
        work_date: workDate,
        shift_id: null,
        shift_name: null,
        clock_in: null,
        clock_out: null,
        worked_minutes: null,
        late_minutes: 0,
        overtime_minutes: 0,
        is_absent: false,
        is_leave: false,
        notes: null,
      };
      existing.clock_out = clockOut;
      if (existing.clock_in) {
        existing.worked_minutes = minutesBetween(clockOut, existing.clock_in);
      }
      this.store.attendanceRecords.set(key, existing);
      return [];
    }

    if (normalized.includes('FROM attendance_records ar JOIN employees e ON e.id = ar.employee_id')) {
      const employeeId = String(params[1] ?? '');
      const fromDate = params[2] ? String(params[2]) : undefined;
      const toDate = params[3] ? String(params[3]) : undefined;
      const limit = params[4] ? Number(params[4]) : 200;

      const rows = [...this.store.attendanceRecords.values()]
        .filter((row) => row.tenant_id === tenantId)
        .filter((row) => !employeeId || row.employee_id === employeeId)
        .filter((row) => !fromDate || row.work_date >= fromDate)
        .filter((row) => !toDate || row.work_date <= toDate)
        .sort((a, b) => b.work_date.localeCompare(a.work_date))
        .slice(0, limit)
        .map((row) => {
          const shift = row.shift_id ? this.store.shifts.get(row.shift_id) : null;
          return {
            id: row.id,
            tenant_id: row.tenant_id,
            employee_id: row.employee_id,
            employee_name: row.employee_name,
            work_date: row.work_date,
            shift_id: row.shift_id,
            shift_name: shift?.name ?? row.shift_name ?? null,
            clock_in: row.clock_in,
            clock_out: row.clock_out,
            worked_minutes: row.worked_minutes,
            late_minutes: row.late_minutes,
            overtime_minutes: row.overtime_minutes,
            is_absent: row.is_absent,
            is_leave: row.is_leave,
            notes: row.notes,
          } as T;
        });

      return rows;
    }

    if (normalized.includes('SELECT COUNT(*) FILTER (WHERE is_absent = FALSE AND is_leave = FALSE AND clock_in IS NOT NULL) AS present_today')) {
      const rows = [...this.store.attendanceRecords.values()].filter((row) => row.tenant_id === tenantId && row.work_date === WORK_DATE);
      return [{
        present_today: String(rows.filter((row) => !row.is_absent && !row.is_leave && row.clock_in !== null).length),
        late_today: String(rows.filter((row) => row.late_minutes > 0).length),
        absent_today: String(rows.filter((row) => row.is_absent).length),
      } as T];
    }

    throw new Error(`Unexpected SQL in attendance pilot test: ${sql}`);
  }
}

test('pilot flow: authenticated attendance clock-in and clock-out reconcile a daily record', async () => {
  const store = createStore();
  const nextId = nextIdFactory();
  const db = new FakeAttendanceDb(store, nextId);
  const repository = new AttendanceRepository(db as never);
  const service = new AttendanceService(repository);
  const controller = new AttendanceController(service);

  await RequestContext.run(
    {
      requestId: REQUEST_ID,
      tenantId: TENANT_ID,
      userId: USER_ID,
      actorRole: 'hr_manager',
    },
    async () => {
      const shift = await controller.createShift({
        name: 'Day Shift',
        code: 'DAY',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 60,
        graceLateMinutes: 15,
      });

      assert.equal(shift.code, 'DAY');

      const shifts = await controller.listShifts();
      assert.equal(shifts.length, 1);
      assert.equal(shifts[0]?.id, shift.id);

      const assignment = await controller.assignShift({
        employeeId: 'employee-1',
        shiftId: shift.id,
        effectiveFrom: WORK_DATE,
      });

      assert.equal(assignment.employeeId, 'employee-1');
      assert.equal(assignment.shiftId, shift.id);

      const currentShift = await controller.getEmployeeCurrentShift('employee-1');
      assert.ok(currentShift);
      assert.equal(currentShift.id, shift.id);
      assert.equal(currentShift.code, 'DAY');

      const clockIn = await controller.clock({
        employeeId: 'employee-1',
        eventTime: CLOCK_IN_TIME,
        direction: 'in',
        source: 'manual',
      });

      assert.equal(clockIn.direction, 'in');

      const clockOut = await controller.clock({
        employeeId: 'employee-1',
        eventTime: CLOCK_OUT_TIME,
        direction: 'out',
        source: 'manual',
      });

      assert.equal(clockOut.direction, 'out');

      const records = await controller.listRecords('employee-1', WORK_DATE, WORK_DATE, '10');
      assert.equal(records.length, 1);
      assert.equal(records[0]?.clockIn, CLOCK_IN_TIME);
      assert.equal(records[0]?.clockOut, CLOCK_OUT_TIME);
      assert.equal(records[0]?.workedMinutes, 540);

      const summary = await controller.todaySummary();
      assert.equal(summary.presentToday, 1);
      assert.equal(summary.lateToday, 0);
      assert.equal(summary.absentToday, 0);
    },
  );
});
