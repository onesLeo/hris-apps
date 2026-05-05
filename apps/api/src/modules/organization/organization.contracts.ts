export type OrganizationLocationSummary = {
  id: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
  clockingMethod: string;
  employeeCount: number;
};

export type OrganizationPlantSummary = {
  id: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string;
  manager: string;
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

export type OrganizationTeamSummary = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  leadName: string;
  isActive: boolean;
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
  plantMap: OrganizationPlantSummary[];
  departmentMap: OrganizationDepartmentSummary[];
  structure: OrganizationStructureNode[];
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

export type OrganizationCatalog = {
  locations: OrganizationCatalogLocation[];
  plants: OrganizationCatalogPlant[];
  departments: OrganizationCatalogDepartment[];
  teams: OrganizationCatalogTeam[];
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
