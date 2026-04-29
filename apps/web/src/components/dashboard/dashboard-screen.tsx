'use client';

import { Badge, Avatar, Icon, SectionHeading } from '../aurora-primitives';
import { getDashboardCopy, useLocale } from '../../i18n';
import type { DashboardCopy } from '../../i18n/dashboard-copy';
import { getApprovalsData } from '../approvals/approvals-data';

const DASHBOARD_DATA: Record<'en' | 'id', {
  headcount: number[];
  months: string[];
  departments: Array<{ name: string; count: number; pct: number; color: string }>;
  onboardings: Array<{ name: string; role: string; dept: string; date: string; initials: string; color: string }>;
}> = {
  en: {
    headcount: [1180, 1192, 1198, 1205, 1215, 1218, 1224, 1231, 1235, 1239, 1244, 1247],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    departments: [
      { name: 'Engineering', count: 312, pct: 0.75, color: '#e8317a' },
      { name: 'Operations', count: 245, pct: 0.58, color: '#8b5cf6' },
      { name: 'Sales', count: 198, pct: 0.47, color: '#06b6d4' },
      { name: 'HR & Admin', count: 156, pct: 0.37, color: '#10b981' },
      { name: 'Finance', count: 134, pct: 0.32, color: '#f59e0b' },
      { name: 'Others', count: 202, pct: 0.48, color: '#94a3b8' },
    ],
    onboardings: [
      { name: 'Sarah Chen', role: 'Senior Engineer', dept: 'Engineering', date: 'Apr 25', initials: 'SC', color: '#f43f8e' },
      { name: 'Marcus Johnson', role: 'Product Manager', dept: 'Product', date: 'Apr 24', initials: 'MJ', color: '#8b5cf6' },
      { name: 'Aisha Patel', role: 'Data Analyst', dept: 'Operations', date: 'Apr 23', initials: 'AP', color: '#06b6d4' },
      { name: 'Lucas Rivera', role: 'UX Designer', dept: 'Design', date: 'Apr 22', initials: 'LR', color: '#10b981' },
      { name: 'Emma Williams', role: 'Finance Lead', dept: 'Finance', date: 'Apr 21', initials: 'EW', color: '#f59e0b' },
    ],
  },
  id: {
    headcount: [1180, 1192, 1198, 1205, 1215, 1218, 1224, 1231, 1235, 1239, 1244, 1247],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    departments: [
      { name: 'Engineering', count: 312, pct: 0.75, color: '#e8317a' },
      { name: 'Operasional', count: 245, pct: 0.58, color: '#8b5cf6' },
      { name: 'Penjualan', count: 198, pct: 0.47, color: '#06b6d4' },
      { name: 'SDM & Admin', count: 156, pct: 0.37, color: '#10b981' },
      { name: 'Keuangan', count: 134, pct: 0.32, color: '#f59e0b' },
      { name: 'Lainnya', count: 202, pct: 0.48, color: '#94a3b8' },
    ],
    onboardings: [
      { name: 'Sarah Chen', role: 'Engineer Senior', dept: 'Engineering', date: '25 Apr', initials: 'SC', color: '#f43f8e' },
      { name: 'Marcus Johnson', role: 'Manajer Produk', dept: 'Produk', date: '24 Apr', initials: 'MJ', color: '#8b5cf6' },
      { name: 'Aisha Patel', role: 'Analis Data', dept: 'Operasional', date: '23 Apr', initials: 'AP', color: '#06b6d4' },
      { name: 'Lucas Rivera', role: 'Desainer UX', dept: 'Desain', date: '22 Apr', initials: 'LR', color: '#10b981' },
      { name: 'Emma Williams', role: 'Lead Keuangan', dept: 'Keuangan', date: '21 Apr', initials: 'EW', color: '#f59e0b' },
    ],
  },
};

