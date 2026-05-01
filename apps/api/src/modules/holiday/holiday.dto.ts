export type CreateCompanyHolidayDto = {
  date: string;
  name: string;
  description?: string;
  locationId?: string;
};

export type AssignCalendarDto = {
  calendarId: string;
};
