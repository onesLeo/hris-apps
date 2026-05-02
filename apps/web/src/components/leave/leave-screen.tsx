'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Avatar, Button, Icon, type Accent } from '../aurora-primitives';
import { WorkflowTimeline } from '../approval/workflow-timeline';
import { getLeaveCopy, useLocale } from '../../i18n';
import { LeaveApplyDialog } from './leave-apply-dialog';
import {
  addLeaveRequest,
  filterLeaveRequests,
  LEAVE_BALANCES,
  LEAVE_REQUESTS,
  LEAVE_TABS,
  type CreateLeaveRequestInput,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveStatus,
} from './leave-data';
import {
  fetchLeaveRequests,
  fetchLeaveBalances,
  submitLeaveRequest,
  reviewLeaveRequest,
  cancelLeaveRequest,
} from '../../lib/leave-api';

const STATUS_TONE: Record<LeaveStatus, Accent> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
};

const STATUS_MAP: Record<string, LeaveStatus> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Rejected',
};

const BALANCE_COLOR_MAP: Record<string, string> = {
  ANNUAL: '#e8317a',
  SICK: '#8b5cf6',
  COMP: '#06b6d4',
  WFH: '#10b981',
};

export function LeaveScreen() {
  const { locale } = useLocale();
  const copy = getLeaveCopy(locale);
  const allowMockFallback = process.env.NODE_ENV !== 'production';
  const [tab, setTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [requests, setRequests] = useState<readonly LeaveRequest[]>(allowMockFallback ? LEAVE_REQUESTS : []);
  const [balances, setBalances] = useState<readonly LeaveBalance[]>(allowMockFallback ? LEAVE_BALANCES : []);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load leave requests from API
  useEffect(() => {
    fetchLeaveRequests({ limit: 100 })
      .then((apiRequests) => {
        setError(null);
        const mapped: LeaveRequest[] = apiRequests.map((req) => ({
          id: req.id,
          workflowInstanceId: req.workflowInstanceId,
          employee: req.employeeName,
          initials: req.employeeName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0] ?? '')
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'EN',
          color: '#e8317a',
          leaveType: req.leaveTypeName as LeaveRequest['leaveType'],
          from: req.fromDate,
          to: req.toDate,
          days: req.days,
          reason: req.reason ?? '',
          status: STATUS_MAP[req.status] ?? 'Pending',
        }));
        setRequests(mapped);
      })
      .catch((err) => {
        if (!allowMockFallback) {
          setError(err instanceof Error ? err.message : 'Failed to load live leave requests.');
        }
      });
  }, [allowMockFallback]);

  // Load leave balances from API
  useEffect(() => {
    const DEMO_EMPLOYEE_ID = '55555555-5555-5555-5555-555555555555';
    fetchLeaveBalances(DEMO_EMPLOYEE_ID)
      .then((apiBalances) => {
        setError(null);
        if (apiBalances.length === 0) return;
        const mapped: LeaveBalance[] = apiBalances.map((b) => ({
          label: b.leaveTypeName as LeaveBalance['label'],
          total: b.entitledDays + b.carriedOverDays,
          used: b.takenDays + b.pendingDays,
          color: BALANCE_COLOR_MAP[b.leaveTypeCode] ?? '#e8317a',
        }));
        setBalances(mapped);
      })
      .catch((err) => {
        if (!allowMockFallback) {
          setError(err instanceof Error ? err.message : 'Failed to load leave balances.');
        }
      });
  }, [allowMockFallback]);

  const filtered = useMemo(() => filterLeaveRequests(requests, tab, search), [requests, search, tab]);
  const statusCounts = useMemo(
    () =>
      LEAVE_TABS.filter((item) => item !== 'All').reduce(
        (counts, status) => ({
          ...counts,
          [status]: requests.filter((request) => request.status === status).length,
        }),
        { Pending: 0, Approved: 0, Rejected: 0 } as Record<'Pending' | 'Approved' | 'Rejected', number>,
      ),
    [requests],
  );

  const submitRequest = (input: CreateLeaveRequestInput) => {
    setError(null);
    const previousRequests = requests;
    const nextRequests = addLeaveRequest(previousRequests, input);
    setRequests(nextRequests);

    submitLeaveRequest({
      employeeId: '55555555-5555-5555-5555-555555555555',
      leaveTypeId: 'bbbb0001-0000-0000-0000-000000000001',
      fromDate: input.from,
      toDate: input.to,
      days: input.days,
      reason: input.reason,
    }).catch((err) => {
      if (!allowMockFallback) {
        setRequests(previousRequests);
        setError(err instanceof Error ? err.message : 'Failed to submit leave request.');
      }
    });
  };

  const handleReview = async (request: LeaveRequest, action: 'approve' | 'reject') => {
    if (!request.id || reviewingId === request.id) return;
    setReviewingId(request.id);
    try {
      await reviewLeaveRequest(request.id, action);
      const newStatus: LeaveStatus = action === 'approve' ? 'Approved' : 'Rejected';
      setRequests((current) =>
        current.map((r) => (r.id === request.id ? { ...r, status: newStatus } : r)),
      );
      setError(null);
    } catch (err) {
      if (!allowMockFallback) {
        setError(err instanceof Error ? err.message : 'Failed to update leave request.');
      }
    } finally {
      setReviewingId(null);
    }
  };

  const handleCancel = async (request: LeaveRequest) => {
    if (!request.id || cancellingId === request.id) return;
    setCancellingId(request.id);
    try {
      await cancelLeaveRequest(request.id);
      setRequests((current) =>
        current.map((r) => (r.id === request.id ? { ...r, status: 'Rejected' as LeaveStatus } : r)),
      );
      if (selectedRequest?.id === request.id) setSelectedRequest(null);
      setError(null);
    } catch (err) {
      if (!allowMockFallback) {
        setError(err instanceof Error ? err.message : 'Failed to cancel leave request.');
      }
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        {balances.map((balance) => (
          <div key={balance.label} className="aurora-card aurora-card-padding aurora-card-lift">
            <div className="aurora-card-subtitle" style={{ marginBottom: 8, fontWeight: 500 }}>
              {copy.balanceLabels[balance.label]}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px' }}>{balance.total - balance.used}</span>
              <span className="aurora-card-subtitle">
                / {balance.total} {copy.daysLeft}
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(balance.used / balance.total) * 100}%`,
                  background: balance.color,
                  borderRadius: 10,
                  animation: 'auroraBar 1s ease both',
                }}
              />
            </div>
            <div className="aurora-card-subtitle" style={{ marginTop: 5 }}>
              {balance.used} {copy.used}
            </div>
          </div>
        ))}
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
          {LEAVE_TABS.map((item) => (
            <button key={item} type="button" className={`aurora-pill ${tab === item ? 'is-active' : ''}`} onClick={() => setTab(item)}>
              {copy.tabs[item]}
              {item !== 'All' && (
                <span
                  style={{
                    marginLeft: 4,
                    background: tab === item ? 'var(--accent)' : 'var(--border)',
                    color: tab === item ? '#fff' : 'var(--text-muted)',
                    borderRadius: 10,
                    padding: '0 5px',
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  {statusCounts[item as keyof typeof statusCounts]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button size="sm" variant="primary" onClick={() => setIsApplyOpen(true)}>
            <Icon name="plus" size={13} color="#fff" strokeWidth={2} />
            {copy.applyLeave}
          </Button>
        </div>
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

      <div className="aurora-card aurora-table aurora-card-lift">
        <div className="aurora-table-head" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 0.8fr 1fr' }}>
          {[
            copy.tableHeaders.employee,
            copy.tableHeaders.leaveType,
            copy.tableHeaders.duration,
            copy.tableHeaders.days,
            copy.tableHeaders.status,
            copy.tableHeaders.actions,
          ].map((label) => (
            <span key={label} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {label}
            </span>
          ))}
        </div>

        {filtered.map((leave) => (
          <div key={`${leave.employee}-${leave.leaveType}-${leave.from}-${leave.to}`} className="aurora-table-row" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 0.8fr 1fr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={leave.initials} color={leave.color} size={30} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{leave.employee}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{leave.reason}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{leave.leaveType}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{leave.reason}</div>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>
              {leave.from} - {leave.to}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{leave.days}d</span>
            <Badge label={copy.tabs[leave.status]} tone={STATUS_TONE[leave.status]} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {leave.status === 'Pending' && leave.id ? (
                <>
                  <button
                    type="button"
                    disabled={reviewingId === leave.id || cancellingId === leave.id}
                    onClick={() => handleReview(leave, 'approve')}
                    style={{ background: 'var(--accent)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#fff', border: 'none', cursor: (reviewingId === leave.id || cancellingId === leave.id) ? 'not-allowed' : 'pointer', opacity: (reviewingId === leave.id || cancellingId === leave.id) ? 0.6 : 1 }}
                  >
                    {copy.approve}
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === leave.id || cancellingId === leave.id}
                    onClick={() => handleReview(leave, 'reject')}
                    style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', border: 'none', cursor: (reviewingId === leave.id || cancellingId === leave.id) ? 'not-allowed' : 'pointer', opacity: (reviewingId === leave.id || cancellingId === leave.id) ? 0.6 : 1 }}
                  >
                    {copy.decline}
                  </button>
                  <button
                    type="button"
                    className="aurora-icon-swatch"
                    aria-label="Cancel request"
                    disabled={cancellingId === leave.id}
                    onClick={() => handleCancel(leave)}
                    style={{ opacity: cancellingId === leave.id ? 0.5 : 1 }}
                    title="Cancel"
                  >
                    <Icon name="xMark" size={14} color="var(--text-muted)" strokeWidth={2} />
                  </button>
                </>
              ) : leave.status === 'Pending' ? (
                <>
                  <div style={{ background: 'var(--accent)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                    {copy.approve}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>
                    {copy.decline}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="aurora-icon-swatch"
                  aria-label="View details"
                  onClick={() => setSelectedRequest(leave)}
                >
                  <Icon name="eye" size={16} color="var(--text-muted)" strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <LeaveApplyDialog
        open={isApplyOpen}
        copy={copy}
        onClose={() => setIsApplyOpen(false)}
        onSubmit={submitRequest}
      />

      {selectedRequest && (
        <>
          <div
            role="presentation"
            onClick={() => setSelectedRequest(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave request details"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 420,
              maxWidth: '95vw',
              background: 'var(--card-bg)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              animation: 'auroraFadeUp 0.22s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Leave Request</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedRequest.employee}</div>
              </div>
              <button
                type="button"
                className="aurora-icon-swatch"
                aria-label="Close"
                onClick={() => setSelectedRequest(null)}
              >
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            {selectedRequest.status === 'Pending' && selectedRequest.id && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={cancellingId === selectedRequest.id}
                  onClick={() => handleCancel(selectedRequest)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    cursor: cancellingId === selectedRequest.id ? 'not-allowed' : 'pointer',
                    opacity: cancellingId === selectedRequest.id ? 0.5 : 1,
                  }}
                >
                  {cancellingId === selectedRequest.id ? 'Cancelling…' : 'Cancel Request'}
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Type', value: selectedRequest.leaveType },
                  { label: 'Days', value: `${selectedRequest.days}d` },
                  { label: 'From', value: selectedRequest.from },
                  { label: 'To', value: selectedRequest.to },
                  { label: 'Status', value: selectedRequest.status },
                  { label: 'Reason', value: selectedRequest.reason || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.45px', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Approval Timeline
                </div>
                {selectedRequest.workflowInstanceId ? (
                  <WorkflowTimeline instanceId={selectedRequest.workflowInstanceId} />
                ) : (
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    This request was auto-approved or does not require workflow approval.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
