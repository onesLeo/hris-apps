# Performance Deep Dive

The Performance module manages review cycles, team reviews, and goal tracking.
It also has a create-cycle modal for local testing.

Key files:
- [apps/web/src/components/performance/performance-screen.tsx](../../../apps/web/src/components/performance/performance-screen.tsx)
- [apps/web/src/components/performance/performance-create-dialog.tsx](../../../apps/web/src/components/performance/performance-create-dialog.tsx)
- [apps/web/src/components/performance/performance-data.ts](../../../apps/web/src/components/performance/performance-data.ts)
- [apps/web/src/i18n/performance-copy.ts](../../../apps/web/src/i18n/performance-copy.ts)
- [apps/web/tests/performance-actions.test.ts](../../../apps/web/tests/performance-actions.test.ts)

## What the code is doing

- shows cycle stats
- shows review cycles
- shows top goals
- shows team review rows
- adds cycles through a modal

## How the flow works

1. `PerformanceScreen` loads overview data.
2. It derives counts for completed, in review, and overdue cycles.
3. It filters team review rows.
4. The modal collects a new cycle.
5. `addPerformanceCycle()` prepends the cycle to local state.

## Important functions

### `filterPerformanceReviews()`

Matches review rows by status and search query.

### `addPerformanceCycle()`

Creates a new cycle object and returns a new list.

Java equivalent:

- a service method that builds a new review cycle aggregate and returns a refreshed list

## Java vs TypeScript details

- `useMemo()` is a cache for derived values
- the modal is a self-contained form component
- the data helpers are pure functions and easy to unit test

## SOLID in this module

- SRP: stats, cards, modal, and data are separated
- OCP: you can add new review cycle statuses by extending the data contract
- DIP: the screen depends on helper functions, not a monolithic class

## Debugging checklist

- modal not opening: inspect `isCreateOpen`
- stats wrong: inspect the derived `useMemo()` values
- progress wrong: inspect the cycle data in `performance-data.ts`

