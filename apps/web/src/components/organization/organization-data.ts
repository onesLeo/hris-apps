import type { Locale } from '../../i18n/types';

export type OrganizationLocation = {
  name: string;
  code: string;
  country: string;
  employeeCount: number;
  accent: string;
};

export type OrganizationDepartment = {
  name: string;
  code: string;
  manager: string;
  locationName: string;
  employeeCount: number;
  accent: string;
};

export type OrganizationPlant = {
  name: string;
  code: string;
  manager: string;
  locationName: string;
  employeeCount: number;
  accent: string;
};

export type OrganizationTeam = {
  name: string;
  department: string;
  lead: string;
  active: boolean;
};

export type OrganizationCatalogLocation = {
  id: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
  clockingMethod: string;
  isActive: boolean;
};

export type OrganizationCatalogDepartment = {
  id: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string;
  managerId: string | null;
  managerName: string;
  isActive: boolean;
};

export type OrganizationCatalogTeam = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  leadId: string | null;
  leadName: string;
  isActive: boolean;
};

export type OrganizationCatalogPlant = {
  id: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string;
  managerId: string | null;
  managerName: string;
  isActive: boolean;
};

export type OrganizationCatalog = {
  locations: OrganizationCatalogLocation[];
  plants: OrganizationCatalogPlant[];
  departments: OrganizationCatalogDepartment[];
  teams: OrganizationCatalogTeam[];
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
  plants: number;
  departments: number;
  leaders: number;
  locations: OrganizationLocation[];
  plantMap: OrganizationPlant[];
  departmentMap: OrganizationDepartment[];
  teams: OrganizationTeam[];
  structure: OrganizationStructureNode[];
};

