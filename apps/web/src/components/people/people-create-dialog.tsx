'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { PeopleCopy } from '../../i18n/people-copy';
import type { CreateEmployeeInput, Employee, EmployeeStatus, WorkType } from './people-data';
import type {
  OrganizationCatalogDepartment,
  OrganizationCatalogLocation,
} from '../../lib/organization-api';

type PeopleDialogMode = 'create' | 'edit';

type PeopleCreateDialogProps = {
  open: boolean;
  mode: PeopleDialogMode;
  copy: PeopleCopy;
  initialEmployee: Employee | undefined;
  initialDepartmentId: string | undefined;
  initialLocationId: string | undefined;
  departmentOptions: readonly OrganizationCatalogDepartment[];
  locationOptions: readonly OrganizationCatalogLocation[];
  onClose: () => void;
  onSubmit: (employee: CreateEmployeeInput) => void;
};

type FormState = {
  name: string;
  role: string;
  departmentId: string;
  locationId: string;
  status: EmployeeStatus;
  type: WorkType;
  since: string;
};

const INITIAL_FORM_STATE: FormState = {
  name: '',
  role: '',
  departmentId: '',
  locationId: '',
  status: 'Active',
  type: 'Office',
  since: '',
};

const STATUSES: readonly EmployeeStatus[] = ['Active', 'Suspended', 'On Leave', 'Pending', 'Approved', 'Rejected'] as const;
const WORK_TYPES: readonly WorkType[] = ['Remote', 'Office', 'Hybrid'] as const;

export function PeopleCreateDialog({
  open,
  mode,
  copy,
  initialEmployee,
  initialDepartmentId,
  initialLocationId,
  departmentOptions,
  locationOptions,
  onClose,
  onSubmit,
}: PeopleCreateDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE);
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
        status: initialEmployee.status,
        type: initialEmployee.type,
        since: initialEmployee.since,
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
    });
  }, [departmentOptions, initialDepartmentId, initialEmployee, initialLocationId, locationOptions, mode, open]);

  if (!open) {
    return null;
  }

  const submit = () => {
    const selectedDepartment = departmentOptions.find((option) => option.id === form.departmentId);
    const selectedLocation = locationOptions.find((option) => option.id === form.locationId);
    if (!form.name.trim() || !form.role.trim() || !form.since.trim() || !selectedDepartment || !selectedLocation) {
      return;
    }

    const derivedLocation = locationOptions.find((location) => location.id === selectedDepartment.locationId) ?? selectedLocation;

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
