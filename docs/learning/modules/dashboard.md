# Dashboard Deep Dive

The dashboard is the top-level operational summary for HR admins.
It combines reusable cards, a chart, and a pending approvals preview.

Key files:
- [apps/web/src/components/dashboard/dashboard-screen.tsx](../../../apps/web/src/components/dashboard/dashboard-screen.tsx)
- [apps/web/src/i18n/dashboard-copy.ts](../../../apps/web/src/i18n/dashboard-copy.ts)
- [apps/web/src/components/approvals/approvals-data.ts](../../../apps/web/src/components/approvals/approvals-data.ts)

## What the code is doing

The screen is split into helper subcomponents:

- `KpiCard`
- `HeadcountChart`
- `DepartmentCard`
- `OnboardingCard`
- `PendingApprovalsCard`

That keeps the JSX readable and lets each section stay focused.

## How the flow works

1. `DashboardScreen` reads locale copy.
2. It renders KPI cards from fixed values.
3. `HeadcountChart` converts a numeric series into SVG paths.
4. `DepartmentCard` renders department bars.
5. `OnboardingCard` renders recent onboardings.
6. `PendingApprovalsCard` reuses the approvals seed data.

## Important functions

### `makePath()`

This function turns a list of numbers into SVG line and area paths.
It calculates min/max values, normalizes each point, and builds a smooth curve.

Java equivalent:

```java
PathGeometry geometry = buildPath(headcount);
```

Think of it as a pure view helper, not business logic.

### `KpiCard`

This is a reusable presentational component.
It accepts label, value, delta text, icon, and accent color.

Java equivalent:

- a small template fragment or view component

## Java vs TypeScript details

- props are plain objects instead of Java classes
- helper functions can live beside components instead of in a service class
- array `map()` is the same idea as iterating and rendering a collection in Java templates

## SOLID in this module

- SRP: each card section does one visual job
- OCP: new cards can be added without rewriting the rest
- DIP: the screen depends on copy helpers and approvals data, not hardcoded shell text

## Debugging checklist

- chart looks wrong: inspect `HEADCOUNT` and `makePath()`
- card text wrong: inspect `dashboard-copy.ts`
- approvals preview mismatch: inspect `approvals-data.ts`

