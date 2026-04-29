import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  OrganizationCatalog,
  OrganizationOverview,
} from './organization.contracts';
import { buildOrganizationOverview } from './organization.overview';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
  ) {}

  getOverview(): OrganizationOverview {
    return buildOrganizationOverview();
  }

  async getCatalog(tenantId: string): Promise<OrganizationCatalog> {
    const [locations, departments] = await Promise.all([
      this.db.queryWithTenant<{
        id: string;
        name: string;
        code: string;
      }>(tenantId, `
        SELECT id, name, code
        FROM locations
        WHERE tenant_id = $1 AND is_active = TRUE
        ORDER BY name
      `, [tenantId]),
      this.db.queryWithTenant<{
        id: string;
        name: string;
        code: string;
        location_id: string;
        location_name: string | null;
      }>(tenantId, `
        SELECT d.id, d.name, d.code, d.location_id, l.name AS location_name
        FROM departments d
        LEFT JOIN locations l ON l.id = d.location_id
        WHERE d.tenant_id = $1 AND d.is_active = TRUE
        ORDER BY d.name
      `, [tenantId]),
    ]);

    return {
      locations: locations.map((location) => ({
        id: location.id,
        name: location.name,
        code: location.code,
      })),
      departments: departments.map((department) => ({
        id: department.id,
        name: department.name,
        code: department.code,
        locationId: department.location_id,
        locationName: department.location_name ?? '',
      })),
    };
  }
}
