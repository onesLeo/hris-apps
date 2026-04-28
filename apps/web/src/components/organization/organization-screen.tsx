'use client';

import { Badge, Avatar, Icon, SectionHeading } from '../aurora-primitives';
import { useLocale, getOrganizationCopy } from '../../i18n';
import { getOrganizationOverview } from './organization-data';

export function OrganizationScreen() {
  const { locale } = useLocale();
  const copy = getOrganizationCopy(locale);
  const overview = getOrganizationOverview();

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
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
              <Badge label={overview.legalName} tone="violet" />
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
          <SectionHeading title={copy.sections.locations} subtitle={`${copy.labels.headquarters}: ${overview.headquarters}`} />
          <div className="aurora-screen-stack" style={{ gap: 12 }}>
            {overview.locations.map((location, index) => (
              <div
                key={location.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: index < overview.locations.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <Avatar initials={location.name.slice(0, 2).toUpperCase()} color={location.accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{location.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {location.city}, {location.country}
                  </div>
                </div>
                <Badge label={`${location.employeeCount} ${copy.labels.employees}`} tone="ghost" />
              </div>
            ))}
          </div>
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.departments} subtitle={`${overview.departmentMap.length} ${copy.stats.departments}`} />
          <div className="aurora-screen-stack" style={{ gap: 11 }}>
            {overview.departmentMap.map((department, index) => (
              <div key={department.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{department.name}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{department.employeeCount}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, 25 + department.employeeCount / 4)}%`,
                      background: department.accent,
                      borderRadius: 10,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span>
                    {copy.labels.manager}: {department.manager}
                  </span>
                  <span>
                    {copy.labels.employees}: {department.employeeCount}
                  </span>
                </div>
                {index < overview.departmentMap.length - 1 && <div style={{ marginTop: 11, borderTop: '1px solid var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.structure} subtitle={overview.legalName} />
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

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}
