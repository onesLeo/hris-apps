export type OrganizationLocationSummary = {
  id: string;
  name: string;
  city: string;
  country: string;
  employeeCount: number;
};

export type OrganizationDepartmentSummary = {
  id: string;
  name: string;
  manager: string;
  employeeCount: number;
};

export type OrganizationOverview = {
  companyName: string;
  totalEmployees: number;
  locations: OrganizationLocationSummary[];
  departments: OrganizationDepartmentSummary[];
};

export type OrganizationCatalogLocation = {
  id: string;
  name: string;
  code: string;
};

export type OrganizationCatalogDepartment = {
  id: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string;
};

export type OrganizationCatalog = {
  locations: OrganizationCatalogLocation[];
  departments: OrganizationCatalogDepartment[];
};
