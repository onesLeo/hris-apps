'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Avatar, Button, Icon } from '../aurora-primitives';
import { getPeopleCopy, useLocale } from '../../i18n';
import { PeopleCreateDialog } from './people-create-dialog';
import {
  addEmployee,
  EMPLOYEES,
  filterEmployees,
  getEmployeeKey,
  PEOPLE_FILTERS,
  removeEmployee,
  suspendEmployee,
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
  terminateEmployee as apiTerminate,
} from '../../lib/employee-api';

const BADGE_TONE: Record<EmployeeStatus | WorkType, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  Active: 'success',
  Suspended: 'ghost',
  'On Leave': 'warning',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Remote: 'info',
  Office: 'violet',
  Hybrid: 'accent',
};

export function PeopleScreen() {
  const { locale } = useLocale();
  const localeCopy = getPeopleCopy(locale);
  const [filter, setFilter] = useState<'All' | 'Active' | 'On Leave' | 'Remote' | 'Office'>('All');
  const [search, setSearch] = useState('');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [usingApi, setUsingApi] = useState(false);

  // Attempt to load real data from the API on mount.
  // Falls back silently to the mock EMPLOYEES array if the API is unavailable
  // (e.g. no token, dev without backend running).
  useEffect(() => {
    fetchEmployees()
      .then((data) => {
        setEmployees(data);
        setUsingApi(true);
      })
      .catch(() => {
        // keep mock data — no error shown to user
      });
  }, []);

  const statusLabel = (label: EmployeeStatus | WorkType) => localeCopy.status[label];

  const filtered = useMemo(
    () => filterEmployees(employees, filter, search),
    [employees, filter, search],
  );

  const editingEmployee = editingKey
    ? employees.find((e) => getEmployeeKey(e) === editingKey)
    : undefined;

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

  const submitDialog = async (input: CreateEmployeeInput) => {
    if (dialogMode === 'edit' && editingKey) {
      const target = employees.find((e) => getEmployeeKey(e) === editingKey);
      if (usingApi && target?.id) {
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

    if (usingApi) {
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
      setEmployees((curr) =>
        updateEmployee(curr, key, {
          name: employee.name,
          role: employee.role,
          dept: employee.dept,
          status: 'Active',
          type: employee.type,
          since: employee.since,
        }),
      );
      return;
    }

    if (usingApi && employee.id) {
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

  const deleteCurrentEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(localeCopy.actionMenu.deleteConfirm);
    if (!confirmed) return;

    if (usingApi && employee.id) {
      try {
        await apiTerminate(employee.id);
        setEmployees((curr) => removeEmployee(curr, getEmployeeKey(employee)));
        return;
      } catch {
        // fall through to local remove
      }
    }
    setEmployees((curr) => removeEmployee(curr, getEmployeeKey(employee)));
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{employee.role}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{employee.dept}</span>
            <Badge label={statusLabel(employee.status)} tone={BADGE_TONE[employee.status]} />
            <Badge label={statusLabel(employee.type)} tone={BADGE_TONE[employee.type]} />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{employee.since}</span>
            <div className="aurora-row-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="aurora-icon-swatch" onClick={() => openEditDialog(employee)} aria-label={localeCopy.actionMenu.edit}>
                <Icon name="edit" size={14} color="var(--text-muted)" strokeWidth={1.8} />
              </button>
              <button type="button" className="aurora-icon-swatch" onClick={() => toggleSuspendEmployee(employee)} aria-label={employee.status === 'Suspended' ? localeCopy.actionMenu.reactivate : localeCopy.actionMenu.suspend}>
                <Icon name="logout" size={14} color="var(--text-muted)" strokeWidth={1.8} />
              </button>
              <button type="button" className="aurora-icon-swatch" onClick={() => deleteCurrentEmployee(employee)} aria-label={localeCopy.actionMenu.delete}>
                <Icon name="trash" size={14} color="var(--text-muted)" strokeWidth={1.8} />
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
        onClose={closeDialog}
        onSubmit={submitDialog}
      />

      <div className="aurora-footer-note">
        {localeCopy.footer(filtered.length, employees.length)}
      </div>
    </div>
  );
}
