'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { getAppCopy, LocaleProvider, LocaleToggle, useLocale } from '../i18n';
import type { Screen } from '../i18n';
import { FEATURE_MENU, NAV_ITEMS, isActiveFeatureKey } from './aurora-shell-data';
import { Icon } from './aurora-primitives';
import { DashboardScreen } from './dashboard/dashboard-screen';
import { AttendanceScreen } from './attendance/attendance-screen';
import { ApprovalsScreen } from './approvals/approvals-screen';
import { LeaveScreen } from './leave/leave-screen';
import { OrganizationScreen } from './organization/organization-screen';
import { PeopleScreen } from './people/people-screen';
import { ReportsScreen } from './reports/reports-screen';
import { RecruitmentScreen } from './recruitment/recruitment-screen';
import { PerformanceScreen } from './performance/performance-screen';
import { LearningScreen } from './learning/learning-screen';
import { MyProfileScreen } from './profile/my-profile-screen';

export function AuroraApp() {
  return (
    <LocaleProvider>
      <AuroraAppShell />
    </LocaleProvider>
  );
}

function initials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

function AuroraAppShell() {
  const [active, setActive] = useState<Screen>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { locale, isTransitioning } = useLocale();
  const copy = getAppCopy(locale);
  const { data: session } = useSession();

  const userName = session?.user?.name ?? 'User';
  const userInitials = initials(userName);

  // Keep window.__hrisAuthToken in sync so api-client picks up the Keycloak token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (session?.accessToken) {
        window.__hrisAuthToken = session.accessToken;
      } else {
        delete window.__hrisAuthToken;
      }
    }
  }, [session?.accessToken]);

  let activeScreen: ReactNode;
  if (active === 'dashboard') {
    activeScreen = <DashboardScreen />;
  } else if (active === 'organization') {
    activeScreen = <OrganizationScreen />;
  } else if (active === 'attendance') {
    activeScreen = <AttendanceScreen />;
  } else if (active === 'reports') {
    activeScreen = <ReportsScreen />;
  } else if (active === 'recruitment') {
    activeScreen = <RecruitmentScreen />;
  } else if (active === 'performance') {
    activeScreen = <PerformanceScreen />;
  } else if (active === 'learning') {
    activeScreen = <LearningScreen />;
  } else if (active === 'people') {
    activeScreen = <PeopleScreen />;
  } else if (active === 'leave') {
    activeScreen = <LeaveScreen />;
  } else if (active === 'profile') {
    activeScreen = <MyProfileScreen />;
  } else {
    activeScreen = <ApprovalsScreen />;
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
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{copy.brandSubtitle}</div>
            </div>
          )}
        </div>

        <nav className="aurora-nav">
          {NAV_ITEMS.map((item) => {
            const activeItem = active === item.id;
            const itemCopy = copy.nav[item.id];
            return (
              <div key={item.id}>
                <div
                  className={`aurora-nav-item ${activeItem ? 'is-active' : ''} ${sidebarOpen ? '' : 'is-collapsed'}`}
                  onClick={() => setActive(item.id)}
                >
                  <Icon name={item.icon} size={17} color={activeItem ? 'var(--accent)' : 'var(--text-mid)'} strokeWidth={activeItem ? 2 : 1.6} />
                  {sidebarOpen && (
                    <>
                      <span className="aurora-nav-label">{itemCopy}</span>
                      <Icon name={activeItem ? 'chevronDown' : 'chevronRight'} size={12} color="var(--text-muted)" strokeWidth={2} />
                    </>
                  )}
                </div>
                {sidebarOpen && activeItem && (
                  <div className="aurora-subnav">
                    <div className="aurora-subnav-item">{copy.screenInfo[item.id].subtitle}</div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ paddingTop: 8 }}>
            {FEATURE_MENU.map((item) => (
              isActiveFeatureKey(item.key) ? (
                <div
                  key={item.key}
                  className={`aurora-nav-item ${active === item.key ? 'is-active' : ''} ${sidebarOpen ? '' : 'is-collapsed'}`}
                  style={{ cursor: 'pointer', opacity: 1 }}
                  onClick={() => setActive(item.key as Screen)}
                >
                  <Icon name={item.icon} size={17} color={active === item.key ? 'var(--accent)' : 'var(--text-mid)'} strokeWidth={active === item.key ? 2 : 1.6} />
                  {sidebarOpen && (
                    <>
                      <span className="aurora-nav-label">{copy.featureMenu[item.key]}</span>
                      <span className="aurora-card-subtitle" style={{ fontSize: 10.5 }}>
                        {copy.screenInfo[item.key].subtitle}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div key={item.key} className={`aurora-nav-item ${sidebarOpen ? '' : 'is-collapsed'}`} style={{ cursor: 'default', opacity: 0.78 }}>
                  <Icon name={item.icon} size={17} color="var(--text-muted)" strokeWidth={1.6} />
                  {sidebarOpen && (
                    <>
                      <span className="aurora-nav-label">{copy.featureMenu[item.key]}</span>
                      <span className="aurora-card-subtitle" style={{ fontSize: 10.5, textTransform: 'uppercase' }}>{copy.common.soon}</span>
                    </>
                  )}
                </div>
              )
            ))}
          </div>
        </nav>

        {/* User profile + logout */}
        <div className="aurora-sidebar-footer">
          <div
            className={`aurora-nav-item ${sidebarOpen ? '' : 'is-collapsed'}`}
            style={{ cursor: 'default' }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'linear-gradient(135deg,#f43f8e,#a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: '#fff', fontSize: 11, fontWeight: 700,
            }}>
              {userInitials}
            </div>
            {sidebarOpen && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{copy.profileRole}</div>
                </div>
                <button
                  type="button"
                  title="Sign out"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  style={{
                    background: 'none', border: 'none', padding: 4,
                    cursor: 'pointer', borderRadius: 6, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
                >
                  <Icon name="logout" size={14} color="var(--text-muted)" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className={`aurora-main ${isTransitioning ? 'is-localizing' : ''}`}>
        <header className="aurora-header">
          <div className="aurora-header-left">
            <div className="aurora-header-toggle" onClick={() => setSidebarOpen((value) => !value)}>
              <Icon name="grid" size={15} color="var(--accent2)" strokeWidth={1.8} />
            </div>
            <div>
              <div className="aurora-header-title">{copy.screenInfo[active].title}</div>
              <div className="aurora-header-subtitle">{copy.screenInfo[active].subtitle}</div>
            </div>
          </div>

          <div className="aurora-header-right">
            <LocaleToggle />
            <div className="aurora-search">
              <Icon name="search" size={14} color="var(--text-muted)" strokeWidth={2} />
              <span style={{ fontSize: 13 }}>{copy.searchPlaceholder}</span>
            </div>
            <div className="aurora-bell">
              <Icon name="bell" size={16} color="var(--text-mid)" strokeWidth={1.8} />
              <span className="aurora-dot" />
            </div>
            <div
              className="aurora-avatar"
              title={`${userName} — click to sign out`}
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ cursor: 'pointer' }}
            >
              {userInitials}
            </div>
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
