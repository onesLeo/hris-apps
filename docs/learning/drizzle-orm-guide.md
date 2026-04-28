# Drizzle ORM for JPA/Hibernate Developers

Drizzle ORM is SQL-first and type-safe. If you know JPA/Hibernate, the biggest mental shift
is that Drizzle does not hide SQL from you — it embraces it. You write queries that look like
SQL, you get type-safe results, and you stay in full control of what hits the database.

---

## Table of Contents

1. Schema Definition vs @Entity
2. Select Queries vs Repository
3. Joins vs @ManyToOne
4. Insert / Update (Effective-Dated Pattern)
5. Transactions
6. Raw SQL with the sql Tag
7. Migrations with drizzle-kit
8. Row-Level Security Setup

---

## 1. Schema Definition vs @Entity

JPA uses `@Entity` classes as the source of truth for table structure. Drizzle uses schema
definition files — plain TypeScript objects that describe tables and their columns. The schema
is also the source of truth for TypeScript types.

**JPA / Hibernate**
```java
@Entity
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "employee_no", nullable = false, unique = true)
    private String employeeNo;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private EmployeeStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
```

**Drizzle**
```typescript
// packages/db/src/schema/employee.ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const employeeStatusEnum = pgEnum('employee_status', [
  'active', 'on_leave', 'suspended', 'resigned', 'terminated',
]);

export const employees = pgTable('employees', {
  id:         uuid('id').primaryKey().defaultRandom(),
  tenantId:   uuid('tenant_id').notNull(),
  employeeNo: text('employee_no').notNull().unique(),
  status:     employeeStatusEnum('status').notNull().default('active'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

TypeScript infers the row type automatically:

```typescript
// The inferred type of a row selected from `employees`
type Employee = typeof employees.$inferSelect;
// Equivalent to: { id: string; tenantId: string; employeeNo: string; status: 'active' | 'on_leave' | ...; createdAt: Date }

// The type for inserting a new row (id and createdAt are optional — they have defaults)
type NewEmployee = typeof employees.$inferInsert;
```

Effective-dated tables (assignments, compensation) include `effectiveFrom` and `effectiveTo`:

```typescript
// packages/db/src/schema/employee-assignment.ts
import { pgTable, uuid, text, date } from 'drizzle-orm/pg-core';

export const employeeAssignments = pgTable('employee_assignments', {
  id:           uuid('id').primaryKey().defaultRandom(),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  spellId:      uuid('spell_id').notNull().references(() => employmentSpells.id),
  locationId:   uuid('location_id').references(() => locations.id),
  departmentId: uuid('department_id').references(() => departments.id),
  jobTitle:     text('job_title').notNull(),
  jobGrade:     text('job_grade'),              // nullable — no .notNull()
  managerId:    uuid('manager_id'),             // nullable self-reference
  costCentre:   text('cost_centre'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo:   date('effective_to'),          // null = open-ended (current row)
});
```

Export all tables from one index file:

```typescript
// packages/db/src/schema/index.ts
export * from './employee';
export * from './employee-assignment';
export * from './employment-spell';
export * from './leave';
export * from './payroll';
export * from './attendance';
export * from './approval';
```

---

## 2. Select Queries vs Repository

JPA uses `JpaRepository` methods (`findById`, `findAll`, `findBy*`) or JPQL. Drizzle uses a
query builder that mirrors SQL structure.

**JPA Repository**
```java
// Declare the interface
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    List<Employee> findByTenantIdAndStatus(String tenantId, EmployeeStatus status);
    Optional<Employee> findByEmployeeNo(String employeeNo);
}

// Usage in service
Optional<Employee> emp = employeeRepository.findById(id);
List<Employee> active  = employeeRepository.findByTenantIdAndStatus(tenantId, EmployeeStatus.ACTIVE);
```

**Drizzle**
```typescript
import { db } from '@hris/db';
import { employees, employeeAssignments } from '@hris/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Find by primary key
const employee = await db.query.employees.findFirst({
  where: eq(employees.id, id),
});
// Returns: Employee | undefined   (no Optional wrapper needed)

// Find with multiple conditions
const activeEmployees = await db.select()
  .from(employees)
  .where(and(
    eq(employees.tenantId, tenantId),
    eq(employees.status, 'active'),
  ));

