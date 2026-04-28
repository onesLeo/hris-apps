# Approvals Deep Dive

This module manages the pending approval queue.
It is intentionally simple so you can see how local interaction state works in React.

Key files:
- [apps/web/src/components/approvals/approvals-screen.tsx](../../../apps/web/src/components/approvals/approvals-screen.tsx)
- [apps/web/src/components/approvals/approvals-data.ts](../../../apps/web/src/components/approvals/approvals-data.ts)
- [apps/web/src/i18n/approvals-copy.ts](../../../apps/web/src/i18n/approvals-copy.ts)

## What the code is doing

The module loads a shared queue of approvals and tracks:

- approved request indexes
- declined request indexes

When a card is approved or declined, the local state changes and the card rerenders.

## How the flow works

1. The screen reads locale copy.
2. It loads the shared approvals queue.
3. It calculates summary metrics.
4. Each approval card checks whether it is already approved or declined.
5. Clicking a button updates local state arrays.

## Java equivalent

- this is similar to a small workflow panel in a Spring MVC app
- the approval queue is like a read model
- the local state arrays are like a temporary UI state holder

## Important behavior

- approved items show an Approved badge
- declined items show a Rejected badge
- after decision, the action buttons disappear

## SOLID in this module

- SRP: screen, queue data, and locale copy are separate
- DIP: the screen consumes `APPROVALS` and copy helpers instead of hardcoded strings
- ISP: the screen only receives the approval copy it needs

## Debugging checklist

- buttons not working: inspect the `setApproved` and `setDeclined` handlers
- counters wrong: inspect the summary calculations
- labels wrong: inspect `approvals-copy.ts`

