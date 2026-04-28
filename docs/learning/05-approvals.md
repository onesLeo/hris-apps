# Approvals Module

The Approvals module is the workflow queue for HR actions. It lets the user approve or
decline requests locally and keeps the current decision state in the component.

Key files:
- [apps/web/src/components/approvals/approvals-screen.tsx](../../apps/web/src/components/approvals/approvals-screen.tsx)
- [apps/web/src/components/approvals/approvals-data.ts](../../apps/web/src/components/approvals/approvals-data.ts)
- [apps/web/src/i18n/approvals-copy.ts](../../apps/web/src/i18n/approvals-copy.ts)

## What it does

- shows approval summary cards
- lists pending approval items
- supports approve and decline actions
- updates the local approval state immediately
- keeps the dashboard counts aligned by sharing the same approvals data source

## Flow

1. The screen loads the approvals queue and locale copy.
2. Local arrays track approved and declined request indexes.
3. Clicking Approve or Decline moves the item into the matching local state.
4. The card rerenders and shows the status badge instead of the action buttons.

## Java equivalent

- this is similar to a Spring workflow approval page
- the local arrays are like a temporary in-memory state holder
- later the approve/decline actions can become service calls that transition a domain state

## How to debug

- If buttons do nothing, check the `onClick` handlers in `ApprovalsScreen`.
- If the badge is wrong, check the approval state arrays.
- If dashboard pending counts drift, check `approvals-data.ts` since both screens share it.

## Implementation notes

- The module is still mock-driven.
- Shared seed data is intentional so the dashboard and approvals page do not diverge.

