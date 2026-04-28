# Leave Module

The Leave module shows leave balances, leave request lists, and a local apply-leave flow.
It is the first example in the app of a module-owned queue with a dedicated modal.

Key files:
- [apps/web/src/components/leave/leave-screen.tsx](../../apps/web/src/components/leave/leave-screen.tsx)
- [apps/web/src/components/leave/leave-apply-dialog.tsx](../../apps/web/src/components/leave/leave-apply-dialog.tsx)
- [apps/web/src/components/leave/leave-data.ts](../../apps/web/src/components/leave/leave-data.ts)
- [apps/web/src/i18n/leave-copy.ts](../../apps/web/src/i18n/leave-copy.ts)
- [apps/web/tests/leave-data.test.ts](../../apps/web/tests/leave-data.test.ts)

## What it does

- displays leave balance cards
- filters leave requests by status
- searches leave requests by employee, leave type, or reason
- opens an `Apply Leave` modal
- adds new requests to the top of the list
- counts pending/approved/rejected requests in the tabs

## Flow

1. The screen loads `LEAVE_REQUESTS` and `LEAVE_BALANCES` from its data module.
2. Search and tab state decide which requests are visible.
3. `LeaveApplyDialog` collects employee name, leave type, dates, days, and reason.
4. `addLeaveRequest()` creates a new pending request and prepends it.
5. The table rerenders from the updated local array.

## Java equivalent

- the screen is similar to a Spring MVC leave request page
- `leave-data.ts` is similar to a service or domain helper class
- `LeaveApplyDialog` is similar to a form object plus modal UI
- the test file is similar to a unit test for leave request creation and filtering

## How to debug

- If `Apply Leave` does not open, check `isApplyOpen` in `LeaveScreen`.
- If the modal submits but nothing appears, check `addLeaveRequest()`.
- If the pending count looks wrong, check `statusCounts`.
- If the search does not work, check `filterLeaveRequests()`.
- If a locale label is wrong, check `leave-copy.ts`.

## Implementation notes

- The leave flow is still mock-driven.
- The module is now self-contained and no longer depends on shell-owned mock rows.
- Later backend integration can replace the local request array without changing the modal layout.

