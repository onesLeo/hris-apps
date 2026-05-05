import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  OrganizationCatalog,
  OrganizationCatalogPlant,
  OrganizationCatalogDepartment,
  OrganizationCatalogLocation,
  OrganizationCatalogTeam,
  OrganizationDepartmentSummary,
  OrganizationLocationSummary,
  OrganizationPlantSummary,
  OrganizationOverview,
  OrganizationStructureNode,
} from './organization.contracts';
import type { CreateDepartmentDto, CreateLocationDto, CreatePlantDto, CreateTeamDto } from './organization.dto';

type TenantRow = { name: string };
type CountRow = { count: string };
type LocationRow = {
  id: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
  clocking_method: string;
  employee_count: string;
  is_active: boolean;
};
type PlantRow = {
  id: string;
  name: string;
  code: string;
  location_id: string;
  location_name: string;
  manager_id: string | null;
  manager_name: string | null;
  employee_count: string;
  is_active: boolean;
};
type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  location_id: string;
  location_name: string;
  manager_id: string | null;
  manager_name: string | null;
  employee_count: string;
  is_active: boolean;
};
type TeamRow = {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  lead_id: string | null;
  lead_name: string | null;
  is_active: boolean;
};

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
  ) {}

  async getOverview(tenantId: string): Promise<OrganizationOverview> {
    const [tenant, totals, activeLocationCount, plantCount, departmentCount, leaderCount, locations, plants, departments] = await Promise.all([
      this.getTenant(tenantId),
      this.countEmployees(tenantId),
      this.countActiveLocations(tenantId),
      this.countPlants(tenantId),
      this.countDepartments(tenantId),
      this.countLeaders(tenantId),
      this.loadLocationSummaries(tenantId),
      this.loadPlantSummaries(tenantId),
      this.loadDepartmentSummaries(tenantId),
    ]);

    const companyName = tenant?.name ?? 'Organization';
    const headquarters = locations[0]?.name ?? 'Headquarters';

    return {
      companyName,
      legalName: 'Registered operating unit and reporting map',
      headquarters,
      totalEmployees: Number(totals[0]?.count ?? 0),
      activeLocations: Number(activeLocationCount[0]?.count ?? locations.length),
      plants: Number(plantCount[0]?.count ?? plants.length),
      departments: Number(departmentCount[0]?.count ?? departments.length),
      leaders: Number(leaderCount[0]?.count ?? 0),
      locations,
      plantMap: plants,
      departmentMap: departments,
      structure: this.buildStructure(headquarters, locations.length, plants.length, departments.length),
    };
  }

  async getCatalog(tenantId: string): Promise<OrganizationCatalog> {
    const [locations, plants, departments, teams] = await Promise.all([
      this.loadCatalogLocations(tenantId),
      this.loadCatalogPlants(tenantId),
      this.loadCatalogDepartments(tenantId),
      this.loadCatalogTeams(tenantId),
    ]);

    return { locations, plants, departments, teams };
  }

  async createLocation(tenantId: string, dto: CreateLocationDto): Promise<OrganizationCatalogLocation> {
    if (!dto.name.trim() || !dto.code.trim()) {
      throw new BadRequestException('name and code are required');
    }

    const [row] = await this.db.queryWithTenant<{
      id: string;
      name: string;
      code: string;
      country: string;
      timezone: string;
      clocking_method: string;
      is_active: boolean;
    }>(tenantId, `
      INSERT INTO locations (
        tenant_id, name, code, timezone, country, state_province, address, clocking_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, code, country, timezone, clocking_method, is_active
    `, [
      tenantId,
      dto.name.trim(),
      dto.code.trim().toUpperCase(),
      dto.timezone ?? 'Asia/Jakarta',
      dto.country ?? 'Indonesia',
      dto.stateProvince ?? null,
      dto.address ?? null,
      dto.clockingMethod ?? 'biometric',
    ]);

    if (!row) {
      throw new Error('Failed to create location');
    }

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      country: row.country,
      timezone: row.timezone,
      clockingMethod: row.clocking_method,
      isActive: row.is_active,
    };
  }

  async createPlant(tenantId: string, dto: CreatePlantDto): Promise<OrganizationCatalogPlant> {
    if (!dto.locationId || !dto.name.trim() || !dto.code.trim()) {
      throw new BadRequestException('locationId, name, and code are required');
    }

    const location = await this.findLocationById(tenantId, dto.locationId);
    if (!location) {
      throw new BadRequestException(`Location ${dto.locationId} not found`);
    }

    const managerId = dto.managerId?.trim() || null;
    const manager = managerId ? await this.findUserById(tenantId, managerId) : null;
    if (managerId && !manager) {
      throw new BadRequestException(`Manager ${managerId} not found`);
    }

    const [row] = await this.db.queryWithTenant<PlantRow>(tenantId, `
      INSERT INTO plants (
        tenant_id, location_id, name, code, manager_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, code, location_id, '' AS location_name, manager_id, NULL AS manager_name, TRUE AS is_active, '0' AS employee_count
    `, [
      tenantId,
      dto.locationId,
      dto.name.trim(),
      dto.code.trim().toUpperCase(),
      managerId,
    ]);

    if (!row) {
      throw new Error('Failed to create plant');
    }

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      locationId: row.location_id,
      locationName: location.name,
      managerId: row.manager_id,
      managerName: manager?.display_name ?? 'Unassigned',
      isActive: row.is_active,
    };
  }

  async createDepartment(tenantId: string, dto: CreateDepartmentDto): Promise<OrganizationCatalogDepartment> {
    if (!dto.locationId || !dto.name.trim() || !dto.code.trim()) {
      throw new BadRequestException('locationId, name, and code are required');
    }

    const location = await this.findLocationById(tenantId, dto.locationId);
    if (!location) {
      throw new BadRequestException(`Location ${dto.locationId} not found`);
    }

    const managerId = dto.managerId?.trim() || null;
    const manager = managerId ? await this.findUserById(tenantId, managerId) : null;
    if (managerId) {
      if (!manager) {
        throw new BadRequestException(`Manager ${managerId} not found`);
      }
    }

    const [row] = await this.db.queryWithTenant<DepartmentRow>(tenantId, `
      INSERT INTO departments (
        tenant_id, location_id, name, code, manager_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, code, location_id, '' AS location_name, manager_id, NULL AS manager_name, TRUE AS is_active, '0' AS employee_count
    `, [
      tenantId,
      dto.locationId,
      dto.name.trim(),
      dto.code.trim().toUpperCase(),
      managerId,
    ]);

    if (!row) {
      throw new Error('Failed to create department');
    }

    const managerName = manager?.display_name ?? '';

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      locationId: row.location_id,
      locationName: location.name,
      managerId: row.manager_id,
      managerName,
      isActive: row.is_active,
    };
  }

  async createTeam(tenantId: string, dto: CreateTeamDto): Promise<OrganizationCatalogTeam> {
    if (!dto.departmentId || !dto.name.trim()) {
      throw new BadRequestException('departmentId and name are required');
    }

    const department = await this.findDepartmentById(tenantId, dto.departmentId);
    if (!department) {
      throw new BadRequestException(`Department ${dto.departmentId} not found`);
    }

    const leadId = dto.leadId?.trim() || null;
    const lead = leadId ? await this.findUserById(tenantId, leadId) : null;
    if (leadId) {
      if (!lead) {
        throw new BadRequestException(`Lead ${leadId} not found`);
      }
    }

    const [row] = await this.db.queryWithTenant<TeamRow>(tenantId, `
      INSERT INTO teams (tenant_id, department_id, name, lead_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, department_id, '' AS department_name, lead_id, NULL AS lead_name, is_active
    `, [
      tenantId,
      dto.departmentId,
      dto.name.trim(),
      leadId,
    ]);

    if (!row) {
      throw new Error('Failed to create team');
    }

    const leadName = lead?.display_name ?? '';

    return {
      id: row.id,
      name: row.name,
      departmentId: row.department_id,
      departmentName: department.name,
      leadId: row.lead_id,
      leadName,
      isActive: row.is_active,
    };
  }

  private async getTenant(tenantId: string): Promise<TenantRow | null> {
    const [row] = await this.db.queryWithTenant<TenantRow>(tenantId, `
      SELECT name
      FROM tenants
      WHERE id = $1
      LIMIT 1
    `, [tenantId]);
    return row ?? null;
  }

  private async countEmployees(tenantId: string): Promise<CountRow[]> {
    return this.db.queryWithTenant<CountRow>(tenantId, `
      SELECT COUNT(*)::text AS count
      FROM employees
      WHERE tenant_id = $1
        AND status = 'active'
    `, [tenantId]);
  }

  private async countActiveLocations(tenantId: string): Promise<CountRow[]> {
    return this.db.queryWithTenant<CountRow>(tenantId, `
      SELECT COUNT(*)::text AS count
      FROM locations
      WHERE tenant_id = $1
        AND is_active = TRUE
    `, [tenantId]);
  }

  private async countDepartments(tenantId: string): Promise<CountRow[]> {
    return this.db.queryWithTenant<CountRow>(tenantId, `
      SELECT COUNT(*)::text AS count
      FROM departments
      WHERE tenant_id = $1
        AND is_active = TRUE
    `, [tenantId]);
  }

  private async countPlants(tenantId: string): Promise<CountRow[]> {
    return this.db.queryWithTenant<CountRow>(tenantId, `
      SELECT COUNT(*)::text AS count
      FROM plants
      WHERE tenant_id = $1
        AND is_active = TRUE
    `, [tenantId]);
  }

  private async countLeaders(tenantId: string): Promise<CountRow[]> {
    return this.db.queryWithTenant<CountRow>(tenantId, `
      SELECT COUNT(DISTINCT leader_id)::text AS count
      FROM (
        SELECT manager_id AS leader_id
        FROM plants
        WHERE tenant_id = $1
          AND is_active = TRUE
          AND manager_id IS NOT NULL
        UNION
        SELECT manager_id AS leader_id
        FROM departments
        WHERE tenant_id = $1
          AND is_active = TRUE
          AND manager_id IS NOT NULL
        UNION
        SELECT lead_id AS leader_id
        FROM teams
        WHERE tenant_id = $1
          AND is_active = TRUE
          AND lead_id IS NOT NULL
      ) leaders
    `, [tenantId]);
  }

  private async loadPlantSummaries(tenantId: string): Promise<OrganizationPlantSummary[]> {
    const rows = await this.db.queryWithTenant<PlantRow>(tenantId, `
      WITH current_spells AS (
        SELECT DISTINCT ON (employee_id)
          employee_id, plant_id
        FROM employment_spells
        WHERE tenant_id = $1
          AND effective_from <= CURRENT_DATE
          AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
          AND plant_id IS NOT NULL
        ORDER BY employee_id, effective_from DESC
      )
      SELECT
        p.id,
        p.name,
        p.code,
        p.location_id,
        l.name AS location_name,
        p.manager_id,
        u.display_name AS manager_name,
        COUNT(cs.employee_id)::text AS employee_count,
        p.is_active
      FROM plants p
      JOIN locations l ON l.id = p.location_id
      LEFT JOIN users u ON u.id = p.manager_id
      LEFT JOIN current_spells cs ON cs.plant_id = p.id
      WHERE p.tenant_id = $1 AND p.is_active = TRUE
      GROUP BY p.id, l.name, u.display_name
      ORDER BY p.name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      locationId: row.location_id,
      locationName: row.location_name,
      manager: row.manager_name ?? 'Unassigned',
      employeeCount: Number(row.employee_count ?? 0),
    }));
  }

  private async loadLocationSummaries(tenantId: string): Promise<OrganizationLocationSummary[]> {
    const rows = await this.db.queryWithTenant<LocationRow>(tenantId, `
      WITH current_spells AS (
        SELECT DISTINCT ON (employee_id)
          employee_id, department_id, location_id
        FROM employment_spells
        WHERE tenant_id = $1
          AND effective_from <= CURRENT_DATE
          AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
        ORDER BY employee_id, effective_from DESC
      )
      SELECT
        l.id,
        l.name,
        l.code,
        l.country,
        l.timezone,
        l.clocking_method,
        COUNT(cs.employee_id)::text AS employee_count,
        l.is_active
      FROM locations l
      LEFT JOIN current_spells cs ON cs.location_id = l.id
      WHERE l.tenant_id = $1 AND l.is_active = TRUE
      GROUP BY l.id
      ORDER BY l.name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      country: row.country,
      timezone: row.timezone,
      clockingMethod: row.clocking_method,
      employeeCount: Number(row.employee_count ?? 0),
    }));
  }

  private async loadDepartmentSummaries(tenantId: string): Promise<OrganizationDepartmentSummary[]> {
    const rows = await this.db.queryWithTenant<DepartmentRow>(tenantId, `
      WITH current_spells AS (
        SELECT DISTINCT ON (employee_id)
          employee_id, department_id, location_id
        FROM employment_spells
        WHERE tenant_id = $1
          AND effective_from <= CURRENT_DATE
          AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
        ORDER BY employee_id, effective_from DESC
      )
      SELECT
        d.id,
        d.name,
        d.code,
        d.location_id,
        l.name AS location_name,
        d.manager_id,
        u.display_name AS manager_name,
        COUNT(cs.employee_id)::text AS employee_count,
        d.is_active
      FROM departments d
      JOIN locations l ON l.id = d.location_id
      LEFT JOIN users u ON u.id = d.manager_id
      LEFT JOIN current_spells cs ON cs.department_id = d.id
      WHERE d.tenant_id = $1 AND d.is_active = TRUE
      GROUP BY d.id, l.name, u.display_name
      ORDER BY d.name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      locationId: row.location_id,
      locationName: row.location_name,
      manager: row.manager_name ?? 'Unassigned',
      employeeCount: Number(row.employee_count ?? 0),
    }));
  }

  private async loadCatalogLocations(tenantId: string): Promise<OrganizationCatalogLocation[]> {
    const rows = await this.db.queryWithTenant<LocationRow>(tenantId, `
      SELECT id, name, code, country, timezone, clocking_method, is_active, '0' AS employee_count
      FROM locations
      WHERE tenant_id = $1
      ORDER BY name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      country: row.country,
      timezone: row.timezone,
      clockingMethod: row.clocking_method,
      isActive: row.is_active,
    }));
  }

  private async loadCatalogPlants(tenantId: string): Promise<OrganizationCatalogPlant[]> {
    const rows = await this.db.queryWithTenant<PlantRow>(tenantId, `
      SELECT p.id, p.name, p.code, p.location_id, l.name AS location_name, p.manager_id,
             u.display_name AS manager_name, p.is_active, '0' AS employee_count
      FROM plants p
      JOIN locations l ON l.id = p.location_id
      LEFT JOIN users u ON u.id = p.manager_id
      WHERE p.tenant_id = $1
      ORDER BY p.name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      locationId: row.location_id,
      locationName: row.location_name,
      managerId: row.manager_id,
      managerName: row.manager_name ?? 'Unassigned',
      isActive: row.is_active,
    }));
  }

  private async loadCatalogDepartments(tenantId: string): Promise<OrganizationCatalogDepartment[]> {
    const rows = await this.db.queryWithTenant<DepartmentRow>(tenantId, `
      SELECT d.id, d.name, d.code, d.location_id, l.name AS location_name, d.manager_id,
             u.display_name AS manager_name, d.is_active, '0' AS employee_count
      FROM departments d
      JOIN locations l ON l.id = d.location_id
      LEFT JOIN users u ON u.id = d.manager_id
      WHERE d.tenant_id = $1
      ORDER BY d.name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      locationId: row.location_id,
      locationName: row.location_name,
      managerId: row.manager_id,
      managerName: row.manager_name ?? 'Unassigned',
      isActive: row.is_active,
    }));
  }

  private async loadCatalogTeams(tenantId: string): Promise<OrganizationCatalogTeam[]> {
    const rows = await this.db.queryWithTenant<TeamRow>(tenantId, `
      SELECT t.id, t.name, t.department_id, d.name AS department_name,
             t.lead_id, u.display_name AS lead_name, t.is_active
      FROM teams t
      JOIN departments d ON d.id = t.department_id
      LEFT JOIN users u ON u.id = t.lead_id
      WHERE t.tenant_id = $1
      ORDER BY t.name ASC
    `, [tenantId]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      departmentId: row.department_id,
      departmentName: row.department_name,
      leadId: row.lead_id,
      leadName: row.lead_name ?? 'Unassigned',
      isActive: row.is_active,
    }));
  }

  private async findLocationById(tenantId: string, locationId: string): Promise<{ id: string; name: string } | null> {
    const [row] = await this.db.queryWithTenant<{ id: string; name: string }>(tenantId, `
      SELECT id, name
      FROM locations
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, [tenantId, locationId]);
    return row ?? null;
  }

  private async findPlantById(tenantId: string, plantId: string): Promise<{ id: string; name: string; locationId: string } | null> {
    const [row] = await this.db.queryWithTenant<{ id: string; name: string; location_id: string }>(tenantId, `
      SELECT id, name, location_id
      FROM plants
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, [tenantId, plantId]);
    return row ? { id: row.id, name: row.name, locationId: row.location_id } : null;
  }

  private async findDepartmentById(tenantId: string, departmentId: string): Promise<{ id: string; name: string } | null> {
    const [row] = await this.db.queryWithTenant<{ id: string; name: string }>(tenantId, `
      SELECT id, name
      FROM departments
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, [tenantId, departmentId]);
    return row ?? null;
  }

  private async findUserById(tenantId: string, userId: string): Promise<{ id: string; display_name: string } | null> {
    const [row] = await this.db.queryWithTenant<{ id: string; display_name: string }>(tenantId, `
      SELECT id, display_name
      FROM users
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, [tenantId, userId]);
    return row ?? null;
  }

  private buildStructure(headquarters: string, locationCount: number, plantCount: number, departmentCount: number): OrganizationStructureNode[] {
    const regionalLocations = Math.max(0, locationCount - 1);
    return [
      { title: 'Head Office', detail: headquarters, accent: '#e8317a' },
      { title: 'Regional Offices', detail: `${regionalLocations} active secondary location${regionalLocations === 1 ? '' : 's'}`, accent: '#8b5cf6' },
      { title: 'Plants', detail: `${plantCount} active plant${plantCount === 1 ? '' : 's'}`, accent: '#10b981' },
      { title: 'Functional Teams', detail: `${departmentCount} active department${departmentCount === 1 ? '' : 's'}`, accent: '#06b6d4' },
    ];
  }
}
