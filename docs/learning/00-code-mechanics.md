# TypeScript Code Mechanics

This guide explains how the current HRIS code works at the language level:
variables, assignment, functions, argument passing, immutability, and how those ideas map to
Java.

Use this as the technical foundation before reading the module walkthroughs.

Key files to study:
- [apps/web/src/components/people/people-data.ts](../../apps/web/src/components/people/people-data.ts)
- [apps/web/src/components/leave/leave-data.ts](../../apps/web/src/components/leave/leave-data.ts)
- [apps/web/src/components/recruitment/recruitment-data.ts](../../apps/web/src/components/recruitment/recruitment-data.ts)
- [apps/web/src/components/performance/performance-data.ts](../../apps/web/src/components/performance/performance-data.ts)
- [apps/web/src/components/learning/learning-data.ts](../../apps/web/src/components/learning/learning-data.ts)

## 1. Variables And Assignment

In TypeScript, variables are usually declared with `const` or `let`.

Example:

```ts
const [employees, setEmployees] = useState(EMPLOYEES);
```

What this means:

- `employees` is a variable holding the current employee list.
- `setEmployees` is a function returned by React that replaces the current state.
- `const` means the variable binding cannot be reassigned, but the array value itself can still
  be replaced by the setter.

Java equivalent:

```java
List<Employee> employees = new ArrayList<>(EMPLOYEES);
```

In Java, the variable binding also points to an object. The main difference is that React state
updates are done by calling a setter, while Java code typically assigns the result to a variable
or returns a new value from a service.

### `const` vs `let`

- `const` means the variable name cannot point to a different value later.
- `let` means the variable name can be reassigned.

Example from the codebase:

```ts
const [search, setSearch] = useState('');
let total = 0;
```

Java equivalent:

- `const` behaves a bit like a local variable you do not reassign.
- `let` behaves like a normal mutable local variable.

## 2. Types And Type Aliases

TypeScript lets us describe the shape of data without creating classes.

Example:

```ts
export type Employee = {
  name: string;
  role: string;
  dept: string;
  status: EmployeeStatus;
  type: WorkType;
  since: string;
  initials: string;
  color: string;
};
```

Java equivalent:

```java
public class Employee {
    private String name;
    private String role;
    private String dept;
    private EmployeeStatus status;
    private WorkType type;
    private String since;
    private String initials;
    private String color;
}
```

Important difference:

- Java usually models data with classes.
- TypeScript often models data with `type` aliases or interfaces.
- In our codebase, this is why `people-data.ts` can define the whole shape without a class.

## 3. Assignment And Immutability

Most helpers in this repo return new arrays instead of mutating the input.

Example:

```ts
export function addEmployee(employees: readonly Employee[], input: CreateEmployeeInput): Employee[] {
  return [
    {
      ...input,
      initials: initials || 'EN',
      color: '#f43f8e',
    },
    ...employees,
  ];
}
```

What happens here:

- `employees` is marked `readonly`, so the function promises not to mutate it.
- `[newItem, ...employees]` creates a brand-new array.
- `{ ...input }` creates a brand-new object by copying fields from `input`.

Java equivalent:

```java
public List<Employee> addEmployee(List<Employee> employees, CreateEmployeeInput input) {
    List<Employee> next = new ArrayList<>();
    next.add(new Employee(...));
    next.addAll(employees);
    return next;
}
```

Why this pattern matters:

- state updates become predictable
- tests are easier to write
- React rerenders are easier to reason about
- accidental mutation bugs are reduced

## 4. Functions

Functions are the workhorses of the codebase.

Example:

```ts
export function filterEmployees(
  employees: Employee[],
  filter: PeopleFilter,
  search: string,
): Employee[] {
  const query = search.trim().toLowerCase();

  return employees.filter((employee) => {
    const matchesFilter = filter === 'All' || employee.status === filter || employee.type === filter;
    const matchesSearch =
      !query ||
      employee.name.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
      employee.dept.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}
```

