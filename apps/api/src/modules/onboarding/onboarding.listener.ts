import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EmployeeService } from '../employee/employee.service';
import { OnboardingService } from './onboarding.service';
import type {
  OnboardingAccessProvisioningFailedEvent,
  OnboardingAccessProvisionedEvent,
  OnboardingAttendanceProfileInitializedEvent,
  OnboardingAttendanceProfileInitializationFailedEvent,
  OnboardingActivationHookExecutedEvent,
  RecruitmentOfferAcceptedExistingEmployeePayload,
  RecruitmentOfferAcceptedNewEmployeePayload,
  RecruitmentOfferAcceptedPayload,
} from '@hris/types';

@Injectable()
export class OnboardingListener {
  constructor(
    private readonly onboarding: OnboardingService,
    private readonly employees: EmployeeService,
    private readonly events: EventEmitter2,
  ) {}

  @OnEvent('recruitment.offer.accepted')
  async handleOfferAccepted(payload: RecruitmentOfferAcceptedPayload): Promise<void> {
    const employeeId = hasExistingEmployeeShell(payload)
      ? payload.employeeId
      : await this.ensureEmployeeShell(payload);
    const contextJson = {
      offerId: payload.offerId,
      applicationId: payload.applicationId,
      candidateId: payload.candidateId,
      requisitionId: payload.requisitionId,
      proposedStartDate: payload.proposedStartDate,
      baseSalary: payload.baseSalary,
      currency: payload.currency,
      employmentType: payload.employmentType,
      ...(payload.contextJson ?? {}),
    };

    await this.onboarding.createCaseWithActor(payload.tenantId, payload.actorId, {
      employeeId,
      startDate: payload.proposedStartDate,
      contextJson,
    });
  }

  @OnEvent('onboarding.activation.hook.executed')
  async handleActivationHookExecuted(payload: OnboardingActivationHookExecutedEvent): Promise<void> {
    switch (payload.hook.key) {
      case 'initialize_payroll_setup':
        return this.handlePayrollSetupHookExecuted(payload);
      case 'provision_access':
        return this.handleAccessProvisioningHookExecuted(payload);
      case 'initialize_attendance_profile':
        return this.handleAttendanceProfileHookExecuted(payload);
      default:
        return;
    }
  }

  private async handlePayrollSetupHookExecuted(payload: OnboardingActivationHookExecutedEvent): Promise<void> {
    const detail = await this.onboarding.getCase(payload.tenantId, payload.onboardingCaseId);
    if (!detail.hireCase || !detail.employee) {
      throw new Error(`Onboarding case ${payload.onboardingCaseId} is missing hire case or employee detail`);
    }

    const hireContext = detail.hireCase.contextJson;
    const payrollProfile = toRecord(hireContext.payrollProfile);
    const npwp = pickString(payrollProfile?.npwp) ?? pickString(hireContext.npwp);
    const ptkpCategoryCode = pickString(payrollProfile?.ptkpCategoryCode)
      ?? pickString(hireContext.ptkpCategoryCode)
      ?? 'TK/0';

    try {
      const result = await this.employees.initializePayrollSetup(payload.tenantId, payload.employeeId, {
        npwp,
        ptkpCategoryCode,
      });

      this.events.emit('payroll.setup.initialized', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        initializedAt: payload.transitionedAt,
        ptkpCategoryCode: result.ptkpCategoryCode,
        npwpActive: npwp !== null,
      });
    } catch (error) {
      this.events.emit('payroll.setup.failed', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        failedAt: payload.transitionedAt,
        reason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async handleAttendanceProfileHookExecuted(payload: OnboardingActivationHookExecutedEvent): Promise<void> {
    const detail = await this.onboarding.getCase(payload.tenantId, payload.onboardingCaseId);
    if (!detail.hireCase || !detail.employee) {
      throw new Error(`Onboarding case ${payload.onboardingCaseId} is missing hire case or employee detail`);
    }

    if (payload.hook.status !== 'completed') {
      this.events.emit('onboarding.attendance.profile.initialization.failed', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        failedAt: payload.transitionedAt,
        reason: payload.hook.message ?? 'Attendance profile prerequisites were missing',
      } satisfies OnboardingAttendanceProfileInitializationFailedEvent);
      return;
    }

    try {
      const result = await this.employees.initializeAttendanceProfile(payload.tenantId, payload.employeeId);

      this.events.emit('onboarding.attendance.profile.initialized', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        initializedAt: payload.transitionedAt,
        profileId: result.profileId,
        locationId: result.locationId,
        departmentId: result.departmentId,
        timezone: result.timezone,
        clockingMethod: result.clockingMethod,
      } satisfies OnboardingAttendanceProfileInitializedEvent);
    } catch (error) {
      this.events.emit('onboarding.attendance.profile.initialization.failed', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        failedAt: payload.transitionedAt,
        reason: error instanceof Error ? error.message : String(error),
      } satisfies OnboardingAttendanceProfileInitializationFailedEvent);
      throw error;
    }
  }

  private async handleAccessProvisioningHookExecuted(payload: OnboardingActivationHookExecutedEvent): Promise<void> {
    const detail = await this.onboarding.getCase(payload.tenantId, payload.onboardingCaseId);
    if (!detail.hireCase || !detail.employee) {
      throw new Error(`Onboarding case ${payload.onboardingCaseId} is missing hire case or employee detail`);
    }

    try {
      const result = await this.employees.initializeAccessProvisioning(payload.tenantId, payload.employeeId);

      this.events.emit('onboarding.access.provisioned', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        provisionedAt: payload.transitionedAt,
        userId: result.userId,
        keycloakId: result.keycloakId,
        roleName: result.roleName,
      } satisfies OnboardingAccessProvisionedEvent);
    } catch (error) {
      this.events.emit('onboarding.access.provisioning.failed', {
        tenantId: payload.tenantId,
        onboardingCaseId: payload.onboardingCaseId,
        hireCaseId: payload.hireCaseId,
        employeeId: payload.employeeId,
        actorId: payload.actorId,
        failedAt: payload.transitionedAt,
        reason: error instanceof Error ? error.message : String(error),
      } satisfies OnboardingAccessProvisioningFailedEvent);
      throw error;
    }
  }

  private async ensureEmployeeShell(payload: RecruitmentOfferAcceptedNewEmployeePayload): Promise<string> {
    const shell = payload.employeeShell;
    const employeeNumber = shell.employeeNumber ?? `PB-${payload.candidateId.slice(0, 8).toUpperCase()}`;

    const employee = await this.employees.hire(payload.tenantId, {
      employeeNumber,
      firstName: shell.firstName,
      lastName: shell.lastName,
      email: shell.email,
      phone: shell.phone,
      dateOfBirth: shell.dateOfBirth,
      gender: shell.gender,
      nationality: shell.nationality,
      hireDate: payload.proposedStartDate,
      jobTitle: shell.jobTitle,
      departmentId: shell.departmentId,
      locationId: shell.locationId,
      employmentType: shell.employmentType,
      workArrangement: shell.workArrangement,
      managerId: shell.managerId,
      status: 'pre_boarding',
      probationEndDate: shell.probationEndDate,
      noticePeriodDays: shell.noticePeriodDays,
      jobGrade: shell.jobGrade,
    });

    return employee.id;
  }
}

function hasExistingEmployeeShell(
  payload: RecruitmentOfferAcceptedPayload,
): payload is RecruitmentOfferAcceptedExistingEmployeePayload {
  return typeof payload.employeeId === 'string' && payload.employeeId.trim().length > 0;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