// Find by unique field
const employee = await db.query.employees.findFirst({
  where: eq(employees.employeeNo, employeeNo),
});

// Pagination
const page    = 1;
const size    = 20;
const results = await db.select()
  .from(employees)
  .where(eq(employees.tenantId, tenantId))
  .limit(size)
  .offset((page - 1) * size)
  .orderBy(employees.employeeNo);
```

**query API vs select API:**
- `db.query.tableName.findFirst()` — relational-style, can eagerly load related rows with `with`
- `db.select().from(table)` — explicit SQL-style, required for complex projections and joins

---

## 3. Joins vs @ManyToOne

JPA handles relationships with `@ManyToOne`, `@OneToMany`, and `@JoinColumn`. The query planner
decides when to join. Drizzle makes you write joins explicitly, which gives you full control
over N+1 problems.

**JPA**
```java
@Entity
public class EmployeeAssignment {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
}

// In repository — JPQL join fetch
@Query("SELECT a FROM EmployeeAssignment a " +
       "JOIN FETCH a.employee e " +
       "JOIN FETCH a.department d " +
       "WHERE e.tenantId = :tenantId AND a.effectiveTo IS NULL")
List<EmployeeAssignment> findCurrentByTenant(@Param("tenantId") String tenantId);
```

**Drizzle — explicit joins**
```typescript
import { db } from '@hris/db';
import { employees, employeeAssignments, departments, locations } from '@hris/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Fetch current assignments with employee, department, and location data
const currentAssignments = await db
  .select({
    assignmentId:  employeeAssignments.id,
    employeeNo:    employees.employeeNo,
    jobTitle:      employeeAssignments.jobTitle,
    jobGrade:      employeeAssignments.jobGrade,
    departmentName: departments.name,
    locationName:  locations.name,
    effectiveFrom: employeeAssignments.effectiveFrom,
  })
  .from(employeeAssignments)
  .innerJoin(employees,   eq(employeeAssignments.employeeId, employees.id))
  .innerJoin(departments, eq(employeeAssignments.departmentId, departments.id))
  .leftJoin(locations,    eq(employeeAssignments.locationId, locations.id))
  .where(
    and(
      eq(employees.tenantId, tenantId),
      isNull(employeeAssignments.effectiveTo),  // current row: no end date
    ),
  );
```

**Relational query API with `with` (alternative to explicit joins)**

First, declare the relations in the schema:
```typescript
// packages/db/src/schema/relations.ts
import { relations } from 'drizzle-orm';
import { employees, employeeAssignments, departments } from './index';

export const employeesRelations = relations(employees, ({ many }) => ({
  assignments: many(employeeAssignments),
}));

export const employeeAssignmentsRelations = relations(employeeAssignments, ({ one }) => ({
  employee:   one(employees,   { fields: [employeeAssignments.employeeId],   references: [employees.id] }),
  department: one(departments, { fields: [employeeAssignments.departmentId], references: [departments.id] }),
}));
```

Then use `with` to load relations in one query:
```typescript
const employeeWithCurrentAssignment = await db.query.employees.findFirst({
  where: eq(employees.id, employeeId),
  with: {
    assignments: {
      where: isNull(employeeAssignments.effectiveTo),
      with: { department: true },
    },
  },
});
```

Use the explicit join style for complex projections; use `with` for simple parent-with-children
loading.

---

## 4. Insert / Update (Effective-Dated Pattern)

This is the most important design rule in this codebase. Tables like `employee_assignments` and
`employee_compensation` are **never updated**. Every change creates a new row with a new
`effective_from` date. The previous row gets its `effective_to` set to one day before the new
row's start date.

This preserves full history and allows point-in-time queries: "what was this employee's salary
on 2025-06-30?" is a single query with a date filter.

**JPA (mutates rows — not our pattern)**
```java
// Do NOT do this for effective-dated tables
EmployeeAssignment assignment = assignmentRepo.findCurrentByEmployeeId(employeeId);
assignment.setDepartmentId(newDepartmentId);  // overwrites history
assignmentRepo.save(assignment);
```

**Drizzle — effective-dated update (close old row, insert new row)**
```typescript
// apps/api/src/modules/employee/employee.service.ts
import { db } from '@hris/db';
import { employeeAssignments, lifecycleEvents } from '@hris/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

