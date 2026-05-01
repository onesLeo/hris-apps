import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { LeaveRepository } from './leave.repository';
import { SubmitLeaveRequestUseCase } from './submit-leave-request.use-case';
import type { LeaveTypeSnapshot, LeaveBalanceSnapshot, LeaveRequestSnapshot } from './leave.types';
import type { CreateLeaveRequestDto, ReviewLeaveRequestDto } from './leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly repository: LeaveRepository,
    private readonly submitUseCase: SubmitLeaveRequestUseCase,
  ) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? 'system';
  }

  async listTypes(tenantId: string): Promise<LeaveTypeSnapshot[]> {
    return this.repository.findLeaveTypes(tenantId);
  }

  async listBalances(tenantId: string, employeeId: string, year: number): Promise<LeaveBalanceSnapshot[]> {
    return this.repository.findLeaveBalances(tenantId, employeeId, year);
  }

  async listRequests(
    tenantId: string,
    filters: { employeeId?: string; status?: string; limit?: number },
  ): Promise<LeaveRequestSnapshot[]> {
    return this.repository.findLeaveRequests(tenantId, filters);
  }

  async submitRequest(tenantId: string, userId: string, dto: CreateLeaveRequestDto): Promise<LeaveRequestSnapshot> {
    return this.submitUseCase.execute(tenantId, userId, dto);
  }

  async reviewRequest(
    tenantId: string,
    userId: string,
    id: string,
    dto: ReviewLeaveRequestDto,
  ): Promise<LeaveRequestSnapshot> {
    const existing = await this.repository.findLeaveRequestById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    if (existing.status !== 'pending') {
      throw new BadRequestException(`Leave request is already ${existing.status} and cannot be reviewed`);
    }

    const newStatus = dto.action === 'approve' ? 'approved' : 'rejected';
    const updated = await this.repository.updateLeaveRequestStatus(tenantId, id, newStatus, userId, dto.note ?? null);

    if (!updated) {
      throw new NotFoundException(`Leave request ${id} not found`);
    }

    const year = new Date(existing.fromDate).getFullYear();

    // Decrement pending in both cases; if approved also increment taken
    await this.repository.adjustLeaveBalance(tenantId, existing.employeeId, existing.leaveTypeId, year, 'pending', -existing.days);
    if (dto.action === 'approve') {
      await this.repository.adjustLeaveBalance(tenantId, existing.employeeId, existing.leaveTypeId, year, 'taken', existing.days);
    }

    return updated;
  }
}
