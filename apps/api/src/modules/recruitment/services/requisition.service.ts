import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequisitionRepository } from '../repositories/requisition.repository';
import type { CreateRequisitionDto, UpdateRequisitionDto } from '../dto/requisition.dto';
import type { RequisitionSnapshot } from '../types/requisition.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestContext } from '../../../common/context/request-context';
import { WorkflowInstanceService } from '../../approval/workflow-instance.service';

@Injectable()
export class RequisitionService {
  constructor(
    private readonly repository: RequisitionRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowInstances: WorkflowInstanceService,
  ) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? '';
  }

  async create(dto: CreateRequisitionDto): Promise<RequisitionSnapshot> {
    return this.repository.create(this.tenantId(), dto);
  }

  async update(id: string, dto: UpdateRequisitionDto): Promise<RequisitionSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Requisition ${id} not found`);
    }

    const updated = await this.repository.update(this.tenantId(), id, dto);
    
    if (existing.status !== 'open' && updated?.status === 'open') {
      this.eventEmitter.emit('recruitment.requisition.opened', {
        tenantId: this.tenantId(),
        requisitionId: id,
        timestamp: new Date().toISOString()
      });
    }

    return updated!;
  }

  async submitForApproval(id: string): Promise<RequisitionSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Requisition ${id} not found`);
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft requisitions can be submitted for approval');
    }

    const workflowInstanceId = await this.workflowInstances.startWorkflowInstance(this.tenantId(), {
      templateCode: 'recruitment-requisition-approval',
      templateName: 'Recruitment Requisition Approval',
      requestType: 'requisition_approval',
      entityType: 'job_requisition',
      entityId: id,
      requestorId: this.userId(),
      triggerEvent: 'recruitment.requisition.submitted',
      defaultSteps: [
        {
          stepOrder: 1,
          name: 'Hiring manager review',
          assigneeRule: 'direct_manager',
        },
        {
          stepOrder: 2,
          name: 'HR review',
          assigneeRule: 'hr_manager',
        },
      ],
      assigneeContext: {
        directManagerId: existing.hiringManagerId,
      },
      contextJson: {
        requisitionId: id,
        hiringManagerId: existing.hiringManagerId,
      },
    });

    const updated = await this.repository.markPendingApproval(this.tenantId(), id, workflowInstanceId);

    return updated!;
  }

  async findById(id: string): Promise<RequisitionSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Requisition ${id} not found`);
    }
    return existing;
  }

  async findAll(): Promise<RequisitionSnapshot[]> {
    return this.repository.findAll(this.tenantId());
  }
}
