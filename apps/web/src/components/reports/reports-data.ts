export type ReportCatalogItem = {
  name: string;
  description: string;
  owner: string;
  cadence: string;
  format: string;
};

export type ReportExport = {
  name: string;
  generatedAt: string;
  status: 'Ready' | 'Queued' | 'Delivered';
  format: string;
};

export type ReportsOverview = {
  periodLabel: string;
  metrics: Array<{ label: string; value: string; accent: string; note: string; icon: 'chartBar' | 'download' | 'clock' | 'users' }>;
  catalog: ReportCatalogItem[];
  exports: ReportExport[];
  scheduleNotes: string[];
};

export function getReportsOverview(): ReportsOverview {
  return {
    periodLabel: 'April 2026',
    metrics: [
      { label: 'Snapshots', value: '24', accent: '#e8317a', note: '8 live, 16 scheduled', icon: 'chartBar' },
      { label: 'Live Reports', value: '6', accent: '#8b5cf6', note: 'Refreshed today', icon: 'users' },
      { label: 'Refresh SLA', value: '12m', accent: '#06b6d4', note: 'Within target', icon: 'clock' },
      { label: 'Delivered', value: '18', accent: '#10b981', note: 'Ready for download', icon: 'download' },
    ],
    catalog: [
      { name: 'Headcount Snapshot', description: 'Monthly workforce count by department and site.', owner: 'HR Analytics', cadence: 'Monthly', format: 'PDF / CSV' },
      { name: 'Attendance Summary', description: 'Daily attendance movement and late arrival summary.', owner: 'Operations', cadence: 'Daily', format: 'CSV' },
      { name: 'Leave Balance Audit', description: 'Balances, approvals, and pending leave consumption.', owner: 'People Ops', cadence: 'Weekly', format: 'XLSX' },
      { name: 'Organization Coverage', description: 'Locations, department coverage, and manager mapping.', owner: 'HR Admin', cadence: 'On demand', format: 'PDF' },
    ],
    exports: [
      { name: 'Headcount Snapshot', generatedAt: '08:45', status: 'Delivered', format: 'PDF' },
      { name: 'Attendance Summary', generatedAt: '09:15', status: 'Ready', format: 'CSV' },
      { name: 'Leave Balance Audit', generatedAt: '10:00', status: 'Queued', format: 'XLSX' },
      { name: 'Organization Coverage', generatedAt: '10:20', status: 'Delivered', format: 'PDF' },
    ],
    scheduleNotes: [
      'Morning refresh runs at 08:30 for leadership snapshots.',
      'Attendance export is queued after the primary clock sync window.',
      'Leave audit is part of the weekly Friday operations bundle.',
    ],
  };
}
