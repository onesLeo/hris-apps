# TypeScript for Java Developers

This guide is written for a developer with strong Java experience. Every concept is explained
by comparison to the equivalent Java construct, using HRIS domain objects as examples.

---

## Table of Contents

1. Type Annotations
2. Interfaces vs Classes (Structural Typing)
3. Optional Fields
4. Generics
5. Enums
6. Async/Await vs CompletableFuture
7. Destructuring
8. Spread Operator
9. null vs undefined
10. readonly vs final
11. Access Modifiers
12. Decorators

---

## 1. Type Annotations

In Java, types are declared to the left of the variable name. In TypeScript, they follow a colon
after the variable name. Both are optional when the compiler can infer the type.

**Java**
```java
String employeeNo = "EMP-0042";
int headcount = 150;
boolean isActive = true;
```

**TypeScript**
```typescript
const employeeNo: string = 'EMP-0042';
const headcount: number = 150;
const isActive: boolean = true;

// Type is inferred — annotation is optional here
const currency = 'IDR';  // TypeScript infers string
```

Function parameter and return types follow the same pattern:

**Java**
```java
public String formatEmployeeNo(int sequence) {
    return "EMP-" + String.format("%04d", sequence);
}
```

**TypeScript**
```typescript
function formatEmployeeNo(sequence: number): string {
  return `EMP-${String(sequence).padStart(4, '0')}`;
}
```

TypeScript has one numeric type (`number`) where Java distinguishes `int`, `long`, `double`, etc.
For monetary amounts, use `number` but document the unit (e.g. "IDR, rounded to nearest integer").

---

## 2. Interfaces vs Classes (Structural Typing)

Java interfaces define method contracts. Classes implement them explicitly with `implements`.
TypeScript interfaces define the shape of any object. There is no `implements` keyword required
for plain objects — TypeScript uses **structural typing**: if an object has all the required
fields, it satisfies the interface regardless of its declared type.

**Java**
```java
public interface Employee {
    String getId();
    String getEmployeeNo();
    String getStatus();
}

public class ActiveEmployee implements Employee {
    private String id;
    private String employeeNo;
    private String status = "active";
    // must explicitly say `implements Employee`
}
```

**TypeScript**
```typescript
interface Employee {
  id: string;
  employeeNo: string;
  status: string;
}

// This plain object satisfies Employee without any declaration
const emp: Employee = {
  id: 'a1b2c3',
  employeeNo: 'EMP-0042',
  status: 'active',
};

// A function accepting Employee accepts any object with those fields
function printEmployee(e: Employee): void {
  console.log(`${e.employeeNo} — ${e.status}`);
}
```

Use interfaces for data shapes (DTOs, query results, event payloads). Use classes when you need
methods, inheritance, or dependency injection (NestJS services and controllers are always classes).

---

## 3. Optional Fields

Java uses `@Nullable` annotations or `Optional<T>` to signal that a field may be absent.
TypeScript uses `?:` to mark a field as optional, meaning it may be the declared type or
`undefined`.

**Java**
```java
public class EmployeeAssignment {
    private String jobTitle;
    @Nullable
    private String jobGrade;   // may be absent for contractors
    @Nullable
    private String managerId;  // top of org has no manager
}
```

**TypeScript**
```typescript
interface EmployeeAssignment {
  jobTitle: string;
  jobGrade?: string;    // string | undefined — may be absent
  managerId?: string;   // string | undefined
  effectiveFrom: string;
  effectiveTo?: string; // open-ended rows have no end date
}
```

The `?:` syntax is exactly equivalent to writing `fieldName: string | undefined`. You can read
optional fields safely but TypeScript forces you to check for `undefined` before using them:

```typescript
function getGrade(a: EmployeeAssignment): string {
  // compile error without the guard: a.jobGrade might be undefined
  return a.jobGrade ?? 'N/A';  // ?? returns right side when left is null or undefined
}
```

---

## 4. Generics

TypeScript generics use the same `<T>` syntax as Java. The semantics are similar but the
constraints are expressed differently.

**Java**
```java
public class PageResult<T> {
    private List<T> items;
    private int total;
    private int page;
    private int pageSize;
}

// Usage
PageResult<Employee> result = employeeService.list(page, size);
```

**TypeScript**
```typescript
interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Usage — TypeScript infers T from the value in most cases
async function listEmployees(page: number, size: number): Promise<PageResult<Employee>> {
  // ...
}
```

Constraints use `extends` just like Java's upper-bounded wildcards:

```typescript
// Only accept objects that have an `id` field
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}
```

---

## 5. Enums

