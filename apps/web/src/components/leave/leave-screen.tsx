'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Avatar, Button, Icon, type Accent } from '../aurora-primitives';
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
  const [tab, setTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [requests, setRequests] = useState<readonly LeaveRequest[]>(LEAVE_REQUESTS);
  const [balances, setBalances] = useState<readonly LeaveBalance[]>(LEAVE_BALANCES);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Load leave requests from API
  useEffect(() => {
    fetchLeaveRequests({ limit: 100 })
      .then((apiRequests) => {
        const mapped: LeaveRequest[] = apiRequests.map((req) => ({
          id: req.id,
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
      .catch(() => {
        // Fall back to mock data if API is unavailable
      });
  }, []);

  // Load leave balances from API
  useEffect(() => {
    const DEMO_EMPLOYEE_ID = '55555555-5555-5555-5555-555555555555';
    fetchLeaveBalances(DEMO_EMPLOYEE_ID)
      .then((apiBalances) => {
        if (apiBalances.length === 0) return;
        const mapped: LeaveBalance[] = apiBalances.map((b) => ({
          label: b.leaveTypeName as LeaveBalance['label'],
          total: b.entitledDays + b.carriedOverDays,
          used: b.takenDays + b.pendingDays,
          color: BALANCE_COLOR_MAP[b.leaveTypeCode] ?? '#e8317a',
        }));
        setBalances(mapped);
      })
      .catch(() => {
        // Fall back to mock balances if API is unavailable
      });
  }, []);

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
    setRequests((current) => addLeaveRequest(current, input));

    submitLeaveRequest({
      employeeId: '55555555-5555-5555-5555-555555555555',
      leaveTypeId: 'bbbb0001-0000-0000-0000-000000000001',
      fromDate: input.from,
      toDate: input.to,
      days: input.days,
      reason: input.reason,
    }).catch(() => {
      // Optimistic update already applied; API failure is non-fatal
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
    } catch {
      // silently ignore — UI already shows current state
    } finally {
      setReviewingId(null);
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
                    disabled={reviewingId === leave.id}
                    onClick={() => handleReview(leave, 'approve')}
                    style={{ background: 'var(--accent)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#fff', border: 'none', cursor: reviewingId === leave.id ? 'not-allowed' : 'pointer', opacity: reviewingId === leave.id ? 0.6 : 1 }}
                  >
                    {copy.approve}
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === leave.id}
                    onClick={() => handleReview(leave, 'reject')}
                    style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', border: 'none', cursor: reviewingId === leave.id ? 'not-allowed' : 'pointer', opacity: reviewingId === leave.id ? 0.6 : 1 }}
                  >
                    {copy.decline}
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
                <Icon name="eye" size={16} color="var(--text-muted)" strokeWidth={1.8} />
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
    </div>
  );
}
