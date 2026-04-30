export type RequisitionStatus = 'draft' | 'pending_approval' | 'open' | 'on_hold' | 'closed' | 'cancelled';

export type RequisitionSnapshot = {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  locationId: string;
  hiringManagerId: string;
  status: RequisitionStatus;
  headcount: number;
  filledCount: number;
  description: string | null;
  requirements: string | null;
  createdAt: string;
  updatedAt: string;
};
