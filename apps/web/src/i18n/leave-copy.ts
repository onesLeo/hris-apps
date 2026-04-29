'use client';

import type { Locale } from './types';

export type LeaveCopy = {
  balanceLabels: Record<'Annual Leave' | 'Sick Leave' | 'Compensatory' | 'WFH Days', string>;
  daysLeft: string;
  used: string;
  tabs: Record<'All' | 'Pending' | 'Approved' | 'Rejected', string>;
  tableHeaders: {
    employee: string;
    leaveType: string;
    duration: string;
    days: string;
    status: string;
    actions: string;
  };
  applyLeave: string;
  applyLeaveTitle: string;
  applyLeaveSubtitle: string;
  searchPlaceholder: string;
  leaveForm: {
    employee: string;
    leaveType: string;
    from: string;
    to: string;
    days: string;
    reason: string;
    cancel: string;
    submit: string;
  };
  validation: {
    required: string;
    invalidDays: string;
  };
  approve: string;
  decline: string;
  footer: string;
};

const LEAVE_COPY: Record<Locale, LeaveCopy> = {
  en: {
    balanceLabels: {
      'Annual Leave': 'Annual Leave',
      'Sick Leave': 'Sick Leave',
      Compensatory: 'Compensatory',
      'WFH Days': 'WFH Days',
    },
    daysLeft: 'days left',
    used: 'used',
    tabs: {
      All: 'All',
      Pending: 'Pending',
      Approved: 'Approved',
      Rejected: 'Rejected',
    },
    tableHeaders: {
      employee: 'Employee',
      leaveType: 'Leave Type',
      duration: 'Duration',
      days: 'Days',
      status: 'Status',
      actions: 'Actions',
    },
    applyLeave: 'Apply Leave',
    applyLeaveTitle: 'Apply Leave',
    applyLeaveSubtitle: 'Create a new leave request in the local queue.',
    searchPlaceholder: 'Search leave requests...',
    leaveForm: {
      employee: 'Employee name',
      leaveType: 'Leave type',
      from: 'Start date',
      to: 'End date',
      days: 'Days',
      reason: 'Reason',
      cancel: 'Cancel',
      submit: 'Submit Request',
    },
    validation: {
      required: 'Please complete the employee name, start date, end date, days, and reason before submitting.',
      invalidDays: 'Please enter a valid number of days.',
    },
    approve: 'Approve',
    decline: 'Decline',
    footer: 'Leave will later connect to live policy, balances, and approval data without changing the screen structure.',
  },
  id: {
    balanceLabels: {
      'Annual Leave': 'Cuti Tahunan',
      'Sick Leave': 'Cuti Sakit',
      Compensatory: 'Cuti Pengganti',
      'WFH Days': 'Hari WFH',
    },
    daysLeft: 'hari tersisa',
    used: 'digunakan',
    tabs: {
      All: 'Semua',
      Pending: 'Menunggu',
      Approved: 'Disetujui',
      Rejected: 'Ditolak',
    },
    tableHeaders: {
      employee: 'Karyawan',
      leaveType: 'Jenis Cuti',
      duration: 'Durasi',
      days: 'Hari',
      status: 'Status',
      actions: 'Aksi',
    },
    applyLeave: 'Ajukan Cuti',
    applyLeaveTitle: 'Ajukan Cuti',
    applyLeaveSubtitle: 'Buat permintaan cuti baru di antrian lokal.',
    searchPlaceholder: 'Cari permintaan cuti...',
    leaveForm: {
      employee: 'Nama karyawan',
      leaveType: 'Jenis cuti',
      from: 'Tanggal mulai',
      to: 'Tanggal selesai',
      days: 'Hari',
      reason: 'Alasan',
      cancel: 'Batal',
      submit: 'Kirim Permintaan',
    },
    validation: {
      required: 'Lengkapi nama karyawan, tanggal mulai, tanggal selesai, jumlah hari, dan alasan sebelum mengirim.',
      invalidDays: 'Masukkan jumlah hari yang valid.',
    },
    approve: 'Setujui',
    decline: 'Tolak',
    footer: 'Cuti nantinya akan terhubung ke kebijakan, saldo, dan data persetujuan aktual tanpa mengubah struktur layar.',
  },
};

export function getLeaveCopy(locale: Locale): LeaveCopy {
  return LEAVE_COPY[locale];
}
