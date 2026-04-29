'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { LeaveCopy } from '../../i18n/leave-copy';
import { LEAVE_TYPES, type CreateLeaveRequestInput, type LeaveBalanceLabel } from './leave-data';

type LeaveApplyDialogProps = {
  open: boolean;
  copy: LeaveCopy;
  onClose: () => void;
  onSubmit: (request: CreateLeaveRequestInput) => void;
};

type FormState = {
  employee: string;
  leaveType: LeaveBalanceLabel;
  from: string;
  to: string;
  days: string;
  reason: string;
};

const INITIAL_FORM_STATE: FormState = {
  employee: '',
  leaveType: 'Annual Leave',
  from: '',
  to: '',
  days: '1',
  reason: '',
};

export function LeaveApplyDialog({ open, copy, onClose, onSubmit }: LeaveApplyDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
      setFeedback(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    setFeedback(null);
    const parsedDays = Number(form.days);

    if (!form.employee.trim() || !form.from.trim() || !form.to.trim() || !form.reason.trim()) {
      setFeedback(copy.validation.required);
      return;
    }

    if (!Number.isFinite(parsedDays) || parsedDays < 1) {
      setFeedback(copy.validation.invalidDays);
      return;
    }

    onSubmit({
      employee: form.employee.trim(),
      leaveType: form.leaveType,
      from: form.from.trim(),
      to: form.to.trim(),
      days: Math.max(1, Number(form.days) || 1),
      reason: form.reason.trim(),
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(10px)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="aurora-card aurora-card-padding aurora-card-lift"
        style={{ width: 'min(760px, 100%)', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }}>
          <div>
            <div className="aurora-card-title">{copy.applyLeaveTitle}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{copy.applyLeaveSubtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.leaveForm.cancel}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              borderRadius: 12,
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
          </button>
        </div>

        {feedback && (
          <div style={feedbackStyle} role="alert" aria-live="polite">
            <Icon name="xMark" size={16} color="var(--danger)" strokeWidth={2} />
            <div>{feedback}</div>
          </div>
        )}

        <div className="aurora-screen-stack" style={{ gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.leaveForm.employee}</span>
              <input value={form.employee} onChange={(event) => setForm((current) => ({ ...current, employee: event.target.value }))} style={inputStyle} placeholder="Sarah Chen" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.leaveForm.leaveType}</span>
              <select value={form.leaveType} onChange={(event) => setForm((current) => ({ ...current, leaveType: event.target.value as LeaveBalanceLabel }))} style={inputStyle}>
                {LEAVE_TYPES.map((leaveType) => (
                  <option key={leaveType} value={leaveType}>
                    {leaveType}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.leaveForm.from}</span>
              <input value={form.from} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} style={inputStyle} placeholder="Apr 28" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.leaveForm.to}</span>
              <input value={form.to} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} style={inputStyle} placeholder="Apr 30" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.leaveForm.days}</span>
              <input value={form.days} onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))} style={inputStyle} inputMode="numeric" type="number" min={1} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.leaveForm.reason}</span>
              <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} style={inputStyle} placeholder="Family trip" />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>
              {copy.leaveForm.cancel}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
              {copy.leaveForm.submit}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
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
