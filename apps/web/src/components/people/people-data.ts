export type EmployeeStatus = 'Active' | 'Suspended' | 'On Leave' | 'Terminated' | 'Pre_Boarding';
export type WorkType = 'Remote' | 'Office' | 'Hybrid';
export type ContractType = 'full_time' | 'part_time' | 'contract' | 'intern';

export type Employee = {
  id?: string;           // API UUID — present when loaded from the backend
  name: string;
  role: string;
  dept: string;
  status: EmployeeStatus;
  type: WorkType;
  since: string;
  initials: string;
  color: string;
  managerId?: string;
  managerName?: string;
  contractType?: ContractType;
  probationEndDate?: string;
  noticePeriodDays?: number;
  jobGrade?: string;
};

export type CreateEmployeeInput = {
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  locationId: string;
  locationName: string;
  status: EmployeeStatus;
  type: WorkType;
  since: string;
  managerId?: string;
  contractType?: ContractType;
  probationEndDate?: string;
  noticePeriodDays?: number;
  jobGrade?: string;
};

export type EmployeeKey = string;

export const EMPLOYEES: Employee[] = [
  { name: 'Sarah Chen', role: 'Senior Engineer', dept: 'Engineering', status: 'Active', type: 'Remote', since: 'Apr 2022', initials: 'SC', color: '#f43f8e' },
  { name: 'Marcus Johnson', role: 'Product Manager', dept: 'Product', status: 'Active', type: 'Office', since: 'Jan 2023', initials: 'MJ', color: '#8b5cf6' },
  { name: 'Aisha Patel', role: 'Data Analyst', dept: 'Operations', status: 'On Leave', type: 'Hybrid', since: 'Jul 2022', initials: 'AP', color: '#06b6d4' },
  { name: 'Lucas Rivera', role: 'UX Designer', dept: 'Design', status: 'Active', type: 'Office', since: 'Mar 2023', initials: 'LR', color: '#10b981' },
  { name: 'Emma Williams', role: 'Finance Lead', dept: 'Finance', status: 'Active', type: 'Office', since: 'Sep 2021', initials: 'EW', color: '#f59e0b' },
  { name: 'James Kim', role: 'DevOps Engineer', dept: 'Engineering', status: 'Active', type: 'Remote', since: 'Feb 2023', initials: 'JK', color: '#6366f1' },
  { name: 'Sofia Martinez', role: 'HR Specialist', dept: 'HR & Admin', status: 'Active', type: 'Office', since: 'May 2022', initials: 'SM', color: '#ec4899' },
  { name: 'Noah Thompson', role: 'Sales Executive', dept: 'Sales', status: 'Active', type: 'Hybrid', since: 'Nov 2022', initials: 'NT', color: '#14b8a6' },
  { name: 'Olivia Brown', role: 'Content Strategist', dept: 'Marketing', status: 'On Leave', type: 'Remote', since: 'Jan 2023', initials: 'OB', color: '#f97316' },
  { name: 'Ethan Davis', role: 'Backend Developer', dept: 'Engineering', status: 'Active', type: 'Remote', since: 'Aug 2022', initials: 'ED', color: '#a78bfa' },
  { name: 'Amara Osei', role: 'Recruitment Lead', dept: 'HR & Admin', status: 'Active', type: 'Office', since: 'Jun 2021', initials: 'AO', color: '#34d399' },
  { name: 'Ryan Park', role: 'QA Engineer', dept: 'Engineering', status: 'Active', type: 'Hybrid', since: 'Oct 2023', initials: 'RP', color: '#fb7185' },
];

// 'All' excludes Terminated so the default view is the active roster.
// Select 'Terminated' explicitly to see former employees.
export const PEOPLE_FILTERS = ['All', 'Active', 'On Leave', 'Terminated', 'Remote', 'Office'] as const;
export type PeopleFilter = (typeof PEOPLE_FILTERS)[number];

export function filterEmployees(employees: Employee[], filter: PeopleFilter, search: string): Employee[] {
  const query = search.trim().toLowerCase();

  return employees.filter((employee) => {
    let matchesFilter: boolean;
    if (filter === 'Terminated') {
      matchesFilter = employee.status === 'Terminated';
    } else if (filter === 'All') {
      matchesFilter = employee.status !== 'Terminated';
    } else {
      matchesFilter = employee.status !== 'Terminated' && (employee.status === filter || employee.type === filter);
    }

    const matchesSearch =
      !query ||
      employee.name.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
      employee.dept.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

export function addEmployee(employees: readonly Employee[], input: CreateEmployeeInput): Employee[] {
  const initials = input.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return [
    {
      name: input.name,
      role: input.role,
      dept: input.departmentName,
      status: input.status,
      type: input.type,
      since: input.since,
      initials: initials || 'EN',
      ...(input.managerId ? { managerId: input.managerId } : {}),
      color:
        input.status === 'On Leave'
          ? '#f59e0b'
          : input.status === 'Suspended'
            ? '#64748b'
            : input.status === 'Pre_Boarding'
              ? '#8b5cf6'
              : '#f43f8e',
    },
    ...employees,
  ];
}

export function getEmployeeKey(employee: Employee): EmployeeKey {
  return [employee.name, employee.role, employee.dept, employee.since].join('|');
}

export function updateEmployee(
  employees: readonly Employee[],
  key: EmployeeKey,
  input: CreateEmployeeInput,
): Employee[] {
  return employees.map((employee) =>
    getEmployeeKey(employee) === key
      ? {
          ...employee,
          name: input.name,
          role: input.role,
          dept: input.departmentName,
          status: input.status,
          type: input.type,
          since: input.since,
          ...(input.managerId ? { managerId: input.managerId } : employee.managerId ? { managerId: employee.managerId } : {}),
          initials: employee.initials,
          color: employee.color,
        }
      : employee,
  );
}

export function suspendEmployee(employees: readonly Employee[], key: EmployeeKey): Employee[] {
  return employees.map((employee) =>
    getEmployeeKey(employee) === key
      ? { ...employee, status: 'Suspended', color: '#64748b' }
      : employee,
  );
}

// Marks the employee as Terminated in local state — does NOT remove from the array.
// Terminated employees are hidden from 'All' and visible only under the 'Terminated' filter.
export function terminateEmployeeLocally(employees: readonly Employee[], key: EmployeeKey): Employee[] {
  return employees.map((employee) =>
    getEmployeeKey(employee) === key
      ? { ...employee, status: 'Terminated', color: '#94a3b8' }
      : employee,
  );
}

/** @deprecated Use terminateEmployeeLocally — employees should never be deleted from the list. */
export function removeEmployee(employees: readonly Employee[], key: EmployeeKey): Employee[] {
  return employees.filter((employee) => getEmployeeKey(employee) !== key);
}
