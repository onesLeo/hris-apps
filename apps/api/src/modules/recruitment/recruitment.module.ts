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

@Module({
  imports: [],
  controllers: [RequisitionController, CandidateController, ApplicationController],
  providers: [
    RequisitionService, RequisitionRepository,
    CandidateService, CandidateRepository,
    ApplicationService, ApplicationRepository
  ],
  exports: [RequisitionService, CandidateService, ApplicationService],
})
export class RecruitmentModule {}
