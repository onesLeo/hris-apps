import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Roles } from '../../common/guards/roles.decorator';
import type {
  OrganizationCatalog,
  OrganizationOverview,
  OrganizationCatalogPlant,
  OrganizationCatalogDepartment,
  OrganizationCatalogLocation,
  OrganizationCatalogTeam,
} from './organization.contracts';
import { OrganizationService } from './organization.service';
import { RequestContext } from '../../common/context/request-context';
import type { CreateDepartmentDto, CreateLocationDto, CreatePlantDto, CreateTeamDto } from './organization.dto';

@Controller('organization')
export class OrganizationController {
  organizationService: OrganizationService;

  constructor(organizationService: OrganizationService) {
    this.organizationService = organizationService;
  }

  @Get('overview')
  getOverview(): Promise<OrganizationOverview> {
    return this.organizationService.getOverview(this.tenantId());
  }

  @Get('catalog')
  getCatalog(@CurrentUser() user?: AuthenticatedUser): Promise<OrganizationCatalog> {
    const tenantId = user?.tenantId ?? '';
    return this.organizationService.getCatalog(tenantId);
  }

  @Post('locations')
  @Roles('hris_admin', 'hr_manager')
  async createLocation(@Body() dto: CreateLocationDto): Promise<OrganizationCatalogLocation> {
    return this.organizationService.createLocation(this.tenantId(), dto);
  }

  @Post('plants')
  @Roles('hris_admin', 'hr_manager')
  async createPlant(@Body() dto: CreatePlantDto): Promise<OrganizationCatalogPlant> {
    return this.organizationService.createPlant(this.tenantId(), dto);
  }

  @Post('departments')
  @Roles('hris_admin', 'hr_manager')
  async createDepartment(@Body() dto: CreateDepartmentDto): Promise<OrganizationCatalogDepartment> {
    return this.organizationService.createDepartment(this.tenantId(), dto);
  }

  @Post('teams')
  @Roles('hris_admin', 'hr_manager')
  async createTeam(@Body() dto: CreateTeamDto): Promise<OrganizationCatalogTeam> {
    return this.organizationService.createTeam(this.tenantId(), dto);
  }

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}
