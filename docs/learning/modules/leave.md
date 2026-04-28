# Leave Deep Dive

This module shows leave balances and a local apply-leave flow.
It is a good example of a list view with a modal form and immutable updates.

Key files:
- [apps/web/src/components/leave/leave-screen.tsx](../../../apps/web/src/components/leave/leave-screen.tsx)
- [apps/web/src/components/leave/leave-apply-dialog.tsx](../../../apps/web/src/components/leave/leave-apply-dialog.tsx)
- [apps/web/src/components/leave/leave-data.ts](../../../apps/web/src/components/leave/leave-data.ts)
- [apps/web/src/i18n/leave-copy.ts](../../../apps/web/src/i18n/leave-copy.ts)
- [apps/web/tests/leave-data.test.ts](../../../apps/web/tests/leave-data.test.ts)

## What the code is doing

The screen manages:

- leave balance cards
- tab-based filtering
- search filtering
- the apply-leave modal
- a local request queue

The data file manages:

- `filterLeaveRequests()`
- `addLeaveRequest()`
- `getLeaveRequestKey()`

## How the flow works

1. `LeaveScreen` loads `LEAVE_BALANCES` and `LEAVE_REQUESTS`.
2. It computes visible rows from tab and search state.
3. It counts pending, approved, and rejected requests for the badges.
4. Clicking `Apply Leave` opens `LeaveApplyDialog`.
5. Submitting the form builds a new pending leave request.
6. The new request is prepended to the list.

## Important functions

### `filterLeaveRequests()`

This function matches by:

- status
- employee name
- leave type
- reason

Java equivalent:

```java
return requests.stream()
    .filter(request -> matchesTab(request, tab))
    .filter(request -> matchesSearch(request, query))
    .toList();
```

### `addLeaveRequest()`

This function creates initials, sets the accent color from leave type, and assigns `Pending`.

Java equivalent:

```java
LeaveRequest next = new LeaveRequest(...);
return Stream.concat(Stream.of(next), requests.stream()).toList();
```

### `LeaveApplyDialog`

The dialog owns its own local form state and only calls the parent when submission is valid.
This keeps the screen component small.

## Java vs TypeScript details

- TypeScript object shapes are usually smaller than Java classes
- `readonly` arrays are used where we do not want mutation
- spread syntax `{ ...current }` is the common way to clone data
- React state replaces values, while Java often rebuilds a DTO or returns a new list

## SOLID in this module

- SRP: screen, modal, data, and copy are separate
- OCP: the module can grow without rewriting the shell
- ISP: the modal only receives leave-form fields
- DIP: the screen depends on `addLeaveRequest()` instead of inline business logic

## Debugging checklist

- button does not open modal: inspect `isApplyOpen`
- submitted request does not appear: inspect `addLeaveRequest()`
- counters wrong: inspect `statusCounts`
- search wrong: inspect `filterLeaveRequests()`
- locale text wrong: inspect `leave-copy.ts`

