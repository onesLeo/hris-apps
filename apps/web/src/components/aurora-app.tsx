'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type Screen = 'dashboard' | 'people' | 'leave' | 'approvals';

type LeaveForm = {
  leaveType: string;
  fromDate: string;
  toDate: string;
  notes: string;
  file: File | null;
};

type UploadState = 'idle' | 'uploading' | 'success' | 'error';
type Accent =
  | 'accent'
  | 'violet'
  | 'warning'
  | 'info'
  | 'success'
  | 'danger'
  | 'ghost';

type IconName =
  | 'home'
  | 'users'
  | 'building'
  | 'clock'
  | 'calendar'
  | 'checkCircle'
  | 'briefcase'
  | 'search'
  | 'bell'
  | 'settings'
  | 'grid'
  | 'chevronDown'
  | 'chevronRight'
  | 'plus'
  | 'eye'
  | 'dotsH'
  | 'filter'
  | 'xMark'
  | 'trending'
  | 'check'
  | 'send'
  | 'clipboard'
  | 'book'
  | 'chartBar'
  | 'download'
  | 'edit'
  | 'trash'
  | 'mapPin'
  | 'logout'
  | 'user';

const ICONS: Record<IconName, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronRight: 'M9 5l7 7-7 7',
  plus: 'M12 4v16m8-8H4',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  dotsH: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
  filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  xMark: 'M6 18L18 6M6 6l12 12',
  trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  check: 'M5 13l4 4L19 7',
  send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  chartBar: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  mapPin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
};

const NAV_ITEMS: Array<{
  id: Screen;
  label: string;
  icon: IconName;
  subtitle: string;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', subtitle: 'Overview' },
  { id: 'people', label: 'People', icon: 'users', subtitle: 'Employee directory' },
  { id: 'leave', label: 'Leave', icon: 'calendar', subtitle: 'Balances and requests' },
  { id: 'approvals', label: 'Approvals', icon: 'checkCircle', subtitle: 'Pending actions' },
];

const FEATURE_MENU = [
  { label: 'Organization', icon: 'building' as const, soon: true },
  { label: 'Attendance', icon: 'clock' as const, soon: true },
  { label: 'Payroll', icon: 'briefcase' as const, soon: true },
  { label: 'Performance', icon: 'trending' as const, soon: true },
  { label: 'Recruitment', icon: 'briefcase' as const, soon: true },
  { label: 'Learning', icon: 'book' as const, soon: true },
  { label: 'Reports', icon: 'chartBar' as const, soon: true },
];

const HEADCOUNT = [1180, 1192, 1198, 1205, 1215, 1218, 1224, 1231, 1235, 1239, 1244, 1247];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEPARTMENTS = [
  { name: 'Engineering', count: 312, pct: 0.75, color: '#e8317a' },
  { name: 'Operations', count: 245, pct: 0.58, color: '#8b5cf6' },
  { name: 'Sales', count: 198, pct: 0.47, color: '#06b6d4' },
  { name: 'HR & Admin', count: 156, pct: 0.37, color: '#10b981' },
  { name: 'Finance', count: 134, pct: 0.32, color: '#f59e0b' },
  { name: 'Others', count: 202, pct: 0.48, color: '#94a3b8' },
];

const ONBOARDINGS = [
  { name: 'Sarah Chen', role: 'Senior Engineer', dept: 'Engineering', date: 'Apr 25', initials: 'SC', color: '#f43f8e' },
  { name: 'Marcus Johnson', role: 'Product Manager', dept: 'Product', date: 'Apr 24', initials: 'MJ', color: '#8b5cf6' },
  { name: 'Aisha Patel', role: 'Data Analyst', dept: 'Operations', date: 'Apr 23', initials: 'AP', color: '#06b6d4' },
  { name: 'Lucas Rivera', role: 'UX Designer', dept: 'Design', date: 'Apr 22', initials: 'LR', color: '#10b981' },
  { name: 'Emma Williams', role: 'Finance Lead', dept: 'Finance', date: 'Apr 21', initials: 'EW', color: '#f59e0b' },
];

