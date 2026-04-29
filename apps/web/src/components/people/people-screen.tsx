'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Avatar, Button, Icon } from '../aurora-primitives';
import { getOnboardingCopy, getPeopleCopy, useLocale } from '../../i18n';
import { getOrganizationOverview } from '../organization/organization-data';
import { PeopleCreateDialog } from './people-create-dialog';
import {
  EmployeeLifecycleDialog,
  type EmployeeLifecycleMode,
  type EmployeeLifecycleSubmit,
} from './employee-lifecycle-dialog';
import { EmployeeOnboardingDialog } from './employee-onboarding-dialog';
import { EmployeeHistoryDialog } from './employee-history-dialog';
import {
  addEmployee,
  EMPLOYEES,
  filterEmployees,
  getEmployeeKey,
  PEOPLE_FILTERS,
  suspendEmployee,
  terminateEmployeeLocally,
  updateEmployee,
  type CreateEmployeeInput,
  type Employee,
  type EmployeeStatus,
  type WorkType,
} from './people-data';
import {
  fetchEmployees,
  createEmployee as apiCreate,
  updateEmployee as apiUpdate,
  suspendEmployee as apiSuspend,
  transferEmployee as apiTransfer,
  promoteEmployee as apiPromote,
  resignEmployee as apiResign,
  fetchEmployeeHistory as apiHistory,
  terminateEmployee as apiTerminate,
  rehireEmployee as apiRehire,
  secondEmployee as apiSecond,
  type EmployeeHistory,
} from '../../lib/employee-api';
import {
  fetchOrganizationCatalog,
  type OrganizationCatalogDepartment,
  type OrganizationCatalogLocation,
} from '../../lib/organization-api';

const BADGE_TONE: Record<EmployeeStatus | WorkType, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  Active: 'success',
  Suspended: 'ghost',
  'On Leave': 'warning',
  Terminated: 'danger',
  Pre_Boarding: 'info',
  Remote: 'info',
  Office: 'violet',
  Hybrid: 'accent',
};

