'use client';

import { useState } from 'react';
import type { AppCopy } from '../../i18n/app-copy';
import { Badge, Avatar, Button, Icon, type Accent } from '../aurora-primitives';
import { LEAVE_BALANCES, LEAVE_REQUESTS } from '../aurora-shell-data';

export function LeaveScreen({ copy }: { copy: AppCopy['leave'] }) {
  const [tab, setTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const tabs = ['All', 'Pending', 'Approved', 'Rejected'] as const;
  const filtered = tab === 'All' ? LEAVE_REQUESTS : LEAVE_REQUESTS.filter((request) => request.status === tab);
  const statusTone: Record<'Pending' | 'Approved' | 'Rejected', Accent> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
  };

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        {LEAVE_BALANCES.map((balance) => (
          <div key={balance.label} className="aurora-card aurora-card-padding aurora-card-lift">
            <div className="aurora-card-subtitle" style={{ marginBottom: 8, fontWeight: 500 }}>
              {copy.balanceLabels[balance.label as keyof typeof copy.balanceLabels]}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px' }}>{balance.total - balance.used}</span>
              <span className="aurora-card-subtitle">/ {balance.total} {copy.daysLeft}</span>
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

      <div className="aurora-card aurora-table aurora-card-lift">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="aurora-pill-row">
            {tabs.map((item) => (
              <button key={item} type="button" className={`aurora-pill ${tab === item ? 'is-active' : ''}`} onClick={() => setTab(item)}>
                {copy.tabs[item]}
                {item !== 'All' && (
                  <span style={{ marginLeft: 4, background: tab === item ? 'var(--accent)' : 'var(--border)', color: tab === item ? '#fff' : 'var(--text-muted)', borderRadius: 10, padding: '0 5px', fontSize: 10.5, fontWeight: 700 }}>
                    {LEAVE_REQUESTS.filter((request) => request.status === item).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button size="sm" variant="primary">
            <Icon name="plus" size={13} color="#fff" strokeWidth={2} />
            {copy.applyLeave}
          </Button>
        </div>

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

        {filtered.map((leave, index) => (
          <div key={`${leave.name}-${index}`} className="aurora-table-row" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 0.8fr 1fr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={leave.initials} color={leave.color} size={30} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{leave.name}</span>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{leave.type}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>
              {leave.from} - {leave.to}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{leave.days}d</span>
            <Badge label={copy.tabs[leave.status]} tone={statusTone[leave.status]} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {leave.status === 'Pending' ? (
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
    </div>
  );
}
