import {
  fetchRequisitions,
  fetchCandidates,
  fetchRequisition,
  fetchApplications,
  createRequisition as apiCreateRequisition,
  updateRequisition as apiUpdateRequisition,
  type ApplicationResponse,
  type RequisitionResponse,
  type CandidateResponse,
} from './recruitment-api.ts';

export type RecruitmentStage = 'Sourcing' | 'Screening' | 'Interview' | 'Offer';
export type RecruitmentFilter = 'All' | RecruitmentStage;

export type OpenRequisition = {
  id?: string;
  title: string;
  department: string;
  departmentId?: string;
  location: string;
  locationId?: string;
  openings: number;
  stage: RecruitmentStage;
  recruiter: string;
  hiringManagerId?: string;
  workflowInstanceId?: string | null;
  priority: 'High' | 'Medium' | 'Low';
  accent: string;
  status?: string;
  description?: string | null;
  requirements?: string | null;
};

export type CreateRequisitionInput = Omit<
  OpenRequisition,
  'accent' | 'id' | 'status' | 'departmentId' | 'locationId' | 'hiringManagerId' | 'stage'
>;
export type RecruitmentRequisitionKey = string;

export type RecruitmentCandidate = {
  id?: string;
  name: string;
  initials: string;
  role: string;
  source: string;
  stage: RecruitmentStage;
  nextStep: string;
  recruiter: string;
  accent: string;
};

export type PipelineStage = {
  stage: RecruitmentStage;
  count: number;
  accent: string;
};

export type RecruitmentOverview = {
  openRoles: number;
  activeCandidates: number;
  interviewsThisWeek: number;
  offersOut: number;
  requisitions: readonly OpenRequisition[];
  pipeline: readonly PipelineStage[];
  candidates: readonly RecruitmentCandidate[];
};

export type RecruitmentApplicationDetail = ApplicationResponse;

export type RecruitmentRequisitionDetail = {
  requisition: OpenRequisition;
  applications: readonly RecruitmentApplicationDetail[];
};

export const RECRUITMENT_FILTERS: readonly RecruitmentFilter[] = ['All', 'Sourcing', 'Screening', 'Interview', 'Offer'] as const;
export const PIPELINE_ORDER: readonly RecruitmentStage[] = ['Sourcing', 'Screening', 'Interview', 'Offer'] as const;

export const RECRUITMENT_STAGE_ACCOUNTS: Record<RecruitmentStage, string> = {
  Sourcing: '#e8317a',
  Screening: '#8b5cf6',
  Interview: '#0ea5e9',
  Offer: '#10b981',
};

const USE_MOCK_DATA = process.env.NODE_ENV !== 'production';
const RECRUITMENT_DATA_ERROR = 'Live recruitment data is unavailable. Check the API connection and retry.';

const MOCK_REQUISITIONS: readonly OpenRequisition[] = [
  { title: 'Senior Backend Engineer', department: 'Engineering', location: 'Jakarta', openings: 2, stage: 'Interview', recruiter: 'Alya Putri', priority: 'High', accent: '#e8317a' },
  { title: 'Payroll Analyst', department: 'Finance', location: 'Bandung', openings: 1, stage: 'Screening', recruiter: 'Reza Gunawan', priority: 'Medium', accent: '#8b5cf6' },
  { title: 'People Partner', department: 'People Ops', location: 'Surabaya', openings: 1, stage: 'Offer', recruiter: 'Mira Santoso', priority: 'High', accent: '#10b981' },
  { title: 'Product Designer', department: 'Product', location: 'Jakarta', openings: 2, stage: 'Sourcing', recruiter: 'Nadia Hartono', priority: 'Low', accent: '#0ea5e9' },
];

const MOCK_CANDIDATES: readonly RecruitmentCandidate[] = [
  { name: 'Dina Ramadhani', initials: 'DR', role: 'Senior Backend Engineer', source: 'LinkedIn', stage: 'Interview', nextStep: 'Technical panel', recruiter: 'Alya Putri', accent: '#e8317a' },
  { name: 'Farhan Wijaya', initials: 'FW', role: 'Payroll Analyst', source: 'Referral', stage: 'Screening', nextStep: 'HR screening', recruiter: 'Reza Gunawan', accent: '#8b5cf6' },
  { name: 'Sari Kusuma', initials: 'SK', role: 'People Partner', source: 'Career site', stage: 'Offer', nextStep: 'Contract review', recruiter: 'Mira Santoso', accent: '#10b981' },
  { name: 'Bima Pratama', initials: 'BP', role: 'Product Designer', source: 'Community', stage: 'Sourcing', nextStep: 'Portfolio review', recruiter: 'Nadia Hartono', accent: '#0ea5e9' },
  { name: 'Laila Fadila', initials: 'LF', role: 'Senior Backend Engineer', source: 'Referral', stage: 'Interview', nextStep: 'Hiring manager', recruiter: 'Alya Putri', accent: '#e8317a' },
];

