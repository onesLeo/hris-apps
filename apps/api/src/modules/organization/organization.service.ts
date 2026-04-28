import { Injectable } from '@nestjs/common';
import type { OrganizationOverview } from './organization.contracts';
import { buildOrganizationOverview } from './organization.overview';

@Injectable()
export class OrganizationService {
  getOverview(): OrganizationOverview {
    return buildOrganizationOverview();
  }
}
