import type {
  RecruitmentEmployeeShellPayload,
  RecruitmentOfferAcceptedExistingEmployeePayload,
  RecruitmentOfferAcceptedNewEmployeePayload,
  RecruitmentOfferAcceptedPayload,
} from './onboarding.events';

type RecruitmentOfferAcceptedBaseInput = {
  tenantId: string;
  actorId: string;
  offerId: string;
  applicationId: string;
  candidateId: string;
  requisitionId: string;
  proposedStartDate: string;
  baseSalary: number;
  currency: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  contextJson?: Record<string, unknown>;
};

export type RecruitmentOfferAcceptedExistingEmployeeInput = RecruitmentOfferAcceptedBaseInput & {
  employeeId: string;
  employeeShell?: never;
};

export type RecruitmentOfferAcceptedNewEmployeeInput = RecruitmentOfferAcceptedBaseInput & {
  employeeId?: never;
  employeeShell: RecruitmentEmployeeShellPayload;
};

export function buildRecruitmentOfferAcceptedPayload(
  input: RecruitmentOfferAcceptedExistingEmployeeInput,
): RecruitmentOfferAcceptedExistingEmployeePayload;
export function buildRecruitmentOfferAcceptedPayload(
  input: RecruitmentOfferAcceptedNewEmployeeInput,
): RecruitmentOfferAcceptedNewEmployeePayload;
export function buildRecruitmentOfferAcceptedPayload(
  input: RecruitmentOfferAcceptedPayload,
): RecruitmentOfferAcceptedPayload {
  if (hasEmployeeId(input) && hasEmployeeShell(input)) {
    throw new Error('Recruitment offer accepted payload must not include both employeeId and employeeShell');
  }

  if (hasEmployeeId(input)) {
    const { employeeShell: _employeeShell, ...payload } = input;
    return payload;
  }

  if (hasEmployeeShell(input)) {
    const { employeeId: _employeeId, ...payload } = input;
    return payload;
  }

  throw new Error('Recruitment offer accepted payload must include either employeeId or employeeShell');
}

function hasEmployeeId(
  input: RecruitmentOfferAcceptedPayload,
): input is RecruitmentOfferAcceptedExistingEmployeePayload {
  const employeeId = (input as { employeeId?: unknown }).employeeId;
  return typeof employeeId === 'string' && employeeId.trim().length > 0;
}

function hasEmployeeShell(
  input: RecruitmentOfferAcceptedPayload,
): input is RecruitmentOfferAcceptedNewEmployeePayload {
  const employeeShell = (input as { employeeShell?: unknown }).employeeShell;
  return typeof employeeShell === 'object' && employeeShell !== null;
}
