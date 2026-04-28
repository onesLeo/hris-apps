'use client';

import { useMemo, useState } from 'react';
import { Badge, Avatar, Button, Icon } from '../aurora-primitives';
import { getPeopleCopy, useLocale } from '../../i18n';
import { EMPLOYEES, PEOPLE_FILTERS, filterEmployees, type EmployeeStatus, type WorkType } from './people-data';

const BADGE_TONE: Record<EmployeeStatus | WorkType, 'accent' | 'violet' | 'warning' | 'info' | 'success' | 'danger' | 'ghost'> = {
  Active: 'success',
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

  const statusLabel = (label: EmployeeStatus | WorkType) => localeCopy.status[label];

  const filtered = useMemo(
    () => filterEmployees(EMPLOYEES, filter, search),
    [filter, search],
  );

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
          <Button variant="primary">
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
            {localeCopy.addEmployee}
          </Button>
        </div>
      </div>

      <div className="aurora-card aurora-table aurora-card-lift">
        <div className="aurora-table-head" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 80px' }}>
          {localeCopy.columns.map((label) => (
            <span key={label} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </span>
          ))}
        </div>

        {filtered.map((employee, index) => (
          <div key={`${employee.name}-${index}`} className="aurora-table-row" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 80px' }}>
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
            <div className="aurora-row-actions">
              <div className="aurora-icon-swatch">
                <Icon name="eye" size={14} color="var(--text-muted)" strokeWidth={1.8} />
              </div>
              <div className="aurora-icon-swatch">
                <Icon name="dotsH" size={14} color="var(--text-muted)" strokeWidth={1.8} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="aurora-footer-note">
        {localeCopy.footer(filtered.length, EMPLOYEES.length)}
      </div>
    </div>
  );
}
