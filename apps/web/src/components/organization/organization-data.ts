export type OrganizationLocation = {
  name: string;
  city: string;
  country: string;
  employeeCount: number;
  accent: string;
};

export type OrganizationDepartment = {
  name: string;
  manager: string;
  employeeCount: number;
  accent: string;
};

export type OrganizationStructureNode = {
  title: string;
  detail: string;
  accent: string;
};

export type OrganizationOverview = {
  companyName: string;
  legalName: string;
  headquarters: string;
  totalEmployees: number;
  activeLocations: number;
  departments: number;
  leaders: number;
  locations: OrganizationLocation[];
  departmentMap: OrganizationDepartment[];
  structure: OrganizationStructureNode[];
};

export function getOrganizationOverview(): OrganizationOverview {
  return {
    companyName: 'PeopleOS',
    legalName: 'PT People Operations System',
    headquarters: 'Jakarta HQ',
    totalEmployees: 1247,
    activeLocations: 3,
    departments: 6,
    leaders: 8,
    locations: [
      { name: 'Jakarta HQ', city: 'Jakarta', country: 'Indonesia', employeeCount: 642, accent: '#e8317a' },
      { name: 'Surabaya Office', city: 'Surabaya', country: 'Indonesia', employeeCount: 218, accent: '#8b5cf6' },
      { name: 'Denpasar Hub', city: 'Denpasar', country: 'Indonesia', employeeCount: 157, accent: '#06b6d4' },
    ],
    departmentMap: [
      { name: 'Engineering', manager: 'Sarah Chen', employeeCount: 312, accent: '#e8317a' },
      { name: 'Operations', manager: 'Aisha Patel', employeeCount: 245, accent: '#8b5cf6' },
      { name: 'Sales', manager: 'Tom Bradley', employeeCount: 198, accent: '#06b6d4' },
      { name: 'HR & Admin', manager: 'Nina Okafor', employeeCount: 156, accent: '#10b981' },
    ],
    structure: [
      { title: 'Head Office', detail: 'Central leadership and shared services', accent: '#e8317a' },
      { title: 'Regional Offices', detail: 'Branch execution in two secondary hubs', accent: '#8b5cf6' },
      { title: 'Functional Teams', detail: 'Cross-site delivery across product and ops', accent: '#06b6d4' },
    ],
  };
}
