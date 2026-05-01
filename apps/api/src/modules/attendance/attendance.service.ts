import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import type {
  ShiftSnapshot,
  ShiftAssignmentSnapshot,
  AttendanceRecordSnapshot,
  ClockEventSnapshot,
  AttendancePolicySnapshot,
} from './attendance.types';
import type { ClockEventDto, CreateShiftDto, AssignShiftDto, CreateAttendancePolicyDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  // ─── Shifts ─────────────────────────────────────────────────────────────────

  async listShifts(tenantId: string): Promise<ShiftSnapshot[]> {
    return this.repository.findShifts(tenantId);
  }

  async createShift(tenantId: string, dto: CreateShiftDto): Promise<ShiftSnapshot> {
    if (!dto.name || !dto.code || !dto.startTime || !dto.endTime) {
      throw new BadRequestException('name, code, startTime, and endTime are required');
    }
    return this.repository.createShift(tenantId, dto);
  }

  // ─── Shift Assignments ──────────────────────────────────────────────────────

  async listShiftAssignments(tenantId: string, filters: {
    employeeId?: string; shiftId?: string; activeOnly?: boolean;
  } = {}): Promise<ShiftAssignmentSnapshot[]> {
    return this.repository.findShiftAssignments(tenantId, filters);
  }

  async getEmployeeCurrentShift(tenantId: string, employeeId: string): Promise<ShiftSnapshot | null> {
    return this.repository.findCurrentShiftForEmployee(tenantId, employeeId);
  }

  async assignShift(tenantId: string, dto: AssignShiftDto): Promise<ShiftAssignmentSnapshot> {
    if (!dto.employeeId || !dto.shiftId || !dto.effectiveFrom) {
      throw new BadRequestException('employeeId, shiftId, and effectiveFrom are required');
    }
    return this.repository.assignShift(tenantId, dto);
  }

  // ─── Attendance Policies ──────────────────────────────────────────────────────

  async listPolicies(tenantId: string): Promise<AttendancePolicySnapshot[]> {
    return this.repository.findPolicies(tenantId);
  }

  async getPolicyForLocation(tenantId: string, locationId: string): Promise<AttendancePolicySnapshot | null> {
    return this.repository.findPolicyForLocation(tenantId, locationId);
  }

  async upsertPolicy(tenantId: string, dto: CreateAttendancePolicyDto): Promise<AttendancePolicySnapshot> {
    if (!dto.locationId || !dto.name || !dto.rules) {
      throw new BadRequestException('locationId, name, and rules are required');
    }
    return this.repository.upsertPolicy(tenantId, dto.locationId, dto.name, dto.rules);
  }

  // ─── Attendance Records ─────────────────────────────────────────────────────

  async listRecords(
    tenantId: string,
    filters: { employeeId?: string; fromDate?: string; toDate?: string; limit?: number },
  ): Promise<AttendanceRecordSnapshot[]> {
    return this.repository.findAttendanceRecords(tenantId, filters);
  }

  async getTodaySummary(tenantId: string): Promise<{ presentToday: number; lateToday: number; absentToday: number }> {
    return this.repository.findTodaySummary(tenantId);
  }

  // ─── Clock Events ───────────────────────────────────────────────────────────

  async clockIn(tenantId: string, dto: ClockEventDto): Promise<ClockEventSnapshot> {
    return this.clock(tenantId, { ...dto, direction: 'in' });
  }

  async clockOut(tenantId: string, dto: ClockEventDto): Promise<ClockEventSnapshot> {
    return this.clock(tenantId, { ...dto, direction: 'out' });
  }

  private async clock(tenantId: string, dto: ClockEventDto): Promise<ClockEventSnapshot> {
    if (!dto.employeeId) {
      throw new BadRequestException('employeeId is required');
    }

    const eventTime = dto.eventTime ?? new Date().toISOString();
    const workDate = eventTime.slice(0, 10);

    // Deduplication: reject if a same-direction event exists within 2 minutes
    const isDuplicate = await this.repository.isDuplicateClockEvent(tenantId, dto.employeeId, dto.direction, eventTime);
    if (isDuplicate) {
      throw new ConflictException(
        `Duplicate clock-${dto.direction} event detected for employee ${dto.employeeId} within 2 minutes of ${eventTime}`,
      );
    }

    const event = await this.repository.insertClockEvent(tenantId, { ...dto, eventTime });
    await this.repository.upsertAttendanceRecord(tenantId, dto.employeeId, workDate, dto.direction, eventTime);

    return event;
  }
}
