# Phase 0: HRIS Project Setup

This note captures the technical foundation for the HRIS repository before feature work begins.
It is written for a Java/Spring Boot developer so the NestJS/TypeScript choices feel familiar.

Primary references:
- [ADR 001: Tech Stack](../adr/001-tech-stack.md)
- [ADR 002: Project Structure](../adr/002-project-structure.md)
- [ERD Overview](../erd/README.md)
- [Org Structure ERD](../erd/01-org-structure.md)
- [Identity / Access ERD](../erd/02-identity-access.md)
- [Employee Lifecycle ERD](../erd/03-employee-lifecycle.md)
- [Aurora UI/UX Design](phase-0-aurora-uiux-design.md)

---

## Phase Goal

Phase 0 is about establishing the codebase, module boundaries, shared contracts, database
foundation, and documentation structure. No business workflow should depend on ad hoc setup
decisions after this phase.

Think of this phase as the equivalent of creating a Spring Boot parent project, defining the
package layout, wiring shared libraries, and setting up the persistence and test baseline before
building actual domain features.

---

## Java Equivalent Mapping

| HRIS Setup Item | NestJS / TypeScript Implementation | Java / Spring Equivalent |
|---|---|---|
| Monorepo workspace | `pnpm` workspaces + Turborepo | Maven or Gradle multi-module build |
| API bootstrap | `apps/api/src/main.ts` + `AppModule` | `@SpringBootApplication` main class |
| Feature boundaries | `apps/api/src/modules/*` | Spring package-per-module structure |
| Dependency injection | `@Injectable()` + constructor injection | `@Service` + constructor injection |
| HTTP layer | `@Controller()` and route decorators | `@RestController` + `@GetMapping`, `@PostMapping` |
| Input validation | DTOs + `class-validator` / config schemas | `jakarta.validation` + `@Validated` |
| Shared contracts | `packages/types` | Shared DTO / enum / contract JAR |
| Database schema | `packages/db` with Drizzle schema files | `@Entity` classes + repository layer |
| Migrations | `drizzle-kit` SQL migrations | Flyway or Liquibase |
| Events | In-process event bus / typed event payloads | `ApplicationEventPublisher` + `@EventListener` |
| Background jobs | Worker entrypoint + queue processing | `@Async`, scheduled jobs, or queue consumer |
| API tests | Jest + Supertest | JUnit 5 + Mockito + MockMvc |
| Config validation | Zod-based env schema | `@ConfigurationProperties` + validation |
| Container runtime | Docker Compose with separate services | Containerized Spring Boot services |

---

## Phase 0 Technical Implementations

### 1. Repository and workspace layout

Set up the repo as a modular monorepo with a clear split between applications, shared packages,
and docs.

- `apps/api` for the NestJS backend
- `apps/web` for the Next.js frontend
- `packages/types` for shared DTOs, enums, and event contracts
- `packages/db` for Drizzle schema, migrations, and database helpers
- `packages/config` for shared env validation and constants
- `docs/adr` for architecture decisions
- `docs/erd` for domain data model diagrams
- `docs/learning` for Java-to-TypeScript learning notes by phase

Java analogy:
- This is the equivalent of a Maven/Gradle multi-module project with separate modules for API,
  web, persistence, and shared domain contracts.

### 2. Application bootstrap

Create the backend bootstrap path so the application can start in a predictable way.

- `main.ts` initializes NestJS
- `AppModule` imports feature modules and shared infrastructure modules
- global validation, filters, and guards are wired in one place
- environment variables are loaded and validated at startup

Java analogy:
- This is the equivalent of a Spring Boot entry point plus central configuration classes,
  usually backed by `@ConfigurationProperties` and bean registration.

### 3. Module boundary rules

Define module boundaries early and enforce them by convention.

- each business area lives in its own NestJS module
- modules do not import directly from another module's internal `src` folders
- cross-module interaction happens through shared contracts, service interfaces, or events
- keep shared code in `packages/types` or `packages/config`, not in a random feature module

Java analogy:
- This is like keeping clean package boundaries in Spring and avoiding direct calls into another
  module's private repository or service classes.

### 4. Shared contracts package

Create the shared contract layer that both apps can use safely.

- add common DTOs, enums, and event payload interfaces in `packages/types`
- keep contract types small and serializable
- use the shared package for request/response models that must stay aligned across the stack

Java analogy:
- This is similar to a shared `contracts` or `common-api` jar that contains DTOs and enums used
  by both backend and frontend code.

### 5. Database foundation

Set up the schema and migration story before any domain table becomes real.

- add the Drizzle schema package
- define the initial PostgreSQL schema structure
- generate migrations from schema changes
- keep migrations committed and reviewable
- align the early table design with the ERD documents

Java analogy:
- This is the same role that JPA entity classes plus Flyway/Liquibase would play in a Spring
  Boot system, except the schema is written in TypeScript rather than annotated Java classes.

### 6. Identity and organization baseline

The first domain foundation should support tenant-aware structure and access control.

- tenants
- locations
- departments
- users
- roles and permission mappings
- audit-friendly identity and access foundations

Reference the ERDs for the exact model direction:
- [Org Structure ERD](../erd/01-org-structure.md)
- [Identity / Access ERD](../erd/02-identity-access.md)

Java analogy:
- This is similar to defining the base `Tenant`, `User`, `Role`, `Location`, and `Department`
  entities in a Spring domain model before higher-level HR flows are built.

### 7. Environment and config management

Make the application fail fast when required infrastructure settings are missing.

- validate environment variables at startup
- keep secrets out of source control
- use separate values for local, test, staging, and production environments
- document the required variables in the repo

Java analogy:
- This is equivalent to `application.yml` plus validated configuration properties in Spring Boot.

### 8. Testing baseline

Set up the test stack before domain logic grows.

- unit tests for services and helpers
- integration tests for HTTP routes
- database-backed tests where schema behavior matters
- keep test naming and structure aligned to modules

Java analogy:
- This is the Spring Boot stack of JUnit 5, Mockito, and MockMvc.

### 9. Documentation and decision records

Keep the architecture reasoning discoverable so future phases do not need to guess.

- maintain ADRs for stable architecture decisions
- maintain ERDs for domain data shape
- keep learning notes for Java developers who need a quick mental mapping
- make phase documents specific enough that implementation can follow them

Java analogy:
- This is the combination of design docs, package docs, and architecture notes that teams often
  keep alongside a Spring Boot platform codebase.

### 10. UI/UX baseline

The frontend should use the Aurora visual system as its initial design language.

- blush and lavender gradients
- frosted sidebar and translucent header
- white cards with soft shadows
- rose-pink primary actions
- violet secondary accents
- DM Sans typography

Reference the design note for the full implementation target:
- [Aurora UI/UX Design](phase-0-aurora-uiux-design.md)

---

## Phase 0 Output Checklist

- repository structure matches the chosen monorepo shape
- backend bootstrap can start cleanly
- shared contracts exist for DTOs and events
- database package and migration flow are in place
- identity and organization foundations are documented
- ERD and ADR references are linked from the learning notes
- basic tests can run in the new layout

---

## Why This Phase Matters

This phase is what keeps the rest of the HRIS build clean.

If the repo structure, contract sharing, database layout, and module boundaries are messy now,
every later phase becomes harder to test, harder to extract, and harder to explain to a Java
developer joining the project.

With Phase 0 done properly, later phase documents can focus on actual feature implementation
instead of re-litigating the foundation.