async function transferEmployee(
  employeeId: string,
  transferDto: TransferEmployeeDto,
): Promise<void> {
  const { newDepartmentId, newLocationId, effectiveDate } = transferDto;

  await db.transaction(async (tx) => {
    // 1. Close the current assignment row
    const [closed] = await tx
      .update(employeeAssignments)
      .set({
        effectiveTo: new Date(
          new Date(effectiveDate).getTime() - 86_400_000  // effectiveDate - 1 day
        ).toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          isNull(employeeAssignments.effectiveTo),  // the current open row
        ),
      )
      .returning();

    if (!closed) {
      throw new NotFoundException(`No current assignment for employee ${employeeId}`);
    }

    // 2. Insert new assignment row (spreads all unchanged fields from the closed row)
    await tx.insert(employeeAssignments).values({
      employeeId:   employeeId,
      spellId:      closed.spellId,
      departmentId: newDepartmentId,
      locationId:   newLocationId ?? closed.locationId,
      jobTitle:     closed.jobTitle,
      jobGrade:     closed.jobGrade,
      managerId:    closed.managerId,
      costCentre:   closed.costCentre,
      effectiveFrom: effectiveDate,
      effectiveTo:  null,  // open-ended — this is now the current row
    });

    // 3. Record the lifecycle event
    await tx.insert(lifecycleEvents).values({
      employeeId,
      eventType:     'transfer',
      effectiveDate,
      initiatedBy:   transferDto.initiatedById,
      payload: {
        fromDepartmentId: closed.departmentId,
        toDepartmentId:   newDepartmentId,
        fromLocationId:   closed.locationId,
        toLocationId:     newLocationId,
      },
    });
  });
}
```

**Point-in-time query**
```typescript
// What was this employee's assignment on a specific date?
async function getAssignmentAt(employeeId: string, asOfDate: string) {
  return db.query.employeeAssignments.findFirst({
    where: and(
      eq(employeeAssignments.employeeId, employeeId),
      lte(employeeAssignments.effectiveFrom, asOfDate),
      or(
        isNull(employeeAssignments.effectiveTo),
        gte(employeeAssignments.effectiveTo, asOfDate),
      ),
    ),
  });
}
```

**Simple insert (no effective dating)**
```typescript
// Insert a new employee record
const [newEmployee] = await db
  .insert(employees)
  .values({
    tenantId:   tenantId,
    employeeNo: generateEmployeeNo(),
    status:     'active',
  })
  .returning();  // returns the inserted row including generated id and createdAt
```

---

## 5. Transactions

Covered briefly in `nestjs-vs-spring-boot.md`. The key difference from Spring `@Transactional`:
Drizzle transactions do not propagate automatically. You must pass the `tx` handle.

```typescript
// Pattern: repository methods accept an optional tx parameter
@Injectable()
export class LeaveRepository {
  async create(
    data: NewLeaveRequest,
    tx?: typeof db,  // tx is the same type as db — both have the same query API
  ): Promise<LeaveRequest> {
    const conn = tx ?? db;  // use transaction if provided, otherwise use the pool
    const [row] = await conn.insert(leaveRequests).values(data).returning();
    return row;
  }

  async deductBalance(
    employeeId: string,
    leaveType: string,
    days: number,
    tx?: typeof db,
  ): Promise<void> {
    const conn = tx ?? db;
    await conn
      .update(leaveBalances)
      .set({ available: sql`available - ${days}` })
      .where(
        and(
          eq(leaveBalances.employeeId, employeeId),
          eq(leaveBalances.leaveType, leaveType),
        ),
      );
  }
}

// Service: coordinates both operations atomically
@Injectable()
export class LeaveService {
  constructor(private readonly leaveRepository: LeaveRepository) {}

  async submitRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return db.transaction(async (tx) => {
      const request = await this.leaveRepository.create(dto, tx);
      await this.leaveRepository.deductBalance(
        dto.employeeId,
        dto.leaveType,
        dto.days,
        tx,
      );
      return request;
    });
  }
}
```

---

## 6. Raw SQL with the sql Tag

Sometimes you need PostgreSQL-specific features that the query builder does not expose, or
you need to write a complex expression. Drizzle has an `sql` template tag for this.

**JPA — native query**
```java
@Query(value = "SELECT * FROM employees WHERE to_tsvector('indonesian', full_name) @@ plainto_tsquery('indonesian', :q)",
       nativeQuery = true)
