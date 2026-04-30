import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestContext } from '../../common/context/request-context';
import { OnboardingRepository } from './onboarding.repository';
import { CreateOnboardingCaseUseCase } from './create-onboarding-case.use-case';
import { CompleteOnboardingTaskUseCase } from './complete-onboarding-task.use-case';
import { TransitionOnboardingCaseUseCase } from './transition-onboarding-case.use-case';
import type {
  CreateOnboardingCaseDto,
  CompleteOnboardingTaskDto,
  TransitionOnboardingCaseDto,
} from './onboarding.dto';
import type { OnboardingDetailSnapshot } from './onboarding.types';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly repository: OnboardingRepository,
    private readonly createUseCase: CreateOnboardingCaseUseCase,
    private readonly taskUseCase: CompleteOnboardingTaskUseCase,
    private readonly transitionUseCase: TransitionOnboardingCaseUseCase,
    private readonly events: EventEmitter2,
  ) {}

  private actorId(): string {
    return RequestContext.get()?.userId ?? 'system';
  }

  private async emit(events: Array<{ type: string; payload: Record<string, unknown> }>): Promise<void> {
    for (const event of events) {
      this.events.emit(event.type, event.payload);
    }
  }

  async createCase(tenantId: string, dto: CreateOnboardingCaseDto): Promise<OnboardingDetailSnapshot> {
    return this.createCaseWithActor(tenantId, this.actorId(), dto);
  }

  async createCaseWithActor(
    tenantId: string,
    actorId: string,
    dto: CreateOnboardingCaseDto,
  ): Promise<OnboardingDetailSnapshot> {
    const snapshot = await this.repository.loadCreateSnapshot(tenantId, dto.employeeId);
    const now = new Date().toISOString();
    const result = this.createUseCase.execute({
      tenantId,
      actorId,
      employeeId: dto.employeeId,
      hireCaseId: randomUUID(),
      onboardingCaseId: randomUUID(),
      startDate: dto.startDate,
      ...(dto.contextJson ? { contextJson: dto.contextJson } : {}),
      createdAt: now,
    }, snapshot);

    await this.repository.saveCreateResult(tenantId, result);
    await this.emit(result.events);

    return this.repository.loadCaseDetail(tenantId, result.onboardingCase.id);
  }

  async getCase(tenantId: string, onboardingCaseId: string): Promise<OnboardingDetailSnapshot> {
    return this.repository.loadCaseDetail(tenantId, onboardingCaseId);
  }

  async getCaseForEmployee(tenantId: string, employeeId: string): Promise<OnboardingDetailSnapshot> {
    return this.repository.loadEmployeeDetail(tenantId, employeeId);
  }

  async completeTask(
    tenantId: string,
    onboardingCaseId: string,
    onboardingTaskId: string,
    dto: CompleteOnboardingTaskDto,
  ): Promise<OnboardingDetailSnapshot> {
    const snapshot = await this.repository.loadCaseDetail(tenantId, onboardingCaseId);
    const result = this.taskUseCase.execute({
      tenantId,
      actorId: this.actorId(),
      onboardingCaseId,
      onboardingTaskId,
      completedAt: new Date().toISOString(),
      comment: dto.comment ?? null,
    }, snapshot);

    await this.repository.saveTaskCompletion(tenantId, result);
    await this.emit(result.events);

    return this.repository.loadCaseDetail(tenantId, onboardingCaseId);
  }

  async transitionCase(
    tenantId: string,
    onboardingCaseId: string,
    dto: TransitionOnboardingCaseDto,
  ): Promise<OnboardingDetailSnapshot> {
    const snapshot = await this.repository.loadCaseDetail(tenantId, onboardingCaseId);
    const result = this.transitionUseCase.execute({
      tenantId,
      actorId: this.actorId(),
      onboardingCaseId,
      action: dto.action,
      reason: dto.reason ?? null,
      transitionedAt: new Date().toISOString(),
    }, snapshot);

    await this.repository.saveTransitionResult(tenantId, result);
    await this.emit(result.events);

    return this.repository.loadCaseDetail(tenantId, onboardingCaseId);
  }
}
