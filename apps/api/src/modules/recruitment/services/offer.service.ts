import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { OfferRepository } from '../repositories/offer.repository';
import { CandidateRepository } from '../repositories/candidate.repository';
import { ApplicationRepository } from '../repositories/application.repository';
import type { CreateOfferDto, UpdateOfferDto } from '../dto/offer.dto';
import type { JobOfferSnapshot } from '../types/offer.types';
import { RequestContext } from '../../../common/context/request-context';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  constructor(
    private readonly repository: OfferRepository,
    private readonly candidateRepo: CandidateRepository,
    private readonly applicationRepo: ApplicationRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
  ) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? '';
  }

  async create(dto: CreateOfferDto): Promise<JobOfferSnapshot> {
    return this.repository.create(this.tenantId(), dto);
  }

  async update(id: string, dto: UpdateOfferDto): Promise<JobOfferSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Offer ${id} not found`);
    }

    const updated = await this.repository.update(this.tenantId(), id, dto);

    // Emit enriched event if status changes to accepted
    if (existing.status !== 'accepted' && updated?.status === 'accepted') {
      await this.emitOfferAccepted(id, updated);
    }

    return updated!;
  }

  async submitForApproval(id: string): Promise<JobOfferSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Offer ${id} not found`);
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft offers can be submitted for approval');
    }

    // Since the approval workflow engine is not fully exposed to create instances directly yet,
    // we bypass it and update to 'approved' to simulate approval for now.
    // In Phase 5 completion, this would create `workflow_instances` and set status to 'pending_approval'.
    const updated = await this.repository.update(this.tenantId(), id, { status: 'approved' });

    return updated!;
  }

  async findById(id: string): Promise<JobOfferSnapshot> {
    const existing = await this.repository.findById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Offer ${id} not found`);
    }
    return existing;
  }

  async findAllByApplication(applicationId: string): Promise<JobOfferSnapshot[]> {
    return this.repository.findAllByApplication(this.tenantId(), applicationId);
  }

  /**
   * Build the full `RecruitmentOfferAcceptedPayload` expected by the onboarding
   * listener, enriching the event with candidate, application, and requisition data.
   */
  private async emitOfferAccepted(offerId: string, offer: JobOfferSnapshot): Promise<void> {
    const tenantId = this.tenantId();

    try {
      const application = await this.applicationRepo.findById(tenantId, offer.applicationId);
      if (!application) {
        this.logger.warn(`Application ${offer.applicationId} not found — cannot emit enriched payload`);
        return;
      }

      const candidate = await this.candidateRepo.findById(tenantId, application.candidateId);
      if (!candidate) {
        this.logger.warn(`Candidate ${application.candidateId} not found — cannot emit enriched payload`);
        return;
      }

      // Look up requisition for department/location info
      const [requisition] = await this.db.queryWithTenant<{
        id: string; title: string; department_id: string; location_id: string;
      }>(
        tenantId,
        `SELECT id, title, department_id, location_id FROM job_requisitions WHERE id = $1 AND tenant_id = $2`,
        [application.requisitionId, tenantId],
      );

      this.eventEmitter.emit('recruitment.offer.accepted', {
        tenantId,
        actorId: this.userId(),
        offerId,
        applicationId: offer.applicationId,
        candidateId: application.candidateId,
        requisitionId: application.requisitionId,
        proposedStartDate: new Date().toISOString().split('T')[0],
        baseSalary: offer.baseSalary ?? 0,
        currency: 'IDR',
        employmentType: 'full_time',
        employeeShell: {
          firstName: candidate.firstName ?? 'Unknown',
          lastName: candidate.lastName ?? '',
          email: candidate.email,
          phone: candidate.phone ?? undefined,
          jobTitle: requisition?.title ?? 'New Hire',
          departmentId: requisition?.department_id ?? '',
          locationId: requisition?.location_id ?? '',
        },
      });

      this.logger.log(`Emitted enriched recruitment.offer.accepted for offer ${offerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to emit enriched offer accepted event: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Still emit a minimal payload so the OnboardingHandlerService can increment filled_count
      this.eventEmitter.emit('recruitment.offer.accepted', {
        tenantId,
        offerId,
        applicationId: offer.applicationId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
