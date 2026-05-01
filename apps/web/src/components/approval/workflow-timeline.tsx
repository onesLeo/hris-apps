'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { apiGet } from '../../lib/api-client';

// ─── Types (mirrors backend DTO) ───────────────────────────────────────────────

type TimelineStepStatus = 'approved' | 'skipped' | 'pending' | 'escalated' | 'rejected' | 'upcoming';

type TimelineStepAssignee = {
  id: string;
  name: string;
};

type TimelineStep = {
  stepOrder: number;
  name: string;
  status: TimelineStepStatus;
  assignee: TimelineStepAssignee | null;
  decidedAt: string | null;
  comment: string | null;
  slaBreached: boolean;
};

type WorkflowTimelineDto = {
  workflowInstanceId: string;
  status: string;
  currentStepOrder: number | null;
  requestType: string;
  entityType: string;
  entityId: string;
  startedAt: string;
  completedAt: string | null;
  timeline: TimelineStep[];
};

// ─── Status Visual Config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimelineStepStatus, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
}> = {
  approved: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    icon: '✓',
    label: 'Approved',
  },
  skipped: {
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    icon: '⤳',
    label: 'Skipped',
  },
  pending: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.10)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    icon: '●',
    label: 'Pending',
  },
  escalated: {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.10)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
    icon: '⚠',
    label: 'Escalated',
  },
  rejected: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: 'rgba(239, 68, 68, 0.30)',
    icon: '✕',
    label: 'Rejected',
  },
  upcoming: {
    color: '#cbd5e1',
    bgColor: 'rgba(203, 213, 225, 0.08)',
    borderColor: 'rgba(203, 213, 225, 0.20)',
    icon: '○',
    label: 'Upcoming',
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

type WorkflowTimelineProps = {
  instanceId: string;
  /** If provided, skip the API call and render this data directly */
  data?: WorkflowTimelineDto;
  /** Compact mode for embedding in drawers */
  compact?: boolean;
};

export function WorkflowTimeline({ instanceId, data: externalData, compact = false }: WorkflowTimelineProps) {
  const [timeline, setTimeline] = useState<WorkflowTimelineDto | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalData) {
      setTimeline(externalData);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const dto = await apiGet<WorkflowTimelineDto>(
          `/approvals/workflow-instances/${instanceId}/timeline`,
        );
        if (!cancelled) {
          setTimeline(dto);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load timeline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [instanceId, externalData]);

  if (loading) {
    return (
      <div style={containerStyle(compact)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0' }}>
          <div style={loadingPulseStyle} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading approval timeline…</span>
        </div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div style={containerStyle(compact)}>
        <div style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          padding: '16px 0',
          textAlign: 'center',
        }}>
          {error ?? 'No approval workflow found'}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle(compact)}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: compact ? 13 : 14,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
        }}>
          Approval Timeline
        </div>
        <div style={{
          fontSize: 11.5,
          color: 'var(--text-muted)',
          marginTop: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {timeline.requestType} · {timeline.status}
        </div>
      </div>

      {/* Steps */}
      <div style={{ position: 'relative' }}>
        {timeline.timeline.map((step, index) => {
          const config = STATUS_CONFIG[step.status];
          const isLast = index === timeline.timeline.length - 1;
          const isPending = step.status === 'pending';

          return (
            <div key={step.stepOrder} style={{ display: 'flex', gap: compact ? 12 : 16, position: 'relative' }}>
              {/* Vertical line + dot */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                width: compact ? 28 : 32,
              }}>
                {/* Dot */}
                <div style={{
                  width: compact ? 26 : 30,
                  height: compact ? 26 : 30,
                  borderRadius: '50%',
                  background: config.bgColor,
                  border: `2px solid ${config.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: compact ? 11 : 13,
                  fontWeight: 700,
                  color: config.color,
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                  ...(isPending ? {
                    boxShadow: `0 0 0 4px ${config.bgColor}`,
                    animation: 'workflowPulse 2s ease-in-out infinite',
                  } : {}),
                }}>
                  {config.icon}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    background: step.status === 'upcoming' || step.status === 'skipped'
                      ? 'rgba(203, 213, 225, 0.25)'
                      : `linear-gradient(to bottom, ${config.borderColor}, rgba(203, 213, 225, 0.20))`,
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                paddingBottom: isLast ? 0 : compact ? 16 : 22,
                minWidth: 0,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: compact ? 2 : 3,
                }}>
                  <span style={{
                    fontSize: compact ? 13 : 13.5,
                    fontWeight: 600,
                    color: step.status === 'upcoming' || step.status === 'skipped'
                      ? 'var(--text-muted)'
                      : 'var(--text-primary)',
                  }}>
                    {step.name}
                  </span>

                  {step.slaBreached && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#f97316',
                      background: 'rgba(249, 115, 22, 0.10)',
                      padding: '2px 6px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      SLA
                    </span>
                  )}
                </div>

                {/* Assignee */}
                {step.assignee && (
                  <div style={{
                    fontSize: 12,
                    color: isPending ? config.color : 'var(--text-muted)',
                    fontWeight: isPending ? 600 : 400,
                    marginTop: 3,
                  }}>
                    {isPending ? `Waiting on: ${step.assignee.name}` : step.assignee.name}
                  </div>
                )}

                {/* Timestamp */}
                {step.decidedAt && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDate(step.decidedAt)}
                  </div>
                )}

                {/* Comment */}
                {step.comment && (
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-mid, var(--text-muted))',
                    marginTop: 5,
                    padding: '6px 10px',
                    borderRadius: 10,
                    background: 'rgba(0, 0, 0, 0.03)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}>
                    "{step.comment}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes workflowPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.10); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.05); }
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function containerStyle(compact: boolean): CSSProperties {
  return {
    padding: compact ? '12px 0' : '0',
  };
}

const loadingPulseStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: 'var(--text-muted)',
  animation: 'workflowPulse 1.5s ease-in-out infinite',
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
