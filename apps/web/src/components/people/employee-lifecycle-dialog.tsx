'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Button, Icon } from '../aurora-primitives';
import type { Employee } from './people-data';
import type {
  OrganizationCatalogDepartment,
  OrganizationCatalogLocation,
} from '../../lib/organization-api';

export type EmployeeLifecycleMode = 'transfer' | 'promote' | 'resign';

export type EmployeeLifecycleSubmit =
  | {
      mode: 'transfer';
      departmentId: string;
      locationId: string;
      jobTitle: string;
      workArrangement: 'office' | 'remote' | 'hybrid';
      effectiveDate: string;
    }
  | {
      mode: 'promote';
      departmentId?: string;
      jobTitle: string;
      effectiveDate: string;
    }
  | {
      mode: 'resign';
      resignationDate: string;
      lastWorkingDate: string;
      reason: string;
    };

type EmployeeLifecycleDialogProps = {
  open: boolean;
  mode: EmployeeLifecycleMode;
  employee: Employee | undefined;
  departmentOptions: readonly OrganizationCatalogDepartment[];
  locationOptions: readonly OrganizationCatalogLocation[];
  onClose: () => void;
  onSubmit: (payload: EmployeeLifecycleSubmit) => void;
};

type TransferForm = {
  departmentId: string;
  locationId: string;
  jobTitle: string;
  workArrangement: 'office' | 'remote' | 'hybrid';
  effectiveDate: string;
};

type PromoteForm = {
  departmentId: string;
  jobTitle: string;
  effectiveDate: string;
};

type ResignForm = {
  resignationDate: string;
  lastWorkingDate: string;
  reason: string;
};

const today = new Date().toISOString().slice(0, 10);

