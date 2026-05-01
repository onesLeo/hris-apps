export type HolidayCalendarSnapshot = {
  id: string;
  tenantId: string | null;
  countryCode: string;
  year: number;
  name: string;
  isSystem: boolean;
};

export type PublicHolidaySnapshot = {
  id: string;
  calendarId: string;
  date: string;
  name: string;
  nameLocal: string | null;
  substitute: boolean;
  originalDate: string | null;
};

export type CompanyHolidaySnapshot = {
  id: string;
  tenantId: string;
  locationId: string | null;
  date: string;
  name: string;
  description: string | null;
};

export type LocationCalendarAssignment = {
  id: string;
  tenantId: string;
  locationId: string;
  calendarId: string;
  calendarName: string;
};

/**
 * Resolved holiday for a given date — includes source (public vs company).
 */
export type ResolvedHoliday = {
  date: string;
  name: string;
  nameLocal: string | null;
  source: 'public' | 'company';
  substitute: boolean;
};
