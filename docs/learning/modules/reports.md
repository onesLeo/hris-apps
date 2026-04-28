# Reports Deep Dive

The Reports module is a read-only reporting snapshot used for analytics preview.

Key files:
- [apps/web/src/components/reports/reports-screen.tsx](../../../apps/web/src/components/reports/reports-screen.tsx)
- [apps/web/src/components/reports/reports-data.ts](../../../apps/web/src/components/reports/reports-data.ts)
- [apps/web/src/i18n/reports-copy.ts](../../../apps/web/src/i18n/reports-copy.ts)

## What the code is doing

- shows reporting metrics
- shows report catalog entries
- shows export status rows
- shows schedule notes

## Java equivalent

- similar to a Spring reporting dashboard page
- the data helper is like a report service method returning a DTO

## SOLID in this module

- SRP: the screen only renders report data
- DIP: the screen depends on `getReportsOverview()`

## Debugging checklist

- empty layout: inspect `getReportsOverview()`
- wrong labels: inspect `reports-copy.ts`

