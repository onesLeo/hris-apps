# Performance Module

The Performance module manages review cycles, team review snapshots, and goal progress.
It supports creating a local performance cycle through a modal.

Key files:
- [apps/web/src/components/performance/performance-screen.tsx](../../apps/web/src/components/performance/performance-screen.tsx)
- [apps/web/src/components/performance/performance-create-dialog.tsx](../../apps/web/src/components/performance/performance-create-dialog.tsx)
- [apps/web/src/components/performance/performance-data.ts](../../apps/web/src/components/performance/performance-data.ts)
- [apps/web/src/i18n/performance-copy.ts](../../apps/web/src/i18n/performance-copy.ts)
- [apps/web/tests/performance-actions.test.ts](../../apps/web/tests/performance-actions.test.ts)

## What it does

- shows performance cycle summary cards
- renders review cycle cards with completion bars
- shows top goals
- lists team review rows
- opens a modal to create a cycle

## Flow

1. `PerformanceScreen` reads the overview snapshot.
2. The screen calculates derived stats from the local cycle list.
3. `PerformanceCreateDialog` collects a cycle name, period, status, participants, and completion.
4. `addPerformanceCycle()` prepends the new cycle.
5. The cycle cards and stats rerender from local state.

## Java equivalent

- this is similar to a Spring performance management page
- the dialog is like a form object plus controller submit path
- `addPerformanceCycle()` is like a service method that returns a new aggregate state

## How to debug

- If the create modal does not open, check `isCreateOpen`.
- If the stats are wrong, check the derived `useMemo()` calculations.
- If the progress bar looks wrong, check the cycle completion values in `performance-data.ts`.

## Implementation notes

- The module is still mock-driven.
- Later backend integration can feed real review cycle data into the same UI structure.

