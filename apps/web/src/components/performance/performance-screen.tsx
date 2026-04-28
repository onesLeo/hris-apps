'use client';

import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import { getPerformanceCopy, useLocale } from '../../i18n';
import { PerformanceCreateDialog } from './performance-create-dialog';
import { addPerformanceCycle, filterPerformanceReviews, getPerformanceOverview, PERFORMANCE_FILTERS, type CreatePerformanceCycleInput, type PerformanceFilter, type PerformanceStatus } from './performance-data';

const STATUS_TONE: Record<PerformanceStatus, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  Scheduled: 'violet',
  'In Review': 'info',
  Completed: 'success',
  Overdue: 'warning',
};

export function PerformanceScreen() {
  const { locale } = useLocale();
  const copy = getPerformanceCopy(locale);
  const overview = getPerformanceOverview();
  const [filter, setFilter] = useState<PerformanceFilter>('All');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cycles, setCycles] = useState(overview.reviewCycles);

  const filteredReviews = useMemo(
    () => filterPerformanceReviews(overview.teamReviews, filter, search),
    [filter, overview.teamReviews, search],
  );

  const stats = useMemo(() => {
    const completed = cycles.filter((cycle) => cycle.status === 'Completed').length;
    const inReview = cycles.filter((cycle) => cycle.status === 'In Review').length;
    const overdue = cycles.filter((cycle) => cycle.status === 'Overdue').length;

    return {
      cycles: cycles.length,
      completed,
      inReview,
      overdue,
    };
  }, [cycles]);

  const createCycle = (input: CreatePerformanceCycleInput) => {
    setCycles((current) => addPerformanceCycle(current, input));
  };

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(14,165,233,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 8 }}>
              {copy.sections.cycles}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.1px', color: 'var(--text-primary)' }}>{copy.heroLabel}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 5, maxWidth: 620 }}>
              {copy.summary}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))', gap: 10, flex: 1.1 }}>
            {[
              { label: copy.stats.cycles, value: stats.cycles },
              { label: copy.stats.completed, value: stats.completed },
              { label: copy.stats.inProgress, value: stats.inReview },
              { label: copy.stats.overdue, value: stats.overdue },
            ].map((item) => (
              <div key={item.label} className="aurora-card" style={{ padding: 14, background: 'rgba(255,255,255,0.6)', boxShadow: 'none' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.45px' }}>{item.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', marginTop: 6 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)', borderRadius: 12, padding: '9px 14px', border: '1px solid var(--border)', flex: 1, maxWidth: 340 }}>
          <Icon name="search" size={15} color="var(--text-muted)" strokeWidth={2} />
          <input
            value={search}
            onChange={(event) => setSearch((event.target as HTMLInputElement).value)}
            placeholder={copy.searchPlaceholder}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13, color: 'var(--text-primary)' }}
          />
        </div>

        <div className="aurora-pill-row">
          {PERFORMANCE_FILTERS.map((item) => (
            <button key={item} type="button" className={`aurora-pill ${filter === item ? 'is-active' : ''}`} onClick={() => setFilter(item)}>
              {copy.filters[item === 'In Review' ? 'inReview' : item.toLowerCase() as keyof typeof copy.filters]}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
            {copy.createCycle}
          </Button>
        </div>
      </div>

      <div className="aurora-dual-grid">
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.cycles} subtitle={copy.summary} />
          <div className="aurora-screen-stack" style={{ gap: 12 }}>
            {cycles.map((cycle) => (
              <div key={`${cycle.name}-${cycle.period}`} style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{cycle.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{cycle.period}</div>
                  </div>
                  <Badge label={cycle.status} tone={STATUS_TONE[cycle.status]} />
                </div>

                <div style={{ height: 7, background: 'rgba(0,0,0,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
                  <div style={{ height: '100%', width: `${cycle.completion}%`, background: cycle.accent, borderRadius: 999 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{cycle.participants} participants</span>
                  <span>{cycle.completion}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.goals} subtitle={copy.summary} />
          <div className="aurora-screen-stack" style={{ gap: 11 }}>
            {overview.goals.map((goal) => (
              <div key={goal.goal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{goal.goal}</span>
                  <Badge label={goal.status} tone={STATUS_TONE[goal.status]} />
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${goal.progress}%`, background: goal.accent, borderRadius: 10 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span>
                    {copy.labels.target}: {goal.target}
                  </span>
                  <span>{goal.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.team} subtitle={`${filteredReviews.length} ${copy.labels.status.toLowerCase()} reviews`} />
        <div className="aurora-table">
          <div className="aurora-table-head" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 1fr 1fr' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.employee}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.role}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.manager}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.score}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.progress}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.status}</span>
          </div>

          {filteredReviews.map((review) => (
            <div key={`${review.employee}-${review.role}`} className="aurora-table-row" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr 1fr 1fr' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar initials={review.initials} color={review.accent} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{review.employee}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{review.objective}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{review.role}</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{review.manager}</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{review.score}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${review.progress}%`, height: '100%', background: review.accent, borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{review.progress}%</span>
              </div>
              <Badge label={review.status} tone={STATUS_TONE[review.status]} />
            </div>
          ))}
        </div>
      </div>

      <PerformanceCreateDialog
        open={isCreateOpen}
        copy={copy}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={createCycle}
      />

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}
