import { apiGet, apiPost } from './api-client';

export type OrganizationCatalogLocation = {
  id: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
  clockingMethod: string;
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

export type OrganizationCatalog = {
  locations: OrganizationCatalogLocation[];
  plants: OrganizationCatalogPlant[];
  departments: OrganizationCatalogDepartment[];
  teams: OrganizationCatalogTeam[];
};

export type OrganizationLocationSummary = {
  id: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
  clockingMethod: string;
  employeeCount: number;
};

export type OrganizationDepartmentSummary = {
  id: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string;
  manager: string;
  employeeCount: number;
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
  locations: OrganizationLocationSummary[];
  plantMap: {
    id: string;
    name: string;
    code: string;
    locationId: string;
    locationName: string;
    manager: string;
    employeeCount: number;
  }[];
  departmentMap: OrganizationDepartmentSummary[];
  structure: OrganizationStructureNode[];
};

export async function fetchOrganizationCatalog(): Promise<OrganizationCatalog> {
  return apiGet<OrganizationCatalog>('/organization/catalog');
}

export async function fetchOrganizationOverview(): Promise<OrganizationOverview> {
  return apiGet<OrganizationOverview>('/organization/overview');
}

export async function createOrganizationLocation(input: {
  name: string;
  code: string;
  country?: string;
  timezone?: string;
  stateProvince?: string | null;
  address?: string | null;
  clockingMethod?: 'biometric' | 'qr' | 'kiosk' | 'gps' | 'manual';
}): Promise<OrganizationCatalogLocation> {
  return apiPost<OrganizationCatalogLocation>('/organization/locations', input);
}

export async function createOrganizationPlant(input: {
  locationId: string;
  name: string;
  code: string;
  managerId?: string | null;
}): Promise<OrganizationCatalogPlant> {
  return apiPost<OrganizationCatalogPlant>('/organization/plants', input);
}

export async function createOrganizationDepartment(input: {
  locationId: string;
  name: string;
  code: string;
  managerId?: string | null;
}): Promise<OrganizationCatalogDepartment> {
  return apiPost<OrganizationCatalogDepartment>('/organization/departments', input);
}

export async function createOrganizationTeam(input: {
  departmentId: string;
  name: string;
  leadId?: string | null;
}): Promise<OrganizationCatalogTeam> {
  return apiPost<OrganizationCatalogTeam>('/organization/teams', input);
}
