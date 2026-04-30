export type CandidateSnapshot = {
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
