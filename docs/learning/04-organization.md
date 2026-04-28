# Organization Module

The Organization module is a read-only structure overview that summarizes the company
shape, locations, departments, and reporting hierarchy.

Key files:
- [apps/web/src/components/organization/organization-screen.tsx](../../apps/web/src/components/organization/organization-screen.tsx)
- [apps/web/src/components/organization/organization-data.ts](../../apps/web/src/components/organization/organization-data.ts)
- [apps/web/src/i18n/organization-copy.ts](../../apps/web/src/i18n/organization-copy.ts)
- [docs/erd/01-org-structure.md](../erd/01-org-structure.md)

## What it does

- shows a company overview card
- displays location and department stats
- renders a location network list
- renders a department map
- shows a reporting structure card

## Flow

1. `OrganizationScreen` reads locale copy with `getOrganizationCopy()`.
2. `getOrganizationOverview()` returns the local snapshot.
3. The screen renders the summary card and three detail sections.
4. There are no mutating actions yet because this is a read-only view.

## Java equivalent

- this is like a Spring MVC read-only dashboard backed by a service method
- `organization-data.ts` is like a query service or read model
- the UI cards are like view fragments rendering a DTO

## How to debug

- If stats are wrong, check `getOrganizationOverview()`.
- If labels are not translated, check `organization-copy.ts`.
- If the layout looks off, inspect the responsive card grid in the screen component.

## Implementation notes

- The structure should stay aligned with the ERD.
- Later backend work should map directly to these same entities and stats.

