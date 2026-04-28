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