export function PeopleScreen() {
  const { locale } = useLocale();
  const localeCopy = getPeopleCopy(locale);
  const [filter, setFilter] = useState<'All' | 'Active' | 'On Leave' | 'Terminated' | 'Remote' | 'Office'>('All');
  const [search, setSearch] = useState('');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [lifecycleMode, setLifecycleMode] = useState<EmployeeLifecycleMode | null>(null);
  const [lifecycleKey, setLifecycleKey] = useState<string | null>(null);
  const [onboardingKey, setOnboardingKey] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeHistory | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [employeesApiReady, setEmployeesApiReady] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const fallbackOrganization = getOrganizationOverview(locale);
  const [departmentOptions, setDepartmentOptions] = useState<OrganizationCatalogDepartment[]>(
    fallbackOrganization.departmentMap.map((department, index) => ({
      id: `mock-dept-${index + 1}`,
      name: department.name,
      code: department.name.toLowerCase().replace(/\s+/g, '-'),
      locationId: `mock-loc-${index + 1}`,
      locationName: fallbackOrganization.locations[0]?.name ?? 'Headquarters',
    })),
  );
  const [locationOptions, setLocationOptions] = useState<OrganizationCatalogLocation[]>(
    fallbackOrganization.locations.map((location, index) => ({
      id: `mock-loc-${index + 1}`,
      name: location.name,
      code: location.name.toLowerCase().replace(/\s+/g, '-'),
    })),
  );

  // Attempt to load real data from the API on mount.
  // Falls back silently to the mock EMPLOYEES array if the API is unavailable
  // (e.g. no token, dev without backend running).
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([fetchEmployees(), fetchOrganizationCatalog()]).then(([employeesResult, catalogResult]) => {
      if (cancelled) return;

      if (employeesResult.status === 'fulfilled') {
        setEmployees(employeesResult.value);
        setEmployeesApiReady(true);
      } else {
        setEmployeesApiReady(false);
      }

      if (catalogResult.status === 'fulfilled' && catalogResult.value.locations.length > 0 && catalogResult.value.departments.length > 0) {
        setDepartmentOptions(catalogResult.value.departments);
        setLocationOptions(catalogResult.value.locations);
        setCatalogReady(true);
      } else {
        setCatalogReady(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel = (label: EmployeeStatus | WorkType) => localeCopy.status[label];

  const filtered = useMemo(
    () => filterEmployees(employees, filter, search),
    [employees, filter, search],
  );

  const editingEmployee = editingKey
    ? employees.find((e) => getEmployeeKey(e) === editingKey)
    : undefined;

  const editingDepartment = editingEmployee
    ? departmentOptions.find((department) => department.name === editingEmployee.dept)
    : undefined;
  const editingLocation = editingDepartment
    ? locationOptions.find((location) => location.id === editingDepartment.locationId)
    : locationOptions[0];

  const closeDialog = () => {
    setDialogMode(null);
    setEditingKey(null);
  };

  const openCreateDialog = () => {
    setEditingKey(null);
    setDialogMode('create');
  };

  const openEditDialog = (employee: Employee) => {
    setEditingKey(getEmployeeKey(employee));
    setDialogMode('edit');
  };

  const openLifecycleDialog = (employee: Employee, mode: EmployeeLifecycleMode) => {
    setEditingKey(null);
    setLifecycleKey(getEmployeeKey(employee));
    setLifecycleMode(mode);
  };

  const closeLifecycleDialog = () => {
    setLifecycleMode(null);
    setLifecycleKey(null);
  };

  const openOnboardingDialog = (employee: Employee) => {
    setOnboardingKey(getEmployeeKey(employee));
  };

  const closeOnboardingDialog = () => {
    setOnboardingKey(null);
  };

  const openHistoryDialog = async (employee: Employee) => {
    setLifecycleKey(getEmployeeKey(employee));
    setHistoryOpen(true);
    setHistoryError(null);
    setEmployeeHistory(null);

    if (!employeesApiReady || !employee.id) {
      setHistoryError(localeCopy.validation.historyUnavailable);
      return;
    }

    setHistoryLoading(true);
    try {
      const history = await apiHistory(employee.id);
      setEmployeeHistory(history);
    } catch {
      setHistoryError(localeCopy.validation.historyFailed);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryDialog = () => {
    setHistoryOpen(false);
    setHistoryLoading(false);
    setHistoryError(null);
    setEmployeeHistory(null);
  };

  const refreshEmployees = async () => {
    try {
      const freshEmployees = await fetchEmployees();
      setEmployees(freshEmployees);
      setEmployeesApiReady(true);
    } catch {
      setEmployeesApiReady(false);
    }
  };

  const submitLifecycleDialog = async (payload: EmployeeLifecycleSubmit) => {
    const target = lifecycleKey ? employees.find((employee) => getEmployeeKey(employee) === lifecycleKey) : undefined;
    if (!target) {
      closeLifecycleDialog();
      return;
    }
    const employeeKey = lifecycleKey ?? getEmployeeKey(target);

    if (payload.mode === 'transfer') {
      if (employeesApiReady && catalogReady && target.id) {
        try {
          const updated = await apiTransfer(target.id, {
            departmentId: payload.departmentId,
            locationId: payload.locationId,
            jobTitle: payload.jobTitle,
            workArrangement: payload.workArrangement,
            effectiveDate: payload.effectiveDate,
          });
          setEmployees((curr) => curr.map((employee) => (employee.id === updated.id ? updated : employee)));
          closeLifecycleDialog();
          return;
        } catch {
          // fall back to local update
        }
      }

      const selectedDepartment = departmentOptions.find((department) => department.id === payload.departmentId);
      const selectedLocation = locationOptions.find((location) => location.id === payload.locationId);
      const currentDepartment = departmentOptions.find((department) => department.name === target.dept) ?? selectedDepartment;
      const currentLocation = currentDepartment
        ? locationOptions.find((location) => location.id === currentDepartment.locationId) ?? selectedLocation
        : selectedLocation;
      setEmployees((curr) =>
        updateEmployee(curr, employeeKey, {
          name: target.name,
          role: payload.jobTitle,
          departmentId: selectedDepartment?.id ?? currentDepartment?.id ?? payload.departmentId,
          departmentName: selectedDepartment?.name ?? currentDepartment?.name ?? target.dept,
          locationId: currentLocation?.id ?? payload.locationId,
          locationName: currentLocation?.name ?? '',
          status: target.status,
          type: payload.workArrangement === 'remote'
            ? 'Remote'
            : payload.workArrangement === 'hybrid'
              ? 'Hybrid'
              : 'Office',
          since: target.since,
        }),
      );
      closeLifecycleDialog();
      return;
    }

    if (payload.mode === 'promote') {
      if (employeesApiReady && catalogReady && target.id) {
        try {
          const updated = await apiPromote(target.id, {
            jobTitle: payload.jobTitle,
            departmentId: payload.departmentId,
            effectiveDate: payload.effectiveDate,
          });
          setEmployees((curr) => curr.map((employee) => (employee.id === updated.id ? updated : employee)));
          closeLifecycleDialog();
          return;
        } catch {
          // fall back to local update
        }
      }

      const selectedDepartment = payload.departmentId
        ? departmentOptions.find((department) => department.id === payload.departmentId)
        : undefined;
      const currentDepartment = departmentOptions.find((department) => department.name === target.dept);
      const currentLocation = currentDepartment
        ? locationOptions.find((location) => location.id === currentDepartment.locationId)
        : locationOptions[0];
      setEmployees((curr) =>
        updateEmployee(curr, employeeKey, {
          name: target.name,
          role: payload.jobTitle,
          departmentId: selectedDepartment?.id ?? currentDepartment?.id ?? '',
          departmentName: selectedDepartment?.name ?? currentDepartment?.name ?? target.dept,
          locationId: currentLocation?.id ?? '',
          locationName: currentLocation?.name ?? '',
          status: target.status,
          type: target.type,
          since: target.since,
        }),
      );
      closeLifecycleDialog();
      return;
    }

    if (payload.mode === 'rehire') {
      if (employeesApiReady && target.id) {
        try {
          const updated = await apiRehire(target.id, {
            newHireDate: payload.newHireDate,
            jobTitle: payload.jobTitle,
            departmentId: payload.departmentId,
            locationId: payload.locationId,
            workArrangement: payload.workArrangement,
          });
          setEmployees((curr) => curr.map((employee) => (employee.id === updated.id ? updated : employee)));
          closeLifecycleDialog();
          return;
        } catch {
          // fall through to local update
        }
      }
      const rehireDept = departmentOptions.find((d) => d.id === payload.departmentId);
      const rehireLoc = locationOptions.find((l) => l.id === payload.locationId);
      setEmployees((curr) =>
        updateEmployee(curr, employeeKey, {
          name: target.name,
          role: payload.jobTitle,
          departmentId: payload.departmentId,
          departmentName: rehireDept?.name ?? target.dept,
          locationId: payload.locationId,
          locationName: rehireLoc?.name ?? '',
          status: 'Active',
          type: payload.workArrangement === 'remote' ? 'Remote' : payload.workArrangement === 'hybrid' ? 'Hybrid' : 'Office',
          since: payload.newHireDate,
        }),
      );
      closeLifecycleDialog();
      return;
    }

    if (payload.mode === 'secondment') {
      if (employeesApiReady && target.id) {
        try {
          const updated = await apiSecond(target.id, {
            hostDepartmentId: payload.hostDepartmentId,
            hostLocationId: payload.hostLocationId,
            ...(payload.jobTitleAtHost ? { jobTitleAtHost: payload.jobTitleAtHost } : {}),
            startDate: payload.startDate,
            expectedReturnDate: payload.expectedReturnDate,
          });
          setEmployees((curr) => curr.map((employee) => (employee.id === updated.id ? updated : employee)));
          closeLifecycleDialog();
          return;
        } catch {
          // fall through to local update
        }
      }
      const hostDept = departmentOptions.find((d) => d.id === payload.hostDepartmentId);
      const hostLoc = locationOptions.find((l) => l.id === payload.hostLocationId);
      setEmployees((curr) =>
        updateEmployee(curr, employeeKey, {
          name: target.name,
          role: payload.jobTitleAtHost || target.role,
          departmentId: payload.hostDepartmentId,
          departmentName: hostDept?.name ?? target.dept,
          locationId: payload.hostLocationId,
          locationName: hostLoc?.name ?? '',
          status: target.status,
          type: target.type,
          since: target.since,
        }),
      );
      closeLifecycleDialog();
      return;
    }

    if (employeesApiReady && target.id) {
      try {
        const updated = await apiResign(target.id, {
          resignationDate: payload.resignationDate,
          lastWorkingDate: payload.lastWorkingDate,
          reason: payload.reason,
        });
        setEmployees((curr) => curr.map((employee) => (employee.id === updated.id ? updated : employee)));
        closeLifecycleDialog();
        return;
      } catch {
        // fall through
      }
    }

    const currentDepartment = departmentOptions.find((department) => department.name === target.dept) ?? departmentOptions[0];
    const currentLocation = currentDepartment
      ? locationOptions.find((location) => location.id === currentDepartment.locationId) ?? locationOptions[0]
      : locationOptions[0];

    setEmployees((curr) =>
      updateEmployee(curr, employeeKey, {
        name: target.name,
        role: target.role,
        departmentId: currentDepartment?.id ?? '',
        departmentName: currentDepartment?.name ?? target.dept,
        locationId: currentLocation?.id ?? '',
        locationName: currentLocation?.name ?? '',
        status: 'Active',
        type: target.type,
        since: target.since,
      }),
    );
    closeLifecycleDialog();
  };

  const submitDialog = async (input: CreateEmployeeInput) => {
    if (dialogMode === 'edit' && editingKey) {
      const target = employees.find((e) => getEmployeeKey(e) === editingKey);
      if (employeesApiReady && target?.id) {
        try {
          const updated = await apiUpdate(target.id, input);
          setEmployees((curr) =>
            curr.map((e) => (e.id === updated.id ? updated : e)),
          );
          closeDialog();
          return;
        } catch {
          // fall through to local state update
        }
      }
      setEmployees((curr) => updateEmployee(curr, editingKey, input));
      closeDialog();
      return;
    }

    if (employeesApiReady && catalogReady) {
      try {
        const created = await apiCreate(input);
        setEmployees((curr) => [created, ...curr]);
        closeDialog();
        return;
      } catch {
        // fall through to local state
      }
    }
    setEmployees((curr) => addEmployee(curr, input));
    closeDialog();
  };

  const toggleSuspendEmployee = async (employee: Employee) => {
    const key = getEmployeeKey(employee);
    if (employee.status === 'Suspended') {
      // Reactivation — no API endpoint in Phase 2, local only
      const department = departmentOptions.find((item) => item.name === employee.dept) ?? departmentOptions[0];
      const location = department
        ? locationOptions.find((item) => item.id === department.locationId) ?? locationOptions[0]
        : locationOptions[0];
      setEmployees((curr) =>
        updateEmployee(curr, key, {
          name: employee.name,
          role: employee.role,
          departmentId: department?.id ?? '',
          departmentName: department?.name ?? employee.dept,
          locationId: location?.id ?? '',
          locationName: location?.name ?? '',
          status: 'Active',
          type: employee.type,
          since: employee.since,
        }),
      );
      return;
    }

    if (employeesApiReady && employee.id) {
      try {
        const updated = await apiSuspend(employee.id);
        setEmployees((curr) =>
          curr.map((e) => (e.id === updated.id ? updated : e)),
        );
        return;
      } catch {
        // fall through
      }
    }
    setEmployees((curr) => suspendEmployee(curr, key));
  };

  const terminateCurrentEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(localeCopy.actionMenu.terminateConfirm);
    if (!confirmed) return;

    if (employeesApiReady && employee.id) {
      try {
        await apiTerminate(employee.id);
      } catch {
        // fall through — mark locally regardless
      }
    }
    // Keep the row in state, change status to Terminated so they appear under the Terminated filter.
    setEmployees((curr) => terminateEmployeeLocally(curr, getEmployeeKey(employee)));
  };

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)', borderRadius: 12, padding: '9px 14px', border: '1px solid var(--border)', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={15} color="var(--text-muted)" strokeWidth={2} />
          <input
            value={search}
            onChange={(event) => setSearch((event.target as HTMLInputElement).value)}
            placeholder={localeCopy.searchPlaceholder}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13, color: 'var(--text-primary)' }}
          />
        </div>

        <div className="aurora-pill-row">
          {PEOPLE_FILTERS.map((item) => (
            <button key={item} type="button" className={`aurora-pill ${filter === item ? 'is-active' : ''}`} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" onClick={openCreateDialog}>
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
            {localeCopy.addEmployee}
          </Button>
        </div>
      </div>

      <div className="aurora-card aurora-table aurora-card-lift">
        <div className="aurora-table-head" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 120px' }}>
          {localeCopy.columns.map((label) => (
            <span key={label} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </span>
          ))}
        </div>

        {filtered.map((employee, index) => (
          <div key={employee.id ?? `${employee.name}-${index}`} className="aurora-table-row" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={employee.initials} color={employee.color} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{employee.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{employee.role}{employee.managerName ? ` / ${employee.managerName}` : ''}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{employee.dept}</span>
            <Badge label={statusLabel(employee.status)} tone={BADGE_TONE[employee.status]} />
            <Badge label={statusLabel(employee.type)} tone={BADGE_TONE[employee.type]} />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{employee.since}</span>
            <div className="aurora-row-actions" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="aurora-icon-swatch is-accent" onClick={() => openHistoryDialog(employee)} aria-label={localeCopy.actionMenu.history} title={localeCopy.actionMenu.history}>
                <Icon name="clipboard" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              {employee.status === 'Pre_Boarding' && employee.id && employeesApiReady && (
                <button type="button" className="aurora-icon-swatch is-violet" onClick={() => openOnboardingDialog(employee)} aria-label={localeCopy.actionMenu.onboarding} title={localeCopy.actionMenu.onboarding}>
                  <Icon name="book" size={14} color="currentColor" strokeWidth={1.8} />
                </button>
              )}
              {employee.status !== 'Terminated' && (<>
              <button type="button" className="aurora-icon-swatch is-accent" onClick={() => openLifecycleDialog(employee, 'transfer')} aria-label={localeCopy.actionMenu.transfer} title={localeCopy.actionMenu.transfer}>
                <Icon name="building" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              <button type="button" className="aurora-icon-swatch is-success" onClick={() => openLifecycleDialog(employee, 'promote')} aria-label={localeCopy.actionMenu.promote} title={localeCopy.actionMenu.promote}>
                <Icon name="trending" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              <button type="button" className="aurora-icon-swatch is-violet" onClick={() => openLifecycleDialog(employee, 'secondment')} aria-label={localeCopy.actionMenu.secondment} title={localeCopy.actionMenu.secondment}>
                <Icon name="briefcase" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              <button type="button" className="aurora-icon-swatch is-warning" onClick={() => openLifecycleDialog(employee, 'resign')} aria-label={localeCopy.actionMenu.resign} title={localeCopy.actionMenu.resign}>
                <Icon name="send" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              <button type="button" className="aurora-icon-swatch is-accent" onClick={() => openEditDialog(employee)} aria-label={localeCopy.actionMenu.edit} title={localeCopy.actionMenu.edit}>
                <Icon name="edit" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              <button type="button" className={`aurora-icon-swatch ${employee.status === 'Suspended' ? 'is-success' : 'is-warning'}`} onClick={() => toggleSuspendEmployee(employee)} aria-label={employee.status === 'Suspended' ? localeCopy.actionMenu.reactivate : localeCopy.actionMenu.suspend} title={employee.status === 'Suspended' ? localeCopy.actionMenu.reactivate : localeCopy.actionMenu.suspend}>
                <Icon name="logout" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              </>)}
              {employee.status === 'Terminated' && (
              <button type="button" className="aurora-icon-swatch is-info" onClick={() => openLifecycleDialog(employee, 'rehire')} aria-label={localeCopy.actionMenu.rehire} title={localeCopy.actionMenu.rehire}>
                <Icon name="user" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
              )}
              <button type="button" className="aurora-icon-swatch is-danger" onClick={() => terminateCurrentEmployee(employee)} aria-label={localeCopy.actionMenu.terminate} title={localeCopy.actionMenu.terminate} disabled={employee.status === 'Terminated'}>
                <Icon name="trash" size={14} color="currentColor" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <PeopleCreateDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        copy={localeCopy}
        initialEmployee={dialogMode === 'edit' ? editingEmployee : undefined}
        initialDepartmentId={editingDepartment?.id}
        initialLocationId={editingLocation?.id}
        departmentOptions={departmentOptions}
        locationOptions={locationOptions}
        managerOptions={employees
          .filter((e) => e.status === 'Active' && e.id !== editingEmployee?.id)
          .map((e) => ({ id: e.id ?? getEmployeeKey(e), name: e.name }))}
        onClose={closeDialog}
        onSubmit={submitDialog}
      />

      <EmployeeLifecycleDialog
      open={lifecycleMode !== null}
      mode={lifecycleMode ?? 'transfer'}
      employee={lifecycleKey ? employees.find((entry) => getEmployeeKey(entry) === lifecycleKey) : undefined}
      copy={localeCopy}
      departmentOptions={departmentOptions}
      locationOptions={locationOptions}
      onClose={closeLifecycleDialog}
        onSubmit={submitLifecycleDialog}
      />

      <EmployeeHistoryDialog
        open={historyOpen}
        employee={lifecycleKey ? employees.find((entry) => getEmployeeKey(entry) === lifecycleKey) : undefined}
        history={employeeHistory}
        loading={historyLoading}
        error={historyError}
        onClose={closeHistoryDialog}
      />

      <EmployeeOnboardingDialog
        open={onboardingKey !== null}
        employee={onboardingKey ? employees.find((entry) => getEmployeeKey(entry) === onboardingKey) : undefined}
        copy={getOnboardingCopy(locale)}
        onClose={closeOnboardingDialog}
        onActivated={refreshEmployees}
      />

      <div className="aurora-footer-note">
        {localeCopy.footer(filtered.length, employees.length)}
      </div>
    </div>
  );
}
