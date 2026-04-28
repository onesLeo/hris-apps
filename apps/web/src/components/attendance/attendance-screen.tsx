'use client';

import { Badge, Avatar, Icon, SectionHeading } from '../aurora-primitives';
import { useLocale, getAttendanceCopy } from '../../i18n';
import { getAttendanceOverview } from './attendance-data';

const STATUS_TONE = {
  'On Time': 'success',
  Late: 'warning',
  Remote: 'violet',
} as const;

export function AttendanceScreen() {
  const { locale } = useLocale();
  const copy = getAttendanceCopy(locale);
  const overview = getAttendanceOverview();

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 260 }}>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 8 }}>
              {copy.heroLabel}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)' }}>{copy.heroTitle}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4, maxWidth: 420 }}>
              {copy.heroSubtitle}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <Badge label={overview.dateLabel} tone="accent" />
              <Badge label={`${overview.notes.length} ${copy.sections.policy}`} tone="violet" />
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
            <div className="aurora-card-subtitle" style={{ marginTop: 3, fontSize: 11 }}>{metric.delta}</div>
          </div>
        ))}
      </div>

      <div className="aurora-dual-grid">
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.roster} subtitle={overview.dateLabel} />
          <div className="aurora-screen-stack" style={{ gap: 10 }}>
            {overview.shifts.map((shift, index) => (
              <div
                key={shift.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: index < overview.shifts.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <Avatar initials={shift.initials} color={shift.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{shift.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shift.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{shift.start} - {shift.end}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{shift.location}</div>
                </div>
                <Badge label={shift.status === 'On Time' ? copy.labels.onTime : shift.status === 'Late' ? copy.labels.late : copy.labels.remote} tone={STATUS_TONE[shift.status]} />
              </div>
            ))}
          </div>
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.events} subtitle={copy.labels.clockIn} />
          <div className="aurora-screen-stack" style={{ gap: 10 }}>
            {overview.events.map((event, index) => (
              <div key={`${event.time}-${event.name}`} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: index < overview.events.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 42, flexShrink: 0, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{event.time}</div>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${event.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={event.action === 'Clock In' ? 'checkCircle' : event.action === 'Clock Out' ? 'logout' : 'clock'} size={18} color={event.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{event.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {event.action} · {event.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.policy} subtitle={copy.footer} />
        <div className="aurora-screen-stack" style={{ gap: 10 }}>
          {overview.notes.map((note) => (
            <div key={note} className="aurora-subtle-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="mapPin" size={15} color="var(--accent)" />
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}
