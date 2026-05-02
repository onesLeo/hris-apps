'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import { getRecruitmentCopy, useLocale } from '../../i18n';
import { RecruitmentCreateDialog } from './recruitment-create-dialog';
import {
  createRequisitionRemote,
  filterRecruitmentCandidates,
  getRecruitmentOverview,
  getRecruitmentRequisitionKey,
  loadCandidates,
  loadRequisitions,
  PIPELINE_ORDER,
  RECRUITMENT_FILTERS,
  removeRecruitmentRequisition,
  updateRequisitionRemote,
  type CreateRequisitionInput,
  type RecruitmentFilter,
  type RecruitmentRequisitionKey,
  type RecruitmentStage,
} from './recruitment-data';

const BADGE_TONE: Record<RecruitmentStage, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  Sourcing: 'accent',
  Screening: 'violet',
  Interview: 'info',
  Offer: 'success',
};

const PRIORITY_TONE: Record<'High' | 'Medium' | 'Low', 'danger' | 'warning' | 'ghost'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'ghost',
};

export function RecruitmentScreen() {
  const { locale } = useLocale();
  const copy = getRecruitmentCopy(locale);
  const overview = getRecruitmentOverview();
  const allowMockFallback = process.env.NODE_ENV !== 'production';
  const [filter, setFilter] = useState<RecruitmentFilter>('All');
  const [search, setSearch] = useState('');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingKey, setEditingKey] = useState<RecruitmentRequisitionKey | null>(null);
  const [requisitions, setRequisitions] = useState(overview.requisitions);
  const [candidates, setCandidates] = useState(overview.candidates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data from API on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [reqs, cands] = await Promise.all([loadRequisitions(), loadCandidates()]);
        if (!cancelled) {
          setRequisitions(reqs);
          setCandidates(cands);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load live recruitment data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredCandidates = useMemo(
    () => filterRecruitmentCandidates(candidates, filter, search),
    [filter, candidates, search],
  );

  const openRolesCount = requisitions.length;
  const editingRequisition = editingKey ? requisitions.find((item) => getRecruitmentRequisitionKey(item) === editingKey) : undefined;
  const dialogInitialRequisition = dialogMode === 'edit' ? editingRequisition : undefined;

  const openCreateDialog = () => {
    setEditingKey(null);
    setDialogMode('create');
  };

  const openEditDialog = (requisition: (typeof requisitions)[number]) => {
    setEditingKey(getRecruitmentRequisitionKey(requisition));
    setDialogMode('edit');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingKey(null);
  };

  const submitDialog = async (input: CreateRequisitionInput) => {
    if (dialogMode === 'edit' && editingKey) {
      try {
        const updated = await updateRequisitionRemote(editingKey, input, editingRequisition?.stage);
        setRequisitions((current) =>
          current.map((item) => (getRecruitmentRequisitionKey(item) === editingKey ? updated : item)),
        );
        closeDialog();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update the requisition.');
      }
      return;
    }

    try {
      const created = await createRequisitionRemote(input);
      setRequisitions((current) => [created, ...current]);
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the requisition.');
    }
  };

  const deleteRequisition = (requisition: (typeof requisitions)[number]) => {
    const confirmed = window.confirm(copy.deleteConfirm);
    if (!confirmed) {
      return;
    }

    if (!allowMockFallback) {
      setError('Deleting requisitions requires a live recruitment API.');
      return;
    }

    setRequisitions((current) => removeRecruitmentRequisition(current, getRecruitmentRequisitionKey(requisition)));
  };

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ background: 'linear-gradient(135deg, rgba(232,49,122,0.08), rgba(14,165,233,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 8 }}>
              {copy.sections.pipeline}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.1px', color: 'var(--text-primary)' }}>{copy.heroLabel}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 5, maxWidth: 620 }}>
              {copy.summary}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))', gap: 10, flex: 1.1 }}>
            {[
              { label: copy.stats.openRoles, value: openRolesCount },
              { label: copy.stats.candidates, value: overview.activeCandidates },
              { label: copy.stats.interviews, value: overview.interviewsThisWeek },
              { label: copy.stats.offers, value: overview.offersOut },
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
          {RECRUITMENT_FILTERS.map((item) => (
            <button key={item} type="button" className={`aurora-pill ${filter === item ? 'is-active' : ''}`} onClick={() => setFilter(item)}>
              {copy.filters[item.toLowerCase() as keyof typeof copy.filters]}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" onClick={openCreateDialog}>
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
            {copy.createRequisition}
          </Button>
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: '11px 14px',
            borderRadius: 14,
            background: 'rgba(14,165,233,0.08)',
            border: '1px solid rgba(14,165,233,0.18)',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Loading live recruitment data...
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

      <div className="aurora-dual-grid">
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.roles} subtitle={`${requisitions.length} ${copy.stats.openRoles.toLowerCase()}`} />
          <div className="aurora-screen-stack" style={{ gap: 12 }}>
            {requisitions.map((role) => {
              const roleKey = getRecruitmentRequisitionKey(role);

              return (
                <div key={roleKey} style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{role.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {copy.labels.department}: {role.department} · {copy.labels.location}: {role.location}
                      </div>
                    </div>
                    <Badge label={role.priority} tone={PRIORITY_TONE[role.priority]} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <Badge label={`${role.openings} ${copy.labels.openings}`} tone="ghost" />
                    <Badge label={role.stage} tone={BADGE_TONE[role.stage]} />
                    <Badge label={role.recruiter} tone="accent" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => openEditDialog(role)}
                      className="aurora-icon-swatch"
                      aria-label={copy.editRequisitionTitle}
                    >
                      <Icon name="edit" size={14} color="var(--text-muted)" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRequisition(role)}
                      className="aurora-icon-swatch"
                      aria-label={copy.deleteRequisition}
                    >
                      <Icon name="trash" size={14} color="var(--text-muted)" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <SectionHeading title={copy.sections.pipeline} subtitle={copy.summary} />
          <div className="aurora-screen-stack" style={{ gap: 11 }}>
            {PIPELINE_ORDER.map((stage) => {
              const item = overview.pipeline.find((entry) => entry.stage === stage)!;
              return (
                <div key={stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{copy.filters[stage.toLowerCase() as keyof typeof copy.filters]}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{item.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, 25 + item.count * 2)}%`,
                        background: item.accent,
                        borderRadius: 10,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={copy.sections.candidates} subtitle={`${filteredCandidates.length} ${copy.stats.candidates}`} />
        <div className="aurora-table">
          <div className="aurora-table-head" style={{ gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1.2fr 1fr' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candidate</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.source}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stage</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.nextStep}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{copy.labels.recruiter}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
          </div>

          {filteredCandidates.map((candidate) => (
            <div key={`${candidate.name}-${candidate.role}`} className="aurora-table-row" style={{ gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1.2fr 1fr' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar initials={candidate.initials} color={candidate.accent} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{candidate.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{candidate.role}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{candidate.source}</span>
              <Badge label={candidate.stage} tone={BADGE_TONE[candidate.stage]} />
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{candidate.nextStep}</span>
              <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{candidate.recruiter}</span>
              <div className="aurora-row-actions">
                <div className="aurora-icon-swatch">
                  <Icon name="eye" size={14} color="var(--text-muted)" strokeWidth={1.8} />
                </div>
                <div className="aurora-icon-swatch">
                  <Icon name="dotsH" size={14} color="var(--text-muted)" strokeWidth={1.8} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RecruitmentCreateDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        copy={copy}
        initialRequisition={dialogInitialRequisition}
        onClose={closeDialog}
        onSubmit={submitDialog}
      />

      <div className="aurora-footer-note">{copy.footer}</div>
    </div>
  );
}
