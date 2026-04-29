import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { OrganizationCatalog, OrganizationOverview } from './organization.contracts';
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

  @Get('catalog')
  getCatalog(@CurrentUser() user?: AuthenticatedUser): Promise<OrganizationCatalog> {
    const tenantId = user?.tenantId ?? '';
    return this.organizationService.getCatalog(tenantId);
  }
}
