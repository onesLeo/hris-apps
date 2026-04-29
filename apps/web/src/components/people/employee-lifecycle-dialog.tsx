'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Avatar, Badge, Button, Icon, type Accent } from '../aurora-primitives';
import type { PeopleCopy } from '../../i18n/people-copy';
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
      departmentId: string | undefined;
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
  copy: PeopleCopy;
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
  copy,
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
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFeedback(null);

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

  const title = mode === 'transfer' ? 'Transfer Employee' : mode === 'promote' ? 'Promote Employee' : 'Resign Employee';
  const subtitle =
    mode === 'transfer'
      ? 'Move the employee to a different department or location.'
      : mode === 'promote'
        ? 'Update the employee title and effective date.'
        : 'Record the resignation dates and optional reason.';
  const accent = getModeAccent(mode);
  const modeBadge = getModeBadge(mode);

  const submit = () => {
    setFeedback(null);
    if (mode === 'transfer') {
      const selectedDepartment = departmentOptions.find((department) => department.id === transferForm.departmentId);
      const selectedLocation = locationOptions.find((location) => location.id === transferForm.locationId);
      if (!selectedDepartment || !selectedLocation || !transferForm.jobTitle.trim() || !transferForm.effectiveDate.trim()) {
        setFeedback(copy.validation.transferRequired);
        return;
      }
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
      if (!promoteForm.jobTitle.trim() || !promoteForm.effectiveDate.trim()) {
        setFeedback(copy.validation.promoteRequired);
        return;
      }
      onSubmit({
        mode,
        departmentId: selectedDepartment?.id ?? undefined,
        jobTitle: promoteForm.jobTitle.trim() || employee.role,
        effectiveDate: promoteForm.effectiveDate,
      });
      return;
    }

    if (!resignForm.resignationDate.trim() || !resignForm.lastWorkingDate.trim() || !resignForm.reason.trim()) {
      setFeedback(copy.validation.resignRequired);
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
                <Avatar initials={employee.initials} color={employee.color} size={54} />
                <div style={{ minWidth: 0 }}>
                  <div className="aurora-card-title" style={{ fontSize: 24, marginBottom: 4 }}>
                    {title}
                  </div>
                  <div className="aurora-card-subtitle" style={{ lineHeight: 1.5 }}>
                    {subtitle}
                  </div>
                  <div style={metaRowStyle}>
                    <Badge label={modeBadge} tone={accent} />
                    <Badge label={employee.role} tone="ghost" />
                    <Badge label={employee.dept} tone="accent" />
                    <Badge label={employee.type} tone="violet" />
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

            <div style={previewCardStyle}>
              <div style={previewLabelStyle}>Current assignment</div>
              <div style={previewValueStyle}>{employee.role} in {employee.dept} / {employee.type}</div>
              <div style={previewHintStyle}>{getModeHint(mode, employee)}</div>
            </div>
          </div>
        </div>

        {feedback && (
          <div style={feedbackStyle} role="alert" aria-live="polite">
            <Icon name="xMark" size={16} color="var(--danger)" strokeWidth={2} />
            <div>{feedback}</div>
          </div>
        )}

        <div style={contentStyle}>
          {mode === 'transfer' && (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div className="aurora-card-title" style={{ fontSize: 16 }}>Transfer details</div>
                  <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                    Move the employee and optionally refresh the title and arrangement.
                  </div>
                </div>
                <Badge label="Assignment update" tone="accent" />
              </div>

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
            </div>
          )}

          {mode === 'promote' && (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div className="aurora-card-title" style={{ fontSize: 16 }}>Promotion details</div>
                  <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                    Update the title and keep the assignment aligned with the org structure.
                  </div>
                </div>
                <Badge label="Role update" tone="success" />
              </div>

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
            </div>
          )}

          {mode === 'resign' && (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div className="aurora-card-title" style={{ fontSize: 16 }}>Resignation details</div>
                  <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>
                    Capture the resignation and last working date for audit history.
                  </div>
                </div>
                <Badge label="Offboarding" tone="warning" />
              </div>

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
            </div>
          )}

          <div style={footerStyle}>
            <div className="aurora-card-subtitle">
              This action updates the employee lifecycle and keeps the audit trail in sync.
            </div>
            <div style={buttonRowStyle}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={submit}>
                <Icon name="check" size={14} color="#fff" strokeWidth={2} />
                Save
              </Button>
            </div>
          </div>
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

const previewCardStyle: CSSProperties = {
  marginTop: 18,
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.55)',
  background: 'rgba(255,255,255,0.48)',
};

const previewLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const previewValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const previewHintStyle: CSSProperties = {
  marginTop: 6,
  color: 'var(--text-muted)',
  fontSize: 13,
};

const contentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const panelStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: 16,
  background: 'var(--card-bg)',
};

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 14,
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

function getModeAccent(mode: EmployeeLifecycleMode): Accent {
  switch (mode) {
    case 'transfer':
      return 'accent';
    case 'promote':
      return 'success';
    case 'resign':
      return 'warning';
    default:
      return 'ghost';
  }
}

function getModeBadge(mode: EmployeeLifecycleMode): string {
  switch (mode) {
    case 'transfer':
      return 'Assignment update';
    case 'promote':
      return 'Role progression';
    case 'resign':
      return 'Offboarding record';
    default:
      return 'Employee action';
  }
}

function getModeHint(mode: EmployeeLifecycleMode, employee: Employee): string {
  if (mode === 'transfer') {
    return `Current assignment: ${employee.dept} / ${employee.type}. Choose the next department and location.`;
  }
  if (mode === 'promote') {
    return `The promotion can update the title while keeping the employee in the same or another department.`;
  }
  return 'Use the dates below to record the exit flow and keep the HR audit trail complete.';
}
