# Phase 0 Backend Design Defaults

This document sets the working backend design before domain implementation begins.
It is intentionally conservative so Phase 1 can move quickly without forcing rewrites.

References:
- [ADR 001: Tech Stack](../adr/001-tech-stack.md)
- [ADR 002: Project Structure](../adr/002-project-structure.md)
- [ADR 003: Module Event Communication Contract](../adr/003-module-event-contract.md)
- [ADR 006: API Error Code Taxonomy and i18n Strategy](../adr/006-error-code-taxonomy.md)
- [ERD Overview](../erd/README.md)
- [Org Structure ERD](../erd/01-org-structure.md)
- [Identity / Access ERD](../erd/02-identity-access.md)

---

## 1. Initial Backend Module Set

The backend should start with a small set of infrastructure modules, then keep business modules
as clear boundaries even if they are initially empty.

### Foundation modules

- `config` for environment validation and application settings
- `database` for Drizzle, PostgreSQL connection handling, and tenant-scoped execution
- `auth` for authentication entry points and principal resolution
- `tenant` for tenant context and request scoping
- `events` for in-process module event wiring from ADR 003
- `jobs` for BullMQ worker wiring from ADR 003
- `health` for readiness and liveness checks
- `audit` for append-only audit event capture
- `common` for cross-cutting helpers that are truly shared within the API app

### Domain modules

Keep these as separate NestJS modules even if they begin as thin placeholders:

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

### Rule

Each module owns its own service, controller, repository, DTOs, and listeners.
Cross-module imports should be limited to:

1. Shared contracts from `packages/types`
2. Shared configuration from `packages/config`
3. Explicit service interfaces when the use case truly requires synchronous access
4. Events for side effects, per ADR 003

Java equivalent:
- This is the same idea as a Spring package-per-module architecture with strict package
  boundaries and shared DTO jars only where necessary.

---

## 2. Auth and Tenant Model

### Authentication

Use token-based authentication with an external identity provider as the long-term target.
The backend should treat authentication and tenant resolution as separate concerns.

### Tenant resolution

The working model should be:

- Every authenticated request must resolve to exactly one tenant context
- `tenant_id` is taken from the authenticated principal, not from an untrusted request body
- The resolved tenant is stored in request context
- The database session variable `app.tenant_id` is set before tenant-scoped queries run
- Global/system users are the exception, not the default

### Scope model

- Tenant scope is mandatory for business data
- Location and department scope are authorization concerns layered on top of tenant scope
- Reporting-line scope remains an authorization rule, not a database rule

### Development fallback

For local development and early scaffolding, a temporary header-based tenant override may be
allowed behind a dev-only guard, but it should never be used as the production model.

Java equivalent:
- This is the Spring Security + `OncePerRequestFilter` pattern plus tenant-aware data source
  routing or request context propagation.

---

## 3. First Data Entities

The first database entities should come from the org and identity foundation, because the rest of
the HRIS depends on them.

### Core entities to model first

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

### Why these first

- `tenants`, `locations`, and `departments` anchor the org hierarchy from the ERDs
- `users`, `roles`, and `permissions` support access control and menu visibility
- `identity_providers` keeps the authentication path future-proof for OIDC / directory sync
- `audit_events` gives every later module a consistent audit trail target

### Not first

Do not start with payroll, attendance, or leave transactional tables in Phase 0.
Those depend on the org and identity foundation and are better built once the request context,
auth, and tenant isolation model are stable.

Java equivalent:
- This is like creating the base JPA entity set for the platform boundary before adding any
  domain-specific aggregates.

---

## 4. API Conventions

The API should have a consistent shape from the start so the frontend and backend can evolve
without repeated refactors.

### URL and versioning

- Use a versioned prefix, starting with `/api/v1`
- Use plural resource nouns for collections
- Prefer resource-specific subpaths for actions that are not pure CRUD

Examples:
- `GET /api/v1/employees`
- `POST /api/v1/employees`
- `PATCH /api/v1/employees/:id`
- `GET /api/v1/leave/requests`

### Query conventions

- Pagination should be cursor-based, using `after` and `limit`
- Default page size should be conservative
- Filters should be explicit and documented per resource

### Payload conventions

- Request and response payloads should use stable machine-friendly field names
- Dates should be ISO 8601
- Error codes must follow ADR 006
- Messages may be localized, but codes remain stable

### Headers

- `Authorization: Bearer <token>`
- `Accept-Language: en | id`
- `X-Request-Id` should be propagated for tracing

### Error handling

- Use the ADR 006 error response shape everywhere
- Validation errors return all field problems at once
- Do not return raw stack traces to clients

Java equivalent:
- This is the same as standard REST conventions with consistent `@ControllerAdvice` error shape
  and query parameter handling.

---

## 5. Working Order For Phase 1

Once this design is accepted, the implementation order should be:

1. Wire `apps/api` bootstrap with config, error handling, and tenant context
2. Add the base foundation modules
3. Add org and identity entities
4. Add RLS and tenant-scoped database access
5. Add auth and role/permission enforcement
6. Only then begin feature modules like employee and attendance

This order keeps the architecture stable before business complexity arrives.

