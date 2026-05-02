'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import type { AttendanceCopy } from '../../i18n/attendance-copy';
import { fetchAttendanceShifts, createShift, type AttendanceShift } from '../../lib/attendance-api';

type Form = { name: string; code: string; startTime: string; endTime: string; breakMinutes: string; graceLateMinutes: string };

const EMPTY_FORM: Form = { name: '', code: '', startTime: '08:00', endTime: '16:00', breakMinutes: '60', graceLateMinutes: '15' };

export function ShiftTemplatesPanel({ copy }: { copy: AttendanceCopy }) {
  const st = copy.shiftTemplates;
  const [shifts, setShifts] = useState<AttendanceShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAttendanceShifts()
      .then((data) => {
        setShifts(data);
        setError(null);
      })
      .catch(() => {
        setShifts([]);
        setError('Failed to load shifts.');
      })
      .finally(() => setLoading(false));
  }, []);

  function openDialog() {
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name || !form.code || !form.startTime || !form.endTime || saving) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const newShift = await createShift({
        name: form.name,
        code: form.code.toUpperCase(),
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: form.breakMinutes ? parseInt(form.breakMinutes, 10) : 60,
        graceLateMinutes: form.graceLateMinutes ? parseInt(form.graceLateMinutes, 10) : 15,
      });
      setShifts((prev) => [...prev, newShift]);
      setError(null);
      setShowDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shift.');
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
        title={st.title}
        subtitle={st.subtitle}
        action={
          <Button variant="primary" size="sm" onClick={openDialog}>
            <Icon name="plus" size={13} color="currentColor" />
            {st.createShift}
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
      ) : shifts.length === 0 ? (
        <div className="aurora-subtle-box" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          {st.noShifts}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[st.name, st.code, st.time, st.break, st.gracePeriod, st.status].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift, idx) => (
                <tr key={shift.id} style={{ borderBottom: idx < shifts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 10px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shift.name}</div>
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <code style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{shift.code}</code>
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-mid)' }}>
                    {shift.startTime} – {shift.endTime}
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>
                    {shift.breakMinutes}m
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>
                    {shift.graceLateMinutes}m
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <Badge label={shift.isActive ? st.active : st.inactive} tone={shift.isActive ? 'success' : 'danger'} />
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
            style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{st.dialogTitle}</div>
                <div className="aurora-card-subtitle" style={{ marginTop: 4, fontSize: 12 }}>{st.dialogSubtitle}</div>
              </div>
              <button type="button" onClick={() => setShowDialog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {st.fieldName} *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Morning Shift"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {st.fieldCode} *
                </label>
                <input
                  type="text"
                  placeholder="e.g., MORNING"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                    {st.fieldStartTime} *
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                    {st.fieldEndTime} *
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                    {st.fieldBreak}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="15"
                    value={form.breakMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, breakMinutes: e.target.value }))}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{st.breakHint}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                    {st.fieldGracePeriod}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={form.graceLateMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, graceLateMinutes: e.target.value }))}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{st.graceHint}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <Button variant="ghost" onClick={() => setShowDialog(false)}>
                  {st.cancel}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {st.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
