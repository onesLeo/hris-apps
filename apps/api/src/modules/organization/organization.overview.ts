import type { OrganizationOverview } from './organization.contracts';

export function buildOrganizationOverview(): OrganizationOverview {
  return {
    companyName: 'PeopleOS',
    legalName: 'PT People Operations System',
    headquarters: 'Jakarta HQ',
    totalEmployees: 1247,
    activeLocations: 3,
    plants: 4,
    departments: 4,
    leaders: 4,
    locations: [
      { id: 'loc-jkt', name: 'Jakarta HQ', code: 'JKT', country: 'Indonesia', timezone: 'Asia/Jakarta', clockingMethod: 'biometric', employeeCount: 642 },
      { id: 'loc-sby', name: 'Surabaya Office', code: 'SBY', country: 'Indonesia', timezone: 'Asia/Jakarta', clockingMethod: 'biometric', employeeCount: 218 },
      { id: 'loc-dps', name: 'Denpasar Hub', code: 'DPS', country: 'Indonesia', timezone: 'Asia/Makassar', clockingMethod: 'biometric', employeeCount: 157 },
    ],
    plantMap: [
      { id: 'plant-jkt-1', name: 'Jakarta Plant A', code: 'JKT-A', locationId: 'loc-jkt', locationName: 'Jakarta HQ', manager: 'Sarah Chen', employeeCount: 214 },
      { id: 'plant-jkt-2', name: 'Jakarta Plant B', code: 'JKT-B', locationId: 'loc-jkt', locationName: 'Jakarta HQ', manager: 'Daniel Kim', employeeCount: 188 },
      { id: 'plant-sby-1', name: 'Surabaya Plant A', code: 'SBY-A', locationId: 'loc-sby', locationName: 'Surabaya Office', manager: 'Aisha Patel', employeeCount: 132 },
      { id: 'plant-dps-1', name: 'Denpasar Plant A', code: 'DPS-A', locationId: 'loc-dps', locationName: 'Denpasar Hub', manager: 'Tom Bradley', employeeCount: 97 },
    ],
    departmentMap: [
      { id: 'dept-eng', name: 'Engineering', code: 'ENG', locationId: 'loc-jkt', locationName: 'Jakarta HQ', manager: 'Sarah Chen', employeeCount: 312 },
      { id: 'dept-ops', name: 'Operations', code: 'OPS', locationId: 'loc-sby', locationName: 'Surabaya Office', manager: 'Aisha Patel', employeeCount: 245 },
      { id: 'dept-sales', name: 'Sales', code: 'SAL', locationId: 'loc-dps', locationName: 'Denpasar Hub', manager: 'Tom Bradley', employeeCount: 198 },
      { id: 'dept-hr', name: 'HR & Admin', code: 'HR', locationId: 'loc-jkt', locationName: 'Jakarta HQ', manager: 'Nina Okafor', employeeCount: 156 },
    ],
    structure: [
      { title: 'Head Office', detail: 'Central leadership and shared services', accent: '#e8317a' },
      { title: 'Regional Offices', detail: 'Branch execution in two secondary hubs', accent: '#8b5cf6' },
      { title: 'Functional Teams', detail: 'Cross-site delivery across product and ops', accent: '#06b6d4' },
    ],
  };
}
