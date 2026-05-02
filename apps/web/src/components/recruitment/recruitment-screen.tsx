'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import { WorkflowTimeline } from '../approval/workflow-timeline';
import { getRecruitmentCopy, useLocale } from '../../i18n';
import { RecruitmentCreateDialog } from './recruitment-create-dialog';
import {
  createRequisitionRemote,
  filterRecruitmentCandidates,
  getRecruitmentOverview,
  getRecruitmentRequisitionKey,
  loadCandidates,
  loadRequisitionDetail,
  loadRequisitions,
  PIPELINE_ORDER,
  RECRUITMENT_FILTERS,
  removeRecruitmentRequisition,
  updateRequisitionRemote,
  type CreateRequisitionInput,
  type RecruitmentFilter,
  type RecruitmentRequisitionKey,
  type RecruitmentRequisitionDetail,
  type RecruitmentStage,
} from './recruitment-data';
import { acceptOffer, fetchOffers, type OfferResponse } from './recruitment-api';

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

const REQUISITION_STATUS_TONE: Record<string, 'accent' | 'warning' | 'success' | 'info' | 'danger' | 'ghost'> = {
  draft: 'ghost',
  pending_approval: 'warning',
  open: 'success',
  on_hold: 'info',
  closed: 'accent',
  cancelled: 'danger',
};

