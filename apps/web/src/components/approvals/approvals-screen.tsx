'use client';

import { useEffect, useState } from 'react';
import { getApprovalsCopy, useLocale } from '../../i18n';
import { Badge, Avatar, Icon } from '../aurora-primitives';
import { fetchPendingApprovals, approveWorkflowStep, rejectWorkflowStep, type PendingWorkflow } from '../../lib/approvals-api';

export function ApprovalsScreen() {
  const { locale } = useLocale();
  const copy = getApprovalsCopy(locale);
  const [workflows, setWorkflows] = useState<PendingWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [decided, setDecided] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingApprovals()
      .then((data) => {
        setWorkflows(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load approvals');
        setWorkflows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = workflows.filter((w) => !decided.has(w.id)).length;
  const declinedCount = Array.from(decided).filter((id) => {
    const wf = workflows.find((w) => w.id === id);
    return wf && processing === `reject-${id}`;
  }).length;

  async function handleApprove(workflow: PendingWorkflow) {
    if (!workflow.currentStep) return;
    setProcessing(`approve-${workflow.id}`);
    try {
      await approveWorkflowStep(workflow.id, workflow.currentStep.stepOrder);
      setDecided((s) => new Set([...s, workflow.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(workflow: PendingWorkflow) {
    if (!workflow.currentStep) return;
    setProcessing(`reject-${workflow.id}`);
    try {
      await rejectWorkflowStep(workflow.id, workflow.currentStep.stepOrder);
      setDecided((s) => new Set([...s, workflow.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  }

  const lifecycleTypeLabel: Record<string, string> = {
    employee_transfer: 'Transfer',
    employee_promotion: 'Promotion',
    employee_termination: 'Termination',
    annual_leave: 'Annual Leave',
    wfh_request: 'WFH Request',
  };

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        {[
          { label: copy.stats.pending, value: pendingCount, color: '#f59e0b', icon: 'clock' as const },
          { label: copy.stats.approved, value: workflows.length - pendingCount - declinedCount, color: '#10b981', icon: 'checkCircle' as const },
          { label: copy.stats.declined, value: declinedCount, color: '#ef4444', icon: 'xMark' as const },
          { label: copy.stats.avgResponse, value: '2.4h', color: '#06b6d4', icon: 'trending' as const },
        ].map((stat) => (
          <div key={stat.label} className="aurora-card aurora-card-padding aurora-card-lift">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${stat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name={stat.icon} size={16} color={stat.color} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px' }}>{stat.value}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

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

      <div>
        <div className="aurora-card-title" style={{ marginBottom: 14 }}>{copy.title}</div>
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>...</div>
        ) : workflows.length === 0 ? (
          <div className="aurora-subtle-box" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            No pending approvals
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {workflows.map((workflow) => {
              const isDone = decided.has(workflow.id);
              const initials = (workflow.contextJson?.employeeName as string || 'EN')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0] ?? '')
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const daysOverdue = workflow.currentStep?.dueAt
                ? Math.max(0, Math.floor((Date.now() - new Date(workflow.currentStep.dueAt).getTime()) / (1000 * 60 * 60 * 24)))
                : 0;

              return (
                <div
                  key={workflow.id}
                  className="aurora-card aurora-card-padding aurora-card-lift"
                  style={{
                    borderColor: isDone ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <Avatar initials={initials} color="#6366f1" size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {workflow.contextJson?.employeeName as string || 'Employee'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{workflow.templateName}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {daysOverdue > 0 && <Badge label={`${daysOverdue}d overdue`} tone="danger" />}
                          {isDone && <Badge label={copy.approved} tone="success" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="aurora-subtle-box" style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {lifecycleTypeLabel[workflow.requestType] || workflow.requestType}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {workflow.requestType === 'employee_transfer' && (
                        <>To: {workflow.contextJson?.toDepartmentId ? 'New Department' : 'TBD'}</>
                      )}
                      {workflow.requestType === 'employee_promotion' && (
                        <>To: {workflow.contextJson?.newJobTitle as string || 'TBD'}</>
                      )}
                      {workflow.requestType === 'employee_termination' && (
                        <>On: {workflow.contextJson?.terminationDate as string || 'TBD'}</>
                      )}
                    </div>
                  </div>

                  {!isDone ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="aurora-button is-primary"
                        style={{ flex: 1 }}
                        disabled={processing === `approve-${workflow.id}`}
                        onClick={() => handleApprove(workflow)}
                      >
                        <Icon name="check" size={14} color="#fff" strokeWidth={2} />
                        {processing === `approve-${workflow.id}` ? 'Approving…' : copy.approve}
                      </button>
                      <button
                        type="button"
                        className="aurora-button"
                        style={{ flex: 1 }}
                        disabled={processing === `reject-${workflow.id}`}
                        onClick={() => handleReject(workflow)}
                      >
                        <Icon name="xMark" size={14} color="var(--text-mid)" strokeWidth={2} />
                        {processing === `reject-${workflow.id}` ? 'Rejecting…' : copy.decline}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                      {copy.approved}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
