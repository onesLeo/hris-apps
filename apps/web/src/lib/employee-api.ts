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
  status: 'active' | 'inactive' | 'suspended' | 'on_leave' | 'terminated';
  hire_date: string;
  job_title: string | null;
  department_name: string | null;
  work_arrangement: 'office' | 'remote' | 'hybrid' | null;
};

type ApiListResponse = { data: ApiEmployee[]; nextCursor: string | null };

// Map DB status → UI status label
const STATUS_MAP: Record<ApiEmployee['status'], Employee['status']> = {
  active:     'Active',
  inactive:   'Pending',
  suspended:  'Suspended',
  on_leave:   'On Leave',
  terminated: 'Pending',
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
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await apiGet<ApiListResponse>('/employees?limit=100');
  return res.data.map(toUiEmployee);
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  // Map UI input → API HireEmployeeDto
  // We use minimal required fields; departmentId/locationId are unknown in UI
  // so we send placeholder UUIDs that the backend will reject — until the UI
  // has real department/location pickers this call will gracefully 400 and
  // the caller falls back to local state.
  const today = new Date().toISOString().slice(0, 10);
  const api = await apiPost<ApiEmployee>('/employees', {
    employeeNumber: `EMP-${Date.now()}`,
    firstName: input.name.split(' ')[0] ?? input.name,
    lastName: input.name.split(' ').slice(1).join(' ') || '-',
    email: `${input.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    hireDate: today,
    jobTitle: input.role,
    departmentId: '00000000-0000-0000-0000-000000000001',
    locationId:   '00000000-0000-0000-0000-000000000001',
    workArrangement: input.type.toLowerCase() as 'office' | 'remote' | 'hybrid',
  });
  return toUiEmployee(api);
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

export async function terminateEmployee(id: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await apiPost(`/employees/${id}/terminate`, { terminationDate: today });
}
