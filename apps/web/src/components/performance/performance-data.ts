export type PerformanceStatus = 'Scheduled' | 'In Review' | 'Completed' | 'Overdue';
export type PerformanceFilter = 'All' | PerformanceStatus;

export type PerformanceCycle = {
  name: string;
  period: string;
  status: PerformanceStatus;
  completion: number;
  participants: number;
  accent: string;
};

export type PerformanceReview = {
  employee: string;
  initials: string;
  role: string;
  manager: string;
  score: string;
  progress: number;
  status: PerformanceStatus;
  objective: string;
  accent: string;
};

export type PerformanceGoal = {
  goal: string;
  target: string;
  owner: string;
  progress: number;
  status: PerformanceStatus;
  accent: string;
};

export type PerformanceOverview = {
  cycles: number;
  completedReviews: number;
  inReview: number;
  overdue: number;
  reviewCycles: readonly PerformanceCycle[];
  teamReviews: readonly PerformanceReview[];
  goals: readonly PerformanceGoal[];
};

export const PERFORMANCE_FILTERS: readonly PerformanceFilter[] = ['All', 'Scheduled', 'In Review', 'Completed', 'Overdue'] as const;

const OVERVIEW: PerformanceOverview = {
  cycles: 4,
  completedReviews: 126,
  inReview: 22,
  overdue: 3,
  reviewCycles: [
    { name: 'Q2 Review', period: 'Apr - Jun 2026', status: 'In Review', completion: 68, participants: 142, accent: '#e8317a' },
    { name: 'Mid-Year Goals', period: 'Jul - Aug 2026', status: 'Scheduled', completion: 12, participants: 142, accent: '#8b5cf6' },
    { name: 'Calibration Round', period: 'May 2026', status: 'Completed', completion: 100, participants: 35, accent: '#10b981' },
    { name: 'Manager Check-ins', period: 'Apr 2026', status: 'Overdue', completion: 48, participants: 12, accent: '#f59e0b' },
  ],
  teamReviews: [
    { employee: 'Alya Putri', initials: 'AP', role: 'Engineering Manager', manager: 'Alex Lee', score: '4.8', progress: 92, status: 'Completed', objective: 'Improve hiring throughput', accent: '#e8317a' },
    { employee: 'Reza Gunawan', initials: 'RG', role: 'Payroll Analyst', manager: 'Mira Santoso', score: '4.2', progress: 74, status: 'In Review', objective: 'Automate monthly recon tasks', accent: '#8b5cf6' },
    { employee: 'Nadia Hartono', initials: 'NH', role: 'Product Designer', manager: 'Alex Lee', score: '4.5', progress: 88, status: 'Scheduled', objective: 'Refresh hiring landing flow', accent: '#0ea5e9' },
    { employee: 'Bima Pratama', initials: 'BP', role: 'Backend Engineer', manager: 'Alya Putri', score: '3.9', progress: 61, status: 'Overdue', objective: 'Complete resilience refactor', accent: '#f59e0b' },
    { employee: 'Sari Kusuma', initials: 'SK', role: 'People Partner', manager: 'Mira Santoso', score: '4.7', progress: 95, status: 'Completed', objective: 'Document lifecycle playbook', accent: '#10b981' },
  ],
  goals: [
    { goal: 'Reduce hiring cycle time', target: '< 18 days', owner: 'Recruitment', progress: 72, status: 'In Review', accent: '#e8317a' },
    { goal: 'Close month-end payroll audit gaps', target: '0 discrepancies', owner: 'Finance', progress: 84, status: 'Completed', accent: '#10b981' },
    { goal: 'Complete 100% review check-ins', target: 'All managers', owner: 'People Ops', progress: 63, status: 'Scheduled', accent: '#8b5cf6' },
    { goal: 'Document leadership growth plans', target: '12 leaders', owner: 'Leadership', progress: 49, status: 'Overdue', accent: '#f59e0b' },
  ],
};

export function getPerformanceOverview(): PerformanceOverview {
  return OVERVIEW;
}

export function filterPerformanceReviews(
  reviews: readonly PerformanceReview[],
  filter: PerformanceFilter,
  search: string,
): readonly PerformanceReview[] {
  const trimmed = search.trim().toLowerCase();

  return reviews.filter((review) => {
    const matchesFilter = filter === 'All' || review.status === filter;
    const matchesSearch =
      trimmed.length === 0 ||
      review.employee.toLowerCase().includes(trimmed) ||
      review.role.toLowerCase().includes(trimmed) ||
      review.manager.toLowerCase().includes(trimmed) ||
      review.objective.toLowerCase().includes(trimmed);

    return matchesFilter && matchesSearch;
  });
}
