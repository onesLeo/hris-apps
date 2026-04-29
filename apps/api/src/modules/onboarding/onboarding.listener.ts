import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnboardingService } from './onboarding.service';

type RecruitmentOfferAcceptedPayload = {
  tenantId: string;
  employeeId: string;
  startDate: string;
  actorId: string;
  contextJson?: Record<string, unknown>;
};

@Injectable()
export class OnboardingListener {
  constructor(private readonly onboarding: OnboardingService) {}

  @OnEvent('recruitment.offer.accepted')
  async handleOfferAccepted(payload: RecruitmentOfferAcceptedPayload): Promise<void> {
    await this.onboarding.createCaseWithActor(payload.tenantId, payload.actorId, {
      employeeId: payload.employeeId,
      startDate: payload.startDate,
      contextJson: payload.contextJson,
    });
  }
}
