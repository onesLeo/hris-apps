'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { PeopleCopy } from '../../i18n/people-copy';
import type { ContractType, CreateEmployeeInput, Employee, EmployeeStatus, WorkType } from './people-data';
import type {
  OrganizationCatalogDepartment,
  OrganizationCatalogLocation,
} from '../../lib/organization-api';

type PeopleDialogMode = 'create' | 'edit';

type ManagerOption = { id: string; name: string };

type PeopleCreateDialogProps = {
  open: boolean;
  mode: PeopleDialogMode;
  copy: PeopleCopy;
  initialEmployee: Employee | undefined;
  initialDepartmentId: string | undefined;
  initialLocationId: string | undefined;
  departmentOptions: readonly OrganizationCatalogDepartment[];
  locationOptions: readonly OrganizationCatalogLocation[];
  managerOptions: readonly ManagerOption[];
  onClose: () => void;
  onSubmit: (employee: CreateEmployeeInput) => void;
};

type FormState = {
  name: string;
  role: string;
  departmentId: string;
  locationId: string;
  managerId: string;
  status: EmployeeStatus;
  type: WorkType;
  since: string;
  contractType: ContractType;
  jobGrade: string;
  probationEndDate: string;
  noticePeriodDays: string;
};

const INITIAL_FORM_STATE: FormState = {
  name: '',
  role: '',
  departmentId: '',
  locationId: '',
  managerId: '',
  status: 'Active',
  type: 'Office',
  since: '',
  contractType: 'full_time',
  jobGrade: '',
  probationEndDate: '',
  noticePeriodDays: '',
};

// Terminated and Pre_Boarding are set by system actions, not manually via this form.
const STATUSES: readonly EmployeeStatus[] = ['Active', 'Suspended', 'On Leave'] as const;
const WORK_TYPES: readonly WorkType[] = ['Remote', 'Office', 'Hybrid'] as const;
const CONTRACT_TYPES: readonly ContractType[] = ['full_time', 'part_time', 'contract', 'intern'] as const;

