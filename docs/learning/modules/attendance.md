# Attendance Deep Dive

The Attendance module is a read-only snapshot of workforce attendance.

Key files:
- [apps/web/src/components/attendance/attendance-screen.tsx](../../../apps/web/src/components/attendance/attendance-screen.tsx)
- [apps/web/src/components/attendance/attendance-data.ts](../../../apps/web/src/components/attendance/attendance-data.ts)
- [apps/web/src/i18n/attendance-copy.ts](../../../apps/web/src/i18n/attendance-copy.ts)

## What the code is doing

- shows summary metrics
- shows shift rows
- shows clock events
- shows notes about the current attendance state

## Java equivalent

- similar to a reporting controller or read model page
- the data helper is like a projection method that returns a DTO

## SOLID in this module

- SRP: screen only renders attendance snapshot
- DIP: screen depends on a data helper and copy file

## Debugging checklist

- empty cards: inspect `getAttendanceOverview()`
- wrong text: inspect `attendance-copy.ts`

