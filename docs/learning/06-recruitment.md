# Recruitment Module

The Recruitment module manages open requisitions and the candidate pipeline.
It already supports create, edit, and delete actions for requisitions with a local modal.

Key files:
- [apps/web/src/components/recruitment/recruitment-screen.tsx](../../apps/web/src/components/recruitment/recruitment-screen.tsx)
- [apps/web/src/components/recruitment/recruitment-create-dialog.tsx](../../apps/web/src/components/recruitment/recruitment-create-dialog.tsx)
- [apps/web/src/components/recruitment/recruitment-data.ts](../../apps/web/src/components/recruitment/recruitment-data.ts)
- [apps/web/src/i18n/recruitment-copy.ts](../../apps/web/src/i18n/recruitment-copy.ts)
- [apps/web/tests/recruitment-actions.test.ts](../../apps/web/tests/recruitment-actions.test.ts)

## What it does

- shows open requisitions
- shows candidate queue details
- filters candidates by stage
- searches across candidate and role fields
- opens a modal to create or edit requisitions
- deletes requisitions with confirmation

## Flow

1. The screen loads overview data from `getRecruitmentOverview()`.
2. Search and filter state are applied with `filterRecruitmentCandidates()`.
3. The requisition list is kept in local component state.
4. `RecruitmentCreateDialog` handles create/edit form input.
5. `addRecruitmentRequisition()`, `updateRecruitmentRequisition()`, and `removeRecruitmentRequisition()` mutate the local array immutably.

## Java equivalent

- this is similar to a Spring ATS controller and service pair
- the modal is like a command object / form backing bean
- the helper functions are like small service methods that keep business logic out of the view

## How to debug

- If create/edit does not work, check the dialog mode and `editingKey`.
- If a deleted item still appears, check the array returned by `removeRecruitmentRequisition()`.
- If filters look wrong, check the stage mapping in `recruitment-data.ts`.

## Implementation notes

- The screen is mock-driven for now.
- Later ATS or backend data can replace the local arrays without changing the card layout.

