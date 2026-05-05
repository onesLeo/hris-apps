export type CreateLocationDto = {
  name: string;
  code: string;
  country?: string;
  timezone?: string;
  stateProvince?: string | null;
  address?: string | null;
  clockingMethod?: 'biometric' | 'qr' | 'kiosk' | 'gps' | 'manual';
};

export type CreatePlantDto = {
  locationId: string;
  name: string;
  code: string;
  managerId?: string | null;
};

export type CreateDepartmentDto = {
  locationId: string;
  name: string;
  code: string;
  managerId?: string | null;
};

export type CreateTeamDto = {
  departmentId: string;
  name: string;
  leadId?: string | null;
};