export function EmployeeLifecycleDialog({
  open,
  mode,
  employee,
  departmentOptions,
  locationOptions,
  onClose,
  onSubmit,
}: EmployeeLifecycleDialogProps) {
  const initialDepartment = useMemo(
    () => departmentOptions.find((department) => department.name === employee?.dept) ?? departmentOptions[0],
    [departmentOptions, employee?.dept],
  );
  const initialLocation = useMemo(
    () =>
      locationOptions.find((location) => location.id === initialDepartment?.locationId)
      ?? locationOptions[0],
    [initialDepartment?.locationId, locationOptions],
  );

  const [transferForm, setTransferForm] = useState<TransferForm>({
    departmentId: initialDepartment?.id ?? '',
    locationId: initialLocation?.id ?? '',
    jobTitle: employee?.role ?? '',
    workArrangement: employee?.type?.toLowerCase() === 'remote'
      ? 'remote'
      : employee?.type?.toLowerCase() === 'hybrid'
        ? 'hybrid'
        : 'office',
    effectiveDate: today,
  });

  const [promoteForm, setPromoteForm] = useState<PromoteForm>({
    departmentId: initialDepartment?.id ?? '',
    jobTitle: employee?.role ?? '',
    effectiveDate: today,
  });

  const [resignForm, setResignForm] = useState<ResignForm>({
    resignationDate: today,
    lastWorkingDate: today,
    reason: '',
  });

  useEffect(() => {
    if (!open) return;

    const nextDepartment = departmentOptions.find((department) => department.name === employee?.dept) ?? departmentOptions[0];
    const nextLocation = locationOptions.find((location) => location.id === nextDepartment?.locationId) ?? locationOptions[0];
    setTransferForm({
      departmentId: nextDepartment?.id ?? '',
      locationId: nextLocation?.id ?? '',
      jobTitle: employee?.role ?? '',
      workArrangement: employee?.type?.toLowerCase() === 'remote'
        ? 'remote'
        : employee?.type?.toLowerCase() === 'hybrid'
          ? 'hybrid'
          : 'office',
      effectiveDate: today,
    });
    setPromoteForm({
      departmentId: nextDepartment?.id ?? '',
      jobTitle: employee?.role ?? '',
      effectiveDate: today,
    });
    setResignForm({
      resignationDate: today,
      lastWorkingDate: today,
      reason: '',
    });
  }, [departmentOptions, employee?.dept, employee?.role, employee?.type, locationOptions, open]);

  if (!open || !employee) {
    return null;
  }

  const title =
    mode === 'transfer'
      ? 'Transfer Employee'
      : mode === 'promote'
        ? 'Promote Employee'
        : 'Resign Employee';
  const subtitle =
    mode === 'transfer'
      ? 'Move the employee to a different department or location.'
      : mode === 'promote'
        ? 'Update the employee role and effective date.'
        : 'Record the resignation dates and optional reason.';

  const submit = () => {
    if (mode === 'transfer') {
      const selectedDepartment = departmentOptions.find((department) => department.id === transferForm.departmentId);
      const selectedLocation = locationOptions.find((location) => location.id === transferForm.locationId);
      if (!selectedDepartment || !selectedLocation) return;
      onSubmit({
        mode,
        departmentId: selectedDepartment.id,
        locationId: selectedLocation.id,
        jobTitle: transferForm.jobTitle.trim() || employee.role,
        workArrangement: transferForm.workArrangement,
        effectiveDate: transferForm.effectiveDate,
      });
      return;
    }

    if (mode === 'promote') {
      const selectedDepartment = departmentOptions.find((department) => department.id === promoteForm.departmentId);
      onSubmit({
        mode,
        departmentId: selectedDepartment?.id,
        jobTitle: promoteForm.jobTitle.trim() || employee.role,
        effectiveDate: promoteForm.effectiveDate,
      });
      return;
    }

    onSubmit({
      mode,
      resignationDate: resignForm.resignationDate,
      lastWorkingDate: resignForm.lastWorkingDate,
      reason: resignForm.reason.trim(),
    });
  };

  return (
    <div className="aurora-overlay" style={overlayStyle} onClick={onClose}>
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={cardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }}>
          <div>
            <div className="aurora-card-title">{title}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{subtitle}</div>
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

        {mode === 'transfer' && (
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <div className="aurora-dual-grid">
              <label className="field">
                <span className="aurora-card-subtitle">Department</span>
                <select
                  value={transferForm.departmentId}
                  onChange={(event) => {
                    const nextDepartment = departmentOptions.find((department) => department.id === event.target.value);
                    setTransferForm((current) => ({
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
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="aurora-card-subtitle">Location</span>
                <select
                  value={transferForm.locationId}
                  onChange={(event) => setTransferForm((current) => ({ ...current, locationId: event.target.value }))}
                  style={inputStyle}
                >
                  {locationOptions.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="aurora-dual-grid">
              <label className="field">
                <span className="aurora-card-subtitle">Job title</span>
                <input
                  value={transferForm.jobTitle}
                  onChange={(event) => setTransferForm((current) => ({ ...current, jobTitle: event.target.value }))}
                  style={inputStyle}
                />
              </label>
              <label className="field">
                <span className="aurora-card-subtitle">Effective date</span>
                <input
                  type="date"
                  value={transferForm.effectiveDate}
                  onChange={(event) => setTransferForm((current) => ({ ...current, effectiveDate: event.target.value }))}
                  style={inputStyle}
                />
              </label>
            </div>
            <label className="field">
              <span className="aurora-card-subtitle">Work arrangement</span>
              <select
                value={transferForm.workArrangement}
                onChange={(event) => setTransferForm((current) => ({ ...current, workArrangement: event.target.value as TransferForm['workArrangement'] }))}
                style={inputStyle}
              >
                <option value="office">Office</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
        )}

        {mode === 'promote' && (
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <div className="aurora-dual-grid">
              <label className="field">
                <span className="aurora-card-subtitle">New job title</span>
                <input
                  value={promoteForm.jobTitle}
                  onChange={(event) => setPromoteForm((current) => ({ ...current, jobTitle: event.target.value }))}
                  style={inputStyle}
                />
              </label>
              <label className="field">
                <span className="aurora-card-subtitle">Effective date</span>
                <input
                  type="date"
                  value={promoteForm.effectiveDate}
                  onChange={(event) => setPromoteForm((current) => ({ ...current, effectiveDate: event.target.value }))}
                  style={inputStyle}
                />
              </label>
            </div>
            <label className="field">
              <span className="aurora-card-subtitle">Department</span>
              <select
                value={promoteForm.departmentId}
                onChange={(event) => setPromoteForm((current) => ({ ...current, departmentId: event.target.value }))}
                style={inputStyle}
              >
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {mode === 'resign' && (
          <div className="aurora-screen-stack" style={{ gap: 14 }}>
            <div className="aurora-dual-grid">
              <label className="field">
                <span className="aurora-card-subtitle">Resignation date</span>
                <input
                  type="date"
                  value={resignForm.resignationDate}
                  onChange={(event) => setResignForm((current) => ({ ...current, resignationDate: event.target.value }))}
                  style={inputStyle}
                />
              </label>
              <label className="field">
                <span className="aurora-card-subtitle">Last working date</span>
                <input
                  type="date"
                  value={resignForm.lastWorkingDate}
                  onChange={(event) => setResignForm((current) => ({ ...current, lastWorkingDate: event.target.value }))}
                  style={inputStyle}
                />
              </label>
            </div>
            <label className="field">
              <span className="aurora-card-subtitle">Reason</span>
              <textarea
                value={resignForm.reason}
                onChange={(event) => setResignForm((current) => ({ ...current, reason: event.target.value }))}
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              />
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            <Icon name="check" size={14} color="#fff" strokeWidth={2} />
            Save
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

const inputStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 12px',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};
