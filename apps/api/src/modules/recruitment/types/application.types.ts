export type ApplicationStage = 'applied' | 'screening' | 'interviewing' | 'offered' | 'hired' | 'rejected' | 'withdrawn';

export type JobApplicationSnapshot = {
  id: string;
  tenantId: string;
  requisitionId: string;
  candidateId: string;
  stage: ApplicationStage;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationStageLogSnapshot = {
  id: string;
  tenantId: string;
  applicationId: string;
  fromStage: ApplicationStage | null;
  toStage: ApplicationStage;
  changedById: string;
  notes: string | null;
  createdAt: string;
};
