# Reports Module

The Reports module is currently a read-only reporting snapshot.
It gives a preview of workforce exports, charts, and summary cards.

Key files:
- [apps/web/src/components/reports/reports-screen.tsx](../../apps/web/src/components/reports/reports-screen.tsx)
- [apps/web/src/components/reports/reports-data.ts](../../apps/web/src/components/reports/reports-data.ts)
- [apps/web/src/i18n/reports-copy.ts](../../apps/web/src/i18n/reports-copy.ts)

## What it does

- shows reporting summary cards
- shows export and scheduling style information
- shows analytic panels and report snapshots
- provides a placeholder for more advanced workforce reporting later

## Flow

1. `ReportsScreen` reads locale copy.
2. `getReportsOverview()` returns the local report snapshot.
3. The screen renders the report cards and graphs.
4. There are no mutating actions yet.

## Java equivalent

- this is like a Spring reporting dashboard or analytics controller
- `reports-data.ts` is like a report projection or query service
- the visual cards are like a reporting view model rendered in the UI

## How to debug

- If cards are empty, check `getReportsOverview()`.
- If labels are wrong, check `reports-copy.ts`.
- If a chart or report block looks off, check the data shape in `reports-data.ts`.

## Implementation notes

- The module is still read-only.
- Later it can connect to export jobs, scheduled reports, and backend report stores.

