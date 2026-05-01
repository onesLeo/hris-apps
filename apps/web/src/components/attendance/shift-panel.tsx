'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import type { AttendanceCopy } from '../../i18n/attendance-copy';
import {
  fetchAttendanceShifts,
  fetchShiftAssignments,
  createShiftAssignment,
  type AttendanceShift,
  type ShiftAssignment,
} from '../../lib/attendance-api';
import { fetchEmployees } from '../../lib/employee-api';
import type { Employee } from '../people/people-data';

type Form = { employeeId: string; shiftId: string; effectiveFrom: string; effectiveTo: string };

const EMPTY_FORM: Form = { employeeId: '', shiftId: '', effectiveFrom: '', effectiveTo: '' };

function fmtDate(s: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ShiftPanel({ copy }: { copy: AttendanceCopy }) {
  const sc = copy.shifts;
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<AttendanceShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetchShiftAssignments(), fetchAttendanceShifts(), fetchEmployees()])
      .then(([a, s, e]) => {
        setAssignments(a);
        setShifts(s);
        setEmployees(e);
        setError(null);
      })
      .catch(() => {
        setAssignments([]);
        setShifts([]);
        setEmployees([]);
        setError('Failed to load shift data.');
      })
      .finally(() => setLoading(false));
  }, []);

  function openDialog() {
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.employeeId || !form.shiftId || !form.effectiveFrom || saving) return;
    setSaving(true);
    try {
      const assignment = await createShiftAssignment({
        employeeId: form.employeeId,
        shiftId: form.shiftId,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
      });
      setAssignments((prev) => [assignment, ...prev]);
      setError(null);
      setShowDialog(false);
    } catch {
      setError('Failed to assign the shift.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--text-primary)',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title={sc.title}
        subtitle={sc.subtitle}
        action={
          <Button variant="primary" size="sm" onClick={openDialog}>
            <Icon name="plus" size={13} color="currentColor" />
            {sc.assignShift}
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 12,
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

      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>...</div>
      ) : assignments.length === 0 ? (
        <div className="aurora-subtle-box" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          {sc.noAssignments}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[sc.employee, sc.shift, sc.effectiveFrom, sc.effectiveTo].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, idx) => (
                <tr key={a.id} style={{ borderBottom: idx < assignments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 10px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.employeeName}</div>
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <Badge label={a.shiftName} tone="accent" />
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{fmtDate(a.effectiveFrom)}</td>
                  <td style={{ padding: '10px 10px' }}>
                    {a.effectiveTo ? <span style={{ color: 'var(--text-muted)' }}>{fmtDate(a.effectiveTo)}</span> : <Badge label={sc.ongoing} tone="success" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDialog(false);
          }}
        >
          <div
            ref={dialogRef}
            className="aurora-card aurora-card-padding"
            style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{sc.dialogTitle}</div>
                <div className="aurora-card-subtitle" style={{ marginTop: 4, fontSize: 12 }}>{sc.dialogSubtitle}</div>
              </div>
              <button type="button" onClick={() => setShowDialog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {sc.fieldEmployee} *
                </label>
                <select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} style={inputStyle}>
                  <option value="">—</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {sc.fieldShift} *
                </label>
                <select value={form.shiftId} onChange={(e) => setForm((f) => ({ ...f, shiftId: e.target.value }))} style={inputStyle}>
                  <option value="">—</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                    {sc.fieldFrom} *
                  </label>
                  <input type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                    {sc.fieldTo}
                  </label>
                  <input type="date" value={form.effectiveTo} onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <Button variant="ghost" onClick={() => setShowDialog(false)}>
                  {sc.cancel}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {sc.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
