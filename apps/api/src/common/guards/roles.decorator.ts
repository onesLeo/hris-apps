import { SetMetadata } from '@nestjs/common';

export type RoleName =
  | 'super_admin'
  | 'hris_admin'
  | 'hr_manager'
  | 'hr_staff'
  | 'payroll_manager'
  | 'payroll_staff'
  | 'plant_manager'
  | 'department_manager'
  | 'team_lead'
  | 'employee'
  | 'recruitment_manager'
  | 'security_officer'
  | 'finance_controller'
  | 'read_only';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
