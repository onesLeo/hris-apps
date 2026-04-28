import type { Locale } from './types';

export type AttendanceCopy = {
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  stats: {
    present: string;
    late: string;
    remote: string;
    watchlist: string;
  };
  sections: {
    roster: string;
    events: string;
    policy: string;
  };
  labels: {
    clockIn: string;
    clockOut: string;
    onTime: string;
    late: string;
    remote: string;
    absence: string;
    minutes: string;
    shift: string;
    location: string;
  };
  footer: string;
};

const ATTENDANCE_COPY: Record<Locale, AttendanceCopy> = {
  en: {
    heroLabel: 'Attendance Control',
    heroTitle: 'Today at a glance',
    heroSubtitle: 'Clock events, roster coverage, and late arrivals across the workforce.',
    stats: {
      present: 'Present',
      late: 'Late Arrivals',
      remote: 'Remote Today',
      watchlist: 'Watchlist',
    },
    sections: {
      roster: 'Shift Roster',
      events: 'Clock Events',
      policy: 'Coverage Notes',
    },
    labels: {
      clockIn: 'Clock In',
      clockOut: 'Clock Out',
      onTime: 'On Time',
      late: 'Late',
      remote: 'Remote',
      absence: 'Absence',
      minutes: 'minutes',
      shift: 'Shift',
      location: 'Location',
    },
    footer: 'Attendance will later bind to live devices and policy rules.',
  },
  id: {
    heroLabel: 'Kontrol Absensi',
    heroTitle: 'Sekilas hari ini',
    heroSubtitle: 'Kejadian clock, cakupan roster, dan keterlambatan di seluruh karyawan.',
    stats: {
      present: 'Hadir',
      late: 'Terlambat',
      remote: 'Remote Hari Ini',
      watchlist: 'Pantauan',
    },
    sections: {
      roster: 'Roster Shift',
      events: 'Kejadian Clock',
      policy: 'Catatan Cakupan',
    },
    labels: {
      clockIn: 'Clock In',
      clockOut: 'Clock Out',
      onTime: 'Tepat Waktu',
      late: 'Terlambat',
      remote: 'Remote',
      absence: 'Absen',
      minutes: 'menit',
      shift: 'Shift',
      location: 'Lokasi',
    },
    footer: 'Absensi akan terhubung ke perangkat live dan aturan kebijakan di tahap berikutnya.',
  },
};

export function getAttendanceCopy(locale: Locale): AttendanceCopy {
  return ATTENDANCE_COPY[locale];
}
