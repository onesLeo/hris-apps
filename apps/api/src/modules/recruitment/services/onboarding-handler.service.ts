import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';

/**
 * Recruitment-side handler for the `recruitment.offer.accepted` event.
 *
 * Responsibilities:
 *   1. Increment `job_requisitions.filled_count` so the requisition tracks
 *      how many positions have been filled.
 *
 * The **onboarding-side** handler (OnboardingListener in the onboarding module)
 * is responsible for creating the employee shell and onboarding case — it already
 * subscribes to the same event. This service only handles recruitment-specific
 * side-effects.
 */
@Injectable()
export class OnboardingHandlerService {
  private readonly logger = new Logger(OnboardingHandlerService.name);

  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  /**
   * When an offer is accepted, look up the application → requisition chain
   * and bump `filled_count` by 1.
   */
  @OnEvent('recruitment.offer.accepted')
  async handleOfferAccepted(payload: {
    tenantId: string;
    offerId: string;
    applicationId: string;
    [key: string]: unknown;
  }): Promise<void> {
    const { tenantId, offerId, applicationId } = payload;

    this.logger.log(
      `Handling offer accepted — offerId=${offerId}, applicationId=${applicationId}`,
    );

    try {
      // Resolve the requisition through the application
      const [application] = await this.db.queryWithTenant<{ requisition_id: string }>(
        tenantId,
        `SELECT requisition_id FROM job_applications WHERE id = $1 AND tenant_id = $2`,
        [applicationId, tenantId],
      );

      if (!application) {
        this.logger.warn(`Application ${applicationId} not found — skipping filled_count increment`);
        return;
      }

      // Increment filled_count on the requisition
      await this.db.queryWithTenant(
        tenantId,
        `UPDATE job_requisitions
         SET filled_count = filled_count + 1, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [application.requisition_id, tenantId],
      );

      this.logger.log(
        `Incremented filled_count on requisition ${application.requisition_id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment filled_count for offer ${offerId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