const OVERVIEW: Record<Locale, OrganizationOverview> = {
  en: {
    companyName: 'PeopleOS',
    legalName: 'PT People Operations System',
    headquarters: 'Head Office',
    totalEmployees: 1247,
    activeLocations: 3,
    plants: 4,
    departments: 6,
    leaders: 8,
    locations: [
      { name: 'Head Office', code: 'HO', country: 'Indonesia', employeeCount: 642, accent: '#e8317a' },
      { name: 'Surabaya Office', code: 'SBY', country: 'Indonesia', employeeCount: 218, accent: '#8b5cf6' },
      { name: 'Denpasar Hub', code: 'DPS', country: 'Indonesia', employeeCount: 157, accent: '#06b6d4' },
    ],
    plantMap: [
      { name: 'HO Assembly Plant', code: 'HO-ASM', manager: 'Maya Wulandari', locationName: 'Head Office', employeeCount: 210, accent: '#10b981' },
      { name: 'Jakarta Packing Plant', code: 'JKT-PK', manager: 'Rizky Pratama', locationName: 'Head Office', employeeCount: 176, accent: '#f59e0b' },
      { name: 'Surabaya Plant A', code: 'SBY-A', manager: 'Sari Dewi', locationName: 'Surabaya Office', employeeCount: 198, accent: '#06b6d4' },
      { name: 'Denpasar Support Plant', code: 'DPS-SP', manager: 'Ari Santoso', locationName: 'Denpasar Hub', employeeCount: 92, accent: '#8b5cf6' },
    ],
    departmentMap: [
      { name: 'Engineering', code: 'ENG', manager: 'Sarah Chen', locationName: 'Head Office', employeeCount: 312, accent: '#e8317a' },
      { name: 'Operations', code: 'OPS', manager: 'Aisha Patel', locationName: 'Surabaya Office', employeeCount: 245, accent: '#8b5cf6' },
      { name: 'Sales', code: 'SAL', manager: 'Tom Bradley', locationName: 'Denpasar Hub', employeeCount: 198, accent: '#06b6d4' },
      { name: 'HR & Admin', code: 'HR', manager: 'Nina Okafor', locationName: 'Head Office', employeeCount: 156, accent: '#10b981' },
    ],
    teams: [
      { name: 'Platform Team', department: 'Engineering', lead: 'Sarah Chen', active: true },
      { name: 'People Ops Core', department: 'HR & Admin', lead: 'Nina Okafor', active: true },
      { name: 'Field Sales', department: 'Sales', lead: 'Tom Bradley', active: true },
    ],
    structure: [
      { title: 'Head Office', detail: 'Central leadership and shared services', accent: '#e8317a' },
      { title: 'Regional Offices', detail: 'Branch execution in two secondary hubs', accent: '#8b5cf6' },
      { title: 'Functional Teams', detail: 'Cross-site delivery across product and ops', accent: '#06b6d4' },
    ],
  },
  id: {
    companyName: 'PeopleOS',
    legalName: 'PT People Operations System',
    headquarters: 'Kantor Pusat',
    totalEmployees: 1247,
    activeLocations: 3,
    plants: 4,
    departments: 6,
    leaders: 8,
    locations: [
      { name: 'Kantor Pusat', code: 'HO', country: 'Indonesia', employeeCount: 642, accent: '#e8317a' },
      { name: 'Kantor Surabaya', code: 'SBY', country: 'Indonesia', employeeCount: 218, accent: '#8b5cf6' },
      { name: 'Hub Denpasar', code: 'DPS', country: 'Indonesia', employeeCount: 157, accent: '#06b6d4' },
    ],
    plantMap: [
      { name: 'Pabrik Perakitan HO', code: 'HO-ASM', manager: 'Maya Wulandari', locationName: 'Kantor Pusat', employeeCount: 210, accent: '#10b981' },
      { name: 'Pabrik Pengemasan Jakarta', code: 'JKT-PK', manager: 'Rizky Pratama', locationName: 'Kantor Pusat', employeeCount: 176, accent: '#f59e0b' },
      { name: 'Pabrik Surabaya A', code: 'SBY-A', manager: 'Sari Dewi', locationName: 'Kantor Surabaya', employeeCount: 198, accent: '#06b6d4' },
      { name: 'Pabrik Dukungan Denpasar', code: 'DPS-SP', manager: 'Ari Santoso', locationName: 'Hub Denpasar', employeeCount: 92, accent: '#8b5cf6' },
    ],
    departmentMap: [
      { name: 'Engineering', code: 'ENG', manager: 'Sarah Chen', locationName: 'Kantor Pusat', employeeCount: 312, accent: '#e8317a' },
      { name: 'Operasional', code: 'OPS', manager: 'Aisha Patel', locationName: 'Kantor Surabaya', employeeCount: 245, accent: '#8b5cf6' },
      { name: 'Penjualan', code: 'SAL', manager: 'Tom Bradley', locationName: 'Hub Denpasar', employeeCount: 198, accent: '#06b6d4' },
      { name: 'SDM & Admin', code: 'HR', manager: 'Nina Okafor', locationName: 'Kantor Pusat', employeeCount: 156, accent: '#10b981' },
    ],
    teams: [
      { name: 'Platform Team', department: 'Engineering', lead: 'Sarah Chen', active: true },
      { name: 'People Ops Core', department: 'SDM & Admin', lead: 'Nina Okafor', active: true },
      { name: 'Sales Field', department: 'Penjualan', lead: 'Tom Bradley', active: true },
    ],
    structure: [
      { title: 'Kantor Pusat', detail: 'Kepemimpinan pusat dan layanan bersama', accent: '#e8317a' },
      { title: 'Kantor Regional', detail: 'Eksekusi cabang di dua hub sekunder', accent: '#8b5cf6' },
      { title: 'Tim Fungsional', detail: 'Pelaksanaan lintas lokasi untuk produk dan operasi', accent: '#06b6d4' },
    ],
  },
};

export function getOrganizationOverview(locale: Locale): OrganizationOverview {
  return OVERVIEW[locale];
}

export function getOrganizationCatalog(locale: Locale): OrganizationCatalog {
  const overview = getOrganizationOverview(locale);
  return {
    locations: overview.locations.map((location, index) => ({
      id: `mock-loc-${index + 1}`,
      name: location.name,
      code: location.code,
      country: location.country,
      timezone: 'Asia/Jakarta',
      clockingMethod: 'biometric',
      isActive: true,
    })),
    plants: overview.plantMap.map((plant, index) => ({
      id: `mock-plant-${index + 1}`,
      name: plant.name,
      code: plant.code,
      locationId: `mock-loc-${index < overview.locations.length ? index + 1 : 1}`,
      locationName: plant.locationName,
      managerId: null,
      managerName: plant.manager,
      isActive: true,
    })),
    departments: overview.departmentMap.map((department, index) => ({
      id: `mock-dept-${index + 1}`,
      name: department.name,
      code: department.code,
      locationId: `mock-loc-${index < overview.locations.length ? index + 1 : 1}`,
      locationName: department.locationName,
      managerId: null,
      managerName: department.manager,
      isActive: true,
    })),
    teams: overview.teams.map((team, index) => ({
      id: `mock-team-${index + 1}`,
      name: team.name,
      departmentId: `mock-dept-${index < overview.departmentMap.length ? index + 1 : 1}`,
      departmentName: team.department,
      leadId: null,
      leadName: team.lead,
      isActive: team.active,
    })),
  };
}
