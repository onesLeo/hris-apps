import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApplicationRepository } from '../repositories/application.repository';
import type { CreateApplicationDto, AdvanceApplicationStageDto } from '../dto/application.dto';
import type { JobApplicationSnapshot } from '../types/application.types';
import { RequestContext } from '../../../common/context/request-context';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly repository: ApplicationRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? '';
  }

  async create(dto: CreateApplicationDto): Promise<JobApplicationSnapshot> {
    const application = await this.repository.create(this.tenantId(), dto);
    
    // Log the initial stage
    await this.repository.logStageChange(
      this.tenantId(),
      application.id,
      null,
      'applied',
      this.userId()
    );

    return application;
  }

  async advanceStage(id: string, dto: AdvanceApplicationStageDto): Promise<JobApplicationSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Application ${id} not found`);
    }

    if (existing.stage === dto.toStage) {
      throw new BadRequestException(`Application is already in stage ${dto.toStage}`);
    }

    const updated = await this.repository.updateStage(this.tenantId(), id, dto.toStage, dto.rejectedReason);
    
    await this.repository.logStageChange(
      this.tenantId(),
      id,
      existing.stage,
      dto.toStage,
      this.userId(),
      dto.notes
    );

    this.eventEmitter.emit('recruitment.application.stage_changed', {
      tenantId: this.tenantId(),
      applicationId: id,
      fromStage: existing.stage,
      toStage: dto.toStage,
      timestamp: new Date().toISOString()
    });

    return updated!;
  }

  async findById(id: string): Promise<JobApplicationSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    return existing;
  }

  async findAllByRequisition(requisitionId: string): Promise<JobApplicationSnapshot[]> {
    return this.repository.findAllByRequisition(this.tenantId(), requisitionId);
  }
}
