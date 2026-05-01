import { Module } from '@nestjs/common';
import { RequisitionController } from './controllers/requisition.controller';
import { RequisitionService } from './services/requisition.service';
import { RequisitionRepository } from './repositories/requisition.repository';
import { CandidateController } from './controllers/candidate.controller';
import { CandidateService } from './services/candidate.service';
import { CandidateRepository } from './repositories/candidate.repository';
import { ApplicationController } from './controllers/application.controller';
import { ApplicationService } from './services/application.service';
import { ApplicationRepository } from './repositories/application.repository';
import { InterviewController } from './controllers/interview.controller';
import { InterviewService } from './services/interview.service';
import { InterviewRepository } from './repositories/interview.repository';
import { OfferController } from './controllers/offer.controller';
import { OfferService } from './services/offer.service';
import { OfferRepository } from './repositories/offer.repository';
import { OnboardingHandlerService } from './services/onboarding-handler.service';

@Module({
  imports: [],
  controllers: [
    RequisitionController, CandidateController, ApplicationController, 
    InterviewController, OfferController
  ],
  providers: [
    RequisitionService, RequisitionRepository,
    CandidateService, CandidateRepository,
    ApplicationService, ApplicationRepository,
    InterviewService, InterviewRepository,
    OfferService, OfferRepository,
    OnboardingHandlerService
  ],
  exports: [
    RequisitionService, CandidateService, ApplicationService, 
    InterviewService, OfferService
  ],
})
export class RecruitmentModule {}
