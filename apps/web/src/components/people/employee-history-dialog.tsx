'use client';

import type { CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { Employee } from './people-data';
import type { EmployeeHistory } from '../../lib/employee-api';

type EmployeeHistoryDialogProps = {
  open: boolean;
  employee: Employee | undefined;
  history: EmployeeHistory | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

export function EmployeeHistoryDialog({
  open,
  employee,
  history,
  loading,
  error,
  onClose,
}: EmployeeHistoryDialogProps) {
  if (!open || !employee) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={cardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }}>
          <div>
            <div className="aurora-card-title">Employee History</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>
              {employee.name} · {employee.role} · {employee.dept}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={closeStyle}
          >
            <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
          </button>
        </div>

        {loading && <div className="aurora-card-subtitle">Loading lifecycle timeline...</div>}
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}

        {!loading && !error && history && (
          <div className="aurora-screen-stack" style={{ gap: 16 }}>
            <section className="aurora-card" style={sectionStyle}>
              <div className="aurora-card-subtitle" style={{ marginBottom: 10 }}>Employment spells</div>
              <div className="aurora-screen-stack" style={{ gap: 10 }}>
                {history.spells.map((spell) => (
                  <div key={spell.id} style={rowStyle}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{spell.job_title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {spell.effective_from} → {spell.effective_to ?? 'current'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Dept: {spell.department_id} · Loc: {spell.location_id}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="aurora-card" style={sectionStyle}>
              <div className="aurora-card-subtitle" style={{ marginBottom: 10 }}>Lifecycle events</div>
              <div className="aurora-screen-stack" style={{ gap: 10 }}>
                {history.events.map((event) => {
                  let details = '';
                  try {
                    const payload = JSON.parse(event.payload_json) as Record<string, unknown>;
                    details = Object.entries(payload)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(' · ');
                  } catch {
                    details = event.payload_json;
                  }

                  return (
                    <div key={event.id} style={rowStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{event.event_type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{event.effective_date}</div>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>{details || 'No extra details'}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {!loading && !error && history && history.spells.length === 0 && history.events.length === 0 && (
          <div className="aurora-card-subtitle">No lifecycle history found for this employee.</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="primary" onClick={onClose}>
            <Icon name="check" size={14} color="#fff" strokeWidth={2} />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.42)',
  backdropFilter: 'blur(10px)',
  zIndex: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const cardStyle: CSSProperties = {
  width: 'min(760px, 100%)',
  maxHeight: '88vh',
  overflowY: 'auto',
};

const closeStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card-bg)',
  borderRadius: 12,
  width: 36,
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const sectionStyle: CSSProperties = {
  padding: 14,
};

const rowStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 12,
  background: 'var(--card-bg)',
};