TypeScript has `enum` but string unions are often preferred for domain values because they
produce cleaner JSON serialisation and are easier to use in switch statements.

**Java**
```java
public enum EmployeeStatus {
    ACTIVE, ON_LEAVE, SUSPENDED, RESIGNED, TERMINATED
}

public enum LeaveType {
    ANNUAL, SICK, MATERNITY, PATERNITY, UNPAID
}
```

**TypeScript — numeric enum (avoid for domain values)**
```typescript
enum EmployeeStatus {
  Active,      // 0
  OnLeave,     // 1
  Suspended,   // 2
}
// Serialises to 0, 1, 2 in JSON — hard to read in logs
```

**TypeScript — string enum (better)**
```typescript
enum EmployeeStatus {
  Active      = 'active',
  OnLeave     = 'on_leave',
  Suspended   = 'suspended',
  Resigned    = 'resigned',
  Terminated  = 'terminated',
}
```

**TypeScript — string union type (often preferred in this codebase)**
```typescript
type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';
type LeaveType = 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid';

// TypeScript enforces the allowed values at compile time
function deactivate(employeeId: string, reason: 'resigned' | 'terminated'): void {
  // ...
}
```

String unions work well with Drizzle's `pgEnum` for database columns (see `drizzle-orm-guide.md`).

---

## 6. Async/Await vs CompletableFuture

Java async work uses `CompletableFuture<T>`. In TypeScript (Node.js) all I/O is asynchronous
and the native primitive is `Promise<T>`. The `async`/`await` syntax is effectively identical
in both languages.

**Java**
```java
public CompletableFuture<Employee> findById(String id) {
    return CompletableFuture.supplyAsync(() ->
        employeeRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(id))
    );
}

// Caller
Employee emp = employeeService.findById(id).get(); // blocks — bad in practice
// or
employeeService.findById(id).thenAccept(emp -> process(emp));
```

**TypeScript**
```typescript
async function findById(id: string): Promise<Employee> {
  const emp = await db.query.employees.findFirst({
    where: eq(employees.id, id),
  });
  if (!emp) throw new NotFoundException(`Employee ${id} not found`);
  return emp;
}

// Caller — must be inside an async function or use .then()
const emp = await employeeService.findById(id);
```

Key differences:
- `await` can only be used inside `async` functions (or at the top level of a module in Node 22).
- An unhandled rejected Promise in Node.js crashes the process — always `try/catch` or let
  NestJS's exception filter handle it.
- Never call `.then()` and `await` on the same Promise — pick one style.

---

## 7. Destructuring

Java has no native destructuring; you access fields with getters. TypeScript lets you pull
fields out of objects and arrays directly into named variables.

**Object destructuring**
```typescript
const assignment: EmployeeAssignment = await getAssignment(employeeId);

// Java-style: access each field
const title  = assignment.jobTitle;
const dept   = assignment.departmentId;
const from   = assignment.effectiveFrom;

// TypeScript destructuring — same result
const { jobTitle, departmentId, effectiveFrom } = assignment;

// Rename while destructuring
const { jobTitle: title, departmentId: dept } = assignment;

// Default value for optional field
const { jobGrade = 'N/A' } = assignment;
```

**Array destructuring**
```typescript
const [first, second, ...rest] = employees;

// Useful with database queries that return tuples
const [totalRows] = await db.select({ count: count() }).from(employees);
console.log(totalRows.count);
```

**Function parameters**
```typescript
// Common pattern: destructure the options object in the parameter list
async function createLeaveRequest({
  employeeId,
  leaveType,
  startDate,
  endDate,
}: CreateLeaveRequestDto): Promise<LeaveRequest> {
  // use the fields directly — no `dto.employeeId` everywhere
}
```

---

## 8. Spread Operator

The spread operator (`...`) works on arrays and objects. It is the TypeScript equivalent of
`Collections.addAll()` and `BeanUtils.copyProperties()` from Java.

**Array spread**
```typescript
const seniorStaff = ['EMP-001', 'EMP-002'];
const newHires    = ['EMP-100', 'EMP-101'];

// Java: seniorStaff.addAll(newHires)
const allEmployees = [...seniorStaff, ...newHires];
```

**Object spread (shallow merge)**
```typescript
const baseLeavePolicy = {
  annualDays: 12,
  sickDays: 12,
  carryOverMaxDays: 5,
};

// Override specific fields for a senior grade
const seniorPolicy = {
  ...baseLeavePolicy,
  annualDays: 18,        // overrides the base value
  carryOverMaxDays: 10,
};
```

