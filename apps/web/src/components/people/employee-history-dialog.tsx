'use client';

import type { CSSProperties } from 'react';
import { Avatar, Badge, Button, Icon, type Accent } from '../aurora-primitives';
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

  const statusTone = getStatusTone(employee.status);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        className="aurora-card aurora-card-padding aurora-card-lift"
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={heroStyle}>
          <div style={heroBackdropStyle} />
          <div style={heroContentStyle}>
            <div style={heroTopRowStyle}>
              <div style={heroIdentityStyle}>
                <Avatar initials={employee.initials} color={employee.color} size={56} />
                <div style={{ minWidth: 0 }}>
                  <div className="aurora-card-title" style={{ fontSize: 24, marginBottom: 4 }}>
                    Employee history
                  </div>
                  <div className="aurora-card-subtitle" style={{ lineHeight: 1.5 }}>
                    Lifecycle timeline for {employee.name}
                  </div>
                  <div style={metaRowStyle}>
                    <Badge label={employee.status} tone={statusTone} />
                    <Badge label={employee.type} tone="ghost" />
                    <Badge label={employee.dept} tone="accent" />
                  </div>
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

            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Role</div>
                <div style={statValueStyle}>{employee.role}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Spells</div>
                <div style={statValueStyle}>{history ? history.spells.length : 0}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Events</div>
                <div style={statValueStyle}>{history ? history.events.length : 0}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>State</div>
                <div style={statValueStyle}>{history ? 'Backend timeline' : 'Loading'}</div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div style={loadingStyle}>
            <div style={loadingDotStyle} />
            <div className="aurora-card-subtitle">Loading lifecycle timeline...</div>
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        {!loading && !error && history && (
          <div className="aurora-screen-stack" style={{ gap: 18 }}>
            <section style={sectionCardStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <div className="aurora-card-title" style={{ fontSize: 16 }}>Employment spells</div>
                  <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                    Chronological assignment history and current role.
                  </div>
                </div>
                <Badge label={`${history.spells.length} records`} tone="violet" />
              </div>

              {history.spells.length === 0 ? (
                <div style={emptyStateStyle}>No spell records found for this employee.</div>
              ) : (
                <div style={timelineStackStyle}>
                  {history.spells.map((spell, index) => {
                    const isActive = spell.effective_to === null;
                    return (
                      <div key={spell.id} style={timelineRowStyle}>
                        <div style={railStyle}>
                          <div style={{ ...dotStyle, background: isActive ? 'var(--success)' : 'var(--accent)' }} />
                          {index < history.spells.length - 1 && <div style={lineStyle} />}
                        </div>

                        <div style={{ ...timelineCardStyle, ...(isActive ? activeSpellStyle : {}) }}>
                          <div style={rowHeaderStyle}>
                            <div style={{ minWidth: 0 }}>
                              <div style={rowTitleStyle}>{spell.job_title}</div>
                              <div style={rowSubtitleStyle}>
                                {formatDate(spell.effective_from)} {'->'} {spell.effective_to ? formatDate(spell.effective_to) : 'Current'}
                              </div>
                            </div>
                            <Badge label={isActive ? 'Current' : 'Completed'} tone={isActive ? 'success' : 'ghost'} />
                          </div>

                          <div style={chipRowStyle}>
                            <Badge label={`Dept ID: ${shortId(spell.department_id)}`} tone="accent" />
                            <Badge label={`Loc ID: ${shortId(spell.location_id)}`} tone="ghost" />
                            <Badge label={spell.work_arrangement} tone="violet" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={sectionCardStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <div className="aurora-card-title" style={{ fontSize: 16 }}>Lifecycle events</div>
                  <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                    Audited changes captured from the backend event trail.
                  </div>
                </div>
                <Badge label={`${history.events.length} records`} tone="accent" />
              </div>

              {history.events.length === 0 ? (
                <div style={emptyStateStyle}>No lifecycle events found for this employee.</div>
              ) : (
                <div style={timelineStackStyle}>
                  {history.events.map((event, index) => {
                    const tone = eventTone(event.event_type);
                    const payloadLines = parsePayload(event.payload_json);

                    return (
                      <div key={event.id} style={timelineRowStyle}>
                        <div style={railStyle}>
                          <div style={{ ...dotStyle, background: tone.dot }} />
                          {index < history.events.length - 1 && <div style={lineStyle} />}
                        </div>

                        <div style={timelineCardStyle}>
                          <div style={rowHeaderStyle}>
                            <div style={{ minWidth: 0 }}>
                              <div style={rowTitleStyle}>{formatEventType(event.event_type)}</div>
                              <div style={rowSubtitleStyle}>{formatDate(event.effective_date)}</div>
                            </div>
                            <Badge label={event.event_type} tone={tone.tone} />
                          </div>

                          <div style={chipRowStyle}>
                            {event.created_by && <Badge label={`By: ${shortId(event.created_by)}`} tone="ghost" />}
                            <Badge label={`At: ${formatDateTime(event.created_at)}`} tone="accent" />
                          </div>

                          {payloadLines.length > 0 ? (
                            <div style={payloadGridStyle}>
                              {payloadLines.map((line) => (
                                <div key={line.key} style={payloadItemStyle}>
                                  <div style={payloadKeyStyle}>{line.key}</div>
                                  <div style={payloadValueStyle}>{line.value}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={emptyPayloadStyle}>No extra details</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {!loading && !error && history && history.spells.length === 0 && history.events.length === 0 && (
          <div style={emptyStateStyle}>No lifecycle history found for this employee.</div>
        )}

        <div style={footerStyle}>
          <div className="aurora-card-subtitle">
            View-only history is read from the backend so the timeline stays auditable.
          </div>
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
  width: 'min(980px, 100%)',
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

const heroStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  border: '1px solid var(--border)',
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(139, 92, 246, 0.08), rgba(16, 185, 129, 0.08))',
  marginBottom: 18,
};

const heroBackdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 40%)',
  pointerEvents: 'none',
};

const heroContentStyle: CSSProperties = {
  position: 'relative',
  padding: 18,
};

const heroTopRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'start',
};

const heroIdentityStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  minWidth: 0,
};

const metaRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
};

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginTop: 18,
};

const statCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.52)',
  padding: 12,
  minWidth: 0,
};

const statLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const statValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const loadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 4px 18px',
};

const loadingDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: 'var(--accent)',
  boxShadow: '0 0 0 6px rgba(59, 130, 246, 0.14)',
};

const errorStyle: CSSProperties = {
  marginBottom: 18,
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(239, 68, 68, 0.25)',
  background: 'rgba(239, 68, 68, 0.08)',
  color: 'var(--danger)',
};

const sectionCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: 16,
  background: 'var(--card-bg)',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 14,
};

const emptyStateStyle: CSSProperties = {
  border: '1px dashed var(--border)',
  borderRadius: 16,
  padding: 18,
  color: 'var(--text-muted)',
  background: 'rgba(148, 163, 184, 0.04)',
};

const timelineStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const timelineRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'stretch',
};

const railStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: 10,
};

const dotStyle: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  border: '2px solid rgba(255,255,255,0.9)',
  boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.08)',
  zIndex: 1,
};

const lineStyle: CSSProperties = {
  flex: 1,
  width: 2,
  minHeight: 28,
  marginTop: 6,
  borderRadius: 999,
  background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.45), rgba(148, 163, 184, 0.15))',
};

const timelineCardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 14,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
};

const activeSpellStyle: CSSProperties = {
  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
  borderColor: 'rgba(16, 185, 129, 0.25)',
};

const rowHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
};

const rowTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const rowSubtitleStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  color: 'var(--text-muted)',
};

const chipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
};

const payloadGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
  marginTop: 12,
};

const payloadItemStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'rgba(248, 250, 252, 0.88)',
};

const payloadKeyStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const payloadValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  color: 'var(--text-primary)',
  wordBreak: 'break-word',
};

const emptyPayloadStyle: CSSProperties = {
  marginTop: 12,
  color: 'var(--text-muted)',
  fontSize: 13,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginTop: 18,
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function parsePayload(payloadJson: string): Array<{ key: string; value: string }> {
  try {
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    return Object.entries(payload)
      .filter(([, value]) => value !== null && value !== undefined && `${value}`.trim() !== '')
      .map(([key, value]) => ({
        key: key
          .split('_')
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
          .join(' '),
        value: String(value),
      }));
  } catch {
    return payloadJson.trim() ? [{ key: 'Payload', value: payloadJson }] : [];
  }
}

function getStatusTone(status: Employee['status']): Accent {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Suspended':
      return 'warning';
    case 'On Leave':
      return 'info';
    case 'Pending':
      return 'violet';
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    default:
      return 'ghost';
  }
}

function eventTone(eventType: string): { tone: Accent; dot: string } {
  const normalized = eventType.toLowerCase();
  if (normalized.includes('terminated') || normalized.includes('resigned')) {
    return { tone: 'danger', dot: 'var(--danger)' };
  }
  if (normalized.includes('promoted') || normalized.includes('transfer')) {
    return { tone: 'accent', dot: 'var(--accent)' };
  }
  if (normalized.includes('hired') || normalized.includes('rehired')) {
    return { tone: 'success', dot: 'var(--success)' };
  }
  if (normalized.includes('suspend')) {
    return { tone: 'warning', dot: 'var(--warning)' };
  }
  return { tone: 'ghost', dot: 'var(--text-muted)' };
}
