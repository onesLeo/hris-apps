import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { StorageModule } from '../../common/storage/storage.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingListener } from './onboarding.listener';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingCaseUseCase } from './create-onboarding-case.use-case';
import { CompleteOnboardingTaskUseCase } from './complete-onboarding-task.use-case';
import { TransitionOnboardingCaseUseCase } from './transition-onboarding-case.use-case';
import { UploadOnboardingAttachmentUseCase } from './upload-onboarding-attachment.use-case';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingRepository,
    OnboardingService,
    OnboardingListener,
    CreateOnboardingCaseUseCase,
    CompleteOnboardingTaskUseCase,
    TransitionOnboardingCaseUseCase,
    UploadOnboardingAttachmentUseCase,
  ],
  exports: [OnboardingRepository, OnboardingService],
})
export class OnboardingModule {}
