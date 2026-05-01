import { apiDelete, apiGet, apiPost } from './api-client';

export type PublicHoliday = {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
};

export type CompanyHoliday = {
  id: string;
  locationId: string | null;
  locationName: string | null;
  name: string;
  date: string;
  isWorkingDay: boolean;
  description: string | null;
};

export type HolidayEntry = {
  id: string;
  name: string;
  date: string;
  source: 'public' | 'company';
  isWorkingDay?: boolean;
  locationName?: string | null;
  description?: string | null;
};

export async function fetchPublicHolidays(year: number, locationId?: string): Promise<PublicHoliday[]> {
  const q = new URLSearchParams({ year: String(year) });
  if (locationId) q.set('locationId', locationId);
  return apiGet<PublicHoliday[]>(`/holidays/public?${q}`);
}

export async function fetchCompanyHolidays(year: number, locationId?: string): Promise<CompanyHoliday[]> {
  const q = new URLSearchParams({ year: String(year) });
  if (locationId) q.set('locationId', locationId);
  return apiGet<CompanyHoliday[]>(`/holidays/company?${q}`);
}

export async function createCompanyHoliday(data: {
  date: string;
  name: string;
  isWorkingDay?: boolean;
  description?: string;
  locationId?: string;
}): Promise<CompanyHoliday> {
  return apiPost<CompanyHoliday>('/holidays/company', data);
}

export async function deleteCompanyHoliday(id: string): Promise<void> {
  await apiDelete(`/holidays/company/${id}`);
}
