'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { PeopleCopy } from '../../i18n/people-copy';
import type { CreateEmployeeInput, Employee, EmployeeStatus, WorkType } from './people-data';

type PeopleDialogMode = 'create' | 'edit';

type PeopleCreateDialogProps = {
  open: boolean;
  mode: PeopleDialogMode;
  copy: PeopleCopy;
  initialEmployee: Employee | undefined;
  onClose: () => void;
  onSubmit: (employee: CreateEmployeeInput) => void;
};

type FormState = {
  name: string;
  role: string;
  dept: string;
  status: EmployeeStatus;
  type: WorkType;
  since: string;
};

const INITIAL_FORM_STATE: FormState = {
  name: '',
  role: '',
  dept: '',
  status: 'Active',
  type: 'Office',
  since: '',
};

const STATUSES: readonly EmployeeStatus[] = ['Active', 'Suspended', 'On Leave', 'Pending', 'Approved', 'Rejected'] as const;
const WORK_TYPES: readonly WorkType[] = ['Remote', 'Office', 'Hybrid'] as const;

export function PeopleCreateDialog({ open, mode, copy, initialEmployee, onClose, onSubmit }: PeopleCreateDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
      return;
    }

    if (mode === 'edit' && initialEmployee) {
      setForm({
        name: initialEmployee.name,
        role: initialEmployee.role,
        dept: initialEmployee.dept,
        status: initialEmployee.status,
        type: initialEmployee.type,
        since: initialEmployee.since,
      });
      return;
    }

    setForm(INITIAL_FORM_STATE);
  }, [initialEmployee, mode, open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    if (!form.name.trim() || !form.role.trim() || !form.dept.trim() || !form.since.trim()) {
      return;
    }

    onSubmit({
      name: form.name.trim(),
      role: form.role.trim(),
      dept: form.dept.trim(),
      status: form.status,
      type: form.type,
      since: form.since.trim(),
    });

    onClose();
  };

  const title = mode === 'edit' ? copy.editEmployeeTitle : copy.addEmployeeTitle;
  const subtitle = mode === 'edit' ? copy.editEmployeeSubtitle : copy.addEmployeeSubtitle;

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
            <div className="aurora-card-title">{title}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.employeeForm.cancel}
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
              <span className="aurora-card-subtitle">{copy.employeeForm.name}</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={inputStyle} placeholder="Alex Lee" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.role}</span>
              <input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} style={inputStyle} placeholder="People Analyst" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.department}</span>
              <input value={form.dept} onChange={(event) => setForm((current) => ({ ...current, dept: event.target.value }))} style={inputStyle} placeholder="People Ops" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.joined}</span>
              <input value={form.since} onChange={(event) => setForm((current) => ({ ...current, since: event.target.value }))} style={inputStyle} placeholder="Apr 2026" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.status}</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EmployeeStatus }))} style={inputStyle}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.workType}</span>
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as WorkType }))} style={inputStyle}>
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>
              {copy.employeeForm.cancel}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
              {copy.employeeForm.submit}
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
