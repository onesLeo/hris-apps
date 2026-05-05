'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import { getOrganizationCopy, useLocale } from '../../i18n';
import { getOrganizationCatalog as getMockCatalog, getOrganizationOverview as getMockOverview } from './organization-data';
import {
  createOrganizationDepartment,
  createOrganizationLocation,
  createOrganizationPlant,
  createOrganizationTeam,
  fetchOrganizationCatalog,
  fetchOrganizationOverview,
  type OrganizationCatalog,
  type OrganizationCatalogPlant,
  type OrganizationCatalogDepartment,
  type OrganizationCatalogLocation,
  type OrganizationCatalogTeam,
  type OrganizationOverview,
} from '../../lib/organization-api';

type LocationForm = {
  name: string;
  code: string;
  country: string;
  timezone: string;
  stateProvince: string;
  address: string;
  clockingMethod: 'biometric' | 'qr' | 'kiosk' | 'gps' | 'manual';
};

type DepartmentForm = {
  name: string;
  code: string;
  locationId: string;
  managerId: string;
};

type PlantForm = {
  name: string;
  code: string;
  locationId: string;
  managerId: string;
};

type TeamForm = {
  name: string;
  departmentId: string;
  leadId: string;
};

const DEFAULT_LOCATION_FORM: LocationForm = {
  name: '',
  code: '',
  country: 'Indonesia',
  timezone: 'Asia/Jakarta',
  stateProvince: '',
  address: '',
  clockingMethod: 'biometric',
};

const DEFAULT_DEPARTMENT_FORM: DepartmentForm = {
  name: '',
  code: '',
  locationId: '',
  managerId: '',
};

const DEFAULT_PLANT_FORM: PlantForm = {
  name: '',
  code: '',
  locationId: '',
  managerId: '',
};

const DEFAULT_TEAM_FORM: TeamForm = {
  name: '',
  departmentId: '',
  leadId: '',
};

type MockOrganizationOverview = ReturnType<typeof getMockOverview>;

function toLiveOverview(mock: MockOrganizationOverview): OrganizationOverview {
  const locations = mock.locations.map((location, index) => ({
    id: `mock-loc-${index + 1}`,
    name: location.name,
    code: location.code,
    country: location.country,
    timezone: 'Asia/Jakarta',
    clockingMethod: 'biometric',
    employeeCount: location.employeeCount,
  }));
  const plants = mock.plantMap.map((plant, index) => ({
    id: `mock-plant-${index + 1}`,
    name: plant.name,
    code: plant.code,
    locationId: locations[index < locations.length ? index : 0]?.id ?? 'mock-loc-1',
    locationName: plant.locationName,
    manager: plant.manager,
    employeeCount: plant.employeeCount,
  }));

  return {
    companyName: mock.companyName,
    legalName: mock.legalName,
    headquarters: mock.headquarters,
    totalEmployees: mock.totalEmployees,
    activeLocations: mock.activeLocations,
    plants: mock.plants,
    departments: mock.departments,
    leaders: mock.leaders,
    locations,
    plantMap: plants,
    departmentMap: mock.departmentMap.map((department, index) => ({
      id: `mock-dept-${index + 1}`,
      name: department.name,
      code: department.code,
      locationId: locations[index < locations.length ? index : 0]?.id ?? 'mock-loc-1',
      locationName: department.locationName,
      manager: department.manager,
      employeeCount: department.employeeCount,
    })),
    structure: mock.structure,
  };
}