const EMPLOYEES = [
  { name: 'Sarah Chen', role: 'Senior Engineer', dept: 'Engineering', status: 'Active', type: 'Remote', since: 'Apr 2022', initials: 'SC', color: '#f43f8e' },
  { name: 'Marcus Johnson', role: 'Product Manager', dept: 'Product', status: 'Active', type: 'Office', since: 'Jan 2023', initials: 'MJ', color: '#8b5cf6' },
  { name: 'Aisha Patel', role: 'Data Analyst', dept: 'Operations', status: 'On Leave', type: 'Hybrid', since: 'Jul 2022', initials: 'AP', color: '#06b6d4' },
  { name: 'Lucas Rivera', role: 'UX Designer', dept: 'Design', status: 'Active', type: 'Office', since: 'Mar 2023', initials: 'LR', color: '#10b981' },
  { name: 'Emma Williams', role: 'Finance Lead', dept: 'Finance', status: 'Active', type: 'Office', since: 'Sep 2021', initials: 'EW', color: '#f59e0b' },
  { name: 'James Kim', role: 'DevOps Engineer', dept: 'Engineering', status: 'Active', type: 'Remote', since: 'Feb 2023', initials: 'JK', color: '#6366f1' },
  { name: 'Sofia Martinez', role: 'HR Specialist', dept: 'HR & Admin', status: 'Active', type: 'Office', since: 'May 2022', initials: 'SM', color: '#ec4899' },
  { name: 'Noah Thompson', role: 'Sales Executive', dept: 'Sales', status: 'Active', type: 'Hybrid', since: 'Nov 2022', initials: 'NT', color: '#14b8a6' },
  { name: 'Olivia Brown', role: 'Content Strategist', dept: 'Marketing', status: 'On Leave', type: 'Remote', since: 'Jan 2023', initials: 'OB', color: '#f97316' },
  { name: 'Ethan Davis', role: 'Backend Developer', dept: 'Engineering', status: 'Active', type: 'Remote', since: 'Aug 2022', initials: 'ED', color: '#a78bfa' },
  { name: 'Amara Osei', role: 'Recruitment Lead', dept: 'HR & Admin', status: 'Active', type: 'Office', since: 'Jun 2021', initials: 'AO', color: '#34d399' },
  { name: 'Ryan Park', role: 'QA Engineer', dept: 'Engineering', status: 'Active', type: 'Hybrid', since: 'Oct 2023', initials: 'RP', color: '#fb7185' },
];

const LEAVE_BALANCES = [
  { label: 'Annual Leave', used: 8, total: 20, color: '#e8317a' },
  { label: 'Sick Leave', used: 3, total: 10, color: '#8b5cf6' },
  { label: 'Compensatory', used: 1, total: 5, color: '#06b6d4' },
  { label: 'WFH Days', used: 12, total: 24, color: '#10b981' },
];

const LEAVE_REQUESTS = [
  { name: 'John Smith', type: 'Annual Leave', from: 'Apr 28', to: 'Apr 30', days: 3, status: 'Pending', initials: 'JS', color: '#6366f1' },
  { name: 'Lisa Park', type: 'Sick Leave', from: 'Apr 25', to: 'Apr 25', days: 1, status: 'Approved', initials: 'LP', color: '#f43f8e' },
  { name: 'Tom Bradley', type: 'Annual Leave', from: 'May 5', to: 'May 9', days: 5, status: 'Pending', initials: 'TB', color: '#10b981' },
  { name: 'Nina Okafor', type: 'Maternity Leave', from: 'May 1', to: 'Aug 1', days: 63, status: 'Approved', initials: 'NO', color: '#8b5cf6' },
  { name: 'Carlos Mendez', type: 'Unpaid Leave', from: 'Apr 29', to: 'Apr 29', days: 1, status: 'Rejected', initials: 'CM', color: '#f59e0b' },
  { name: 'Yuki Tanaka', type: 'Annual Leave', from: 'May 12', to: 'May 16', days: 5, status: 'Pending', initials: 'YT', color: '#06b6d4' },
  { name: 'Alex Turner', type: 'Paternity Leave', from: 'May 2', to: 'May 15', days: 10, status: 'Approved', initials: 'AT', color: '#ec4899' },
];

