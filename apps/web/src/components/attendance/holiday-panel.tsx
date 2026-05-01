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
const USE_MOCK_FALLBACK = process.env.NODE_ENV !== 'production';

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
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ date: '', name: '', description: '', locationId: '', isWorkingDay: false });
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const load = (y: number) => {
    setLoading(true);
    setError(null);

    Promise.all([fetchPublicHolidays(y), fetchCompanyHolidays(y)])
      .then(([pub, comp]) => {
        setPublicHolidays(pub);
        setCompanyHolidays(comp);
      })
      .catch(() => {
        if (USE_MOCK_FALLBACK) {
          setPublicHolidays(y === 2026 ? INDONESIA_PUBLIC_HOLIDAYS_2026 : []);
          setCompanyHolidays([]);
        } else {
          setPublicHolidays([]);
          setCompanyHolidays([]);
          setError('Failed to load holiday calendars.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(year);
  }, [year]);

  const companyDateMap = new Map(companyHolidays.map((h) => [h.date, h]));
  const rows: HolidayRow[] = [];

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

  const publicDates = new Set(publicHolidays.map((h) => h.date));
  for (const ch of companyHolidays) {
    if (!publicDates.has(ch.date)) {
      rows.push({
        id: ch.id,
        name: ch.name,
        date: ch.date,
        source: 'company',
        isWorkingDay: ch.isWorkingDay,
        locationName: ch.locationName,
        description: ch.description,
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const handleSave = async () => {
    if (!form.date || !form.name) return;
    setSaving(true);
    setError(null);
    try {
      const payload: {
        date: string;
        name: string;
        isWorkingDay: boolean;
        description?: string;
        locationId?: string;
      } = {
        date: form.date,
        name: form.name,
        isWorkingDay: form.isWorkingDay,
      };
      if (form.description.trim()) {
        payload.description = form.description.trim();
      }
      if (form.locationId.trim()) {
        payload.locationId = form.locationId.trim();
      }

      const created = await createCompanyHoliday(payload);
      setCompanyHolidays((prev) => [...prev, created]);
      setShowDialog(false);
      setForm({ date: '', name: '', description: '', locationId: '', isWorkingDay: false });
    } catch {
      setError('Failed to create the holiday.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteCompanyHoliday(id);
      setCompanyHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch {
      setError('Failed to delete the holiday.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="aurora-screen-stack">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
              <button type="button" onClick={() => setYear((y) => y - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                <Icon name="chevronLeft" size={14} color="var(--text-muted)" strokeWidth={2} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', minWidth: 36, textAlign: 'center' }}>{year}</span>
              <button type="button" onClick={() => setYear((y) => y + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
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

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.22)',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

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

      <div className="aurora-card aurora-card-padding aurora-card-lift">
        <SectionHeading title={hc.title} subtitle={hc.subtitle} />

        {loading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div className="aurora-subtle-box" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {hc.noHolidays}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {rows.map((row) => (
              <div key={row.id} className="aurora-subtle-box" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: row.source === 'public' ? 'rgba(6,182,212,0.12)' : row.isWorkingDay ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={row.isWorkingDay ? 'trending' : 'calendar'} size={18} color={row.source === 'public' ? '#06b6d4' : row.isWorkingDay ? '#8b5cf6' : '#10b981'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {getDayName(row.date)} · {formatDate(row.date)}
                      {row.locationName ? ` · ${row.locationName}` : ''}
                      {row.description ? ` · ${row.description}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.isRecurring && <Badge label={hc.recurring} tone="info" />}
                  {row.isWorkingDay && <Badge label={hc.workingDayOverride} tone="warning" />}
                  {row.source === 'company' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      style={{ background: 'none', border: 'none', cursor: deletingId === row.id ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8 }}
                      aria-label={hc.delete}
                    >
                      <Icon name="trash" size={15} color="var(--text-muted)" strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{hc.addHoliday}</div>
                <div className="aurora-card-subtitle" style={{ marginTop: 4, fontSize: 12 }}>{hc.subtitle}</div>
              </div>
              <button type="button" onClick={() => setShowDialog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                <Icon name="xMark" size={16} color="var(--text-muted)" strokeWidth={2} />
              </button>
            </div>

            <div className="aurora-screen-stack" style={{ gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldDate} *
                </label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldName} *
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldDescription}
                </label>
                <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
                  {hc.fieldLocation}
                </label>
                <input type="text" value={form.locationId} onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={form.isWorkingDay} onChange={(e) => setForm((f) => ({ ...f, isWorkingDay: e.target.checked }))} />
                {hc.fieldIsWorkingDay}
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <Button variant="ghost" onClick={() => setShowDialog(false)}>
                  {hc.cancel}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {hc.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
