import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingListener } from './onboarding.listener';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingCaseUseCase } from './create-onboarding-case.use-case';
import { CompleteOnboardingTaskUseCase } from './complete-onboarding-task.use-case';
import { TransitionOnboardingCaseUseCase } from './transition-onboarding-case.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingRepository,
    OnboardingService,
    OnboardingListener,
    CreateOnboardingCaseUseCase,
    CompleteOnboardingTaskUseCase,
    TransitionOnboardingCaseUseCase,
  ],
  exports: [OnboardingRepository, OnboardingService],
})
export class OnboardingModule {}
