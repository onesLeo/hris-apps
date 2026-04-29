import type { Locale } from '../../i18n/types';

export type ApprovalItem = {
  name: string;
  dept: string;
  type: string;
  detail: string;
  urgent: boolean;
  initials: string;
  color: string;
};

const APPROVALS_BY_LOCALE: Record<Locale, readonly ApprovalItem[]> = {
  en: [
    { name: 'John Smith', dept: 'Engineering', type: 'Annual Leave', detail: '3 days - Apr 28 to 30', urgent: true, initials: 'JS', color: '#6366f1' },
    { name: 'Tom Bradley', dept: 'Sales', type: 'WFH Request', detail: '2 days - Apr 29 to 30', urgent: false, initials: 'TB', color: '#10b981' },
    { name: 'Yuki Tanaka', dept: 'Operations', type: 'Annual Leave', detail: '5 days - May 12 to 16', urgent: false, initials: 'YT', color: '#06b6d4' },
    { name: 'Nina Okafor', dept: 'Design', type: 'Equipment Request', detail: 'MacBook Pro 16"', urgent: true, initials: 'NO', color: '#8b5cf6' },
    { name: 'Carlos Mendez', dept: 'Product', type: 'Training Approval', detail: 'React Advanced - $499', urgent: false, initials: 'CM', color: '#f59e0b' },
  ],
  id: [
    { name: 'John Smith', dept: 'Engineering', type: 'Cuti Tahunan', detail: '3 hari - 28 sampai 30 Apr', urgent: true, initials: 'JS', color: '#6366f1' },
    { name: 'Tom Bradley', dept: 'Penjualan', type: 'Permintaan WFH', detail: '2 hari - 29 sampai 30 Apr', urgent: false, initials: 'TB', color: '#10b981' },
    { name: 'Yuki Tanaka', dept: 'Operasional', type: 'Cuti Tahunan', detail: '5 hari - 12 sampai 16 Mei', urgent: false, initials: 'YT', color: '#06b6d4' },
    { name: 'Nina Okafor', dept: 'Desain', type: 'Permintaan Peralatan', detail: 'MacBook Pro 16"', urgent: true, initials: 'NO', color: '#8b5cf6' },
    { name: 'Carlos Mendez', dept: 'Produk', type: 'Persetujuan Pelatihan', detail: 'React Advanced - Rp 499', urgent: false, initials: 'CM', color: '#f59e0b' },
  ],
};

export function getApprovalsData(locale: Locale): readonly ApprovalItem[] {
  return APPROVALS_BY_LOCALE[locale];
}
