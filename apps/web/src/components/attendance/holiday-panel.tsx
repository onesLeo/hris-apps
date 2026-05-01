'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon, SectionHeading } from '../aurora-primitives';
import type { AttendanceCopy } from '../../i18n/attendance-copy';
import {
  fetchPublicHolidays,
  fetchCompanyHolidays,
  createCompanyHoliday,
  deleteCompanyHoliday,
  type CompanyHoliday,
  type PublicHoliday,
} from '../../lib/holiday-api';

type HolidayRow = {
  id: string;
  name: string;
  date: string;
  source: 'public' | 'company';
  isWorkingDay?: boolean;
  locationName?: string | null;
  description?: string | null;
  isRecurring?: boolean;
};

type Props = {
  copy: AttendanceCopy;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function getDayName(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()] ?? '';
}

const INDONESIA_PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { id: 'ph-1', name: "New Year's Day", date: '2026-01-01', isRecurring: true },
  { id: 'ph-2', name: 'Lunar New Year (Year of the Horse)', date: '2026-02-17', isRecurring: false },
  { id: 'ph-3', name: 'Day of Silence (Nyepi)', date: '2026-03-19', isRecurring: false },
  { id: 'ph-4', name: 'Isra Miraj', date: '2026-03-20', isRecurring: false },
  { id: 'ph-5', name: 'Good Friday', date: '2026-04-03', isRecurring: false },
  { id: 'ph-6', name: 'Easter Sunday', date: '2026-04-05', isRecurring: false },
  { id: 'ph-7', name: 'International Labour Day', date: '2026-05-01', isRecurring: true },
  { id: 'ph-8', name: 'Ascension of Jesus Christ', date: '2026-05-14', isRecurring: false },
  { id: 'ph-9', name: 'Eid al-Fitr Day 1', date: '2026-05-20', isRecurring: false },
  { id: 'ph-10', name: 'Eid al-Fitr Day 2', date: '2026-05-21', isRecurring: false },
  { id: 'ph-11', name: 'Pancasila Day', date: '2026-06-01', isRecurring: true },
  { id: 'ph-12', name: 'Vesak Day (Waisak)', date: '2026-06-02', isRecurring: false },
  { id: 'ph-13', name: 'Eid al-Adha', date: '2026-07-27', isRecurring: false },
  { id: 'ph-14', name: 'Islamic New Year 1448H', date: '2026-08-16', isRecurring: false },
  { id: 'ph-15', name: 'Independence Day', date: '2026-08-17', isRecurring: true },
  { id: 'ph-16', name: "Prophet Muhammad's Birthday", date: '2026-10-25', isRecurring: false },
  { id: 'ph-17', name: 'Christmas Day', date: '2026-12-25', isRecurring: true },
];

