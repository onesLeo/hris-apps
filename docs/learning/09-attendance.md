# Attendance Module

The Attendance module is currently a read-only operational snapshot.
It is useful as a dashboard-style overview while the backend attendance engine is still being designed.

Key files:
- [apps/web/src/components/attendance/attendance-screen.tsx](../../apps/web/src/components/attendance/attendance-screen.tsx)
- [apps/web/src/components/attendance/attendance-data.ts](../../apps/web/src/components/attendance/attendance-data.ts)
- [apps/web/src/i18n/attendance-copy.ts](../../apps/web/src/i18n/attendance-copy.ts)

## What it does

- shows attendance summary cards
- shows shift and coverage information
- shows late or absent patterns
- gives a preview of attendance health without editing data

## Flow

1. `AttendanceScreen` reads the current locale copy.
2. `getAttendanceOverview()` returns the local snapshot.
3. The screen renders the summary and pattern sections.
4. There are no write actions yet.

## Java equivalent

- this is similar to a Spring read model dashboard
- `attendance-data.ts` is similar to a query service or report projection
- the screen is like a JSP or Thymeleaf page backed by a DTO

## How to debug

- If the cards do not render, check `getAttendanceOverview()`.
- If labels are wrong, check `attendance-copy.ts`.
- If the layout looks crowded, inspect the dual-grid and card padding in the screen component.

## Implementation notes

- The module is intentionally read-only for now.
- Later it will connect to actual clock events, shift rules, and attendance policies.