Step by step:

- `search.trim().toLowerCase()` normalizes the search text.
- `employees.filter(...)` loops through the array.
- The callback returns `true` for rows that should stay visible.
- The final result is a new filtered array.

Java equivalent:

```java
public List<Employee> filterEmployees(List<Employee> employees, PeopleFilter filter, String search) {
    String query = search.trim().toLowerCase();
    return employees.stream()
        .filter(employee -> matches(employee, filter, query))
        .toList();
}
```

This is very close to Java Streams. The main conceptual difference is that TypeScript uses
callback functions directly inside array methods, while Java uses streams with lambdas.

## 5. How Arguments Work

This is one of the most important language differences to understand.

### The short version

Java and TypeScript both pass arguments by value.

The confusion comes from the fact that:

- Java passes the value of a primitive directly
- Java passes the value of an object reference
- TypeScript/JavaScript also passes the value of a reference when the value is an object

So in both languages:

- reassigning a parameter inside a function does not change the caller’s variable
- mutating the object through that reference can affect the caller

### Example in TypeScript

```ts
function changeName(employee: Employee) {
  employee.name = 'New Name';
}
```

If you call this with an object, the caller sees the mutated object because the function received
a copy of the reference that points to the same object.

### Safe pattern used in this repo

Instead of mutating, we return a new value:

```ts
export function updateEmployee(
  employees: readonly Employee[],
  key: EmployeeKey,
  input: CreateEmployeeInput,
): Employee[] {
  return employees.map((employee) =>
    getEmployeeKey(employee) === key
      ? {
          ...employee,
          ...input,
          initials: employee.initials,
          color: employee.color,
        }
      : employee,
  );
}
```

Java equivalent:

```java
public List<Employee> updateEmployee(List<Employee> employees, EmployeeKey key, CreateEmployeeInput input) {
    return employees.stream()
        .map(employee -> employee.getKey().equals(key) ? employee.copyWith(input) : employee)
        .toList();
}
```

This is closer to functional programming than classic mutable Java code, but it is very clean
for UI state.

## 6. Function Arguments In Java vs TypeScript

### Java

- primitive values like `int` and `boolean` are copied
- object references are copied
- method overloading is common
- default parameters do not exist in the same way

### TypeScript

- primitive values are copied
- object references are copied
- optional parameters are common
- default values are common
- union types are common

Example:

```ts
function submitCycle(input: CreatePerformanceCycleInput) { ... }
```

Java equivalent often uses a DTO:

```java
public void submitCycle(CreatePerformanceCycleInput input) { ... }
```

The biggest practical difference in this repo is that TypeScript functions are usually
single-purpose and typed with object shapes, while Java often leans more heavily on classes and
method overloads.

## 7. Arrays, Map, Filter, Reduce

Most of the data manipulation here uses array helpers.

Examples:

- `filter()` keeps matching rows
- `map()` transforms rows
- `reduce()` aggregates values

Java equivalents are Stream API operations:

- `filter()`
- `map()`
- `reduce()`

This is why much of the data logic feels familiar to a Java developer even though the syntax is
different.

## 8. React State

React state is local component memory.

Example:

```ts
const [requests, setRequests] = useState(LEAVE_REQUESTS);
```

What that means:

- `requests` is the current state value
- `setRequests` replaces it with a new value
- React rerenders the component after the state update

Java equivalent:

- this is not exactly the same as a Spring service
- it is closer to a UI view model or controller state in a desktop/web client

The key idea is that React state should be treated as immutable data that gets replaced, not
modified in place.

## 9. Debugging Checklist

When a module behaves strangely, debug it in this order:

1. Check the screen component for UI state.
2. Check the data helper for transformation logic.
3. Check the copy file for labels and translations.
4. Check the tests for the expected behavior.
5. Check the shell only if navigation or locale switching is involved.

That is the same mental model as:

- controller
- service
- DTO / view model
- test
- shell or layout

