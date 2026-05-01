'use client';

import { useEffect, useState } from 'react';
import { Icon, SectionHeading, Badge } from '../aurora-primitives';
import type { AttendanceCopy } from '../../i18n/attendance-copy';
import {
  fetchAttendanceRecords,
  submitClockEvent,
  type AttendanceRecord,
} from '../../lib/attendance-api';
import { fetchEmployees } from '../../lib/employee-api';
import type { Employee } from '../people/people-data';

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ClockPanel({ copy }: { copy: AttendanceCopy }) {
  const c = copy.clock;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees()
      .then((rows) => {
        setEmployees(rows);
        setError(null);
      })
      .catch(() => {
        setEmployees([]);
        setError('Failed to load employees for clocking.');
      });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setRecord(null);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    fetchAttendanceRecords({ employeeId: selectedId, fromDate: today, toDate: today, limit: 1 })
      .then((rows) => {
        setRecord(rows[0] ?? null);
        setError(null);
      })
      .catch(() => {
        setRecord(null);
        setError('Failed to load today\'s attendance record.');
      });
  }, [selectedId]);

  async function handleClock(direction: 'in' | 'out') {
    if (!selectedId || loading) return;
    setLoading(true);
    try {
      await submitClockEvent(selectedId, direction);
      const today = new Date().toISOString().slice(0, 10);
      const rows = await fetchAttendanceRecords({ employeeId: selectedId, fromDate: today, toDate: today, limit: 1 });
      setRecord(rows[0] ?? null);
      setError(null);
      setFlash(direction === 'in' ? c.successIn : c.successOut);
      setTimeout(() => setFlash(null), 3000);
    } catch {
      setError('Failed to submit clock event.');
    } finally {
      setLoading(false);
    }
  }

  const isClockedIn = !!(record?.clockIn && !record?.clockOut);
  const isClockedOut = !!(record?.clockIn && record?.clockOut);

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading title={c.title} subtitle={c.subtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: 'var(--text-primary)',
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--text-primary)',
            width: '100%',
          }}
        >
          <option value="">{c.selectEmployee}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
          ))}
        </select>

        {selectedId && (
          <div className="aurora-subtle-box" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{c.lastEvent}</div>
              {record ? (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {copy.labels.clockIn}: {fmtTime(record.clockIn)}
                  {record.clockOut && <span style={{ marginLeft: 12 }}>{copy.labels.clockOut}: {fmtTime(record.clockOut)}</span>}
                  {record.workedMinutes != null && (
                    <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                      {Math.floor(record.workedMinutes / 60)}h {record.workedMinutes % 60}m
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.noRecord}</div>
              )}
            </div>
            {isClockedIn && <Badge label={copy.labels.clockIn} tone="success" />}
            {isClockedOut && <Badge label={copy.labels.clockOut} tone="ghost" />}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="aurora-button is-primary"
            disabled={!selectedId || loading || isClockedIn}
            onClick={() => handleClock('in')}
            style={{ flex: 1 }}
          >
            <Icon name="checkCircle" size={15} color="currentColor" />
            {c.clockInBtn}
          </button>
          <button
            type="button"
            className="aurora-button"
            disabled={!selectedId || loading || !isClockedIn}
            onClick={() => handleClock('out')}
            style={{ flex: 1 }}
          >
            <Icon name="logout" size={15} color="currentColor" />
            {c.clockOutBtn}
          </button>
        </div>

        {flash && (
          <div style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={14} color="var(--success)" />
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}
