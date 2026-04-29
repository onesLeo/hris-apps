'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { PerformanceCopy } from '../../i18n/performance-copy';
import type { CreatePerformanceCycleInput, PerformanceCycle, PerformanceStatus } from './performance-data';

type PerformanceCreateDialogProps = {
  open: boolean;
  copy: PerformanceCopy;
  onClose: () => void;
  onSubmit: (cycle: CreatePerformanceCycleInput) => void;
};

type FormState = {
  name: string;
  period: string;
  status: PerformanceStatus;
  participants: string;
  completion: string;
};

const INITIAL_FORM_STATE: FormState = {
  name: '',
  period: '',
  status: 'Scheduled',
  participants: '0',
  completion: '0',
};

const STATUSES: readonly PerformanceStatus[] = ['Scheduled', 'In Review', 'Completed', 'Overdue'] as const;

export function PerformanceCreateDialog({ open, copy, onClose, onSubmit }: PerformanceCreateDialogProps) {
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
    const participants = Number(form.participants);
    const completion = Number(form.completion);

    if (!form.name.trim() || !form.period.trim()) {
      setFeedback(copy.validation.required);
      return;
    }

    if (!Number.isFinite(participants) || participants < 0 || !Number.isFinite(completion) || completion < 0 || completion > 100) {
      setFeedback(copy.validation.invalidNumbers);
      return;
    }

    onSubmit({
      name: form.name.trim(),
      period: form.period.trim(),
      status: form.status,
      participants,
      completion,
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
        style={{ width: 'min(680px, 100%)', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }}>
          <div>
            <div className="aurora-card-title">{copy.createCycleTitle}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{copy.createCycleSubtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.cycleForm.cancel}
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
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="aurora-card-subtitle">{copy.cycleForm.name}</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              style={inputStyle}
              placeholder="Q3 Review"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.cycleForm.period}</span>
              <input
                value={form.period}
                onChange={(event) => setForm((current) => ({ ...current, period: event.target.value }))}
                style={inputStyle}
                placeholder="Jul - Sep 2026"
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.cycleForm.status}</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PerformanceStatus }))}
                style={inputStyle}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.cycleForm.participants}</span>
              <input
                value={form.participants}
                onChange={(event) => setForm((current) => ({ ...current, participants: event.target.value }))}
                style={inputStyle}
                inputMode="numeric"
                type="number"
                min={0}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.cycleForm.completion}</span>
              <input
                value={form.completion}
                onChange={(event) => setForm((current) => ({ ...current, completion: event.target.value }))}
                style={inputStyle}
                inputMode="numeric"
                type="number"
                min={0}
                max={100}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>
              {copy.cycleForm.cancel}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
              {copy.cycleForm.submit}
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
