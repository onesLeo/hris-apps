'use client';

import { useState } from 'react';
import { getApprovalsCopy, useLocale } from '../../i18n';
import { Badge, Avatar, Icon } from '../aurora-primitives';
import { getApprovalsData } from './approvals-data';

export function ApprovalsScreen() {
  const { locale } = useLocale();
  const copy = getApprovalsCopy(locale);
  const approvals = getApprovalsData(locale);
  const [approved, setApproved] = useState<number[]>([]);
  const [declined, setDeclined] = useState<number[]>([]);

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        {[
          { label: copy.stats.pending, value: approvals.length - approved.length - declined.length, color: '#f59e0b', icon: 'clock' as const },
          { label: copy.stats.approved, value: approved.length, color: '#10b981', icon: 'checkCircle' as const },
          { label: copy.stats.declined, value: declined.length, color: '#ef4444', icon: 'xMark' as const },
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

      <div>
        <div className="aurora-card-title" style={{ marginBottom: 14 }}>{copy.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {approvals.map((approval, index) => {
            const isApproved = approved.includes(index);
            const isDeclined = declined.includes(index);
            const isDone = isApproved || isDeclined;
            return (
              <div
                key={approval.name}
                className="aurora-card aurora-card-padding aurora-card-lift"
                style={{
                  borderColor: isDone ? (isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border)',
                  opacity: isDone ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <Avatar initials={approval.initials} color={approval.color} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{approval.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{approval.dept}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {approval.urgent && <Badge label={copy.urgent} tone="danger" />}
                        {isApproved && <Badge label={copy.approved} tone="success" />}
                        {isDeclined && <Badge label={copy.rejected} tone="danger" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="aurora-subtle-box" style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{approval.type}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{approval.detail}</div>
                </div>

                {!isDone ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="aurora-button is-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setApproved((current) => (current.includes(index) ? current : [...current, index]));
                        setDeclined((current) => current.filter((item) => item !== index));
                      }}
                    >
                      <Icon name="check" size={14} color="#fff" strokeWidth={2} />
                      {copy.approve}
                    </button>
                    <button
                      type="button"
                      className="aurora-button"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setDeclined((current) => (current.includes(index) ? current : [...current, index]));
                        setApproved((current) => current.filter((item) => item !== index));
                      }}
                    >
                      <Icon name="xMark" size={14} color="var(--text-mid)" strokeWidth={2} />
                      {copy.decline}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: isApproved ? 'var(--success)' : 'var(--danger)' }}>
                    {isApproved ? copy.approved : copy.rejected}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
