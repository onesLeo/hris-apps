import { apiGet, apiPatch, apiPost } from './api-client';
import type { Employee, CreateEmployeeInput } from '../components/people/people-data';

// Shape returned by GET /employees (API snake_case with joined spell fields)
type ApiEmployee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | 'on_leave' | 'terminated' | 'pre_boarding';
  hire_date: string;
  job_title: string | null;
  department_name: string | null;
  work_arrangement: 'office' | 'remote' | 'hybrid' | null;
  manager_id: string | null;
  manager_display_name: string | null;
};

type ApiListResponse = { data: ApiEmployee[]; nextCursor: string | null };
type ApiLifecycleSpell = {
  id: string;
  employee_id: string;
  department_id: string;
  location_id: string;
  job_title: string;
  employment_type: string;
  work_arrangement: string;
  effective_from: string;
  effective_to: string | null;
};

type ApiLifecycleEvent = {
  id: string;
  employee_id: string;
  event_type: string;
  payload_json: string;
  effective_date: string;
  created_by: string | null;
  created_at: string;
};

export type EmployeeHistory = {
  spells: ApiLifecycleSpell[];
  events: ApiLifecycleEvent[];
};

// Map DB status → UI status label
const STATUS_MAP: Record<ApiEmployee['status'], Employee['status']> = {
  active:      'Active',
  inactive:    'Active',
  suspended:   'Suspended',
  on_leave:    'On Leave',
  terminated:  'Terminated',
  pre_boarding:'Pre_Boarding',
};

// Map DB work arrangement → UI WorkType
const ARRANGEMENT_MAP: Record<string, Employee['type']> = {
  office: 'Office',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

const COLORS = [
  '#f43f8e', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length] ?? '#f43f8e';
}

function toUiEmployee(api: ApiEmployee): Employee {
  const initials = api.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EE';

  const hireYear = api.hire_date ? new Date(api.hire_date).getFullYear() : null;
  const hireMonth = api.hire_date
    ? new Date(api.hire_date).toLocaleString('en', { month: 'short' })
    : null;
  const since = hireYear && hireMonth ? `${hireMonth} ${hireYear}` : '';

  return {
    id: api.id,
    name: api.display_name,
    role: api.job_title ?? 'N/A',
    dept: api.department_name ?? 'N/A',
    status: STATUS_MAP[api.status] ?? 'Active',
    type: ARRANGEMENT_MAP[api.work_arrangement ?? 'office'] ?? 'Office',
    since,
    initials,
    color: colorForName(api.display_name),
    ...(api.manager_id ? { managerId: api.manager_id } : {}),
    ...(api.manager_display_name ? { managerName: api.manager_display_name } : {}),
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await apiGet<ApiListResponse>('/employees?limit=100');
  return res.data.map(toUiEmployee);
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  // Map UI input → API HireEmployeeDto using real organization selections.
  const today = new Date().toISOString().slice(0, 10);
  const api = await apiPost<ApiEmployee>('/employees', {
    employeeNumber: `EMP-${Date.now()}`,
    firstName: input.name.split(' ')[0] ?? input.name,
    lastName: input.name.split(' ').slice(1).join(' ') || '-',
    email: `${input.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    hireDate: today,
    jobTitle: input.role,
    departmentId: input.departmentId,
    locationId: input.locationId,
    workArrangement: input.type.toLowerCase() as 'office' | 'remote' | 'hybrid',
    managerId: input.managerId ?? null,
  });
  return {
    ...toUiEmployee(api),
    dept: api.department_name ?? input.departmentName,
  };
}

export async function updateEmployee(id: string, input: CreateEmployeeInput): Promise<Employee> {
  const nameParts = input.name.split(' ');
  const api = await apiPatch<ApiEmployee>(`/employees/${id}`, {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ') || '-',
  });
  return toUiEmployee(api);
}

export async function suspendEmployee(id: string): Promise<Employee> {
  const api = await apiPost<ApiEmployee>(`/employees/${id}/suspend`, {});
  return toUiEmployee(api);
}

export async function transferEmployee(
  id: string,
  input: {
    departmentId: string;
    locationId: string;
    jobTitle?: string;
    workArrangement?: 'office' | 'remote' | 'hybrid';
    effectiveDate: string;
  },
): Promise<Employee> {
  const api = await apiPost<ApiEmployee>(`/employees/${id}/transfer`, input);
  return toUiEmployee(api);
}

export async function promoteEmployee(
  id: string,
  input: {
    jobTitle: string;
    departmentId: string | undefined;
    effectiveDate: string;
  },
): Promise<Employee> {
  const api = await apiPost<ApiEmployee>(`/employees/${id}/promote`, input);
  return toUiEmployee(api);
}

export async function resignEmployee(
  id: string,
  input: {
    resignationDate: string;
    lastWorkingDate: string;
    reason?: string;
  },
): Promise<Employee> {
  const api = await apiPost<ApiEmployee>(`/employees/${id}/resign`, input);
  return toUiEmployee(api);
}

export async function fetchEmployeeHistory(id: string): Promise<EmployeeHistory> {
  return apiGet<EmployeeHistory>(`/employees/${id}/history`);
}

export async function terminateEmployee(id: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await apiPost(`/employees/${id}/terminate`, { terminationDate: today });
}