export function HolidayPanel({ copy }: Props) {
  const hc = copy.holidays;
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add-holiday form state
  const [form, setForm] = useState({ date: '', name: '', description: '', locationId: '', isWorkingDay: false });
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const load = (y: number) => {
    setLoading(true);
    Promise.all([
      fetchPublicHolidays(y).catch(() => y === 2026 ? INDONESIA_PUBLIC_HOLIDAYS_2026 : []),
      fetchCompanyHolidays(y).catch(() => []),
    ]).then(([pub, comp]) => {
      setPublicHolidays(pub);
      setCompanyHolidays(comp);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(year); }, [year]);

  // Merge public + company into a sorted unified list
  const companyDateMap = new Map(companyHolidays.map((h) => [h.date, h]));
  const rows: HolidayRow[] = [];

  // Public holidays (possibly overridden by a company entry)
  for (const ph of publicHolidays) {
    const override = companyDateMap.get(ph.date);
    if (override) {
      rows.push({
        id: override.id,
        name: override.isWorkingDay ? `${ph.name} (Working Day Override)` : override.name,
        date: ph.date,
        source: 'company',
        isWorkingDay: override.isWorkingDay,
        locationName: override.locationName,
        description: override.description,
      });
    } else {
      rows.push({ id: ph.id, name: ph.name, date: ph.date, source: 'public', isRecurring: ph.isRecurring });
    }
  }

  // Company-only holidays (date not in public list)
  const publicDates = new Set(publicHolidays.map((h) => h.date));
  for (const ch of companyHolidays) {
    if (!publicDates.has(ch.date)) {
      rows.push({
        id: ch.id, name: ch.name, date: ch.date, source: 'company',
        isWorkingDay: ch.isWorkingDay, locationName: ch.locationName, description: ch.description,
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const handleSave = async () => {
    if (!form.date || !form.name) return;
    setSaving(true);
    try {
      const created = await createCompanyHoliday({
        date: form.date,
        name: form.name,
        description: form.description || undefined,
        locationId: form.locationId || undefined,
        isWorkingDay: form.isWorkingDay,
      });
      setCompanyHolidays((prev) => [...prev, created]);
      setShowDialog(false);
      setForm({ date: '', name: '', description: '', locationId: '', isWorkingDay: false });
    } catch {
      // stay open; user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      await deleteCompanyHoliday(id);
      setCompanyHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // silently restore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="aurora-screen-stack">
      {/* Header */}
      <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(6,182,212,0.07))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="aurora-card-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, marginBottom: 6 }}>
              {hc.title}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--text-primary)' }}>{hc.title}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4, maxWidth: 480 }}>{hc.subtitle}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Year picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <Icon name="chevronLeft" size={14} color="var(--text-muted)" strokeWidth={2} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 36, textAlign: 'center' }}>{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
              >
                <Icon name="chevronRight" size={14} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            <Button size="sm" variant="primary" onClick={() => setShowDialog(true)}>
              <Icon name="plus" size={13} color="#fff" strokeWidth={2} />
              {hc.addHoliday}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="aurora-kpi-grid" style={{ '--kpi-cols': '3' } as React.CSSProperties}>
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Icon name="calendar" size={15} color="#10b981" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{rows.filter((r) => !r.isWorkingDay).length}</div>
          <div className="aurora-card-subtitle" style={{ marginTop: 3 }}>Total holidays in {year}</div>
        </div>
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Icon name="globe" size={15} color="#06b6d4" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{publicHolidays.length}</div>
          <div className="aurora-card-subtitle" style={{ marginTop: 3 }}>{hc.publicHoliday}</div>
        </div>
        <div className="aurora-card aurora-card-padding aurora-card-lift">
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Icon name="building" size={15} color="#8b5cf6" strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{companyHolidays.length}</div>
          <div className="aurora-card-subtitle" style={{ marginTop: 3 }}>{hc.companyHoliday}</div>
        </div>
      </div>

      {/* Holiday list */}
      <div className="aurora-card aurora-card-lift">
        <div style={{ padding: '16px 20px 12px' }}>
          <SectionHeading title={`${hc.title} ${year}`} subtitle={`${rows.filter((r) => !r.isWorkingDay).length} holidays`} />
        </div>

        {loading ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {hc.noHolidays}
          </div>
        ) : (
          <div>
            {rows.map((row, index) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 20px',
                  borderTop: index > 0 ? '1px solid var(--border)' : 'none',
                  opacity: row.isWorkingDay ? 0.6 : 1,
                }}
              >
                {/* Date cell */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: row.source === 'company' ? '#8b5cf6' : '#06b6d4', lineHeight: 1 }}>
                    {new Date(row.date + 'T00:00:00').getDate()}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    {formatDate(row.date).split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{getDayName(row.date)}</div>
                </div>

                {/* Name + badges */}
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {row.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge
                      label={row.source === 'public' ? hc.publicHoliday : hc.companyHoliday}
                      tone={row.source === 'public' ? 'info' : 'violet'}
                    />
                    {row.isWorkingDay && <Badge label={hc.workingDayOverride} tone="warning" />}
                    {row.isRecurring && <Badge label={hc.recurring} tone="ghost" />}
                    {row.locationName && (
                      <Badge label={row.locationName} tone="ghost" />
                    )}
                  </div>
                  {row.description && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{row.description}</div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {row.source === 'company' && (
                    <button
                      type="button"
                      title={hc.confirmDelete}
                      disabled={deletingId === row.id}
                      onClick={() => handleDelete(row.id)}
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 7,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#ef4444',
                        cursor: deletingId === row.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === row.id ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Icon name="trash" size={11} color="#ef4444" strokeWidth={2} />
                      {hc.delete}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Holiday Dialog */}
      {showDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDialog(false); }}
        >
          <div
            ref={dialogRef}
            className="aurora-card aurora-card-padding"
            style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{hc.dialogTitle}</div>
                <div className="aurora-card-subtitle" style={{ marginTop: 4, fontSize: 12 }}>{hc.dialogSubtitle}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
              >
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              {/* Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldDate} *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: (e.target as HTMLInputElement).value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--input-bg, var(--card-bg))', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldName} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                  placeholder="e.g. Company Anniversary"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--input-bg, var(--card-bg))', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldDescription}
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: (e.target as HTMLInputElement).value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--input-bg, var(--card-bg))', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Is working day toggle */}
              <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  id="isWorkingDay"
                  checked={form.isWorkingDay}
                  onChange={(e) => setForm((f) => ({ ...f, isWorkingDay: (e.target as HTMLInputElement).checked }))}
                  style={{ marginTop: 2, accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="isWorkingDay" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    {hc.fieldIsWorkingDay}
                  </label>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{hc.fieldIsWorkingDayHint}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <Button size="sm" variant="ghost" onClick={() => setShowDialog(false)}>
                  {hc.cancel}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSave}
                  disabled={!form.date || !form.name || saving}
                >
                  {saving ? '…' : hc.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
