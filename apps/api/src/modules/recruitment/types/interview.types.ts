export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type InterviewRecommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';

export type InterviewSnapshot = {
  id: string;
  tenantId: string;
  applicationId: string;
  roundName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: InterviewStatus;
  overallRecommendation: InterviewRecommendation | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewerSnapshot = {
  id: string;
  tenantId: string;
  interviewId: string;
  employeeId: string;
};

export type ScorecardSnapshot = {
  id: string;
  tenantId: string;
  interviewId: string;
  interviewerId: string;
  recommendation: InterviewRecommendation | null;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
