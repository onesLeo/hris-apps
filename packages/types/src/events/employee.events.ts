// Domain event payload types for employee lifecycle (ADR 003).
// EventEmitter2 emits these on the API; consumers subscribe by event name.

export type EmployeeHiredPayload = {
  tenantId: string;
  employeeId: string;
  employeeNumber: string;
  displayName: string;
  jobTitle: string;
  departmentId: string;
  locationId: string;
  hireDate: string;
  actorId: string;
};

export type EmployeeTransferredPayload = {
  tenantId: string;
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromLocationId: string;
  toLocationId: string;
  effectiveDate: string;
  actorId: string;
};

export type EmployeePromotedPayload = {
  tenantId: string;
  employeeId: string;
  fromJobTitle: string;
  toJobTitle: string;
  departmentId: string;
  locationId: string;
  effectiveDate: string;
  actorId: string;
};

export type EmployeeResignedPayload = {
  tenantId: string;
  employeeId: string;
  resignationDate: string;
  lastWorkingDate: string;
  reason?: string;
  actorId: string;
};

export type EmployeeTerminatedPayload = {
  tenantId: string;
  employeeId: string;
  terminationDate: string;
  reason?: string;
  actorId: string;
};

export type EmployeeRehiredPayload = {
  tenantId: string;
  employeeId: string;
  rehireDate: string;
  jobTitle: string;
  departmentId: string;
  locationId: string;
  actorId: string;
};

export type EmployeeSecondedPayload = {
  tenantId: string;
  employeeId: string;
  toLocationId: string;
  effectiveDate: string;
  returnDate?: string;
  actorId: string;
};

// Union discriminated by event name for typed routing.
export type EmployeeEvent =
  | { name: 'employee.hired';      payload: EmployeeHiredPayload }
  | { name: 'employee.transferred'; payload: EmployeeTransferredPayload }
  | { name: 'employee.promoted';   payload: EmployeePromotedPayload }
  | { name: 'employee.resigned';   payload: EmployeeResignedPayload }
  | { name: 'employee.terminated'; payload: EmployeeTerminatedPayload }
  | { name: 'employee.rehired';    payload: EmployeeRehiredPayload }
  | { name: 'employee.seconded';   payload: EmployeeSecondedPayload };
