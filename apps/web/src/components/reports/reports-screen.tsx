'use client';

import { Badge, Icon, SectionHeading } from '../aurora-primitives';
import { useLocale, getReportsCopy } from '../../i18n';
import { getReportsOverview } from './reports-data';

const STATUS_TONE = {
  Ready: 'success',
  Queued: 'warning',
  Delivered: 'accent',
} as const;

export function ReportsScreen() {
  const { locale } = useLocale();
  const copy = getReportsCopy(locale);
  const overview = getReportsOverview(locale);

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ background: 'linear-gradient(135deg, rgba(232,49,122,0.08), rgba(6,182,212,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 260 }}>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 8 }}>
              {copy.heroLabel}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)' }}>{copy.heroTitle}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4, maxWidth: 440 }}>
              {copy.heroSubtitle}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <Badge label={overview.periodLabel} tone="accent" />
              <Badge label={`${overview.catalog.length} ${copy.stats.snapshots}`} tone="violet" />
            </div>
          </div>
        </div>
      </div>

      <div className="aurora-kpi-grid">
        {overview.metrics.map((metric) => (
          <div key={metric.label} className="aurora-card aurora-card-padding aurora-card-lift">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${metric.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name={metric.icon} size={16} color={metric.accent} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px' }}>{metric.value}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{metric.label}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 3, fontSize: 11 }}>{metric.note}</div>
          </div>
        ))}
      </div>

      <div className="aurora-dual-grid">
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.catalog} subtitle={copy.heroSubtitle} />
          <div className="aurora-screen-stack" style={{ gap: 11 }}>
            {overview.catalog.map((item, index) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</span>
                  <Badge label={item.format} tone="ghost" />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>{item.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span>
                    {copy.labels.owner}: {item.owner}
                  </span>
                  <span>
                    {copy.labels.cadence}: {item.cadence}
                  </span>
                </div>
                {index < overview.catalog.length - 1 && <div style={{ marginTop: 11, borderTop: '1px solid var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.exports} subtitle={copy.labels.generated} />
          <div className="aurora-screen-stack" style={{ gap: 10 }}>
            {overview.exports.map((item, index) => (
              <div key={`${item.name}-${item.generatedAt}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: index < overview.exports.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="download" size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.format} {'·'} {item.generatedAt}
                  </div>
                </div>
                <Badge label={item.status} tone={STATUS_TONE[item.status]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.schedule} subtitle={copy.footer} />
        <div className="aurora-screen-stack" style={{ gap: 10 }}>
          {overview.scheduleNotes.map((note) => (
            <div key={note} className="aurora-subtle-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="clock" size={15} color="var(--accent)" />
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}