**Immutable update pattern** — never mutate the original:
```typescript
// Build a new assignment row without mutating the current one
const updatedAssignment: Omit<EmployeeAssignment, 'id'> = {
  ...currentAssignment,
  departmentId: newDepartmentId,
  effectiveFrom: transferDate,
  effectiveTo: undefined,
};
```

---

## 9. null vs undefined

Java has one empty value: `null`. TypeScript has two: `null` and `undefined`.

| Value       | Meaning                                              |
|-------------|------------------------------------------------------|
| `undefined` | Variable declared but never assigned; optional field absent |
| `null`      | Explicitly set to "no value"                        |

In practice:
- Optional fields (`?:`) produce `undefined` when absent.
- Database NULL values come back from Drizzle as `null`.
- Use `??` (nullish coalescing) to handle both at once: `value ?? 'default'` returns `'default'`
  when `value` is `null` or `undefined`.
- Use `?.` (optional chaining) to safely navigate possibly-null objects:

```typescript
const managerName = assignment.managerId
  ? await db.query.employees.findFirst({ where: eq(employees.id, assignment.managerId) })
    .then(m => m?.employeeNo)
  : undefined;

// Or more idiomatically:
const manager = await fetchManager(assignment.managerId);
const grade   = manager?.currentAssignment?.jobGrade ?? 'N/A';
```

**This codebase convention:** database columns that may be NULL are typed `string | null`.
Optional DTO fields are typed `string | undefined` (or `string?:`). Do not mix the two without
an explicit conversion.

---

## 10. readonly vs final

`final` in Java makes a variable reference immutable after assignment. TypeScript's `readonly`
does the same for object properties. At the top level, `const` prevents reassignment (like
Java `final` on a local variable).

**Java**
```java
public final class EmployeeId {
    private final String value;
    public EmployeeId(String value) { this.value = value; }
}
```

**TypeScript**
```typescript
// Prevent reassignment of a local variable
const employeeId = 'EMP-0042';
// employeeId = 'other'; // compile error

// Prevent mutation of object properties
interface FrozenAssignment {
  readonly employeeId: string;
  readonly effectiveFrom: string;
  readonly departmentId: string;
}

const assignment: FrozenAssignment = {
  employeeId: 'EMP-0042',
  effectiveFrom: '2026-01-01',
  departmentId: 'DEPT-HR',
};
// assignment.departmentId = 'DEPT-FIN'; // compile error

// Readonly array — no push/pop/splice
const allowedStatuses: readonly string[] = ['active', 'on_leave', 'suspended'];
```

Use `readonly` on interfaces that represent database rows or event payloads — they should never
be mutated after they are loaded.

---

## 11. Access Modifiers

TypeScript supports `public`, `protected`, and `private` on class members, the same as Java.
In TypeScript they are compile-time only (JavaScript has no runtime enforcement), but that is
sufficient for catching mistakes.

**Java**
```java
@Service
public class EmployeeService {
    private final EmployeeRepository repository;
    
    public EmployeeService(EmployeeRepository repository) {
        this.repository = repository;
    }
    
    public Employee findById(String id) { ... }
    private void validateStatus(Employee e) { ... }
}
```

**TypeScript**
```typescript
@Injectable()
export class EmployeeService {
  // TypeScript shorthand: constructor parameter with access modifier
  // automatically declares and assigns the field
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async findById(id: string): Promise<Employee> { ... }

  private validateStatus(employee: Employee): void { ... }
}
```

The constructor parameter shorthand (`private readonly repo: Repo`) is idiomatic TypeScript —
it replaces the Java pattern of declaring a field, then assigning it in the constructor.

---

## 12. Decorators

Java uses annotations (`@Service`, `@GetMapping`, etc.) that are processed at compile time or
by a framework at runtime. TypeScript decorators (`@Injectable()`, `@Get()`, etc.) are functions
called at class or method definition time. They modify or register the class/method they decorate.

**Java**
```java
@Service
public class LeaveService { ... }

@RestController
@RequestMapping("/leave")
public class LeaveController {
    @GetMapping("/{id}")
    public LeaveRequest getById(@PathVariable String id) { ... }
    
    @PostMapping
    public LeaveRequest create(@RequestBody CreateLeaveRequestDto dto) { ... }
}
```

**TypeScript / NestJS**
```typescript
@Injectable()
export class LeaveService { ... }

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get(':id')
  getById(@Param('id') id: string): Promise<LeaveRequest> { ... }

  @Post()
  create(@Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> { ... }
}
```

Decorators must be enabled in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

NestJS uses `emitDecoratorMetadata` to read parameter types at runtime, which powers its
dependency injection container — the same mechanism that Spring uses reflection for `@Autowired`.
