'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Avatar, Badge, Button, Icon, type Accent } from '../aurora-primitives';
import type { OnboardingCopy } from '../../i18n/onboarding-copy';
import type { Employee } from './people-data';
import type { OnboardingTask } from '../../lib/onboarding-api';

type EmployeeOnboardingTaskDialogProps = {
  open: boolean;
  employee: Employee;
  task: OnboardingTask | null;
  copy: OnboardingCopy;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<boolean>;
};

type CaptureState = {
  documents: string;
  policyAcknowledged: boolean;
  notes: string;
};

const INITIAL_STATE: CaptureState = {
  documents: '',
  policyAcknowledged: false,
  notes: '',
};

export function EmployeeOnboardingTaskDialog({
  open,
  employee,
  task,
  copy,
  onClose,
  onSubmit,
}: EmployeeOnboardingTaskDialogProps) {
  const [form, setForm] = useState<CaptureState>(INITIAL_STATE);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !task) {
      setForm(INITIAL_STATE);
      setFeedback(null);
      setBusy(false);
      return;
    }

    setForm({
      documents: '',
      policyAcknowledged: task.code === 'policy_acknowledgement',
      notes: '',
    });
    setFeedback(null);
    setBusy(false);
  }, [open, task]);

  if (!open || !task) {
    return null;
  }

  const submit = async () => {
    setFeedback(null);

    if (task.code === 'employee_documents' && !form.documents.trim()) {
      setFeedback(copy.taskCaptureRequired);
      return;
    }

    if (task.code === 'policy_acknowledgement' && !form.policyAcknowledged) {
      setFeedback(copy.taskCapturePolicyRequired);
      return;
    }

    setBusy(true);
    try {
      const success = await onSubmit(buildComment(task, form));
      if (success) {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aurora-overlay" style={overlayStyle} onClick={onClose}>
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
                <Avatar initials={employee.initials} color={employee.color} size={50} />
                <div style={{ minWidth: 0 }}>
                  <div className="aurora-card-title" style={{ fontSize: 22, marginBottom: 4 }}>
                    {copy.taskCaptureTitle}
                  </div>
                  <div className="aurora-card-subtitle" style={{ lineHeight: 1.5 }}>
                    {copy.taskCaptureSubtitle}
                  </div>
                  <div style={metaRowStyle}>
                    <Badge label={task.code} tone={taskTone(task.code)} />
                    <Badge label={employee.name} tone="ghost" />
                    <Badge label={employee.dept} tone="accent" />
                  </div>
                </div>
              </div>

              <button type="button" onClick={onClose} aria-label={copy.taskCaptureCancel} style={closeStyle}>
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div style={feedbackStyle} role="alert" aria-live="polite">
            <Icon name="xMark" size={16} color="var(--danger)" strokeWidth={2} />
            <div>{feedback}</div>
          </div>
        )}

        <div className="aurora-screen-stack" style={{ gap: 16 }}>
          <section style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div className="aurora-card-title" style={{ fontSize: 16 }}>{task.title}</div>
                <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>{task.description ?? copy.taskCaptureSubtitle}</div>
              </div>
              <Badge label={task.required ? copy.requiredLabel : copy.pendingLabel} tone={task.required ? 'warning' : 'info'} />
            </div>

            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              {(task.code === 'employee_documents' || task.code === 'access_provisioning') && (
                <label className="field">
                  <span className="aurora-card-subtitle">{copy.taskCaptureDocuments}</span>
                  <textarea
                    value={form.documents}
                    onChange={(event) => setForm((current) => ({ ...current, documents: event.target.value }))}
                    style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                    placeholder={task.code === 'employee_documents'
                      ? copy.taskCaptureDocumentsPlaceholder
                      : 'Laptop, email account, VPN, payroll access...'}
                  />
                  <span className="aurora-card-subtitle" style={helpTextStyle}>{copy.taskCaptureRequired}</span>
                </label>
              )}

              {task.code === 'policy_acknowledgement' && (
                <label style={checkboxCardStyle}>
                  <input
                    type="checkbox"
                    checked={form.policyAcknowledged}
                    onChange={(event) => setForm((current) => ({ ...current, policyAcknowledged: event.target.checked }))}
                  />
                  <div>
                    <div style={checkboxTitleStyle}>{copy.taskCapturePolicy}</div>
                    <div style={checkboxHintStyle}>{task.description ?? copy.taskCapturePolicyRequired}</div>
                  </div>
                </label>
              )}

              <label className="field">
                <span className="aurora-card-subtitle">{copy.taskCaptureNotes}</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
                  placeholder={task.code === 'manager_introduction'
                    ? 'Meeting date, attendees, and key points...'
                    : task.code === 'payroll_setup'
                      ? 'Bank details verified, tax profile confirmed...'
                      : task.code === 'orientation'
                        ? 'Welcome agenda and materials covered...'
                        : copy.taskCaptureNotesPlaceholder}
                />
                <span className="aurora-card-subtitle" style={helpTextStyle}>{copy.taskSummaryHelp}</span>
              </label>
            </div>
          </section>

          <div style={footerStyle}>
            <div className="aurora-card-subtitle">{copy.taskCaptureSubtitle}</div>
            <div style={buttonRowStyle}>
              <Button variant="ghost" onClick={onClose}>
                <Icon name="xMark" size={14} color="currentColor" strokeWidth={2} />
                {copy.taskCaptureCancel}
              </Button>
              <Button variant="primary" onClick={submit} disabled={busy}>
                <Icon name="checkCircle" size={14} color="#fff" strokeWidth={2} />
                {busy ? copy.working : copy.taskCaptureSubmit}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildComment(task: OnboardingTask, form: CaptureState): string {
  const payload = {
    taskCode: task.code,
    taskTitle: task.title,
    documents: form.documents.trim() || null,
    policyAcknowledged: form.policyAcknowledged,
    notes: form.notes.trim() || null,
    capturedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}

function taskTone(taskCode: string): Accent {
  switch (taskCode) {
    case 'employee_documents':
      return 'accent';
    case 'policy_acknowledgement':
      return 'success';
    case 'manager_introduction':
      return 'violet';
    case 'payroll_setup':
      return 'info';
    case 'access_provisioning':
      return 'warning';
    default:
      return 'ghost';
  }
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.42)',
  backdropFilter: 'blur(10px)',
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const cardStyle: CSSProperties = {
  width: 'min(920px, 100%)',
  maxHeight: '88vh',
  overflowY: 'auto',
};

const heroStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  border: '1px solid var(--border)',
  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.10), rgba(139, 92, 246, 0.08))',
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
  marginTop: 10,
};

const feedbackStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  borderRadius: 16,
  border: '1px solid rgba(239, 68, 68, 0.25)',
  background: 'rgba(239, 68, 68, 0.08)',
  color: 'var(--danger)',
  padding: '12px 14px',
  marginBottom: 16,
  fontSize: 13,
  lineHeight: 1.5,
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

const inputStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const helpTextStyle: CSSProperties = {
  marginTop: 4,
};

const checkboxCardStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'rgba(248, 250, 252, 0.9)',
  padding: 14,
};

const checkboxTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const checkboxHintStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  color: 'var(--text-muted)',
  lineHeight: 1.45,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
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
  flexShrink: 0,
};