export function PeopleCreateDialog({
  open,
  mode,
  copy,
  initialEmployee,
  initialDepartmentId,
  initialLocationId,
  departmentOptions,
  locationOptions,
  managerOptions,
  onClose,
  onSubmit,
}: PeopleCreateDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
      setFeedback(null);
      return;
    }

    if (mode === 'edit' && initialEmployee) {
      const initialDepartment = departmentOptions.find((department) => department.id === (initialDepartmentId ?? ''))
        ?? departmentOptions[0];
      const initialLocation =
        locationOptions.find((location) => location.id === (initialLocationId ?? ''))
        ?? (initialDepartment
          ? locationOptions.find((location) => location.id === initialDepartment.locationId)
          : undefined)
        ?? locationOptions[0];
      setForm({
        name: initialEmployee.name,
        role: initialEmployee.role,
        departmentId: initialDepartment?.id ?? '',
        locationId: initialLocation?.id ?? '',
        managerId: initialEmployee.managerId ?? '',
        status: (STATUSES as readonly string[]).includes(initialEmployee.status)
          ? initialEmployee.status as EmployeeStatus
          : 'Active',
        type: initialEmployee.type,
        since: initialEmployee.since,
        contractType: initialEmployee.contractType ?? 'full_time',
        jobGrade: initialEmployee.jobGrade ?? '',
        probationEndDate: initialEmployee.probationEndDate ?? '',
        noticePeriodDays: initialEmployee.noticePeriodDays != null ? String(initialEmployee.noticePeriodDays) : '',
      });
      return;
    }

    const defaultDepartment = departmentOptions[0];
    const defaultLocation =
      defaultDepartment
        ? locationOptions.find((location) => location.id === defaultDepartment.locationId)
        : undefined;
    setForm({
      ...INITIAL_FORM_STATE,
      departmentId: defaultDepartment?.id ?? '',
      locationId: defaultLocation?.id ?? locationOptions[0]?.id ?? '',
      managerId: '',
    });
  }, [departmentOptions, initialDepartmentId, initialEmployee, initialLocationId, locationOptions, mode, open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    setFeedback(null);
    const selectedDepartment = departmentOptions.find((option) => option.id === form.departmentId);
    const selectedLocation = locationOptions.find((option) => option.id === form.locationId);
    if (!form.name.trim() || !form.role.trim() || !form.since.trim() || !selectedDepartment || !selectedLocation) {
      setFeedback(copy.validation.createRequired);
      return;
    }

    const derivedLocation = locationOptions.find((location) => location.id === selectedDepartment.locationId) ?? selectedLocation;

    const noticeDays = form.noticePeriodDays.trim() ? Number(form.noticePeriodDays.trim()) : undefined;

    onSubmit({
      name: form.name.trim(),
      role: form.role.trim(),
      departmentId: selectedDepartment.id,
      departmentName: selectedDepartment.name,
      locationId: derivedLocation.id,
      locationName: derivedLocation.name,
      status: form.status,
      type: form.type,
      since: form.since.trim(),
      ...(form.managerId ? { managerId: form.managerId } : {}),
      contractType: form.contractType,
      ...(form.jobGrade.trim() ? { jobGrade: form.jobGrade.trim() } : {}),
      ...(form.probationEndDate.trim() ? { probationEndDate: form.probationEndDate.trim() } : {}),
      ...(noticeDays != null && !isNaN(noticeDays) ? { noticePeriodDays: noticeDays } : {}),
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

        {feedback && (
          <div style={feedbackStyle} role="alert" aria-live="polite">
            <Icon name="xMark" size={16} color="var(--danger)" strokeWidth={2} />
            <div>{feedback}</div>
          </div>
        )}

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
              <select
                value={form.departmentId}
                onChange={(event) => {
                  const nextDepartment = departmentOptions.find((department) => department.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                    locationId: nextDepartment
                      ? locationOptions.find((location) => location.id === nextDepartment.locationId)?.id ?? current.locationId
                      : current.locationId,
                  }));
                }}
                style={inputStyle}
              >
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.location}</span>
              <select value={form.locationId} onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))} style={inputStyle}>
                {locationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span className="aurora-card-subtitle">{copy.employeeForm.manager}</span>
            <select value={form.managerId} onChange={(event) => setForm((current) => ({ ...current, managerId: event.target.value }))} style={inputStyle}>
              <option value="">— {copy.employeeForm.manager} (optional)</option>
              {managerOptions.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </label>

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
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.joined}</span>
              <input value={form.since} onChange={(event) => setForm((current) => ({ ...current, since: event.target.value }))} style={inputStyle} placeholder="Apr 2026" />
            </label>
          </div>

          <div style={sectionDividerStyle}>
            <span style={sectionLabelStyle}>Contract details</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.contractType}</span>
              <select value={form.contractType} onChange={(event) => setForm((current) => ({ ...current, contractType: event.target.value as ContractType }))} style={inputStyle}>
                {CONTRACT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{copy.employeeForm.contractTypeOptions[ct]}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.jobGrade}</span>
              <input value={form.jobGrade} onChange={(event) => setForm((current) => ({ ...current, jobGrade: event.target.value }))} style={inputStyle} placeholder="e.g. IC3, Grade 7" />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.probationEndDate}</span>
              <input type="date" value={form.probationEndDate} onChange={(event) => setForm((current) => ({ ...current, probationEndDate: event.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="aurora-card-subtitle">{copy.employeeForm.noticePeriodDays}</span>
              <input type="number" min={0} value={form.noticePeriodDays} onChange={(event) => setForm((current) => ({ ...current, noticePeriodDays: event.target.value }))} style={inputStyle} placeholder="30" />
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

const sectionDividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 4,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
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
