# ADR 005: Public Holiday Calendar Design

**Status:** Accepted
**Date:** 2026-04-27

---

## Context

Indonesia national public holidays must be available to all tenants. Different company locations may follow different holiday calendars, though for Indonesia v1 this is primarily national holidays plus company-specific additions. Substitute holidays (when a public holiday falls on a Sunday and the following Monday is declared a holiday by the government) must be tracked separately. HR admins need to add company-specific holidays such as a company anniversary day off. Holiday calendars affect leave calculations, attendance records, and payroll (holiday pay rules). The government typically announces substitute holidays one to two months before the date.

---

## Decision

Use system-provided master calendars per country and year, with location assignment and company-level override capability.

### Schema Design

**`holiday_calendars`**

Master calendar per country and year. `tenant_id` is NULL for system-provided calendars. A specific tenant can also create their own custom master calendar.

**`public_holidays`**

Individual holiday dates within a calendar. Includes a `substitute` boolean flag and an `original_date` field to record which holiday a substitute date is replacing (e.g. substitute Monday links back to the original Sunday date).

**`company_holidays`**

Tenant-scoped extra holidays added by the HR admin. Can optionally be scoped to a specific location (for location-specific company events).

**`location_holiday_calendars`**

Junction table linking a location to one master calendar.

### Rules

1. The system provides the Indonesia national holiday calendar each year. This is loaded as seed data or via an admin tool from official government sources.
2. Substitute holidays are manually entered by a system admin or HR admin when the government announces them. This is acceptable for v1; automation via a government API can be added later.
3. Each location is assigned one master calendar. For Indonesia v1, all locations use the national calendar.
4. Company holidays stack on top of the assigned master calendar. They do not replace it.
5. When determining whether a date is a holiday, the resolution order is:
   1. Check `company_holidays` for the tenant (and location, if scoped)
   2. Check `public_holidays` via the location's assigned calendar

---

## Consequences

- A system admin must load each year's Indonesia national holidays. This can be scripted from the official government PDF or data source and run as a migration before the new calendar year.
- Substitute holidays require manual entry. The government announces them with enough lead time (typically one to two months) for this to be operationally acceptable.
- Multi-country support is additive: adding a new country means adding a new master calendar and its public holidays. No schema changes are required.
- Locations that have not been assigned a master calendar will find no holidays, which will produce incorrect leave and attendance calculations. Assignment must be enforced during location setup.

---

## Alternatives Considered

**Option A: Each tenant manages their own full holiday list**

Gives tenants complete control but requires every tenant to enter the national holidays themselves each year. This creates operational burden and risks of error (missed holidays, wrong dates). Ruled out.

**Option C: Pull holidays automatically from a public API**

Services such as Calendarific or Nager.Date provide Indonesian public holidays via API. This would eliminate manual entry for national holidays. However, Indonesian substitute holidays are not reliably available in these APIs because they are declared by presidential decree and announced late. A hybrid approach (API for base holidays, manual entry for substitutes) is worth considering for v2 once the manual process is validated.

**Flat table with a `type` column (national / company)**

Simpler schema but makes it harder to assign different national calendars to different locations and harder to scope company holidays to specific locations. The junction table approach provides more flexibility at the cost of slightly more complex queries.
