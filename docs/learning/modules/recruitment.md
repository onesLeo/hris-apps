# Recruitment Deep Dive

The Recruitment module manages requisitions and the candidate pipeline.
It is a good example of a screen with a list, a modal, search, filters, and immutable updates.

Key files:
- [apps/web/src/components/recruitment/recruitment-screen.tsx](../../../apps/web/src/components/recruitment/recruitment-screen.tsx)
- [apps/web/src/components/recruitment/recruitment-create-dialog.tsx](../../../apps/web/src/components/recruitment/recruitment-create-dialog.tsx)
- [apps/web/src/components/recruitment/recruitment-data.ts](../../../apps/web/src/components/recruitment/recruitment-data.ts)
- [apps/web/src/i18n/recruitment-copy.ts](../../../apps/web/src/i18n/recruitment-copy.ts)
- [apps/web/tests/recruitment-actions.test.ts](../../../apps/web/tests/recruitment-actions.test.ts)

## What the code is doing

- manages requisition cards
- manages candidate pipeline data
- filters candidates by stage
- opens a modal for create and edit
- deletes requisitions with confirmation

## How the flow works

1. `RecruitmentScreen` loads overview data.
2. It derives visible candidates using `filterRecruitmentCandidates()`.
3. It keeps requisitions in local state.
4. The modal collects requisition form values.
5. Create, edit, and delete all return a new array.

## Important functions

### `filterRecruitmentCandidates()`

This function checks stage and search terms across multiple fields.

Java equivalent:

```java
return candidates.stream()
    .filter(candidate -> matchesStage(candidate, filter))
    .filter(candidate -> matchesSearch(candidate, query))
    .toList();
```

### `addRecruitmentRequisition()`

Creates a new requisition and prepends it.

### `updateRecruitmentRequisition()`

Returns a mapped list where the matching requisition is replaced.

### `removeRecruitmentRequisition()`

Returns a filtered list without the matching requisition.

## Java vs TypeScript details

- the modal is like a command DTO
- `as const` arrays act like a fixed enum list
- helper functions are the equivalent of a small service layer

## SOLID in this module

- SRP: screen, modal, data, and copy are isolated
- OCP: new fields can be added to the modal without changing the shell
- DIP: the screen depends on helper functions instead of inline list editing

## Debugging checklist

- create/edit broken: inspect dialog mode and `editingKey`
- delete broken: inspect the returned list from `removeRecruitmentRequisition()`
- filter broken: inspect `RECRUITMENT_FILTERS` and the stage mapping

