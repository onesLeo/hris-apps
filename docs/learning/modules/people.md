# People Deep Dive

This module is the employee directory screen.
It is the best place to learn how the app uses local state, pure helper functions, and modal
forms together.

Key files:
- [apps/web/src/components/people/people-screen.tsx](../../../apps/web/src/components/people/people-screen.tsx)
- [apps/web/src/components/people/people-create-dialog.tsx](../../../apps/web/src/components/people/people-create-dialog.tsx)
- [apps/web/src/components/people/people-data.ts](../../../apps/web/src/components/people/people-data.ts)
- [apps/web/src/i18n/people-copy.ts](../../../apps/web/src/i18n/people-copy.ts)
- [apps/web/tests/people-data.test.ts](../../../apps/web/tests/people-data.test.ts)

## What the code is doing

The screen holds three main kinds of state:

- the current filter
- the current search text
- the current employee list

The data module holds the pure operations:

- `filterEmployees()`
- `addEmployee()`
- `updateEmployee()`
- `suspendEmployee()`
- `removeEmployee()`
- `getEmployeeKey()`

The modal handles create/edit input only.
The copy file handles labels only.

## How the flow works

1. `PeopleScreen` loads the initial `EMPLOYEES` array.
2. The user types into search or clicks a filter pill.
3. `filterEmployees()` returns the visible rows.
4. Clicking `Add Employee` opens `PeopleCreateDialog`.
5. Submitting create mode calls `addEmployee()`.
6. Submitting edit mode calls `updateEmployee()`.
7. Suspend and delete use helper functions that return a new array.

## Important functions

### `filterEmployees()`

This function trims the search string, converts it to lowercase, and checks each employee
against both the filter and the search query.

Java equivalent:

```java
List<Employee> filtered = employees.stream()
    .filter(employee -> matchesFilter(employee, filter))
    .filter(employee -> matchesSearch(employee, query))
    .toList();
```

### `addEmployee()`

This function creates initials from the employee name and prepends a new row to the array.
It does not mutate the original list.

Java equivalent:

```java
List<Employee> next = new ArrayList<>();
next.add(buildEmployee(input));
next.addAll(employees);
return next;
```

### `updateEmployee()`

This function matches the employee by key and returns a new object with updated fields.
The initials and color stay unchanged.

Java equivalent:

```java
employees.stream()
    .map(employee -> employee.getKey().equals(key) ? employee.withUpdatedFields(input) : employee)
    .toList();
```

### `suspendEmployee()` and `removeEmployee()`

- `suspendEmployee()` changes the status to `Suspended`
- `removeEmployee()` removes the matching employee

Both are immutable transformations.

## How the dialog works

`PeopleCreateDialog` is a controlled form:

- it receives `open`, `mode`, `initialEmployee`, `onClose`, and `onSubmit`
- it keeps a local `form` state object
- it resets form values when the dialog closes
- it loads existing values when editing

Java equivalent:

- a form backing bean plus modal dialog state
- in Spring MVC terms, it feels similar to a DTO that is shown in a modal form

## Java vs TypeScript details

### Variables

- TypeScript uses `const` and `let`
- Java uses local variables and fields

### Arguments

- both Java and TypeScript pass values by value
- object references are copied, so mutation can still affect the original object
- this code avoids mutation by returning new arrays and new objects

### Types

- Java often uses classes for DTOs
- TypeScript uses `type` aliases and union types

## SOLID in this module

- SRP: screen, dialog, data, copy, and tests are separate
- OCP: you can add behavior by adding a helper, not by rewriting the shell
- ISP: the dialog only depends on employee form data
- DIP: the screen depends on helper functions, not hardcoded logic

## Debugging checklist

- search not working: inspect `filterEmployees()`
- create not working: inspect `PeopleCreateDialog` submit logic
- edit opening wrong record: inspect `editingKey`
- suspend/delete not changing state: inspect the helper return values
- translation wrong: inspect `people-copy.ts`