List<Employee> searchByName(@Param("q") String query);
```

**Drizzle — sql tag**
```typescript
import { sql } from 'drizzle-orm';

// Full-text search using PostgreSQL tsvector
const results = await db.select()
  .from(employees)
  .where(
    sql`to_tsvector('indonesian', ${employees.fullName}) @@ plainto_tsquery('indonesian', ${query})`
  );

// Use sql in a SET clause for arithmetic
await db.update(leaveBalances)
  .set({
    used: sql`${leaveBalances.used} + ${days}`,
  })
  .where(eq(leaveBalances.id, balanceId));

// Window functions and CTEs require raw sql for the full query
const headcountByDept = await db.execute(sql`
  SELECT
    d.name  AS department_name,
    COUNT(ea.id) FILTER (WHERE ea.effective_to IS NULL) AS headcount
  FROM departments d
  LEFT JOIN employee_assignments ea ON ea.department_id = d.id
  WHERE d.tenant_id = ${tenantId}
  GROUP BY d.id, d.name
  ORDER BY headcount DESC
`);
```

The `sql` tag is safe against SQL injection — values are passed as parameterised placeholders,
not interpolated into the string.

---

## 7. Migrations with drizzle-kit

JPA uses Liquibase, Flyway, or Hibernate's `ddl-auto` to manage schema changes. Drizzle uses
`drizzle-kit` to diff the schema files against the database and generate SQL migration files.

**Workflow:**

```bash
# 1. Edit the schema file (e.g. add a column to employees)
# packages/db/src/schema/employee.ts

# 2. Generate the migration SQL file
pnpm --filter @hris/db drizzle-kit generate

# Output: packages/db/src/migrations/0003_add_middle_name_to_employees.sql

# 3. Review the generated SQL before applying
# packages/db/src/migrations/0003_add_middle_name_to_employees.sql:
# ALTER TABLE employees ADD COLUMN middle_name text;

# 4. Apply in development
pnpm --filter @hris/db drizzle-kit migrate

# 5. In production, migrations run at deploy time (CI/CD step before starting the server)
```

**drizzle.config.ts**
```typescript
// packages/db/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:    './src/schema/index.ts',
  out:       './src/migrations',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict:  true,   // prompt before destructive operations
});
```

Migration files are committed to git. They are never edited after they are applied — just like
Flyway versioned scripts. If you need to undo a change, write a new migration.

---

## 8. Row-Level Security Setup

PostgreSQL Row-Level Security (RLS) enforces tenant isolation at the database level. Even if
application code forgets to filter by `tenant_id`, the database will not return rows for other
tenants. This is not possible with JPA/Hibernate without significant custom work.

**Enable RLS on a table:**
```sql
-- In a migration file
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Set the tenant context before each query:**

```typescript
// apps/api/src/common/db/tenant-db.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '@hris/db';

@Injectable()
export class TenantDbService {
  /**
   * Returns a database connection scoped to the given tenant.
   * All queries run through this connection will only see rows for that tenant.
   */
  forTenant(tenantId: string) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return tx;
    });
  }

  /**
   * Run a callback inside a tenant-scoped transaction.
   */
  async withTenant<T>(tenantId: string, fn: (tx: typeof db) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      return fn(tx);
    });
  }
}
```

**Usage in a service:**
```typescript
async listEmployees(tenantId: string): Promise<Employee[]> {
  return this.tenantDb.withTenant(tenantId, (tx) =>
    tx.select().from(employees)
    // No .where(eq(employees.tenantId, tenantId)) needed —
    // RLS enforces it at the PostgreSQL level
  );
}
```

**RLS for the application role vs the migration role:**

The migration user (superuser or `BYPASSRLS`) runs migrations and can see all rows. The
application user is granted only `SELECT`, `INSERT`, `UPDATE` and is subject to RLS. Keep
two database credentials:

```env
DATABASE_URL=postgresql://hris_app:apppassword@localhost/hris       # used by the NestJS app
DATABASE_MIGRATION_URL=postgresql://hris_admin:adminpw@localhost/hris  # used by drizzle-kit
```