function makePath(data: number[], width: number, height: number, pad = 12) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => ({
    x: pad + (index / (data.length - 1)) * (width - pad * 2),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
  }));

  let linePath = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    linePath += ` C ${(prev.x + (curr.x - prev.x) * 0.45).toFixed(1)} ${prev.y.toFixed(1)} ${(prev.x + (curr.x - prev.x) * 0.55).toFixed(1)} ${curr.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  const areaPath = `${linePath} L ${points[points.length - 1]!.x.toFixed(1)} ${height} L ${points[0]!.x.toFixed(1)} ${height} Z`;
  return { linePath, areaPath, points };
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
  icon: 'users' | 'checkCircle' | 'calendar' | 'briefcase';
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

function HeadcountChart({ copy, headcount, months }: { copy: DashboardCopy; headcount: number[]; months: string[] }) {
  const width = 560;
  const height = 170;
  const { linePath, areaPath, points } = makePath(headcount, width, height, 10);

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title={copy.headcountTrend}
        subtitle={copy.headcountSubtitle}
        action={
          <div className="aurora-pill-row">
            {copy.periods.map((label, index) => (
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
        {months.map((month, index) => (
          <text key={month} x={10 + (index / 11) * (width - 20)} y={height + 18} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-muted)' }}>
            {month}
          </text>
        ))}
      </svg>
    </div>
  );
}

function DepartmentCard({ copy, departments }: { copy: DashboardCopy; departments: typeof DASHBOARD_DATA.en.departments }) {
  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading title={copy.byDepartment} subtitle={copy.totalEmployeesSubtitle} />
      <div className="aurora-screen-stack" style={{ gap: 11 }}>
        {departments.map((department, index) => (
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

function OnboardingCard({ copy, onboardings }: { copy: DashboardCopy; onboardings: typeof DASHBOARD_DATA.en.onboardings }) {
  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading
        title={copy.recentOnboardings}
        action={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>
            <span>{copy.viewAll}</span>
            <Icon name="chevronRight" size={13} color="currentColor" strokeWidth={2} />
          </div>
        }
      />
      <div className="aurora-screen-stack" style={{ gap: 0 }}>
        {onboardings.map((employee, index) => (
          <div
            key={employee.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 0',
              borderBottom: index < onboardings.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <Avatar initials={employee.initials} color={employee.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{employee.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {employee.role} {'·'} {employee.dept}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{employee.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingApprovalsCard({ copy }: { copy: DashboardCopy }) {
  const { locale } = useLocale();
  const approvals = getApprovalsData(locale);

  return (
    <div className="aurora-card aurora-card-padding aurora-card-lift">
      <SectionHeading title={copy.pending} action={<Badge label={`${approvals.length}`} tone="accent" />} />
      <div className="aurora-screen-stack" style={{ gap: 0 }}>
        {approvals.map((approval, index) => (
          <div key={approval.name} style={{ padding: '9px 0', borderBottom: index < approvals.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{approval.name}</span>
              {approval.urgent && <Badge label={copy.urgent} tone="danger" />}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '3px 0 8px' }}>{approval.detail}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: 'var(--accent)', borderRadius: 7, padding: '5px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                {copy.approve}
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '5px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-mid)' }}>
                {copy.decline}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale);
  const demo = DASHBOARD_DATA[locale];

  return (
    <div className="aurora-screen-stack" style={{ animation: 'auroraFadeUp 0.4s ease' }}>
      <div className="aurora-kpi-grid">
        <KpiCard label={copy.kpis.totalEmployees} value="1,247" change={locale === 'id' ? '+12 bulan ini' : '+12 this month'} positive icon="users" accent="#e8317a" />
        <KpiCard label={copy.kpis.activeToday} value="1,183" change={locale === 'id' ? 'Tingkat 94.9%' : '94.9% rate'} positive icon="checkCircle" accent="#8b5cf6" />
        <KpiCard label={copy.kpis.onLeave} value="23" change={locale === 'id' ? '1.8% tenaga kerja' : '1.8% workforce'} positive={false} icon="calendar" accent="#f59e0b" />
        <KpiCard label={copy.kpis.openPositions} value="8" change={locale === 'id' ? '+3 minggu ini' : '+3 this week'} positive={false} icon="briefcase" accent="#06b6d4" />
      </div>

      <div className="aurora-dual-grid">
        <HeadcountChart copy={copy} headcount={demo.headcount} months={demo.months} />
        <DepartmentCard copy={copy} departments={demo.departments} />
      </div>

      <div className="aurora-row-grid">
        <OnboardingCard copy={copy} onboardings={demo.onboardings} />
        <PendingApprovalsCard copy={copy} />
      </div>

      <div className="aurora-mobile-only">
        <div className="aurora-card aurora-card-padding">
          <SectionHeading title={copy.quickActions} />
          <div className="aurora-screen-stack" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', display: 'grid', gap: 12 }}>
            {[
              { label: copy.applyLeave, icon: 'calendar' as const },
              { label: copy.myTeam, icon: 'users' as const },
              { label: copy.approvals, icon: 'checkCircle' as const },
              { label: copy.reports, icon: 'chartBar' as const },
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
