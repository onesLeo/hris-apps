# ADR 002: Monorepo Structure and Microservices Migration Roadmap

**Status:** Accepted
**Date:** 2026-04-27

---

## Context

The team is 2 people: one backend/fullstack developer and one business process specialist. The frontend and backend are deployed as separate containers from day one. The long-term goal is to migrate toward microservices as the product grows and team scales. Module boundaries must be clean from the start so that extraction is possible without rewriting application logic.

---

## Decision

### Repository Structure

The monorepo is managed with pnpm workspaces and Turborepo.

```
hris-apps/
├── apps/
│   ├── api/                        ← NestJS backend (deployed separately)
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── identity/
│   │       │   ├── employee/
│   │       │   ├── attendance/
│   │       │   ├── leave/
│   │       │   ├── payroll/
│   │       │   ├── approval/
│   │       │   ├── notification/
│   │       │   └── reporting/
│   │       ├── worker/             ← same codebase, RUN_MODE=worker entry point
│   │       ├── common/             ← shared utilities WITHIN the api app only
│   │       └── main.ts
│   └── web/                        ← Next.js frontend (deployed separately)
│       └── src/
│           ├── app/                ← App Router pages
│           └── components/
├── packages/
│   ├── types/                      ← shared TypeScript interfaces, DTOs, enums, event types
│   ├── db/                         ← Drizzle schema definitions + migrations
│   └── config/                     ← shared env validation (zod schemas), constants
├── docs/
│   ├── adr/                        ← Architecture Decision Records
│   ├── erd/                        ← Entity Relationship Diagrams
│   └── learning/                   ← TypeScript/NestJS guides for Java developers
├── docker/
│   ├── docker-compose.yml
│   └── nginx/
└── package.json                    ← pnpm workspace root
```

### Module Boundary Rule

Modules NEVER import directly from each other's `src/` folders. Cross-module communication is permitted only through:

1. The event bus (for cross-module side effects)
2. The `packages/types` shared package (for shared data shapes)
3. Explicit service interfaces (when one module truly needs a synchronous result from another)

This rule is enforced by convention and code review. Violating it creates hidden coupling that makes microservices extraction into a rewrite.

### Microservices Migration Roadmap

**Phase 1 - Current: Modular Monolith**

- All modules run in one `api` container
- In-process EventEmitter for module-to-module communication
- BullMQ for heavy background jobs (payroll calculation, report generation, attendance batch processing)
- One PostgreSQL database, one Redis instance

**Phase 2: Extract Payroll**

Payroll is the most change-sensitive module and the one most likely to require a dedicated specialist developer. Extract it first.

- Payroll becomes its own deployable service
- In-process events for payroll are replaced with Redis pub/sub or RabbitMQ
- Payroll gets its own schema namespace in PostgreSQL, or a separate database
- The `api` container no longer contains the payroll module
- Trigger: payroll logic becomes too complex to test safely in the monolith, or a payroll-specialist developer joins the team

**Phase 3: Extract Attendance**

Attendance clock event ingestion is the highest-volume endpoint. It should scale independently during shift changeover peaks.

- Attendance service owns `clock_events` and `attendance_records` tables
- Can be scaled horizontally without scaling the rest of the API
- Trigger: clock event volume causes resource contention in the monolith

**Phase 4: Full Decomposition**

Each bounded context (identity, employee, leave, approval, reporting, notification) becomes its own service with its own database schema. An API Gateway or Backend-for-Frontend layer handles routing.

- Trigger: team grows to 5+ developers, or customer scale requires independent scaling of specific modules

**Migration Rule**

Because module boundaries are clean from day one, each extraction is an infrastructure change (swap EventEmitter for a queue consumer) rather than a code rewrite. The emitting module's code does not change.

---

## Consequences

- Enforcing module boundaries requires discipline and code review attention, especially early when shortcuts are tempting.
- Turborepo build caching means that changing `packages/types` only triggers rebuilds in packages that depend on it, not a full monorepo rebuild.
- `packages/types` is the single source of truth for data shapes shared between `apps/api` and `apps/web`. Any breaking change to a shared type surfaces as a TypeScript compile error in both apps before it reaches production.
- The `worker/` entry point in `apps/api` allows the same codebase to run in both HTTP server mode and background worker mode, controlled by an environment variable. This avoids maintaining a separate worker repository during Phase 1.

---

## Alternatives Considered

**Separate repositories from day one**

Would enforce boundaries at the repository level but creates overhead for a 2-person team: separate CI pipelines, separate dependency updates, cross-repo type sharing requires publishing to a registry. Premature for current team size.

**Single deployable with no module structure**

Fastest to start but creates a big ball of mud. Extraction later would require a rewrite. Not acceptable given the explicit roadmap goal.

**Nx instead of Turborepo**

Nx has more features (project graph, affected commands, generators) but is significantly more complex to configure. Turborepo is simpler and sufficient for this repository's size and team.
