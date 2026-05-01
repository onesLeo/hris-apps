export type OfferStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'declined';

export type JobOfferSnapshot = {
  id: string;
  tenantId: string;
  applicationId: string;
  baseSalary: number | null;
  bonus: number | null;
  equity: number | null;
  otherBenefits: string | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};
