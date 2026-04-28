# SOLID In Practice

This guide explains how SOLID is implemented in the current HRIS frontend structure.
The goal is not just to know the acronym, but to see how the codebase is already applying it.

## 1. Single Responsibility Principle

Each file should do one job.

Examples:

- [apps/web/src/components/leave/leave-screen.tsx](../../apps/web/src/components/leave/leave-screen.tsx) renders the Leave UI
- [apps/web/src/components/leave/leave-data.ts](../../apps/web/src/components/leave/leave-data.ts) handles leave data operations
- [apps/web/src/components/leave/leave-apply-dialog.tsx](../../apps/web/src/components/leave/leave-apply-dialog.tsx) handles the modal form
- [apps/web/src/i18n/leave-copy.ts](../../apps/web/src/i18n/leave-copy.ts) owns the translated text

Java equivalent:

- one controller
- one service
- one DTO class or record
- one message bundle

Why this matters:

- easier to test
- easier to refactor
- easier to localize
- easier to replace static data with API data later

## 2. Open / Closed Principle

The code should be open for extension but closed for rewriting.

Examples in this repo:

- add a new language by extending the locale copy module
- add a new screen by creating a new module
- add a new helper by placing it in the module’s data file
- add a new action by extending the modal or helper instead of rewriting the shell

Example:

```ts
export function getLeaveCopy(locale: Locale): LeaveCopy {
  return LEAVE_COPY[locale];
}
```

To add a new locale, we extend `LEAVE_COPY`.
We do not have to rewrite the `LeaveScreen`.

Java equivalent:

- add a new `MessageSource` entry or resource bundle
- add a new service implementation
- keep the consumer code unchanged

## 3. Liskov Substitution Principle

If two objects share the same contract, either one should be usable without breaking the caller.

In our app:

- `getDashboardCopy(locale)` returns the same shape for both EN and ID
- `getApprovalsCopy(locale)` returns the same shape for both EN and ID
- `getLeaveCopy(locale)` returns the same shape for both EN and ID

That means the screen component does not care which locale is active.
It only cares that the contract is stable.

Java equivalent:

- the same idea as a service interface with interchangeable implementations
- the caller depends on behavior, not the concrete class

## 4. Interface Segregation Principle

Do not force a component to depend on data it does not need.

Examples:

- `LeaveApplyDialog` only depends on leave-form copy, not the whole app copy object
- `PeopleCreateDialog` only depends on people copy and employee input types
- `DashboardScreen` only depends on dashboard copy, not the recruitment or leave contract

That is why each module has its own copy file.
The contracts stay small and focused.

Java equivalent:

- small interfaces
- small DTOs
- small service contracts
- avoid giant “god” interfaces

## 5. Dependency Inversion Principle

High-level code should depend on abstractions, not on hardcoded details.

Examples:

- `AuroraApp` depends on screen components, not on inline screen text
- screen components depend on `getXCopy(locale)` helpers, not on raw language constants
- data helpers depend on typed input shapes, not on uncontrolled form values

This is why the shell does not own the module text anymore.

Java equivalent:

- controller depends on service interface
- service depends on repository interface
- concrete implementations are injected, not hardcoded

## 6. How This Looks In The Current Modules

### People

- screen: table, search, buttons, modal orchestration
- data: add/update/remove/filter helpers
- dialog: form handling only
- copy: labels only
- tests: helper behavior only

### Leave

- screen: balances, tabs, queue, modal open state
- data: request creation and filtering
- dialog: form handling only
- copy: labels only
- tests: helper behavior only

### Recruitment, Performance, Learning

These modules follow the same split:

- screen
- data
- modal
- copy
- tests

That is the reusable pattern.

## 7. Java Mapping For SOLID

| SOLID concept | This repo pattern | Java equivalent |
|---|---|---|
| SRP | screen / data / dialog / copy split | controller / service / DTO / message bundle |
| OCP | add new locale or module by extension | add new bean or resource bundle |
| LSP | same copy shape for every locale | interchangeable interface implementations |
| ISP | small copy contracts per screen | narrow interfaces and DTOs |
| DIP | screens consume helpers, not raw literals | controller depends on abstractions |

## 8. Debugging With SOLID

When something breaks, SOLID gives you a map:

- layout issue: inspect the screen component
- form issue: inspect the modal component
- data issue: inspect the helper file
- translation issue: inspect the copy file
- shared navigation issue: inspect the shell and locale provider

If a bug requires editing many files at once, that is usually a sign the boundaries are too
wide.

## 9. Practical Rule For Future Work

Before adding a feature, ask:

1. Does this belong to the shell or to a screen?
2. Does this belong to copy, data, or UI?
3. Can it be tested as a pure helper?
4. Can it be localized without touching component logic?
5. Can it be replaced by API data later without rewriting the screen?

If the answer is no, the design is probably too coupled.

