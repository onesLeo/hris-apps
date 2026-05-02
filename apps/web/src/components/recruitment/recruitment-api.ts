import { apiGet, apiPost, apiPatch } from '../../lib/api-client.ts';

// ─── API Response Types ────────────────────────────────────────────────────────

export type RequisitionResponse = {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  locationId: string;
  hiringManagerId: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  headcount: number;
  filledCount: number;
  description: string | null;
  requirements: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateResponse = {
  id: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  anonymisedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationResponse = {
  id: string;
  tenantId: string;
  requisitionId: string;
  candidateId: string;
  stage: string;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewResponse = {
  id: string;
  tenantId: string;
  applicationId: string;
  roundName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  overallRecommendation: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfferResponse = {
  id: string;
  tenantId: string;
  applicationId: string;
  baseSalary: number | null;
  bonus: number | null;
  equity: number | null;
  otherBenefits: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Requisitions ──────────────────────────────────────────────────────────────

export async function fetchRequisitions(): Promise<RequisitionResponse[]> {
  return apiGet<RequisitionResponse[]>('/recruitment/requisitions');
}

export async function fetchRequisition(id: string): Promise<RequisitionResponse> {
  return apiGet<RequisitionResponse>(`/recruitment/requisitions/${id}`);
}

export async function createRequisition(data: {
  title: string;
  departmentId: string;
  locationId: string;
  hiringManagerId: string;
  priority?: 'high' | 'medium' | 'low';
  headcount: number;
  description?: string;
  requirements?: string;
}): Promise<RequisitionResponse> {
  return apiPost<RequisitionResponse>('/recruitment/requisitions', data);
}

export async function updateRequisition(id: string, data: Partial<{
  title: string;
  departmentId: string;
  locationId: string;
  hiringManagerId: string;
  priority: 'high' | 'medium' | 'low';
  headcount: number;
  description: string;
  requirements: string;
  status: string;
}>): Promise<RequisitionResponse> {
  return apiPatch<RequisitionResponse>(`/recruitment/requisitions/${id}`, data);
}

export async function submitRequisition(id: string): Promise<RequisitionResponse> {
  return apiPost<RequisitionResponse>(`/recruitment/requisitions/${id}/submit`, {});
}

// ─── Candidates ────────────────────────────────────────────────────────────────

export async function fetchCandidates(): Promise<CandidateResponse[]> {
  return apiGet<CandidateResponse[]>('/recruitment/candidates');
}

export async function createCandidate(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<CandidateResponse> {
  return apiPost<CandidateResponse>('/recruitment/candidates', data);
}

export async function anonymiseCandidate(id: string): Promise<CandidateResponse> {
  return apiPost<CandidateResponse>(`/recruitment/candidates/${id}/anonymise`, {});
}

// ─── Applications ──────────────────────────────────────────────────────────────

export async function fetchApplications(requisitionId: string): Promise<ApplicationResponse[]> {
  return apiGet<ApplicationResponse[]>(`/recruitment/applications?requisitionId=${requisitionId}`);
}

export async function createApplication(data: {
  requisitionId: string;
  candidateId: string;
}): Promise<ApplicationResponse> {
  return apiPost<ApplicationResponse>('/recruitment/applications', data);
}

export async function advanceApplication(id: string, data: {
  toStage: string;
  notes?: string;
  rejectedReason?: string;
}): Promise<ApplicationResponse> {
  return apiPost<ApplicationResponse>(`/recruitment/applications/${id}/advance`, data);
}

// ─── Interviews ────────────────────────────────────────────────────────────────

export async function fetchInterviews(applicationId: string): Promise<InterviewResponse[]> {
  return apiGet<InterviewResponse[]>(`/recruitment/interviews?applicationId=${applicationId}`);
}

export async function createInterview(data: {
  applicationId: string;
  roundName: string;
  scheduledAt: string;
  durationMinutes: number;
  interviewerIds: string[];
}): Promise<InterviewResponse> {
  return apiPost<InterviewResponse>('/recruitment/interviews', data);
}

export async function submitScorecard(interviewId: string, data: {
  recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no';
  notes?: string;
}): Promise<unknown> {
  return apiPost(`/recruitment/interviews/${interviewId}/scorecards`, data);
}

// ─── Offers ────────────────────────────────────────────────────────────────────

export async function fetchOffers(applicationId: string): Promise<OfferResponse[]> {
  return apiGet<OfferResponse[]>(`/recruitment/offers?applicationId=${applicationId}`);
}

export async function createOffer(data: {
  applicationId: string;
  baseSalary?: number;
  bonus?: number;
  equity?: number;
  otherBenefits?: string;
}): Promise<OfferResponse> {
  return apiPost<OfferResponse>('/recruitment/offers', data);
}

export async function updateOffer(id: string, data: Partial<{
  baseSalary: number;
  bonus: number;
  equity: number;
  otherBenefits: string;
  status: string;
}>): Promise<OfferResponse> {
  return apiPatch<OfferResponse>(`/recruitment/offers/${id}`, data);
}

export async function submitOffer(id: string): Promise<OfferResponse> {
  return apiPost<OfferResponse>(`/recruitment/offers/${id}/submit`, {});
}
