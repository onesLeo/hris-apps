import { Controller, Get } from '@nestjs/common';
import type { OrganizationOverview } from './organization.contracts';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  organizationService: OrganizationService;

  constructor(organizationService: OrganizationService) {
    this.organizationService = organizationService;
  }

  @Get('overview')
  getOverview(): OrganizationOverview {
    return this.organizationService.getOverview();
  }
}