const MOCK_OVERVIEW: RecruitmentOverview = {
  openRoles: 14,
  activeCandidates: 86,
  interviewsThisWeek: 23,
  offersOut: 5,
  requisitions: MOCK_REQUISITIONS,
  pipeline: [
    { stage: 'Sourcing', count: 28, accent: '#e8317a' },
    { stage: 'Screening', count: 24, accent: '#8b5cf6' },
    { stage: 'Interview', count: 19, accent: '#0ea5e9' },
    { stage: 'Offer', count: 5, accent: '#10b981' },
  ],
  candidates: MOCK_CANDIDATES,
};

const EMPTY_OVERVIEW: RecruitmentOverview = {
  openRoles: 0,
  activeCandidates: 0,
  interviewsThisWeek: 0,
  offersOut: 0,
  requisitions: [],
  pipeline: [
    { stage: 'Sourcing', count: 0, accent: '#e8317a' },
    { stage: 'Screening', count: 0, accent: '#8b5cf6' },
    { stage: 'Interview', count: 0, accent: '#0ea5e9' },
    { stage: 'Offer', count: 0, accent: '#10b981' },
  ],
  candidates: [],
};

function mapRequisitionStatusToStage(status: string): RecruitmentStage {
  switch (status) {
    case 'draft':
      return 'Sourcing';
    case 'pending_approval':
      return 'Screening';
    case 'open':
      return 'Interview';
    case 'closed':
      return 'Offer';
    default:
      return 'Sourcing';
  }
}

function accentForPriority(priority: OpenRequisition['priority']): string {
  return priority === 'High' ? '#e8317a' : priority === 'Medium' ? '#8b5cf6' : '#0ea5e9';
}

function normalizePriority(priority: string | null | undefined): OpenRequisition['priority'] {
  switch (priority) {
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    case 'medium':
    default:
      return 'Medium';
  }
}

function mapApiRequisition(r: RequisitionResponse): OpenRequisition {
  return {
    id: r.id,
    title: r.title,
    department: r.departmentName ?? r.departmentId,
    departmentId: r.departmentId,
    location: r.locationName ?? r.locationId,
    locationId: r.locationId,
    openings: r.headcount,
    stage: mapRequisitionStatusToStage(r.status),
    recruiter: r.hiringManagerName ?? r.hiringManagerId,
    hiringManagerId: r.hiringManagerId,
    workflowInstanceId: r.workflowInstanceId,
    priority: normalizePriority(r.priority),
    accent: accentForPriority(normalizePriority(r.priority)),
    status: r.status,
    description: r.description,
    requirements: r.requirements,
  };
}

function mapApiCandidate(c: CandidateResponse): RecruitmentCandidate {
  const first = c.firstName ?? '';
  const last = c.lastName ?? '';
  const name = `${first} ${last}`.trim() || c.email;
  const initials = (first.charAt(0) + last.charAt(0)).toUpperCase() || c.email.charAt(0).toUpperCase();
  return {
    id: c.id,
    name,
    initials,
    role: '—',
    source: '—',
    stage: 'Sourcing',
    nextStep: '—',
    recruiter: '—',
    accent: '#8b5cf6',
  };
}

/**
 * Returns synchronous data for the initial state.
 */
export function getRecruitmentOverview(): RecruitmentOverview {
  return USE_MOCK_DATA ? MOCK_OVERVIEW : EMPTY_OVERVIEW;
}

/**
 * Fetches live requisitions from the API.
 */
export async function loadRequisitions(): Promise<OpenRequisition[]> {
  try {
    const data = await fetchRequisitions();
    return data.map(mapApiRequisition);
  } catch {
    if (USE_MOCK_DATA) {
      return [...MOCK_REQUISITIONS];
    }
    throw new Error(RECRUITMENT_DATA_ERROR);
  }
}

