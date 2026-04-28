'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { RecruitmentCopy } from '../../i18n/recruitment-copy';
import type { CreateRequisitionInput, OpenRequisition, RecruitmentStage } from './recruitment-data';

type RecruitmentDialogMode = 'create' | 'edit';

type RecruitmentCreateDialogProps = {
  open: boolean;
  mode: RecruitmentDialogMode;
  copy: RecruitmentCopy;
  initialRequisition: OpenRequisition | undefined;
  onClose: () => void;
  onSubmit: (requisition: CreateRequisitionInput) => void;
};

type FormState = {
  title: string;
  department: string;
  location: string;
  openings: string;
  stage: RecruitmentStage;
  recruiter: string;
  priority: CreateRequisitionInput['priority'];
};

const INITIAL_FORM_STATE: FormState = {
  title: '',
  department: '',
  location: '',
  openings: '1',
  stage: 'Sourcing',
  recruiter: '',
  priority: 'Medium',
};

const STAGES: readonly RecruitmentStage[] = ['Sourcing', 'Screening', 'Interview', 'Offer'] as const;
const PRIORITIES: readonly CreateRequisitionInput['priority'][] = ['High', 'Medium', 'Low'] as const;

export function RecruitmentCreateDialog({ open, mode, copy, initialRequisition, onClose, onSubmit }: RecruitmentCreateDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
      return;
    }

    if (mode === 'edit' && initialRequisition) {
      setForm({
        title: initialRequisition.title,
        department: initialRequisition.department,
        location: initialRequisition.location,
        openings: String(initialRequisition.openings),
        stage: initialRequisition.stage,
        recruiter: initialRequisition.recruiter,
        priority: initialRequisition.priority,
      });
      return;
    }

    setForm(INITIAL_FORM_STATE);
  }, [initialRequisition, mode, open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    if (!form.title.trim() || !form.department.trim() || !form.location.trim() || !form.recruiter.trim()) {
      return;
    }

    onSubmit({
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      openings: Number(form.openings) || 1,
      stage: form.stage,
      recruiter: form.recruiter.trim(),
      priority: form.priority,
    });

    onClose();
  };

  const title = mode === 'edit' ? copy.editRequisitionTitle : copy.createRequisitionTitle;
  const subtitle = mode === 'edit' ? copy.editRequisitionSubtitle : copy.createRequisitionSubtitle;

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
            <div className="aurora-card-title">{title}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.requisitionForm.cancel}
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
              <span className="aurora-card-subtitle">{copy.requisitionForm.title}</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} style={inputStyle} placeholder="Senior Backend Engineer" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.requisitionForm.department}</span>
              <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} style={inputStyle} placeholder="Engineering" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.requisitionForm.location}</span>
              <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} style={inputStyle} placeholder="Jakarta" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.requisitionForm.openings}</span>
              <input value={form.openings} onChange={(event) => setForm((current) => ({ ...current, openings: event.target.value }))} style={inputStyle} inputMode="numeric" type="number" min={1} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.requisitionForm.stage}</span>
              <select value={form.stage} onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value as RecruitmentStage }))} style={inputStyle}>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.requisitionForm.priority}</span>
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as CreateRequisitionInput['priority'] }))} style={inputStyle}>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.requisitionForm.recruiter}</span>
              <input value={form.recruiter} onChange={(event) => setForm((current) => ({ ...current, recruiter: event.target.value }))} style={inputStyle} placeholder="Alya Putri" />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>
              {copy.requisitionForm.cancel}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
              {copy.requisitionForm.submit}
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