const APPLICATION_STAGE_TONE: Record<string, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  applied: 'ghost',
  screening: 'info',
  interviewing: 'violet',
  offered: 'warning',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'ghost',
};

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function RecruitmentScreen() {
  const { locale } = useLocale();
  const copy = getRecruitmentCopy(locale);
  const overview = getRecruitmentOverview();
  const allowMockFallback = process.env.NODE_ENV !== 'production';
  const [filter, setFilter] = useState<RecruitmentFilter>('All');
  const [search, setSearch] = useState('');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingKey, setEditingKey] = useState<RecruitmentRequisitionKey | null>(null);
  const [selectedRequisitionKey, setSelectedRequisitionKey] = useState<RecruitmentRequisitionKey | null>(null);
  const [requisitions, setRequisitions] = useState(overview.requisitions);
  const [candidates, setCandidates] = useState(overview.candidates);
  const [detail, setDetail] = useState<RecruitmentRequisitionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offersByApplicationId, setOffersByApplicationId] = useState<Record<string, OfferResponse[]>>({});
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

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
          setSelectedRequisitionKey((current) => {
            if (reqs.length === 0) {
              return null;
            }

            if (current && reqs.some((item) => getRecruitmentRequisitionKey(item) === current)) {
              return current;
            }

            return getRecruitmentRequisitionKey(reqs[0]!);
          });
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

  useEffect(() => {
    if (!selectedRequisitionKey && requisitions.length > 0) {
      setSelectedRequisitionKey(getRecruitmentRequisitionKey(requisitions[0]!));
    }
  }, [selectedRequisitionKey, requisitions]);

  useEffect(() => {
    if (!selectedRequisitionKey) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    const selectedRequisition = requisitions.find((item) => getRecruitmentRequisitionKey(item) === selectedRequisitionKey);
    if (!selectedRequisition) {
      setDetail(null);
      setDetailError('Select a requisition to view the full detail.');
      return;
    }

    const requisition = selectedRequisition;

    const requisitionId = requisition.id ?? '';

    if (!requisitionId) {
      setDetail({ requisition, applications: [] });
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const next = await loadRequisitionDetail(requisitionId);
        if (!cancelled) {
          setDetail(next);
          // Fetch offers for any application at the offered stage
          const offeredApps = next.applications.filter((a) => a.stage === 'offered');
          if (offeredApps.length > 0) {
            const offerResults = await Promise.allSettled(
              offeredApps.map((a) => fetchOffers(a.id).then((offers) => ({ id: a.id, offers }))),
            );
            if (!cancelled) {
              const map: Record<string, OfferResponse[]> = {};
              for (const result of offerResults) {
                if (result.status === 'fulfilled') {
                  map[result.value.id] = result.value.offers;
                }
              }
              setOffersByApplicationId(map);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : 'Failed to load requisition detail.');
          setDetail({ requisition, applications: [] });
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [selectedRequisitionKey, requisitions]);

  const filteredCandidates = useMemo(
    () => filterRecruitmentCandidates(candidates, filter, search),
    [filter, candidates, search],
  );

  const candidateNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const candidate of candidates) {
      if (candidate.id) {
        map.set(candidate.id, candidate.name);
      }
    }
    return map;
  }, [candidates]);

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

  const selectRequisition = (requisition: (typeof requisitions)[number]) => {
    setSelectedRequisitionKey(getRecruitmentRequisitionKey(requisition));
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
      setSelectedRequisitionKey(getRecruitmentRequisitionKey(created));
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

  const handleAcceptOffer = async (applicationId: string, offerId: string) => {
    setAcceptingOfferId(offerId);
    try {
      const updated = await acceptOffer(offerId);
      setOffersByApplicationId((current) => ({
        ...current,
        [applicationId]: (current[applicationId] ?? []).map((o) => (o.id === offerId ? updated : o)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer.');
    } finally {
      setAcceptingOfferId(null);
    }
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
              const isSelected = roleKey === selectedRequisitionKey;

              return (
                <div
                  key={roleKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectRequisition(role)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectRequisition(role);
                    }
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: isSelected ? '1px solid rgba(14,165,233,0.45)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.55)',
                    boxShadow: isSelected ? '0 0 0 1px rgba(14,165,233,0.12) inset' : 'none',
                    cursor: 'pointer',
                  }}
                >
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
                    <Badge label={humanize(role.status ?? 'draft')} tone={REQUISITION_STATUS_TONE[role.status ?? 'draft'] ?? 'ghost'} />
                    <Badge label={role.recruiter} tone="accent" />
                    {role.workflowInstanceId ? <Badge label="Approval linked" tone="info" /> : <Badge label="Draft" tone="ghost" />}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditDialog(role);
                      }}
                      className="aurora-icon-swatch"
                      aria-label={copy.editRequisitionTitle}
                    >
                      <Icon name="edit" size={14} color="var(--text-muted)" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteRequisition(role);
                      }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <SectionHeading
              title="Requisition detail"
              subtitle={selectedRequisitionKey ? 'Selected role, approval trail, and linked applications' : 'Choose a requisition to inspect the full hiring record'}
            />
          </div>
          {detail?.requisition && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge label={humanize(detail.requisition.status ?? 'draft')} tone={REQUISITION_STATUS_TONE[detail.requisition.status ?? 'draft'] ?? 'ghost'} />
              <Badge label={detail.requisition.priority} tone={PRIORITY_TONE[detail.requisition.priority]} />
              {detail.requisition.workflowInstanceId ? <Badge label="Workflow active" tone="info" /> : <Badge label="Workflow not started" tone="ghost" />}
            </div>
          )}
        </div>

        {detailLoading && (
          <div style={{ marginTop: 14, padding: '11px 14px', borderRadius: 14, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading requisition detail...
          </div>
        )}

        {detailError && (
          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: 'var(--text-primary)', fontSize: 13 }}>
            {detailError}
          </div>
        )}

        {detail?.requisition && (
          <div className="aurora-dual-grid" style={{ marginTop: 14, gridTemplateColumns: '1.15fr 0.85fr' }}>
            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              <div style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{detail.requisition.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  {detail.requisition.department} · {detail.requisition.location}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>Hiring manager</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                      {detail.requisition.recruiter}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>Headcount</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                      {detail.requisition.openings}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                      {humanize(detail.requisition.status ?? 'draft')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>Priority</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                      {detail.requisition.priority}
                    </div>
                  </div>
                </div>

                {detail.requisition.description && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>Description</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-primary)', marginTop: 5 }}>
                      {detail.requisition.description}
                    </div>
                  </div>
                )}

                {detail.requisition.requirements && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>Requirements</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-primary)', marginTop: 5, whiteSpace: 'pre-wrap' }}>
                      {detail.requisition.requirements}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Linked applications</div>
                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                  {detail.applications.length === 0 ? (
                    <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      No applications have been linked yet.
                    </div>
                  ) : detail.applications.map((application) => {
                    const candidateName = candidateNameById.get(application.candidateId) ?? application.candidateId;
                    const tone = APPLICATION_STAGE_TONE[application.stage] ?? 'ghost';
                    const offers = offersByApplicationId[application.id] ?? [];
                    const approvedOffer = offers.find((o) => o.status === 'approved');
                    const acceptedOffer = offers.find((o) => o.status === 'accepted');

                    return (
                      <div key={application.id} style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', background: 'rgba(255,255,255,0.78)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{candidateName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                              Candidate ID: {application.candidateId}
                            </div>
                          </div>
                          <Badge label={humanize(application.stage)} tone={tone} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                          Created {new Date(application.createdAt).toLocaleString()}
                        </div>
                        {acceptedOffer && (
                          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Badge label="Offer Accepted" tone="success" />
                            {acceptedOffer.baseSalary != null && (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Base: {acceptedOffer.baseSalary.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </div>
                        )}
                        {approvedOffer && !acceptedOffer && (
                          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Offer approved</span>
                              {approvedOffer.baseSalary != null && (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                                  Base: {approvedOffer.baseSalary.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="primary"
                              onClick={() => handleAcceptOffer(application.id, approvedOffer.id)}
                              disabled={acceptingOfferId === approvedOffer.id}
                            >
                              {acceptingOfferId === approvedOffer.id ? 'Accepting…' : 'Mark as Accepted'}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Approval timeline</div>
              {detail.requisition.workflowInstanceId ? (
                <WorkflowTimeline instanceId={detail.requisition.workflowInstanceId} compact />
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  This requisition has not been submitted for approval yet.
                </div>
              )}
            </div>
          </div>
        )}
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
