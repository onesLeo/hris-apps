import { apiGet } from './api-client';

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

export async function fetchOrganizationCatalog(): Promise<OrganizationCatalog> {
  return apiGet<OrganizationCatalog>('/organization/catalog');
}
