// ─── Request DTOs ─────────────────────────────────────────────────────────────

export type HireEmployeeDto = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;       // ISO date: YYYY-MM-DD
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  nationality?: string;
  hireDate: string;            // ISO date
  jobTitle: string;
  departmentId: string;
  locationId: string;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
  workArrangement?: 'office' | 'remote' | 'hybrid';
  managerId?: string;          // direct manager employee UUID (optional)
  status?: 'active' | 'pre_boarding';
  probationEndDate?: string;   // ISO date
  noticePeriodDays?: number;
  jobGrade?: string;
};

export type UpdateEmployeeDto = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  nationality?: string;
};

export type UpdateEmployeeProfileDto = {
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  nik?: string;
  bpjsHealth?: string;
  bpjsEmployment?: string;
  bpjsPension?: string;
  bpjsAccident?: string;
};

export type EmployeeProfileSnapshot = {
  id: string;
  tenantId: string;
  employeeId: string;
  displayName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  hireDate: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  nik: string | null;
  bpjsHealth: string | null;
  bpjsEmployment: string | null;
  bpjsPension: string | null;
  bpjsAccident: string | null;
};

export type TransferEmployeeDto = {
  departmentId: string;
  locationId: string;
  jobTitle?: string;
  workArrangement?: 'office' | 'remote' | 'hybrid';
  effectiveDate: string;       // ISO date
};

export type PromoteEmployeeDto = {
  jobTitle: string;
  departmentId?: string;
  effectiveDate: string;
};

export type ResignEmployeeDto = {
  resignationDate: string;
  lastWorkingDate: string;
  reason?: string;
};

export type TerminateEmployeeDto = {
  terminationDate: string;
  reason?: string;
};

export type RehireEmployeeDto = {
  newHireDate: string;
  jobTitle: string;
  departmentId: string;
  locationId: string;
  workArrangement?: 'office' | 'remote' | 'hybrid';
};

export type SecondmentDto = {
  hostDepartmentId: string;
  hostLocationId: string;
  jobTitleAtHost?: string;
  startDate: string;
  expectedReturnDate: string;
};

export type EmployeeListQuery = {
  status?: string;
  departmentId?: string;
  locationId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
};

// ─── Response shapes ──────────────────────────────────────────────────────────

export type EmployeeRow = {
  id: string;
  tenant_id: string;
  employee_number: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  status: string;
  hire_date: string;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
  manager_id: string | null;
  manager_display_name: string | null;  // joined from manager employee row
  // joined from current spell
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  location_id: string | null;
  location_name: string | null;
  employment_type: string | null;
  work_arrangement: string | null;
  probation_end_date: string | null;
  notice_period_days: number | null;
  job_grade: string | null;
};

export type LifecycleEventRow = {
  id: string;
  employee_id: string;
  event_type: string;
  payload_json: string;
  effective_date: string;
  created_by: string | null;
  created_at: string;
};

export type SpellRow = {
  id: string;
  employee_id: string;
  department_id: string;
  location_id: string;
  job_title: string;
  employment_type: string;
  work_arrangement: string;
  effective_from: string;
  effective_to: string | null;
  probation_end_date: string | null;
  notice_period_days: number | null;
  job_grade: string | null;
};