/**
 * Fetches live candidates from the API.
 */
export async function loadCandidates(): Promise<RecruitmentCandidate[]> {
  try {
    const data = await fetchCandidates();
    return data.map(mapApiCandidate);
  } catch {
    if (USE_MOCK_DATA) {
      return [...MOCK_CANDIDATES];
    }
    throw new Error(RECRUITMENT_DATA_ERROR);
  }
}

/**
 * Fetches a live requisition detail view with linked applications.
 */
export async function loadRequisitionDetail(id: string): Promise<RecruitmentRequisitionDetail> {
  const [requisition, applications] = await Promise.all([
    fetchRequisition(id),
    fetchApplications(id),
  ]);

  return {
    requisition: mapApiRequisition(requisition),
    applications,
  };
}

/**
 * Creates a new requisition via the API.
 */
export async function createRequisitionRemote(input: CreateRequisitionInput): Promise<OpenRequisition> {
  try {
    const result = await apiCreateRequisition({
      title: input.title,
      departmentId: input.department,
      locationId: input.location,
      hiringManagerId: input.recruiter,
      priority: input.priority.toLowerCase() as 'high' | 'medium' | 'low',
      headcount: input.openings,
    });
    return mapApiRequisition(result);
  } catch {
    if (USE_MOCK_DATA) {
      return {
        ...input,
        stage: 'Sourcing',
        accent: accentForPriority(input.priority),
      };
    }
    throw new Error(RECRUITMENT_DATA_ERROR);
  }
}

/**
 * Updates an existing requisition via the API.
 */
export async function updateRequisitionRemote(
  id: string,
  input: CreateRequisitionInput,
  existingStage?: OpenRequisition['stage'],
): Promise<OpenRequisition> {
  try {
    const result = await apiUpdateRequisition(id, {
      title: input.title,
      priority: input.priority.toLowerCase() as 'high' | 'medium' | 'low',
      headcount: input.openings,
    });
    return mapApiRequisition(result);
  } catch {
    if (USE_MOCK_DATA) {
      return {
        ...input,
        stage: existingStage ?? 'Sourcing',
        accent: accentForPriority(input.priority),
      };
    }
    throw new Error(RECRUITMENT_DATA_ERROR);
  }
}

export function filterRecruitmentCandidates(
  candidates: readonly RecruitmentCandidate[],
  filter: RecruitmentFilter,
  search: string,
): readonly RecruitmentCandidate[] {
  const trimmed = search.trim().toLowerCase();

  return candidates.filter((candidate) => {
    const matchesFilter = filter === 'All' || candidate.stage === filter;
    const matchesSearch =
      trimmed.length === 0 ||
      candidate.name.toLowerCase().includes(trimmed) ||
      candidate.role.toLowerCase().includes(trimmed) ||
      candidate.source.toLowerCase().includes(trimmed) ||
      candidate.recruiter.toLowerCase().includes(trimmed);

    return matchesFilter && matchesSearch;
  });
}

export function addRecruitmentRequisition(
  requisitions: readonly OpenRequisition[],
  input: CreateRequisitionInput,
): readonly OpenRequisition[] {
  return [
    {
      ...input,
      stage: 'Sourcing',
      accent: accentForPriority(input.priority),
    },
    ...requisitions,
  ];
}

export function getRecruitmentRequisitionKey(requisition: OpenRequisition): RecruitmentRequisitionKey {
  return requisition.id ?? [requisition.title, requisition.department, requisition.location, requisition.recruiter].join('|');
}

export function updateRecruitmentRequisition(
  requisitions: readonly OpenRequisition[],
  key: RecruitmentRequisitionKey,
  input: CreateRequisitionInput,
): OpenRequisition[] {
  return requisitions.map((requisition) =>
    getRecruitmentRequisitionKey(requisition) === key
      ? {
          ...requisition,
          ...input,
          stage: requisition.stage,
          accent: accentForPriority(input.priority),
        }
      : requisition,
  );
}

export function removeRecruitmentRequisition(
  requisitions: readonly OpenRequisition[],
  key: RecruitmentRequisitionKey,
): readonly OpenRequisition[] {
  return requisitions.filter((requisition) => getRecruitmentRequisitionKey(requisition) !== key);
}
