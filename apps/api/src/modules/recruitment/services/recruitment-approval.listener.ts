import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OfferRepository } from '../repositories/offer.repository';
import { RequisitionRepository } from '../repositories/requisition.repository';

type ApprovalInstanceCompletedPayload = {
  tenantId?: string;
  requestType?: string;
  entityType?: string;
  entityId?: string;
  status?: 'approved' | 'rejected' | string;
  completedAt?: string | null;
};

@Injectable()
export class RecruitmentApprovalListener {
  constructor(
    private readonly requisitions: RequisitionRepository,
    private readonly offers: OfferRepository,
    private readonly events: EventEmitter2,
  ) {
    this.events.on('approval.instance.completed', (payload: ApprovalInstanceCompletedPayload) => {
      void this.handleApprovalInstanceCompleted(payload);
    });
  }

  async handleApprovalInstanceCompleted(payload: ApprovalInstanceCompletedPayload): Promise<void> {
    const tenantId = pickString(payload.tenantId);
    const requestType = pickString(payload.requestType);
    const entityId = pickString(payload.entityId);
    const status = payload.status;

    if (!tenantId || !requestType || !entityId || !status) {
      return;
    }

    const completedAt = pickString(payload.completedAt) ?? new Date().toISOString();

    if (requestType === 'requisition_approval' || payload.entityType === 'job_requisition') {
      await this.handleRequisitionDecision(tenantId, entityId, status, completedAt);
      return;
    }

    if (requestType === 'offer_approval' || payload.entityType === 'job_offer') {
      await this.handleOfferDecision(tenantId, entityId, status);
    }
  }

  private async handleRequisitionDecision(
    tenantId: string,
    requisitionId: string,
    status: ApprovalInstanceCompletedPayload['status'],
    completedAt: string,
  ): Promise<void> {
    if (status === 'approved') {
      const updated = await this.requisitions.update(tenantId, requisitionId, { status: 'open' });
      if (updated) {
        this.events.emit('recruitment.requisition.opened', {
          tenantId,
          requisitionId,
          timestamp: completedAt,
        });
      }
      return;
    }

    if (status === 'rejected') {
      await this.requisitions.update(tenantId, requisitionId, { status: 'cancelled' });
    }
  }

  private async handleOfferDecision(
    tenantId: string,
    offerId: string,
    status: ApprovalInstanceCompletedPayload['status'],
  ): Promise<void> {
    if (status === 'approved') {
      await this.offers.update(tenantId, offerId, { status: 'approved' });
      return;
    }

    if (status === 'rejected') {
      await this.offers.update(tenantId, offerId, { status: 'declined' });
    }
  }
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
