export type PolicyLevel = 'employee' | 'department' | 'location' | 'company' | 'system';

export type PolicyResolutionContext = {
  tenantId: string;
  employeeId?: string;
  departmentId?: string;
  locationId?: string;
};

export type PolicyResolutionResult<T> = {
  value: T;
  winningLevel: PolicyLevel;
  winningEntityId: string | null;
  context: PolicyResolutionContext;
};
