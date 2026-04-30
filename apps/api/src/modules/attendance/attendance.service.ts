import { Injectable, BadRequestException } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { AttendanceRepository } from './attendance.repository';
import type { ShiftSnapshot, AttendanceRecordSnapshot, ClockEventSnapshot } from './attendance.types';
import type { ClockEventDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  async listShifts(tenantId: string): Promise<ShiftSnapshot[]> {
    return this.repository.findShifts(tenantId);
  }

  async listRecords(
    tenantId: string,
    filters: { employeeId?: string; fromDate?: string; toDate?: string; limit?: number },
  ): Promise<AttendanceRecordSnapshot[]> {
    return this.repository.findAttendanceRecords(tenantId, filters);
  }

  async getTodaySummary(tenantId: string): Promise<{ presentToday: number; lateToday: number; absentToday: number }> {
    return this.repository.findTodaySummary(tenantId);
  }

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

    const event = await this.repository.insertClockEvent(tenantId, { ...dto, eventTime });
    await this.repository.upsertAttendanceRecord(tenantId, dto.employeeId, workDate, dto.direction, eventTime);

    return event;
  }
}