export function OrganizationScreen() {
  const { locale } = useLocale();
  const copy = getOrganizationCopy(locale);
  const { data: session, status } = useSession();
  const allowMockFallback = process.env.NODE_ENV !== 'production';
  const isLiveSession = Boolean(session?.accessToken);
  const canMutate = isLiveSession || allowMockFallback;
  const [overview, setOverview] = useState<OrganizationOverview | null>(null);
  const [catalog, setCatalog] = useState<OrganizationCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (status === 'loading') {
      return;
    }

    if (!session?.accessToken) {
      setLoading(false);
      if (allowMockFallback) {
        setOverview(toLiveOverview(getMockOverview(locale)));
        setCatalog(getMockCatalog(locale));
        setError(null);
      } else {
        setOverview(null);
        setCatalog(null);
        setError('Organization data requires a live API session.');
      }
      return;
    }

    setLoading(true);
    setError(null);

    const [overviewResult, catalogResult] = await Promise.allSettled([
      fetchOrganizationOverview(),
      fetchOrganizationCatalog(),
    ]);

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value);
    } else {
      setOverview(null);
      if (allowMockFallback) {
        setError('Failed to load organization overview from the API. Using demo data.');
        setOverview(toLiveOverview(getMockOverview(locale)));
      } else {
        setError('Failed to load organization overview from the API.');
      }
    }

    if (catalogResult.status === 'fulfilled') {
      setCatalog(catalogResult.value);
    } else {
      setCatalog(null);
      if (allowMockFallback) {
        setError('Failed to load organization structure from the API. Using demo data.');
        setCatalog(getMockCatalog(locale));
      } else {
        setError('Failed to load organization structure from the API.');
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [session?.accessToken, status, locale]);

  const createMockId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const createLocalLocation = (input: {
    name: string;
    code: string;
    country?: string;
    timezone?: string;
    stateProvince?: string | null;
    address?: string | null;
    clockingMethod?: 'biometric' | 'qr' | 'kiosk' | 'gps' | 'manual';
  }) => {
    const location = {
      id: createMockId('mock-loc'),
      name: input.name,
      code: input.code,
      country: input.country ?? 'Indonesia',
      timezone: input.timezone ?? 'Asia/Jakarta',
      clockingMethod: input.clockingMethod ?? 'biometric',
      isActive: true,
    };

    setCatalog((current) => (current ? { ...current, locations: [...current.locations, location] } : current));
    setOverview((current) => {
      if (!current) return current;
      const nextLocations = [
        ...current.locations,
        {
          ...location,
          employeeCount: 0,
        },
      ];

      return {
        ...current,
        headquarters: current.locations.length === 0 ? location.name : current.headquarters,
        activeLocations: current.activeLocations + 1,
        locations: nextLocations,
        structure: current.structure.map((node, index) => (
          index === 0 && current.locations.length === 0
            ? { ...node, detail: location.name }
            : node
        )),
      };
    });
  };

  const createLocalPlant = (input: {
    locationId: string;
    name: string;
    code: string;
    managerId?: string | null;
  }) => {
    const location = catalog?.locations.find((item) => item.id === input.locationId);
    if (!location) {
      throw new Error(`Location ${input.locationId} not found in local catalog`);
    }

    const plant = {
      id: createMockId('mock-plant'),
      name: input.name,
      code: input.code,
      locationId: location.id,
      locationName: location.name,
      managerId: input.managerId ?? null,
      managerName: input.managerId?.trim() ? input.managerId.trim() : 'Unassigned',
      isActive: true,
    };

    setCatalog((current) => (current ? { ...current, plants: [...current.plants, plant] } : current));
    setOverview((current) => {
      if (!current) return current;
      return {
        ...current,
        plants: current.plants + 1,
        leaders: current.leaders + (input.managerId?.trim() ? 1 : 0),
        plantMap: [
          ...current.plantMap,
          {
            id: plant.id,
            name: plant.name,
            code: plant.code,
            locationId: plant.locationId,
            locationName: plant.locationName,
            manager: plant.managerName,
            employeeCount: 0,
          },
        ],
        structure: current.structure.map((node) => (
          node.title === 'Plants'
            ? { ...node, detail: `${current.plants + 1} active plants` }
            : node
        )),
      };
    });
  };

  const createLocalDepartment = (input: {
    locationId: string;
    name: string;
    code: string;
    managerId?: string | null;
  }) => {
    const location = catalog?.locations.find((item) => item.id === input.locationId);
    if (!location) {
      throw new Error(`Location ${input.locationId} not found in local catalog`);
    }

    const department = {
      id: createMockId('mock-dept'),
      name: input.name,
      code: input.code,
      locationId: location.id,
      locationName: location.name,
      managerId: input.managerId ?? null,
      managerName: input.managerId?.trim() ? input.managerId.trim() : 'Unassigned',
      isActive: true,
    };

    setCatalog((current) => (current ? { ...current, departments: [...current.departments, department] } : current));
    setOverview((current) => {
      if (!current) return current;
      return {
        ...current,
        departments: current.departments + 1,
        leaders: current.leaders + (input.managerId?.trim() ? 1 : 0),
        departmentMap: [
          ...current.departmentMap,
          {
            id: department.id,
            name: department.name,
            code: department.code,
            locationId: department.locationId,
            locationName: department.locationName,
            manager: department.managerName,
            employeeCount: 0,
          },
        ],
      };
    });
  };

  const createLocalTeam = (input: {
    departmentId: string;
    name: string;
    leadId?: string | null;
  }) => {
    const department = catalog?.departments.find((item) => item.id === input.departmentId);
    if (!department) {
      throw new Error(`Department ${input.departmentId} not found in local catalog`);
    }

    const team = {
      id: createMockId('mock-team'),
      name: input.name,
      departmentId: department.id,
      departmentName: department.name,
      leadId: input.leadId ?? null,
      leadName: input.leadId?.trim() ? input.leadId.trim() : 'Unassigned',
      isActive: true,
    };

    setCatalog((current) => (current ? { ...current, teams: [...current.teams, team] } : current));
    setOverview((current) => {
      if (!current) return current;
      return {
        ...current,
        leaders: current.leaders + (input.leadId?.trim() ? 1 : 0),
      };
    });
  };

  if (loading && !overview && !catalog) {
    return (
      <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading organization setup...</div>
        </div>
      </div>
    );
  }

  if (!overview || !catalog) {
    return (
      <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      {!isLiveSession && allowMockFallback && (
        <div
          role="status"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(14,165,233,0.08)',
            border: '1px solid rgba(14,165,233,0.22)',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        >
          Local demo mode is active. Organization creates will be saved in memory until you sign in with a live HR session.
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.22)',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        className="aurora-card aurora-card-padding aurora-card-lift"
        style={{ background: 'linear-gradient(135deg, rgba(232,49,122,0.08), rgba(139,92,246,0.08))' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240 }}>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 8 }}>
              {copy.heroLabel}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)' }}>{overview.companyName}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>
              {copy.legalName}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <Badge label={`HQ: ${overview.headquarters}`} tone="accent" />
              <Badge label={`${overview.totalEmployees} employees`} tone="violet" />
              <Badge label={overview.legalName} tone="ghost" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))', gap: 10, flex: 1 }}>
            {[
              { label: copy.stats.totalEmployees, value: overview.totalEmployees },
              { label: copy.stats.locations, value: overview.activeLocations },
              { label: copy.stats.departments, value: overview.departments },
              { label: copy.stats.leaders, value: overview.leaders },
            ].map((item) => (
              <div key={item.label} className="aurora-card" style={{ padding: 14, background: 'rgba(255,255,255,0.55)', boxShadow: 'none' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', marginTop: 6 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-dual-grid">
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.locations} subtitle={`${overview.headquarters} and branch sites`} />
          {overview.locations.length === 0 ? (
            <EmptyState title="No locations yet" detail="Create the first office, plant, or hub to start organizing the tenant." />
          ) : (
            <div className="aurora-screen-stack" style={{ gap: 12 }}>
              {overview.locations.map((location, index) => (
                <div
                  key={location.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: index < overview.locations.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Avatar initials={location.code.slice(0, 2).toUpperCase()} color={index % 2 === 0 ? '#e8317a' : '#8b5cf6'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{location.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {location.code} {location.country} {location.timezone ? `- ${location.timezone}` : ''}
                    </div>
                  </div>
                  <Badge label={`${location.employeeCount} ${copy.labels.employees}`} tone="ghost" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.departments} subtitle={`${overview.departments} active departments`} />
          {overview.departmentMap.length === 0 ? (
            <EmptyState title="No departments yet" detail="Add a location first, then attach departments to it." />
          ) : (
            <div className="aurora-screen-stack" style={{ gap: 11 }}>
              {overview.departmentMap.map((department, index) => (
                <div key={department.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{department.name}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{department.code}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, 25 + department.employeeCount / 4)}%`,
                        background: index % 2 === 0 ? '#e8317a' : '#8b5cf6',
                        borderRadius: 10,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <span>
                      {copy.labels.manager}: {department.manager}
                    </span>
                    <span>
                      {department.locationName}
                    </span>
                  </div>
                  {index < overview.departmentMap.length - 1 && <div style={{ marginTop: 11, borderTop: '1px solid var(--border)' }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.structure} subtitle={overview.headquarters} />
        <div className="aurora-screen-stack" style={{ gap: 10 }}>
          {overview.structure.map((node) => (
            <div key={node.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${node.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="building" size={18} color={node.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{node.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{node.detail}</div>
              </div>
              <Badge label={copy.labels.headquarters} tone="accent" />
            </div>
          ))}
        </div>
      </div>

      <LocationPanel
        locations={catalog.locations}
        canMutate={canMutate}
        onCreate={async (input) => {
          if (isLiveSession) {
            await createOrganizationLocation(input);
            await loadData();
            return;
          }
          createLocalLocation(input);
        }}
      />

      <PlantPanel
        plants={catalog.plants}
        locations={catalog.locations}
        canMutate={canMutate}
        onCreate={async (input) => {
          if (isLiveSession) {
            await createOrganizationPlant(input);
            await loadData();
            return;
          }
          createLocalPlant(input);
        }}
      />

      <DepartmentPanel
        departments={catalog.departments}
        locations={catalog.locations}
        canMutate={canMutate}
        onCreate={async (input) => {
          if (isLiveSession) {
            await createOrganizationDepartment(input);
            await loadData();
            return;
          }
          createLocalDepartment(input);
        }}
      />

      <TeamPanel
        teams={catalog.teams}
        departments={catalog.departments}
        canMutate={canMutate}
        onCreate={async (input) => {
          if (isLiveSession) {
            await createOrganizationTeam(input);
            await loadData();
            return;
          }
          createLocalTeam(input);
        }}
      />

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}

function LocationPanel({
  locations,
  canMutate,
  onCreate,
}: {
  locations: readonly OrganizationCatalogLocation[];
  canMutate: boolean;
  onCreate: (input: {
    name: string;
    code: string;
    country?: string;
    timezone?: string;
    stateProvince?: string | null;
    address?: string | null;
    clockingMethod?: 'biometric' | 'qr' | 'kiosk' | 'gps' | 'manual';
  }) => Promise<void>;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LocationForm>(DEFAULT_LOCATION_FORM);

  const submit = async () => {
    if (!canMutate || saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Location name and code are required.');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        country: form.country.trim() || 'Indonesia',
        timezone: form.timezone.trim() || 'Asia/Jakarta',
        stateProvince: form.stateProvince.trim() || null,
        address: form.address.trim() || null,
        clockingMethod: form.clockingMethod,
      });
      setShowDialog(false);
      setForm(DEFAULT_LOCATION_FORM);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title="Locations"
        subtitle="Create plants, offices, or hubs for the tenant."
        action={
          <Button variant="primary" size="sm" onClick={() => setShowDialog(true)} disabled={!canMutate}>
            <Icon name="plus" size={13} color="currentColor" />
            Add Location
          </Button>
        }
      />
      {error && <InlineAlert text={error} />}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Code', 'Country', 'Timezone', 'Clocking', 'Status'].map((heading) => (
                <th key={heading} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '18px 10px' }}>
                  <EmptyState title="No locations created" detail="Add the first location to unlock department and team setup." compact />
                </td>
              </tr>
            ) : (
              locations.map((location, index) => (
                <tr key={location.id} style={{ borderBottom: index < locations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 600 }}>{location.name}</td>
                  <td style={{ padding: '10px 10px' }}><code>{location.code}</code></td>
                  <td style={{ padding: '10px 10px' }}>{location.country}</td>
                  <td style={{ padding: '10px 10px' }}>{location.timezone}</td>
                  <td style={{ padding: '10px 10px' }}>{location.clockingMethod}</td>
                  <td style={{ padding: '10px 10px' }}><Badge label={location.isActive ? 'Active' : 'Inactive'} tone={location.isActive ? 'success' : 'danger'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <DialogShell title="Add Location" subtitle="Create a location that can be used for attendance and employee placement." onClose={() => setShowDialog(false)}>
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <Grid2>
              <TextField label="Location name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Head Office" />
              <TextField label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value.toUpperCase() }))} placeholder="HO" />
            </Grid2>
            <Grid2>
              <TextField label="Country" value={form.country} onChange={(value) => setForm((current) => ({ ...current, country: value }))} placeholder="Indonesia" />
              <TextField label="Timezone" value={form.timezone} onChange={(value) => setForm((current) => ({ ...current, timezone: value }))} placeholder="Asia/Jakarta" />
            </Grid2>
            <Grid2>
              <TextField label="State / Province" value={form.stateProvince} onChange={(value) => setForm((current) => ({ ...current, stateProvince: value }))} placeholder="DKI Jakarta" />
              <SelectField
                label="Clocking method"
                value={form.clockingMethod}
                onChange={(value) => setForm((current) => ({ ...current, clockingMethod: value as LocationForm['clockingMethod'] }))}
                options={[
                  'biometric',
                  'qr',
                  'kiosk',
                  'gps',
                  'manual',
                ]}
              />
            </Grid2>
            <TextField label="Address" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} placeholder="Jl. Merdeka No. 1" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void submit()} disabled={saving}>Save Location</Button>
            </div>
          </div>
        </DialogShell>
      )}
    </div>
  );
}

function PlantPanel({
  plants,
  locations,
  canMutate,
  onCreate,
}: {
  plants: readonly OrganizationCatalogPlant[];
  locations: readonly OrganizationCatalogLocation[];
  canMutate: boolean;
  onCreate: (input: {
    locationId: string;
    name: string;
    code: string;
    managerId?: string | null;
  }) => Promise<void>;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PlantForm>(DEFAULT_PLANT_FORM);

  const submit = async () => {
    if (!canMutate || saving) return;
    if (!form.name.trim() || !form.code.trim() || !form.locationId) {
      setError('Plant name, code, and location are required.');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        locationId: form.locationId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        managerId: form.managerId.trim() || null,
      });
      setShowDialog(false);
      setForm(DEFAULT_PLANT_FORM);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title="Plants"
        subtitle={locations.length === 0 ? 'Create a location first, then add plants underneath it.' : 'Operational sites inside each location or branch.'}
        action={
          <Button variant="primary" size="sm" onClick={() => setShowDialog(true)} disabled={!canMutate || locations.length === 0}>
            <Icon name="plus" size={13} color="currentColor" />
            Add Plant
          </Button>
        }
      />
      {error && <InlineAlert text={error} />}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Code', 'Location', 'Manager', 'Status'].map((heading) => (
                <th key={heading} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plants.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '18px 10px' }}>
                  <EmptyState title="No plants created" detail="Create the first plant to model the real branch or production site." compact />
                </td>
              </tr>
            ) : (
              plants.map((plant, index) => (
                <tr key={plant.id} style={{ borderBottom: index < plants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 600 }}>{plant.name}</td>
                  <td style={{ padding: '10px 10px' }}><code>{plant.code}</code></td>
                  <td style={{ padding: '10px 10px' }}>{plant.locationName}</td>
                  <td style={{ padding: '10px 10px' }}>{plant.managerName}</td>
                  <td style={{ padding: '10px 10px' }}><Badge label={plant.isActive ? 'Active' : 'Inactive'} tone={plant.isActive ? 'success' : 'danger'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <DialogShell title="Add Plant" subtitle="Create a plant and attach it to a location." onClose={() => setShowDialog(false)}>
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <Grid2>
              <TextField label="Plant name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Jakarta Plant A" />
              <TextField label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value.toUpperCase() }))} placeholder="JKT-PLT-A" />
            </Grid2>
            <Grid2>
              <SelectField
                label="Location"
                value={form.locationId}
                onChange={(value) => setForm((current) => ({ ...current, locationId: value }))}
                options={locations.map((location) => location.id)}
                labels={locations.reduce<Record<string, string>>((acc, location) => {
                  acc[location.id] = `${location.name} (${location.code})`;
                  return acc;
                }, {})}
              />
              <TextField label="Manager ID (optional)" value={form.managerId} onChange={(value) => setForm((current) => ({ ...current, managerId: value }))} placeholder="user UUID" />
            </Grid2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void submit()} disabled={saving || locations.length === 0}>Save Plant</Button>
            </div>
          </div>
        </DialogShell>
      )}
    </div>
  );
}

function DepartmentPanel({
  departments,
  locations,
  canMutate,
  onCreate,
}: {
  departments: readonly OrganizationCatalogDepartment[];
  locations: readonly OrganizationCatalogLocation[];
  canMutate: boolean;
  onCreate: (input: {
    locationId: string;
    name: string;
    code: string;
    managerId?: string | null;
  }) => Promise<void>;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DepartmentForm>(DEFAULT_DEPARTMENT_FORM);

  const submit = async () => {
    if (!canMutate || saving) return;
    if (!form.name.trim() || !form.code.trim() || !form.locationId) {
      setError('Department name, code, and location are required.');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        locationId: form.locationId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        managerId: form.managerId.trim() || null,
      });
      setShowDialog(false);
      setForm(DEFAULT_DEPARTMENT_FORM);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title="Departments"
        subtitle={locations.length === 0 ? 'Create a location first, then attach departments.' : 'Map each department to a location.'}
        action={
          <Button variant="primary" size="sm" onClick={() => setShowDialog(true)} disabled={!canMutate || locations.length === 0}>
            <Icon name="plus" size={13} color="currentColor" />
            Add Department
          </Button>
        }
      />
      {error && <InlineAlert text={error} />}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Code', 'Location', 'Manager', 'Status'].map((heading) => (
                <th key={heading} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '18px 10px' }}>
                  <EmptyState title="No departments created" detail="Create a location first, then assign departments to that site." compact />
                </td>
              </tr>
            ) : (
              departments.map((department, index) => (
                <tr key={department.id} style={{ borderBottom: index < departments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 600 }}>{department.name}</td>
                  <td style={{ padding: '10px 10px' }}><code>{department.code}</code></td>
                  <td style={{ padding: '10px 10px' }}>{department.locationName}</td>
                  <td style={{ padding: '10px 10px' }}>{department.managerName}</td>
                  <td style={{ padding: '10px 10px' }}><Badge label={department.isActive ? 'Active' : 'Inactive'} tone={department.isActive ? 'success' : 'danger'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <DialogShell title="Add Department" subtitle="Create a department and attach it to a location." onClose={() => setShowDialog(false)}>
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <Grid2>
              <TextField label="Department name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Engineering" />
              <TextField label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value.toUpperCase() }))} placeholder="ENG" />
            </Grid2>
            <Grid2>
              <SelectField
                label="Location"
                value={form.locationId}
                onChange={(value) => setForm((current) => ({ ...current, locationId: value }))}
                options={locations.map((location) => location.id)}
                labels={locations.reduce<Record<string, string>>((acc, location) => {
                  acc[location.id] = `${location.name} (${location.code})`;
                  return acc;
                }, {})}
              />
              <TextField label="Manager ID (optional)" value={form.managerId} onChange={(value) => setForm((current) => ({ ...current, managerId: value }))} placeholder="user UUID" />
            </Grid2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void submit()} disabled={saving || locations.length === 0}>Save Department</Button>
            </div>
          </div>
        </DialogShell>
      )}
    </div>
  );
}

function TeamPanel({
  teams,
  departments,
  canMutate,
  onCreate,
}: {
  teams: readonly OrganizationCatalogTeam[];
  departments: readonly OrganizationCatalogDepartment[];
  canMutate: boolean;
  onCreate: (input: {
    departmentId: string;
    name: string;
    leadId?: string | null;
  }) => Promise<void>;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TeamForm>(DEFAULT_TEAM_FORM);

  const submit = async () => {
    if (!canMutate || saving) return;
    if (!form.name.trim() || !form.departmentId) {
      setError('Team name and department are required.');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        departmentId: form.departmentId,
        name: form.name.trim(),
        leadId: form.leadId.trim() || null,
      });
      setShowDialog(false);
      setForm(DEFAULT_TEAM_FORM);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title="Teams"
        subtitle={departments.length === 0 ? 'Create a department first, then add teams inside it.' : 'Optional working groups inside departments.'}
        action={
          <Button variant="primary" size="sm" onClick={() => setShowDialog(true)} disabled={!canMutate || departments.length === 0}>
            <Icon name="plus" size={13} color="currentColor" />
            Add Team
          </Button>
        }
      />
      {error && <InlineAlert text={error} />}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Department', 'Lead', 'Status'].map((heading) => (
                <th key={heading} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '18px 10px' }}>
                  <EmptyState title="No teams created" detail="Create a department first, then add teams inside it." compact />
                </td>
              </tr>
            ) : (
              teams.map((team, index) => (
                <tr key={team.id} style={{ borderBottom: index < teams.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 10px', fontWeight: 600 }}>{team.name}</td>
                  <td style={{ padding: '10px 10px' }}>{team.departmentName}</td>
                  <td style={{ padding: '10px 10px' }}>{team.leadName}</td>
                  <td style={{ padding: '10px 10px' }}><Badge label={team.isActive ? 'Active' : 'Inactive'} tone={team.isActive ? 'success' : 'danger'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <DialogShell title="Add Team" subtitle="Create a team under a department." onClose={() => setShowDialog(false)}>
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <TextField label="Team name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Platform Team" />
            <Grid2>
              <SelectField
                label="Department"
                value={form.departmentId}
                onChange={(value) => setForm((current) => ({ ...current, departmentId: value }))}
                options={departments.map((department) => department.id)}
                labels={departments.reduce<Record<string, string>>((acc, department) => {
                  acc[department.id] = `${department.name} (${department.code})`;
                  return acc;
                }, {})}
              />
              <TextField label="Lead ID (optional)" value={form.leadId} onChange={(value) => setForm((current) => ({ ...current, leadId: value }))} placeholder="user UUID" />
            </Grid2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void submit()} disabled={saving || departments.length === 0}>Save Team</Button>
            </div>
          </div>
        </DialogShell>
      )}
    </div>
  );
}

function DialogShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
        overscrollBehavior: 'contain',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="aurora-card aurora-card-padding"
        style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4, fontSize: 12 }}>{subtitle}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
            <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}

function InlineAlert({ text }: { text: string }) {
  return (
    <div
      role="alert"
      style={{
        marginBottom: 12,
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.22)',
        color: 'var(--text-primary)',
        fontSize: 12.5,
      }}
    >
      {text}
    </div>
  );
}

function EmptyState({
  title,
  detail,
  compact = false,
}: {
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        padding: compact ? '0' : '18px 16px',
        borderRadius: 12,
        border: compact ? 'none' : '1px dashed var(--border)',
        background: compact ? 'transparent' : 'rgba(255,255,255,0.35)',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontSize: compact ? 12.5 : 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

function Grid2({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span className="aurora-card-subtitle">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          color: 'var(--text-primary)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span className="aurora-card-subtitle">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          color: 'var(--text-primary)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
