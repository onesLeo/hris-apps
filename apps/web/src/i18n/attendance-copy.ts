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
  tabs: {
    overview: string;
    holidays: string;
    shifts: string;
  };
  clock: {
    title: string;
    subtitle: string;
    selectEmployee: string;
    clockInBtn: string;
    clockOutBtn: string;
    successIn: string;
    successOut: string;
    lastEvent: string;
    noRecord: string;
  };
  shifts: {
    title: string;
    subtitle: string;
    assignShift: string;
    noAssignments: string;
    employee: string;
    shift: string;
    effectiveFrom: string;
    effectiveTo: string;
    ongoing: string;
    dialogTitle: string;
    dialogSubtitle: string;
    fieldEmployee: string;
    fieldShift: string;
    fieldFrom: string;
    fieldTo: string;
    fieldToHint: string;
    cancel: string;
    save: string;
  };
  holidays: {
    title: string;
    subtitle: string;
    year: string;
    addHoliday: string;
    publicHoliday: string;
    companyHoliday: string;
    workingDayOverride: string;
    allLocations: string;
    noHolidays: string;
    dialogTitle: string;
    dialogSubtitle: string;
    fieldDate: string;
    fieldName: string;
    fieldDescription: string;
    fieldLocation: string;
    fieldIsWorkingDay: string;
    fieldIsWorkingDayHint: string;
    cancel: string;
    save: string;
    delete: string;
    confirmDelete: string;
    recurring: string;
  };
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
    tabs: {
      overview: 'Overview',
      holidays: 'Holiday Calendar',
      shifts: 'Shift Assignments',
    },
    clock: {
      title: 'Manual Clock',
      subtitle: 'Record a clock event on behalf of an employee.',
      selectEmployee: 'Select employee…',
      clockInBtn: 'Clock In',
      clockOutBtn: 'Clock Out',
      successIn: 'Clocked in',
      successOut: 'Clocked out',
      lastEvent: 'Last event',
      noRecord: 'No record today',
    },
    shifts: {
      title: 'Shift Assignments',
      subtitle: 'Assign employees to shifts for attendance tracking.',
      assignShift: 'Assign Shift',
      noAssignments: 'No shift assignments found.',
      employee: 'Employee',
      shift: 'Shift',
      effectiveFrom: 'From',
      effectiveTo: 'To',
      ongoing: 'Ongoing',
      dialogTitle: 'Assign Shift',
      dialogSubtitle: 'Link an employee to a shift with an effective date range.',
      fieldEmployee: 'Employee',
      fieldShift: 'Shift',
      fieldFrom: 'Effective From',
      fieldTo: 'Effective To (optional)',
      fieldToHint: 'Leave blank for an open-ended assignment.',
      cancel: 'Cancel',
      save: 'Save Assignment',
    },
    holidays: {
      title: 'Holiday Calendar',
      subtitle: 'Public and company holidays for absence and leave calculations.',
      year: 'Year',
      addHoliday: 'Add Company Holiday',
      publicHoliday: 'Public Holiday',
      companyHoliday: 'Company Holiday',
      workingDayOverride: 'Working Day Override',
      allLocations: 'All Locations',
      noHolidays: 'No holidays found for this year.',
      dialogTitle: 'Add Company Holiday',
      dialogSubtitle: 'Company holidays override public holidays for absence detection.',
      fieldDate: 'Date',
      fieldName: 'Holiday Name',
      fieldDescription: 'Description (optional)',
      fieldLocation: 'Location (leave blank for all locations)',
      fieldIsWorkingDay: 'This is a working day',
      fieldIsWorkingDayHint: 'Check this to mark a public holiday as a regular working day.',
      cancel: 'Cancel',
      save: 'Save Holiday',
      delete: 'Delete',
      confirmDelete: 'Delete this holiday?',
      recurring: 'Recurring',
    },
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
    tabs: {
      overview: 'Ringkasan',
      holidays: 'Kalender Hari Libur',
      shifts: 'Penugasan Shift',
    },
    clock: {
      title: 'Clock Manual',
      subtitle: 'Catat kejadian clock atas nama karyawan.',
      selectEmployee: 'Pilih karyawan…',
      clockInBtn: 'Clock In',
      clockOutBtn: 'Clock Out',
      successIn: 'Clock in berhasil',
      successOut: 'Clock out berhasil',
      lastEvent: 'Kejadian terakhir',
      noRecord: 'Belum ada rekaman hari ini',
    },
    shifts: {
      title: 'Penugasan Shift',
      subtitle: 'Tugaskan karyawan ke shift untuk pemantauan absensi.',
      assignShift: 'Tugaskan Shift',
      noAssignments: 'Tidak ada penugasan shift.',
      employee: 'Karyawan',
      shift: 'Shift',
      effectiveFrom: 'Mulai',
      effectiveTo: 'Hingga',
      ongoing: 'Berlanjut',
      dialogTitle: 'Tugaskan Shift',
      dialogSubtitle: 'Hubungkan karyawan ke shift dengan rentang tanggal berlaku.',
      fieldEmployee: 'Karyawan',
      fieldShift: 'Shift',
      fieldFrom: 'Berlaku Mulai',
      fieldTo: 'Berlaku Hingga (opsional)',
      fieldToHint: 'Kosongkan untuk penugasan tanpa batas waktu.',
      cancel: 'Batal',
      save: 'Simpan Penugasan',
    },
    holidays: {
      title: 'Kalender Hari Libur',
      subtitle: 'Hari libur nasional dan perusahaan untuk kalkulasi absensi dan cuti.',
      year: 'Tahun',
      addHoliday: 'Tambah Hari Libur Perusahaan',
      publicHoliday: 'Hari Libur Nasional',
      companyHoliday: 'Hari Libur Perusahaan',
      workingDayOverride: 'Override Hari Kerja',
      allLocations: 'Semua Lokasi',
      noHolidays: 'Tidak ada hari libur untuk tahun ini.',
      dialogTitle: 'Tambah Hari Libur Perusahaan',
      dialogSubtitle: 'Hari libur perusahaan menggantikan hari libur nasional untuk deteksi absensi.',
      fieldDate: 'Tanggal',
      fieldName: 'Nama Hari Libur',
      fieldDescription: 'Deskripsi (opsional)',
      fieldLocation: 'Lokasi (kosongkan untuk semua lokasi)',
      fieldIsWorkingDay: 'Ini adalah hari kerja',
      fieldIsWorkingDayHint: 'Centang ini untuk menandai hari libur nasional sebagai hari kerja biasa.',
      cancel: 'Batal',
      save: 'Simpan Hari Libur',
      delete: 'Hapus',
      confirmDelete: 'Hapus hari libur ini?',
      recurring: 'Berulang',
    },
  },
};

export function getAttendanceCopy(locale: Locale): AttendanceCopy {
  return ATTENDANCE_COPY[locale];
}
