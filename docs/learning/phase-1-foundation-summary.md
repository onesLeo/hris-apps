# Phase 1 Foundation — What We Built and Why

This document explains every piece of infrastructure built in Phase 1, what it does, and why it matters for the HRIS application. The buttons you see in the UI will be wired to these backend foundations in Phase 2 onwards.

---

## Overview

Phase 1 is pure backend infrastructure — no visible features yet. Think of it as laying the pipes, locks, and electrical wiring of a building before the rooms are furnished. Every feature in Phase 2 and beyond depends on what was built here.

---

## 1. Authentication — Keycloak / OIDC (`JwtAuthGuard`)

**What it does**
Every HTTP request that reaches the API must carry a signed JWT token issued by Keycloak. The `JwtAuthGuard` fetches Keycloak's public keys (JWKS endpoint) and cryptographically verifies the token's signature before the request reaches any controller. Routes can be opted out with `@Public()`.

**Why we built it**
HRIS data is sensitive — salaries, tax numbers, personal details. No request should reach any business logic without proving who the caller is. Keycloak handles the login page, MFA, password resets, and social login so the API never touches raw passwords.

**Key files**
- `apps/api/src/modules/auth/jwt.guard.ts`
- `apps/api/src/modules/auth/public.decorator.ts`
- `apps/api/src/modules/auth/auth.types.ts`

---

## 2. Request Context — `AsyncLocalStorage`

**What it does**
Every incoming HTTP request is stamped with a `request_id`, `trace_id`, `tenant_id`, `user_id`, and `actor_role`. These values are stored in Node's `AsyncLocalStorage` — a per-request storage mechanism that flows through every `await` call without needing to pass arguments through every function.

