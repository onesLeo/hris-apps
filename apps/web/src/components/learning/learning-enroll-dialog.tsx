'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { LearningCopy } from '../../i18n/learning-copy';
import type { CreateLearningCourseInput, LearningCourse, LearningStatus } from './learning-data';

type LearningEnrollDialogProps = {
  open: boolean;
  copy: LearningCopy;
  onClose: () => void;
  onSubmit: (course: CreateLearningCourseInput) => void;
};

type FormState = {
  title: string;
  owner: string;
  duration: string;
  status: LearningStatus;
  due: string;
};

const INITIAL_FORM_STATE: FormState = {
  title: '',
  owner: '',
  duration: '2h',
  status: 'Optional',
  due: '',
};

const STATUSES: readonly LearningStatus[] = ['Mandatory', 'Optional', 'In Progress', 'Completed'] as const;

export function LearningEnrollDialog({ open, copy, onClose, onSubmit }: LearningEnrollDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    if (!form.title.trim() || !form.owner.trim() || !form.due.trim()) {
      return;
    }

    onSubmit({
      title: form.title.trim(),
      owner: form.owner.trim(),
      duration: form.duration.trim(),
      status: form.status,
      due: form.due.trim(),
      enrolled: 0,
      completion: form.status === 'Completed' ? 100 : 0,
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
        style={{ width: 'min(720px, 100%)', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }}>
          <div>
            <div className="aurora-card-title">{copy.enrollCourseTitle}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{copy.enrollCourseSubtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.courseForm.cancel}
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

        <div className="aurora-screen-stack" style={{ gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.courseForm.title}</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} style={inputStyle} placeholder="Leadership Essentials" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.courseForm.owner}</span>
              <input value={form.owner} onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} style={inputStyle} placeholder="People Ops" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.courseForm.duration}</span>
              <input value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} style={inputStyle} placeholder="3h" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.courseForm.due}</span>
              <input value={form.due} onChange={(event) => setForm((current) => ({ ...current, due: event.target.value }))} style={inputStyle} placeholder="May 30" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="aurora-card-subtitle">{copy.courseForm.status}</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as LearningStatus }))} style={inputStyle}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>
              {copy.courseForm.cancel}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
              {copy.courseForm.submit}
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
