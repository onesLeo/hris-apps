# People Module

The People module is the employee directory and the first interactive HR list in the app.
It supports search, filters, add employee, edit employee, suspend/reactivate, and delete.

Key files:
- [apps/web/src/components/people/people-screen.tsx](../../apps/web/src/components/people/people-screen.tsx)
- [apps/web/src/components/people/people-create-dialog.tsx](../../apps/web/src/components/people/people-create-dialog.tsx)
- [apps/web/src/components/people/people-data.ts](../../apps/web/src/components/people/people-data.ts)
- [apps/web/src/i18n/people-copy.ts](../../apps/web/src/i18n/people-copy.ts)
- [apps/web/tests/people-data.test.ts](../../apps/web/tests/people-data.test.ts)

## What it does

- filters employees by status or work type
- searches by name, role, and department
- opens a local create/edit dialog
- adds new employees to the top of the list
- updates an employee in place
- marks employees suspended or removes them

## Flow

1. The screen loads `EMPLOYEES` from the local data module.
2. Search and filter state is applied through `filterEmployees()`.
3. `PeopleCreateDialog` handles create and edit form state.
4. Submit uses `addEmployee()` or `updateEmployee()` depending on the mode.
5. Suspend and delete use helper functions to return a new array.
6. The footer count updates from the current list size.

## Java equivalent

- `people-screen.tsx` is similar to a Spring MVC controller plus template
- `people-data.ts` is similar to a service class with pure domain helpers
- `PeopleCreateDialog` is similar to a form DTO and modal dialog flow in a web app
- the test file is similar to a JUnit test for service logic

## How to debug

- If Add Employee does nothing, check the dialog open state in `PeopleScreen`.
- If edit opens with the wrong values, check `editingKey` and `initialEmployee`.
- If suspend does not flip back, check `updateEmployee()` and `suspendEmployee()`.
- If search looks broken, check the `filterEmployees()` query matching.
- If tests fail, run `node tests/run-tests.mjs` from `apps/web`.

## Implementation notes

- This module is intentionally mock-driven.
- It follows a clean SOLID split: screen, dialog, data helpers, and copy are separated.
- Later the helpers can be replaced by API calls while keeping the dialog and table UI stable.