const APPROVALS = [
  { name: 'John Smith', dept: 'Engineering', type: 'Annual Leave', detail: '3 days - Apr 28 to 30', urgent: true, initials: 'JS', color: '#6366f1' },
  { name: 'Tom Bradley', dept: 'Sales', type: 'WFH Request', detail: '2 days - Apr 29 to 30', urgent: false, initials: 'TB', color: '#10b981' },
  { name: 'Yuki Tanaka', dept: 'Operations', type: 'Annual Leave', detail: '5 days - May 12 to 16', urgent: false, initials: 'YT', color: '#06b6d4' },
  { name: 'Nina Okafor', dept: 'Design', type: 'Equipment Request', detail: 'MacBook Pro 16"', urgent: true, initials: 'NO', color: '#8b5cf6' },
  { name: 'Carlos Mendez', dept: 'Product', type: 'Training Approval', detail: 'React Advanced - $499', urgent: false, initials: 'CM', color: '#f59e0b' },
];

function iconPath(name: IconName): string {
  return ICONS[name];
}

function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={iconPath(name)} />
    </svg>
  );
}

function Avatar({ initials, color, size = 34 }: { initials: string; color: string; size?: number }) {
  return (
    <div className="aurora-avatar" style={{ width: size, height: size, borderRadius: size * 0.3, background: `${color}20`, border: `1px solid ${color}30`, color }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700 }}>{initials}</span>
    </div>
  );
}

function Badge({ label, tone = 'ghost' }: { label: string; tone?: Accent }) {
  return <span className={`aurora-badge is-${tone}`}>{label}</span>;
}