**Why we built it**
Any code anywhere in the call stack — a service, a repository, a background job triggered mid-request — can call `RequestContext.get()` and know which tenant and user it is serving. This is required for:
- Structured logging (every log line knows the request it belongs to)
- Audit logging (every write knows who made it)
- RLS enforcement (the database knows which tenant's rows to show)

**Key files**
- `apps/api/src/common/context/request-context.ts`
- `apps/api/src/common/context/request-context.middleware.ts`

---

## 3. Multi-tenancy — Tenant Middleware + PostgreSQL RLS

**What it does**
The HRIS is a multi-tenant SaaS — Company A and Company B share the same database and API but must never see each other's data.

Two layers enforce this:

1. **TenantMiddleware** reads `tenant_id` from the verified JWT and writes it into the `AsyncLocalStorage` context for the duration of the request.
2. **PostgreSQL Row-Level Security (RLS)** enforces isolation at the database level. Every tenant-scoped table has a policy: `USING (tenant_id = current_tenant_id())`. The `current_tenant_id()` function reads the `app.tenant_id` session variable that `DatabaseService` sets at the start of every transaction.

**Why two layers?**
The application layer (`TenantMiddleware`) protects against accidental cross-tenant queries in code. The database layer (RLS) protects against bugs in the application — even if a developer forgets a `WHERE tenant_id = ?` clause, Postgres will silently filter the rows. Defence in depth.

**Key files**
- `apps/api/src/modules/tenant/tenant.middleware.ts`
- `apps/api/src/common/database/database.service.ts` — `withTenantClient()`
- `packages/db/src/migrations/0001_enable_rls.sql`

---

## 4. Database Service — `IDatabaseService`

**What it does**
A single injectable service that owns the PostgreSQL connection pool. It exposes two patterns:

- `queryWithTenant(tenantId, sql, params)` — raw parameterised SQL inside a tenant-scoped transaction
- `withTenant(tenantId, fn)` — passes a Drizzle ORM connection to a callback inside a tenant-scoped transaction
- `system` — an unscoped connection for admin operations like tenant creation

**Why we built it as an interface**
Dependency Inversion Principle (SOLID). Services that need the database depend on the `IDatabaseService` interface, not the concrete `DatabaseService` class. In unit tests, you pass a mock object that implements the same interface. No database is needed to test business logic.

**Security detail**
`tenantId` is validated against a UUID regex before being passed to `set_config`. This prevents any SQL injection through the tenant ID parameter.

**Key files**
- `apps/api/src/common/database/database.types.ts` — interface + DI token
- `apps/api/src/common/database/database.service.ts` — implementation
- `apps/api/src/common/database/database.module.ts` — NestJS module

---

## 5. Role-Based Access Control — `RolesGuard` + `@Roles()`

**What it does**
After the JWT guard confirms *who* the caller is, the `RolesGuard` checks *what they are allowed to do*. Controllers annotate endpoints with `@Roles('hr_manager', 'hris_admin')` and the guard rejects callers whose JWT roles don't include any of the required roles.

The system supports 14 roles:
`super_admin`, `hris_admin`, `hr_manager`, `hr_staff`, `payroll_manager`, `payroll_staff`, `plant_manager`, `department_manager`, `team_lead`, `employee`, `recruitment_manager`, `security_officer`, `finance_controller`, `read_only`

**Design decision: no implicit super_admin**
`super_admin` is NOT automatically granted access to all endpoints. It must be explicitly listed in `@Roles()`. This prevents a compromised `super_admin` token from silently accessing endpoints that were never intended to support it.

**Key files**
- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/src/common/guards/roles.decorator.ts`

---

## 6. Policy Resolution Engine — `PolicyService`

**What it does**
Many HRIS rules vary by employee, department, location, or company. For example: overtime multipliers, leave accrual rates, and probation periods may differ across sites. The `PolicyService` resolves any named rule through a 5-level hierarchy:

```
employee  →  department  →  location  →  company  →  system default
```

The most specific rule wins. A query asks: "What is the `overtime.multiplier` for employee `emp-1` in department `dept-engineering` at location `jakarta`?" The service fetches all active rules for that key and picks the most specific match.

**Why this matters**
Without this, you'd hardcode rules or write complex if/else chains in every service. The policy engine is a single, testable, reusable resolver. When a company wants to set a different overtime rate for one plant, an HR admin adds a row to `policy_rules` — no code change needed.

**Key files**
- `apps/api/src/modules/policy/policy.service.ts`
- `apps/api/src/modules/policy/policy.types.ts`
- `packages/db/src/schema/policy.schema.ts`

---

## 7. Sensitive Field Encryption — `EncryptionService`

**What it does**
Encrypts and decrypts string values using AES-256-GCM — the industry standard for authenticated encryption. Each encryption call generates a random 12-byte IV, producing a different ciphertext every time even for the same plaintext. The output format is:

```
base64(iv).base64(ciphertext).base64(authTag)
```

Also provides `safeEquals()` — a timing-safe string comparison that prevents timing attacks when comparing tokens or hashed values.

**Why we built it now**
Phase 2 will add employee records containing NPWP (tax ID), bank account numbers, and salary data. These fields must be encrypted at rest. Having `EncryptionService` ready means any service in Phase 2 can inject it and call `encrypt()` / `decrypt()` without reinventing cryptography.

**Key files**
- `apps/api/src/common/encryption/encryption.service.ts`
- `apps/api/src/common/encryption/encryption.module.ts`

---

## 8. Structured Logging — `StructuredLoggerService`

**What it does**
Replaces NestJS's default console logger with a JSON logger. Every log line is a machine-readable JSON object with consistent fields:

```json
{
  "timestamp": "2026-04-29T03:00:00.000Z",
  "level": "info",
  "module": "PolicyService",
  "message": "policy resolved",
  "request_id": "req-abc123",
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "actor_role": "hr_manager"
}
```

**Why structured logging matters**
When the application runs in production, logs are ingested by tools like Datadog, CloudWatch, or ELK. Structured JSON makes it trivial to filter "all errors for tenant X" or "all requests slower than 500ms" without regex parsing. It also never logs PII — field values are logged by key name only.

**Key files**
- `apps/api/src/common/logging/structured-logger.service.ts`

---

## 9. Audit Log Foundation — `AuditService` + `AuditInterceptor`

**What it does**
Every mutating HTTP request (POST, PUT, PATCH, DELETE) is automatically captured by `AuditInterceptor` after the handler succeeds. `AuditService.record()` writes a structured audit entry including:

- Who made the change (`user_id`, `actor_role`)
- Which tenant
- What changed (`entity_type`, `entity_id`, `changes_json`)
- When and from where (`request_id`, `ip_address`)

**Why append-only matters**
Audit logs must never be edited or deleted — they are legal evidence for compliance (Indonesia labour law, GDPR-adjacent privacy requirements). The `audit_logs` table schema has no UPDATE path and will be protected by a database-level trigger in Phase 2.

**Key files**
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/modules/audit/audit.interceptor.ts`

---

## 10. API Security Layers

Multiple defences were added beyond authentication:

| Layer | What it prevents |
|---|---|
| **CORS allowlist** (`CORS_ORIGINS` env) | Browsers from unknown origins cannot call the API |
| **nginx rate limiting** | 60 req/min/IP on all API routes; 10 req/min/IP on auth routes (brute-force protection) |
| **Request body limit** (1 MB) | Memory exhaustion from giant JSON payloads |
| **Security headers** via nginx | Clickjacking (`X-Frame-Options`), MIME sniffing, HSTS |
| **Swagger hidden in production** | API documentation not reachable by attackers in prod |
| **UUID validation** before `set_config` | SQL injection via tenant ID parameter |
| **`ValidationPipe` whitelist** | Unknown/extra fields stripped from all request bodies |

---

## 11. Database Schema

All tables built in Phase 1:

| Table | Purpose |
|---|---|
| `tenants` | One row per company using the system |
| `users` | Employee accounts linked to Keycloak IDs |
| `roles` | 14 system roles |
| `user_roles` | Scoped role assignments (tenant / location / department) for ABAC |
| `locations` | Physical sites with timezone, country, clocking method |
| `departments` | Org units with parent hierarchy and manager reference |
| `teams` | Sub-groups within departments |
| `audit_logs` | Append-only record of every mutating action |
| `policy_rules` | Configurable rules for the 5-level policy hierarchy |

---

## 12. Test Suite

41 unit tests covering every Phase 1 component:

| Test file | What it covers |
|---|---|
| `request-context.test.ts` | AsyncLocalStorage isolation, nesting, cleanup |
| `jwt.guard.test.ts` | Public routes, missing token, wrong scheme, no JWKS URI |
| `roles.guard.test.ts` | All allow/deny combinations, no implicit super_admin |
| `encryption.service.test.ts` | Round-trip, tampered ciphertext, wrong key, safeEquals |
| `policy.service.test.ts` | All 5 levels, expiry, no-match error |
| `audit.service.test.ts` | Missing context, with context, changesJson |

Integration tests in `tests/integration/` test the running API:
- `health.test.ts` — `/api/v1/health` returns 200 without auth token
- `auth.test.ts` — protected route returns 401 with correct ADR 006 error shape

---

## What the Frontend Buttons Need (Phase 2)

The buttons visible in the UI are wired to mock data. Connecting them to real backend endpoints requires Phase 2:

| UI Action | What Phase 2 will build |
|---|---|
| Add / Edit Employee | `POST /api/v1/employees`, `PATCH /api/v1/employees/:id` |
| Suspend / Delete Employee | Employee lifecycle events + status transitions |
| Leave Apply | Leave balance model + approval workflow |
| Create Requisition | Recruitment module |
| Org chart | Real data from `departments` + `locations` tables |

All of these will benefit directly from Phase 1 — every employee API call will be authenticated, tenant-isolated via RLS, role-checked, audit-logged, and policy-resolved automatically.
