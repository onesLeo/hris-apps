export type RequisitionStatus = 'draft' | 'pending_approval' | 'open' | 'on_hold' | 'closed' | 'cancelled';
export type RequisitionPriority = 'high' | 'medium' | 'low';

export type RequisitionSnapshot = {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  departmentName: string | null;
  locationId: string;
  locationName: string | null;
  hiringManagerId: string;
  hiringManagerName: string | null;
  workflowInstanceId: string | null;
  status: RequisitionStatus;
  priority: RequisitionPriority;
  headcount: number;
  filledCount: number;
  description: string | null;
  requirements: string | null;
  createdAt: string;
  updatedAt: string;
};
