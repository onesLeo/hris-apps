# Dashboard Module

The Dashboard is the home screen for HR admins. It summarizes workforce KPIs,
headcount trends, department mix, recent onboardings, and pending approvals.

Key files:
- [apps/web/src/components/dashboard/dashboard-screen.tsx](../../apps/web/src/components/dashboard/dashboard-screen.tsx)
- [apps/web/src/i18n/dashboard-copy.ts](../../apps/web/src/i18n/dashboard-copy.ts)
- [apps/web/src/components/approvals/approvals-data.ts](../../apps/web/src/components/approvals/approvals-data.ts)

## What it does

- shows four KPI cards
- renders a headcount trend chart
- shows the department distribution
- lists recent onboardings
- surfaces a compact pending approvals panel
- supports EN and ID copy through the locale helper

## Flow

1. `DashboardScreen` reads the active locale.
2. `getDashboardCopy(locale)` returns the language-specific labels.
3. The screen renders static KPI values and small reusable cards.
4. `APPROVALS` is reused from the approvals data module so the dashboard and approvals page stay aligned.
5. The chart is rendered from a local numeric series through `makePath()`.

## Java equivalent

- the screen is similar to a Spring MVC dashboard view model
- `KpiCard` is like a reusable JSP/Thymeleaf fragment or view component
- `makePath()` is like a pure presentation helper method in a service or utility class
- `APPROVALS` is like a shared seed or read model used by two screens

## How to debug

- If the chart is empty, check the `HEADCOUNT` data and `makePath()` coordinates.
- If the KPI labels are wrong, check `dashboard-copy.ts`.
- If approvals counts do not match the approvals page, check `approvals-data.ts`.
- If locale switching fails, confirm `useLocale()` is working in the shell.

## Implementation notes

- The dashboard is still mock-driven.
- Values are intentionally local so the UI can be polished before backend integration.
- Later we can replace the static arrays with live API data without changing the visual structure.

