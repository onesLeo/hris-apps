import { apiGet, apiPatch } from './api-client';

export type EmployeeProfile = {
  id: string;
  tenantId: string;
  employeeId: string;
  displayName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  hireDate: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  nik: string | null;
  bpjsHealth: string | null;
  bpjsEmployment: string | null;
  bpjsPension: string | null;
  bpjsAccident: string | null;
};

export type UpdateProfileInput = {
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  nik?: string;
  bpjsHealth?: string;
  bpjsEmployment?: string;
  bpjsPension?: string;
  bpjsAccident?: string;
};

export async function fetchMyProfile(): Promise<EmployeeProfile> {
  return apiGet<EmployeeProfile>('/employees/me');
}

export async function updateMyProfile(data: UpdateProfileInput): Promise<EmployeeProfile> {
  return apiPatch<EmployeeProfile>('/employees/me', data);
}
