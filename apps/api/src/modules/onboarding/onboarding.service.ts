import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestContext } from '../../common/context/request-context';
import { FILE_STORAGE_SERVICE, type IFileStorageService } from '../../common/storage/storage.types';
import { OnboardingRepository } from './onboarding.repository';
import { CreateOnboardingCaseUseCase } from './create-onboarding-case.use-case';
import { CompleteOnboardingTaskUseCase } from './complete-onboarding-task.use-case';
import { TransitionOnboardingCaseUseCase } from './transition-onboarding-case.use-case';
import { UploadOnboardingAttachmentUseCase, OnboardingAttachmentError } from './upload-onboarding-attachment.use-case';
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
    private readonly uploadAttachmentUseCase: UploadOnboardingAttachmentUseCase,
    @Inject(FILE_STORAGE_SERVICE) private readonly storage: IFileStorageService,
    private readonly events: EventEmitter2,
  ) {}

  private actorId(): string {
    return RequestContext.get()?.userId ?? 'system';
  }

  private actorRole(): string | null {
    return RequestContext.get()?.actorRole ?? null;
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
      actorRole: this.actorRole(),
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

  async uploadAttachment(
    tenantId: string,
    onboardingCaseId: string,
    onboardingTaskId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ): Promise<OnboardingDetailSnapshot> {
    const snapshot = await this.repository.loadCaseDetail(tenantId, onboardingCaseId);
    const now = new Date().toISOString();
    const attachmentId = randomUUID();
    const storageKey = buildAttachmentStorageKey(
      tenantId,
      onboardingCaseId,
      onboardingTaskId,
      attachmentId,
      file.originalname,
    );

    const result = this.uploadAttachmentUseCase.execute({
      tenantId,
      actorId: this.actorId(),
      onboardingCaseId,
      onboardingTaskId,
      attachmentId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey,
      uploadedAt: now,
    }, snapshot);

    try {
      await this.storage.save(result.attachment.storageKey, file.buffer);
    } catch (error) {
      throw new OnboardingAttachmentError(
        'ATTACHMENT_STORAGE_FAILED',
        `Failed to store onboarding attachment ${attachmentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await this.repository.saveAttachment(tenantId, result.attachment);
      await this.emit(result.events);
    } catch (error) {
      await this.storage.delete(result.attachment.storageKey);
      throw error;
    }

    return this.repository.loadCaseDetail(tenantId, onboardingCaseId);
  }

  async downloadAttachment(
    tenantId: string,
    attachmentId: string,
  ): Promise<{ attachment: NonNullable<Awaited<ReturnType<OnboardingRepository['loadAttachmentDetail']>>>; content: Buffer }> {
    const attachment = await this.repository.loadAttachmentDetail(tenantId, attachmentId);
    if (!attachment) {
      throw new OnboardingAttachmentError('ATTACHMENT_NOT_FOUND', `Onboarding attachment ${attachmentId} not found`);
    }

    let content: Buffer;
    try {
      content = await this.storage.read(attachment.storageKey);
    } catch (error) {
      throw new OnboardingAttachmentError(
        'ATTACHMENT_STORAGE_FAILED',
        `Failed to read onboarding attachment ${attachmentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return { attachment, content };
  }
}

function buildAttachmentStorageKey(
  tenantId: string,
  onboardingCaseId: string,
  onboardingTaskId: string,
  attachmentId: string,
  originalFileName: string,
): string {
  const ext = extname(originalFileName).toLowerCase();
  const safeExt = ext && ext.length <= 8 ? ext : '';
  return [
    'onboarding',
    tenantId,
    onboardingCaseId,
    onboardingTaskId,
    `${attachmentId}${safeExt}`,
  ].join('/');
}
