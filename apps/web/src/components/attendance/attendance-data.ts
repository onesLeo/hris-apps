import type { Locale } from '../../i18n/types';

export type AttendanceShift = {
  name: string;
  role: string;
  location: string;
  status: 'On Time' | 'Late' | 'Remote';
  start: string;
  end: string;
  initials: string;
  color: string;
};

export type ClockEvent = {
  time: string;
  name: string;
  action: 'Clock In' | 'Clock Out' | 'Break Start' | 'Break End';
  detail: string;
  accent: string;
};

export type AttendanceOverview = {
  dateLabel: string;
  metrics: Array<{ label: string; value: string; accent: string; delta: string; icon: 'users' | 'clock' | 'mapPin' | 'trending' }>;
  shifts: AttendanceShift[];
  events: ClockEvent[];
  notes: string[];
};

export function createEmptyAttendanceOverview(locale: Locale): AttendanceOverview {
  return {
    dateLabel: locale === 'id' ? 'Belum ada data langsung' : 'No live data available',
    metrics: [
      { label: 'Present', value: '0', accent: '#10b981', delta: 'Waiting for live API data', icon: 'users' },
      { label: 'Late Arrivals', value: '0', accent: '#f59e0b', delta: 'Waiting for live API data', icon: 'clock' },
      { label: 'Remote Today', value: '0', accent: '#8b5cf6', delta: 'Waiting for live API data', icon: 'mapPin' },
      { label: 'Watchlist', value: '0', accent: '#ef4444', delta: 'Waiting for live API data', icon: 'trending' },
    ],
    shifts: [],
    events: [],
    notes: [],
  };
}

const OVERVIEW: Record<Locale, AttendanceOverview> = {
  en: {
    dateLabel: 'Tuesday, 28 Apr 2026',
    metrics: [
      { label: 'Present', value: '1,183', accent: '#10b981', delta: '+18 vs yesterday', icon: 'users' },
      { label: 'Late Arrivals', value: '14', accent: '#f59e0b', delta: '-3 vs yesterday', icon: 'clock' },
      { label: 'Remote Today', value: '264', accent: '#8b5cf6', delta: '21.2% workforce', icon: 'mapPin' },
      { label: 'Watchlist', value: '8', accent: '#ef4444', delta: 'Requires review', icon: 'trending' },
    ],
    shifts: [
      { name: 'Sarah Chen', role: 'Engineering', location: 'Jakarta HQ', status: 'On Time', start: '08:30', end: '17:30', initials: 'SC', color: '#f43f8e' },
      { name: 'Marcus Johnson', role: 'Product', location: 'Jakarta HQ', status: 'Late', start: '09:10', end: '18:10', initials: 'MJ', color: '#8b5cf6' },
      { name: 'Aisha Patel', role: 'Operations', location: 'Remote', status: 'Remote', start: 'Flexible', end: 'Flexible', initials: 'AP', color: '#06b6d4' },
      { name: 'Lucas Rivera', role: 'Design', location: 'Surabaya Office', status: 'On Time', start: '08:45', end: '17:45', initials: 'LR', color: '#10b981' },
    ],
    events: [
      { time: '08:31', name: 'Sarah Chen', action: 'Clock In', detail: 'Jakarta HQ gate 02', accent: '#10b981' },
      { time: '08:44', name: 'Lucas Rivera', action: 'Clock In', detail: 'Surabaya office reader', accent: '#06b6d4' },
      { time: '09:10', name: 'Marcus Johnson', action: 'Clock In', detail: '10 minutes late', accent: '#f59e0b' },
      { time: '12:01', name: 'Aisha Patel', action: 'Break Start', detail: 'Remote session recorded', accent: '#8b5cf6' },
    ],
    notes: [
      'Jakarta HQ clock point is healthy and reporting normally.',
      'Surabaya office has 1 unresolved late arrival for morning shift.',
      'Remote users are within policy coverage for this morning window.',
    ],
  },
  id: {
    dateLabel: 'Selasa, 28 Apr 2026',
    metrics: [
      { label: 'Hadir', value: '1,183', accent: '#10b981', delta: '+18 dibanding kemarin', icon: 'users' },
      { label: 'Datang Terlambat', value: '14', accent: '#f59e0b', delta: '-3 dibanding kemarin', icon: 'clock' },
      { label: 'Remote Hari Ini', value: '264', accent: '#8b5cf6', delta: '21,2% tenaga kerja', icon: 'mapPin' },
      { label: 'Pantauan', value: '8', accent: '#ef4444', delta: 'Perlu ditinjau', icon: 'trending' },
    ],
    shifts: [
      { name: 'Sarah Chen', role: 'Engineering', location: 'Jakarta HQ', status: 'On Time', start: '08:30', end: '17:30', initials: 'SC', color: '#f43f8e' },
      { name: 'Marcus Johnson', role: 'Produk', location: 'Jakarta HQ', status: 'Late', start: '09:10', end: '18:10', initials: 'MJ', color: '#8b5cf6' },
      { name: 'Aisha Patel', role: 'Operasional', location: 'Remote', status: 'Remote', start: 'Fleksibel', end: 'Fleksibel', initials: 'AP', color: '#06b6d4' },
      { name: 'Lucas Rivera', role: 'Desain', location: 'Kantor Surabaya', status: 'On Time', start: '08:45', end: '17:45', initials: 'LR', color: '#10b981' },
    ],
    events: [
      { time: '08:31', name: 'Sarah Chen', action: 'Clock In', detail: 'Gerbang 02 HQ Jakarta', accent: '#10b981' },
      { time: '08:44', name: 'Lucas Rivera', action: 'Clock In', detail: 'Reader kantor Surabaya', accent: '#06b6d4' },
      { time: '09:10', name: 'Marcus Johnson', action: 'Clock In', detail: 'Terlambat 10 menit', accent: '#f59e0b' },
      { time: '12:01', name: 'Aisha Patel', action: 'Break Start', detail: 'Sesi remote tercatat', accent: '#8b5cf6' },
    ],
    notes: [
      'Titik clock HQ Jakarta sehat dan melaporkan normal.',
      'Kantor Surabaya memiliki 1 keterlambatan pagi yang belum terselesaikan.',
      'Pengguna remote masih berada dalam cakupan kebijakan untuk jendela pagi ini.',
    ],
  },
};

export function getAttendanceOverview(locale: Locale): AttendanceOverview {
  return OVERVIEW[locale];
}
