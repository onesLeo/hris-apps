import type { OrganizationOverview } from './organization.contracts';

export function buildOrganizationOverview(): OrganizationOverview {
  return {
    companyName: 'PeopleOS',
    totalEmployees: 1247,
    locations: [
      { id: 'loc-jkt', name: 'Jakarta HQ', city: 'Jakarta', country: 'Indonesia', employeeCount: 642 },
      { id: 'loc-sby', name: 'Surabaya Office', city: 'Surabaya', country: 'Indonesia', employeeCount: 218 },
      { id: 'loc-dps', name: 'Denpasar Hub', city: 'Denpasar', country: 'Indonesia', employeeCount: 157 },
    ],
    departments: [
      { id: 'dept-eng', name: 'Engineering', manager: 'Sarah Chen', employeeCount: 312 },
      { id: 'dept-ops', name: 'Operations', manager: 'Aisha Patel', employeeCount: 245 },
      { id: 'dept-sales', name: 'Sales', manager: 'Tom Bradley', employeeCount: 198 },
      { id: 'dept-hr', name: 'HR & Admin', manager: 'Nina Okafor', employeeCount: 156 },
    ],
  };
}
