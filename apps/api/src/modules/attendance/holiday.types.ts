export type HolidayCalendar = {
  id: string;
  code: string;
  name: string;
  country: string;
  year: number;
};

export type PublicHoliday = {
  id: string;
  holidayCalendarId: string;
  name: string;
  date: string;
  isRecurring: boolean;
};

export type CompanyHoliday = {
  id: string;
  tenantId: string;
  locationId: string | null;
  name: string;
  date: string;
  isWorkingDay: boolean;
};

export type HolidayResolution = {
  date: string;
  isHoliday: boolean;
  source: 'company' | 'public' | null;
  name: string | null;
  isCompanyOverride: boolean;
};