function Button({
  children,
  variant = 'default',
  size = 'md',
  onClick,
}: {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'md' | 'sm';
  onClick?: () => void;
}) {
  const classes = [
    'aurora-button',
    variant === 'primary' ? 'is-primary' : '',
    variant === 'ghost' ? 'is-ghost' : '',
    size === 'sm' ? 'is-small' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

function makePath(data: number[], width: number, height: number, pad = 12) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => ({
    x: pad + (index / (data.length - 1)) * (width - pad * 2),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
  }));

  let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    linePath += ` C ${(prev.x + (curr.x - prev.x) * 0.45).toFixed(1)} ${prev.y.toFixed(1)} ${(prev.x + (curr.x - prev.x) * 0.55).toFixed(1)} ${curr.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
  return { linePath, areaPath, points };
}

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div>
        <div className="aurora-card-title">{title}</div>
        {subtitle && <div className="aurora-card-subtitle" style={{ marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  positive,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: IconName;
  accent: string;
}) {
  return (
    <div className="aurora-card aurora-card-lift aurora-card-padding">
      <div className="aurora-kpi-top">
        <div className="aurora-kpi-icon" style={{ background: `${accent}1a` }}>
          <Icon name={icon} size={17} color={accent} strokeWidth={1.8} />
        </div>
        <Badge label={change} tone={positive ? 'success' : 'danger'} />
      </div>
      <div className="aurora-kpi-value">{value}</div>
      <div className="aurora-kpi-label">{label}</div>
    </div>
  );
}

function HeadcountChart() {
  const width = 560;
  const height = 170;
  const { linePath, areaPath, points } = makePath(HEADCOUNT, width, height, 10);

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title="Headcount Trend"
        subtitle="Full year 2025 - +67 employees"
        action={
          <div className="aurora-pill-row">
            {['Month', 'Quarter', 'Year'].map((label, index) => (
              <span key={label} className={`aurora-pill ${index === 2 ? 'is-active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        }
      />
      <svg width={width} height={height + 24} style={{ overflow: 'visible', display: 'block', width: '100%' }}>
        <defs>
          <linearGradient id="auroraHeadcount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={10} y1={height * ratio} x2={width - 10} y2={height * ratio} stroke="var(--border)" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#auroraHeadcount)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" className="aurora-animate-draw" />
        {points.map((point, index) => (index % 2 === 0 ? <circle key={index} cx={point.x} cy={point.y} r="3.5" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2" /> : null))}
        {MONTHS.map((month, index) => (
          <text key={month} x={10 + (index / 11) * (width - 20)} y={height + 18} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-muted)' }}>
            {month}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DepartmentCard() {
  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading title="By Department" subtitle="1,247 total employees" />
      <div className="aurora-screen-stack" style={{ gap: 11 }}>
        {DEPARTMENTS.map((department, index) => (
          <div key={department.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 500 }}>{department.name}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>{department.count}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${department.pct * 100}%`,
                  background: department.color,
                  borderRadius: 10,
                  animation: `auroraBar 1s ${0.1 * index}s ease both`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OnboardingCard() {
  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading title="Recent Onboardings" action={<span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>View all -&gt;</span>} />
      <div className="aurora-screen-stack" style={{ gap: 0 }}>
        {ONBOARDINGS.map((employee, index) => (
          <div
            key={employee.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 0',
              borderBottom: index < ONBOARDINGS.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <Avatar initials={employee.initials} color={employee.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{employee.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {employee.role} - {employee.dept}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{employee.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingApprovalsCard() {
  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading title="Pending" action={<Badge label="5" tone="accent" />} />
      <div className="aurora-screen-stack" style={{ gap: 0 }}>
        {APPROVALS.map((approval, index) => (
          <div key={approval.name} style={{ padding: '9px 0', borderBottom: index < APPROVALS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{approval.name}</span>
              {approval.urgent && <Badge label="Urgent" tone="danger" />}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '3px 0 8px' }}>{approval.detail}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: 'var(--accent)', borderRadius: 7, padding: '5px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                Approve
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '5px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>
                Decline
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        <KpiCard label="Total Employees" value="1,247" change="+12 this month" positive icon="users" accent="#e8317a" />
        <KpiCard label="Active Today" value="1,183" change="94.9% rate" positive icon="checkCircle" accent="#8b5cf6" />
        <KpiCard label="On Leave" value="23" change="1.8% workforce" positive={false} icon="calendar" accent="#f59e0b" />
        <KpiCard label="Open Positions" value="8" change="+3 this week" positive={false} icon="briefcase" accent="#06b6d4" />
      </div>

      <div className="aurora-dual-grid">
        <HeadcountChart />
        <DepartmentCard />
      </div>

      <div className="aurora-row-grid">
        <OnboardingCard />
        <PendingApprovalsCard />
      </div>

      <div className="aurora-mobile-only">
        <div className="aurora-card aurora-card-padding">
          <SectionHeading title="Quick Actions" />
          <div className="aurora-screen-stack" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', display: 'grid', gap: 12 }}>
            {[
              { label: 'Apply Leave', icon: 'calendar' as const },
              { label: 'My Team', icon: 'users' as const },
              { label: 'Approvals', icon: 'checkCircle' as const },
              { label: 'Reports', icon: 'chartBar' as const },
            ].map((action) => (
              <div key={action.label} className="aurora-card" style={{ padding: 14, borderRadius: 14, background: 'rgba(139,92,246,0.04)', boxShadow: 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name={action.icon} size={16} color="var(--accent)" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const tone: Record<string, Accent> = {
    Active: 'success',
    'On Leave': 'warning',
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Remote: 'info',
    Office: 'violet',
    Hybrid: 'accent',
    Urgent: 'danger',
  };
  return <Badge label={label} tone={tone[label] ?? 'ghost'} />;
}

function PeopleScreen() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filters = ['All', 'Active', 'On Leave', 'Remote', 'Office'];

  const filtered = useMemo(
    () =>
      EMPLOYEES.filter((employee) => {
        const matchesFilter = filter === 'All' || employee.status === filter || employee.type === filter;
        const query = search.toLowerCase();
        const matchesSearch =
          !query ||
          employee.name.toLowerCase().includes(query) ||
          employee.role.toLowerCase().includes(query) ||
          employee.dept.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
      }),
    [filter, search],
  );

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)', borderRadius: 12, padding: '9px 14px', border: '1px solid var(--border)', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={15} color="var(--text-muted)" strokeWidth={2} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees..."
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13, color: 'var(--text-primary)' }}
          />
        </div>

        <div className="aurora-pill-row">
          {filters.map((item) => (
            <button key={item} type="button" className={`aurora-pill ${filter === item ? 'is-active' : ''}`} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary">
            <Icon name="plus" size={14} color="#fff" strokeWidth={2} />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="aurora-card aurora-table aurora-card-lift">
        <div className="aurora-table-head" style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 80px' }}>
          {['Employee', 'Department', 'Status', 'Work Type', 'Joined', ''].map((label) => (
            <span key={label} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </span>
          ))}
        </div>

        {filtered.map((employee, index) => (
          <div
            key={`${employee.name}-${index}`}
            className="aurora-table-row"
            style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr 80px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={employee.initials} color={employee.color} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{employee.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{employee.role}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{employee.dept}</span>
            <StatusBadge label={employee.status} />
            <StatusBadge label={employee.type} />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{employee.since}</span>
            <div className="aurora-row-actions">
              <div className="aurora-icon-swatch">
                <Icon name="eye" size={14} color="var(--text-muted)" strokeWidth={1.8} />
              </div>
              <div className="aurora-icon-swatch">
                <Icon name="dotsH" size={14} color="var(--text-muted)" strokeWidth={1.8} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="aurora-footer-note">
        Showing {filtered.length} of {EMPLOYEES.length} employees
      </div>
    </div>
  );
}

const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Compensatory',
  'Maternity Leave',
  'Paternity Leave',
  'WFH Days',
  'Unpaid Leave',
];

const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LeaveApplicationModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<LeaveForm>({
    leaveType: 'Annual Leave',
    fromDate: '',
    toDate: '',
    notes: '',
    file: null,
  });
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileError, setFileError] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setFileError('');
    if (!picked) { setForm((f) => ({ ...f, file: null })); return; }
    if (picked.size > MAX_FILE_BYTES) {
      setFileError('File exceeds 10 MB limit.');
      event.target.value = '';
      return;
    }
    setForm((f) => ({ ...f, file: picked }));
  }

  async function handleSubmit() {
    if (!form.fromDate || !form.toDate) return;
    setUploadState('uploading');
    try {
      if (form.file) {
        const body = new FormData();
        body.append('file', form.file);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/v1/upload/leave-document`,
          { method: 'POST', body },
        );
        if (!res.ok) throw new Error('Upload failed');
      }
      setSubmittedName(form.leaveType);
      setUploadState('success');
    } catch {
      setUploadState('error');
    }
  }

  if (uploadState === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="aurora-card aurora-card-padding" style={{ width: 400, textAlign: 'center', gap: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="checkCircle" size={26} color="#10b981" strokeWidth={1.8} />
          </div>
          <div className="aurora-card-title">Leave Applied</div>
          <div className="aurora-card-subtitle">{submittedName} request submitted successfully{form.file ? ' with supporting document' : ''}.</div>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="aurora-card aurora-card-padding" style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="aurora-card-title">Apply for Leave</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="xMark" size={18} color="var(--text-muted)" strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leave Type</span>
            <select
              value={form.leaveType}
              onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
            >
              {LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['fromDate', 'toDate'] as const).map((field) => (
              <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {field === 'fromDate' ? 'From' : 'To'}
                </span>
                <input
                  type="date"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
                />
              </label>
            ))}
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason (optional)</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Briefly describe the reason for leave..."
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </label>

          {/* File attachment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporting Document (optional)</span>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: `1.5px dashed ${fileError ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '12px 16px',
                cursor: 'pointer',
                background: form.file ? 'rgba(16,185,129,0.04)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Icon
                name={form.file ? 'checkCircle' : 'clipboard'}
                size={18}
                color={form.file ? '#10b981' : 'var(--text-muted)'}
                strokeWidth={1.8}
              />
              {form.file ? (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.file.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatBytes(form.file.size)}</div>
                </div>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Attach PDF, image, or Word document &mdash; max 10 MB</span>
              )}
              {form.file && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setForm((f) => ({ ...f, file: null })); setFileError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Icon name="xMark" size={14} color="var(--text-muted)" strokeWidth={2} />
                </button>
              )}
            </label>
            {fileError && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{fileError}</span>}
          </div>
        </div>

        {uploadState === 'error' && (
          <div style={{ fontSize: 13, color: 'var(--danger)', background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '9px 12px' }}>
            Something went wrong. Please try again.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            {uploadState === 'uploading' ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeaveScreen() {
  const [tab, setTab] = useState('All');
  const tabs = ['All', 'Pending', 'Approved', 'Rejected'];
  const filtered = tab === 'All' ? LEAVE_REQUESTS : LEAVE_REQUESTS.filter((request) => request.status === tab);
  const [showApplyModal, setShowApplyModal] = useState(false);

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      {showApplyModal && <LeaveApplicationModal onClose={() => setShowApplyModal(false)} />}
      <div className="aurora-kpi-grid">
        {LEAVE_BALANCES.map((balance) => (
          <div key={balance.label} className="aurora-card aurora-card-padding aurora-card-lift">
            <div className="aurora-card-subtitle" style={{ marginBottom: 8, fontWeight: 500 }}>
              {balance.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px' }}>{balance.total - balance.used}</span>
              <span className="aurora-card-subtitle">/ {balance.total} days left</span>
            </div>
            <div style={{ height: 5, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(balance.used / balance.total) * 100}%`,
                  background: balance.color,
                  borderRadius: 10,
                  animation: 'auroraBar 1s ease both',
                }}
              />
            </div>
            <div className="aurora-card-subtitle" style={{ marginTop: 5 }}>
              {balance.used} used
            </div>
          </div>
        ))}
      </div>

      <div className="aurora-card aurora-table aurora-card-lift">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="aurora-pill-row">
            {tabs.map((item) => (
              <button key={item} type="button" className={`aurora-pill ${tab === item ? 'is-active' : ''}`} onClick={() => setTab(item)}>
                {item}
                {item !== 'All' && (
                  <span style={{ marginLeft: 4, background: tab === item ? 'var(--accent)' : 'var(--border)', color: tab === item ? '#fff' : 'var(--text-muted)', borderRadius: 10, padding: '0 5px', fontSize: 10.5, fontWeight: 700 }}>
                    {LEAVE_REQUESTS.filter((request) => request.status === item).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button size="sm" variant="primary" onClick={() => setShowApplyModal(true)}>
            <Icon name="plus" size={13} color="#fff" strokeWidth={2} />
            Apply Leave
          </Button>
        </div>

        <div className="aurora-table-head" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 0.8fr 1fr' }}>
          {['Employee', 'Leave Type', 'Duration', 'Days', 'Status', 'Actions'].map((label) => (
            <span key={label} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {label}
            </span>
          ))}
        </div>

        {filtered.map((leave, index) => (
          <div key={`${leave.name}-${index}`} className="aurora-table-row" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 0.8fr 1fr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={leave.initials} color={leave.color} size={30} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{leave.name}</span>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{leave.type}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>
              {leave.from} - {leave.to}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{leave.days}d</span>
            <StatusBadge label={leave.status} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {leave.status === 'Pending' ? (
                <>
                  <div style={{ background: 'var(--accent)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                    Approve
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>
                    Decline
                  </div>
                </>
              ) : (
                <Icon name="eye" size={16} color="var(--text-muted)" strokeWidth={1.8} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApprovalsScreen() {
  const [approved, setApproved] = useState<number[]>([]);
  const [declined, setDeclined] = useState<number[]>([]);

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        {[
          { label: 'Pending Approval', value: APPROVALS.length - approved.length - declined.length, color: '#f59e0b', icon: 'clock' as const },
          { label: 'Approved Today', value: approved.length, color: '#10b981', icon: 'checkCircle' as const },
          { label: 'Declined Today', value: declined.length, color: '#ef4444', icon: 'xMark' as const },
          { label: 'Avg. Response Time', value: '2.4h', color: '#06b6d4', icon: 'trending' as const },
        ].map((stat) => (
          <div key={stat.label} className="aurora-card aurora-card-padding aurora-card-lift">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${stat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name={stat.icon} size={16} color={stat.color} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px' }}>{stat.value}</div>
            <div className="aurora-card-subtitle" style={{ marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="aurora-card-title" style={{ marginBottom: 14 }}>
          Pending Approvals
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {APPROVALS.map((approval, index) => {
            const isApproved = approved.includes(index);
            const isDeclined = declined.includes(index);
            const isDone = isApproved || isDeclined;
            return (
              <div
                key={approval.name}
                className="aurora-card aurora-card-padding aurora-card-lift"
                style={{
                  borderColor: isDone ? (isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border)',
                  opacity: isDone ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <Avatar initials={approval.initials} color={approval.color} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{approval.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{approval.dept}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {approval.urgent && <Badge label="Urgent" tone="danger" />}
                        {isApproved && <Badge label="Approved" tone="success" />}
                        {isDeclined && <Badge label="Rejected" tone="danger" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="aurora-subtle-box" style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{approval.type}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{approval.detail}</div>
                </div>

                {!isDone ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="aurora-button is-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setApproved((current) => (current.includes(index) ? current : [...current, index]));
                        setDeclined((current) => current.filter((item) => item !== index));
                      }}
                    >
                      <Icon name="check" size={14} color="#fff" strokeWidth={2} />
                      Approve
                    </button>
                    <button
                      type="button"
                      className="aurora-button"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setDeclined((current) => (current.includes(index) ? current : [...current, index]));
                        setApproved((current) => current.filter((item) => item !== index));
                      }}
                    >
                      <Icon name="xMark" size={14} color="var(--text-mid)" strokeWidth={2} />
                      Decline
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: isApproved ? 'var(--success)' : 'var(--danger)' }}>
                    {isApproved ? 'Approved' : 'Declined'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComingSoonScreen({ title }: { title: string }) {
  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift" style={{ minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="grid" size={22} color="var(--accent)" strokeWidth={1.8} />
      </div>
      <div className="aurora-card-title">{title}</div>
      <div className="aurora-card-subtitle" style={{ maxWidth: 420 }}>
        This module is part of the product roadmap and will follow the Aurora visual language when we implement it.
      </div>
    </div>
  );
}

export function AuroraApp() {
  const [active, setActive] = useState<Screen>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const screenInfo: Record<Screen, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Good morning, Alex. Tue, 28 Apr 2026' },
    people: { title: 'People', subtitle: 'Browse and manage employees' },
    leave: { title: 'Leave', subtitle: 'Balance and request overview' },
    approvals: { title: 'Approvals', subtitle: 'Review pending workflow actions' },
  };

  let activeScreen: ReactNode;
  switch (active) {
    case 'dashboard':
      activeScreen = <DashboardScreen />;
      break;
    case 'people':
      activeScreen = <PeopleScreen />;
      break;
    case 'leave':
      activeScreen = <LeaveScreen />;
      break;
    case 'approvals':
      activeScreen = <ApprovalsScreen />;
      break;
    default:
      activeScreen = <ComingSoonScreen title={screenInfo[active].title} />;
      break;
  }

  return (
    <div className="aurora-page">
      <aside className={`aurora-sidebar ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="aurora-brand">
          <div className="aurora-brand-mark">
            <Icon name="grid" size={17} color="#fff" strokeWidth={2} />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>PeopleOS</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>HRIS Platform</div>
            </div>
          )}
        </div>

        <nav className="aurora-nav">
          {NAV_ITEMS.map((item) => {
            const activeItem = active === item.id;
            return (
              <div key={item.id}>
                <div
                  className={`aurora-nav-item ${activeItem ? 'is-active' : ''} ${sidebarOpen ? '' : 'is-collapsed'}`}
                  onClick={() => setActive(item.id)}
                >
                  <Icon name={item.icon} size={17} color={activeItem ? 'var(--accent)' : 'var(--text-mid)'} strokeWidth={activeItem ? 2 : 1.6} />
                  {sidebarOpen && (
                    <>
                      <span className="aurora-nav-label">{item.label}</span>
                      <Icon name={activeItem ? 'chevronDown' : 'chevronRight'} size={12} color="var(--text-muted)" strokeWidth={2} />
                    </>
                  )}
                </div>
                {sidebarOpen && activeItem && (
                  <div className="aurora-subnav">
                    <div className="aurora-subnav-item">{item.subtitle}</div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ paddingTop: 8 }}>
            {FEATURE_MENU.map((item) => (
              <div key={item.label} className={`aurora-nav-item ${sidebarOpen ? '' : 'is-collapsed'}`} style={{ cursor: 'default', opacity: 0.78 }}>
                <Icon name={item.icon} size={17} color="var(--text-muted)" strokeWidth={1.6} />
                {sidebarOpen && (
                  <>
                    <span className="aurora-nav-label">{item.label}</span>
                    <span className="aurora-card-subtitle" style={{ fontSize: 10.5, textTransform: 'uppercase' }}>Soon</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="aurora-sidebar-footer">
          <div className={`aurora-nav-item ${sidebarOpen ? '' : 'is-collapsed'}`} style={{ cursor: 'default' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#f43f8e,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 11, fontWeight: 700 }}>
              AL
            </div>
            {sidebarOpen && (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Alex Lee</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>HR Admin</div>
                </div>
                <Icon name="settings" size={14} color="var(--text-muted)" strokeWidth={1.5} />
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="aurora-main">
        <header className="aurora-header">
          <div className="aurora-header-left">
            <div className="aurora-header-toggle" onClick={() => setSidebarOpen((value) => !value)}>
              <Icon name="grid" size={15} color="var(--accent2)" strokeWidth={1.8} />
            </div>
            <div>
              <div className="aurora-header-title">{screenInfo[active].title}</div>
              <div className="aurora-header-subtitle">{screenInfo[active].subtitle}</div>
            </div>
          </div>

          <div className="aurora-header-right">
            <div className="aurora-search">
              <Icon name="search" size={14} color="var(--text-muted)" strokeWidth={2} />
              <span style={{ fontSize: 13 }}>Search...</span>
            </div>
            <div className="aurora-bell">
              <Icon name="bell" size={16} color="var(--text-mid)" strokeWidth={1.8} />
              <span className="aurora-dot" />
            </div>
            <div className="aurora-avatar">AL</div>
          </div>
        </header>

        <main className="aurora-content">{activeScreen}</main>
      </div>

      <nav className="aurora-mobile-nav">
        {NAV_ITEMS.map((item) => (
          <div key={item.id} className={`aurora-mobile-tab ${active === item.id ? 'is-active' : ''}`} onClick={() => setActive(item.id)}>
            <Icon name={item.icon} size={22} color="currentColor" strokeWidth={1.8} />
          </div>
        ))}
      </nav>
    </div>
  );
}
