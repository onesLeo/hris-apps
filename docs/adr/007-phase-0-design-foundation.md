# ADR 007: Phase 0 Design Foundation

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

Phase 0 needs a single place to define the project's foundational design choices before module
implementation begins.

That includes:

- the backend module and API conventions
- the tenant and auth working model
- the first data entities
- the Aurora UI/UX visual system for PeopleOS

Keeping these decisions together prevents the implementation notes from drifting away from the
design language or the backend contract model.

---

## Decision

This ADR consolidates the Phase 0 design defaults into a single approved document.

It combines:

1. Backend design defaults
2. Aurora UI/UX design system

### 1. Backend Design Defaults

#### Initial backend module set

Start the backend with a small set of infrastructure modules, then keep business modules as
separate boundaries even if they begin as thin placeholders.

##### Foundation modules

- `config` for environment validation and application settings
- `database` for Drizzle, PostgreSQL connection handling, and tenant-scoped execution
- `auth` for authentication entry points and principal resolution
- `tenant` for tenant context and request scoping
- `events` for in-process module event wiring from ADR 003
- `jobs` for BullMQ worker wiring from ADR 003
- `health` for readiness and liveness checks
- `audit` for append-only audit event capture
- `common` for cross-cutting helpers that are truly shared within the API app

##### Domain modules

- `identity`
- `organization`
- `employee`
- `attendance`
- `leave`
- `approval`
- `payroll`
- `notification`
- `reporting`
- `integration`

##### Rule

Each module owns its own service, controller, repository, DTOs, and listeners.
Cross-module imports should be limited to:

1. Shared contracts from `packages/types`
2. Shared configuration from `packages/config`
3. Explicit service interfaces when the use case truly requires synchronous access
4. Events for side effects, per ADR 003

Java equivalent:
- This is the same idea as a Spring package-per-module architecture with strict package
  boundaries and shared DTO jars only where necessary.

#### Auth and tenant model

- Every authenticated request must resolve to exactly one tenant context
- `tenant_id` is taken from the authenticated principal, not from an untrusted request body
- The resolved tenant is stored in request context
- The database session variable `app.tenant_id` is set before tenant-scoped queries run
- Global/system users are the exception, not the default

Tenant scope is mandatory for business data. Location and department scope are authorization
concerns layered on top of tenant scope.

Java equivalent:
- This is the Spring Security + `OncePerRequestFilter` pattern plus tenant-aware data source
  routing or request context propagation.

#### First data entities

The first database entities should come from the org and identity foundation.

- `tenants`
- `locations`
- `departments`
- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `identity_providers`
- `audit_events`

Do not start with payroll, attendance, or leave transactional tables in Phase 0.

Java equivalent:
- This is like creating the base JPA entity set for the platform boundary before adding any
  domain-specific aggregates.

#### API conventions

- Use a versioned prefix, starting with `/api/v1`
- Use plural resource nouns for collections
- Prefer resource-specific subpaths for actions that are not pure CRUD
- Pagination should be cursor-based, using `after` and `limit`
- Request and response payloads should use stable machine-friendly field names
- Dates should be ISO 8601
- Error codes must follow ADR 006
- `Authorization`, `Accept-Language`, and `X-Request-Id` should be supported consistently

Java equivalent:
- This is the same as standard REST conventions with consistent `@ControllerAdvice` error shape
  and query parameter handling.

#### Working order for Phase 1

1. Wire `apps/api` bootstrap with config, error handling, and tenant context
2. Add the base foundation modules
3. Add org and identity entities
4. Add RLS and tenant-scoped database access
5. Add auth and role/permission enforcement
6. Only then begin feature modules like employee and attendance

---

### 2. Aurora UI/UX Design

#### Design intent

Aurora is a soft, polished, light-mode HRIS interface with:

- blush and lavender gradient backgrounds
- frosted-glass sidebar and header
- white cards with subtle shadows
- rose-pink primary accents
- violet secondary accents
- rounded chips, pills, and badges
- DM Sans typography

The overall feel is calm and premium rather than heavy or enterprise-gray.

#### Core tokens

##### Colors

- Background gradient: `linear-gradient(145deg, #fce8f3 0%, #f0e8f8 45%, #e8edf8 100%)`
- Background solid: `#fdf0f8`
- Primary accent: `#e8317a`
- Secondary accent: `#8b5cf6`
- Text primary: `#1a1428`
- Text secondary: `#4b4563`
- Text muted: `#9590a8`
- Success: `#10b981`
- Warning: `#f59e0b`
- Danger: `#ef4444`
- Info: `#06b6d4`

##### Typography

- Font family: `DM Sans`
- Page title: 18px, 700 weight
- Section title: 14px, 700 weight
- Body text: 13 to 13.5px
- Badge/tag text: 11 to 11.5px, 600 weight

##### Layout

- Page padding: 24px top/bottom, 28px left/right
- Large card radius: 16px
- Medium radius: 14px
- Small radius/chips: 10px
- Sidebar width: 232px expanded, 62px collapsed
- Header height: 64px

##### Motion

- Sidebar collapse: 300ms width transition
- Card hover lift: translateY(-2px)
- Chart draw: stroke animation on mount
- Bars animate in with staggered timing

#### Desktop screens

The prototype focuses on four screens:

1. Dashboard
2. People
3. Leave
4. Approvals

##### Dashboard

- Sidebar on the left
- Header across the top
- KPI cards row
- Headcount trend chart
- Department bar chart
- Recent onboardings list
- Pending approvals panel

##### People

- Search input
- Filter chips
- Add Employee button
- Employee table with avatar, department, status, work type, joined date, and action icons

##### Leave

- Balance cards for leave categories
- Tabbed request table
- Pending rows show Approve and Decline actions

##### Approvals

- Summary metrics cards
- Two-column approval cards
- Approve and Decline actions with done states

#### Mobile screens

The mobile prototype adapts the same product into:

- bottom tab navigation
- 2x2 KPI tiles on dashboard
- compact chart and quick actions
- card-based people list
- 2x2 leave balance tiles
- stacked approval cards

This should be treated as the mobile baseline for responsive work, not as a separate product.

#### Navigation

The main sidebar menu in the prototype is:

- Dashboard
- People
- Organization
- Attendance
- Leave
- Approvals
- Payroll
- Performance
- Recruitment
- Learning
- Reports

Only Dashboard, People, Leave, and Approvals are implemented in the prototype, while the other
items can display a coming-soon state until their modules exist.

#### Implementation notes

- preserve the rose/violet palette
- keep the frosted-glass header and sidebar feel
- use white cards with soft shadows
- keep spacing airy and rounded
- prefer grid and card layouts over dense admin tables where the design calls for it
- make mobile responsive rather than building a separate visual language

The design should be used as the default visual system for the web app until the product
establishes a different brand direction.

---

## Consequences

- Backend implementation can now follow one approved design note rather than scattered learning
  files.
- The Aurora visual language is a documented project decision, not just a prototype reference.
- Phase 0 docs and later implementation notes can link to this ADR as the source of truth.

