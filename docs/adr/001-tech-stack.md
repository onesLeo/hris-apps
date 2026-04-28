# ADR 001: Tech Stack Selection

**Status:** Accepted
**Date:** 2026-04-27

---

## Context

The project is a multi-tenant HRIS built as a modular monolith, with frontend and backend deployed as separate containers. The sole developer has a strong Java/Spring Boot OOP background and is learning TypeScript. Key constraints:

- Must be easy to hire for locally (Southeast Asia talent market)
- Needs a strong module system that supports future microservices extraction
- Frontend and backend are deployed and versioned independently
- Development velocity matters for a solo developer iterating quickly

---

## Decision

**Backend: NestJS + TypeScript**

NestJS was chosen over Python/FastAPI, Go, and Java/Spring Boot. The primary reason is that NestJS mirrors Spring Boot's architecture almost 1:1, making the mental model transfer straightforward for a Java developer:

| Spring Boot | NestJS |
|---|---|
| `@Module` | `@Module()` |
| `@Service` | `@Injectable()` |
| `@RestController` | `@Controller()` |
| Spring Security filters | Guards |
| AOP / `@Aspect` | Interceptors |
| `@Autowired` constructor DI | Constructor injection |

Using the same language as the frontend also eliminates context switching between two different type systems and ecosystems.

**Frontend: Next.js with App Router**

Deployed as a separate container. App Router is the current standard for Next.js and enables server components, streaming, and a clear routing model.

**Database ORM: Drizzle ORM**

SQL-first, type-safe, and works well with advanced PostgreSQL features (Row-Level Security, partitioned tables). Prisma was considered but it fights against RLS and partitioned tables at the migration and query level. Raw Knex was considered but lacks the type safety needed to catch schema mismatches at compile time.

**Testing: Jest + Supertest**

Equivalent to the JUnit + MockMVC stack familiar from Spring Boot. Jest handles unit and integration tests; Supertest handles HTTP-level API testing.

**Package manager: pnpm**

Faster installs than npm, strict dependency isolation, and native workspace support for linking internal packages without publishing.

**Monorepo tool: Turborepo**

Provides build caching and a simple pipeline configuration. Changing one package does not trigger a full rebuild of the entire monorepo.

**Runtime: Node.js 22 LTS**

Current LTS release with stable performance and long support window.

---

## Consequences

- The developer must learn TypeScript. Learning materials are available in `docs/learning/`.
- NestJS patterns map directly to Spring Boot patterns, reducing the effective learning curve for Java developers joining the team.
- Drizzle requires writing SQL-like queries rather than JPA-style annotations. This gives more control over the generated SQL but adds verbosity for simple CRUD operations compared to Hibernate.
- pnpm workspaces allow `packages/types` to be shared between `apps/api` and `apps/web` without publishing to a registry.
- Docker images for Node.js are significantly smaller than JVM images, which matters for deployment cost.

---

## Alternatives Considered

**Java/Spring Boot**

Familiar to the developer but heavy to operate. Docker images are large (JVM startup overhead), and iteration speed for a solo developer is slower compared to the TypeScript ecosystem. Would also split the team across two languages once a frontend developer joins.

**Python/FastAPI**

Good for data-heavy or ML-adjacent work. Less opinionated structure means more decisions about how to organise modules, middleware, and DI. Not a natural fit for a Java developer expecting a framework with strong conventions.

**Go**

Fastest raw performance, smallest binaries. However, Go's standard library is verbose and the HRIS-specific ecosystem (auth libraries, job queues, ORM tooling) is smaller and less mature than the Node.js ecosystem.

**Prisma ORM**

Excellent developer experience and type safety for straightforward schemas. Struggles with complex PostgreSQL features: RLS policies interact poorly with Prisma's query engine, and partitioned tables require workarounds that break Prisma's migration model.

**TypeORM**

Mimics Java JPA annotations and is superficially familiar to Spring developers. In practice it has known bugs with complex queries and joins, and maintenance activity has declined. Not recommended for new projects.
