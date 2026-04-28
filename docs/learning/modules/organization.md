# Organization Deep Dive

The Organization module is a read-only company structure overview.

Key files:
- [apps/web/src/components/organization/organization-screen.tsx](../../../apps/web/src/components/organization/organization-screen.tsx)
- [apps/web/src/components/organization/organization-data.ts](../../../apps/web/src/components/organization/organization-data.ts)
- [apps/web/src/i18n/organization-copy.ts](../../../apps/web/src/i18n/organization-copy.ts)

## What the code is doing

- shows summary numbers
- lists locations
- lists departments
- shows reporting structure

## How the flow works

1. The screen loads locale copy.
2. It loads the organization overview snapshot.
3. It renders the cards and structure sections.

## Java equivalent

- similar to a read-only Spring MVC page backed by a query service
- the data module is like a repository-projection result

## SOLID in this module

- SRP: the screen only renders organization data
- DIP: the screen depends on `getOrganizationOverview()`

## Debugging checklist

- wrong stats: inspect `organization-data.ts`
- wrong labels: inspect `organization-copy.ts`

