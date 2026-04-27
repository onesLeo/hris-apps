# ADR 003: Module Event Communication Contract

**Status:** Accepted
**Date:** 2026-04-27

---

## Context

When a business action in one module triggers side effects in other modules, those modules must communicate without tight coupling. The canonical example is an employee transfer: the employee module records the transfer, but payroll needs to update the cost centre, leave needs to re-evaluate entitlements, attendance needs to update the location assignment, and notification needs to inform the employee and managers.

Tight coupling means Module A imports Module B's service directly. This violates module boundaries (see ADR 002) and makes future microservices extraction impossible without a rewrite of every import site.

---

## Decision

### Event Bus: NestJS EventEmitter2 for Module-to-Module Communication

For side effects between modules, use an in-process event bus powered by NestJS EventEmitter2. The emitting module emits a typed event. Any number of listener modules can subscribe to it with `@OnEvent()`. Neither the emitter nor the listeners know about each other.

### BullMQ for Heavy Background Operations

BullMQ (Redis-backed job queue) is used exclusively for operations that are too slow, too resource-intensive, or too failure-prone to run in the request-response cycle:

- Payroll batch calculation
- Report generation
- Attendance batch processing
- Email and SMS delivery
- Biometric device sync jobs

BullMQ provides retries, job visibility, dead-letter queues, and concurrency control that EventEmitter2 does not provide.

### Decision Matrix

| Use Case | Mechanism | Reason |
|---|---|---|
| Update leave policy after transfer | EventEmitter | Fast, no retry needed |
| Queue a notification after hire | EventEmitter | Fast, notification module handles delivery |
| Monthly payroll calculation | BullMQ | Long-running, must survive restarts |
| Generate PDF report | BullMQ | CPU-intensive, needs retry |
| Send email | BullMQ | External call, must retry on failure |
| Attendance batch recalculation | BullMQ | High volume, needs concurrency control |

### Event Naming Convention

Events are named `<aggregate>.<action>` in lowercase snake_case.

Examples:

```
employee.hired
employee.transferred
employee.promoted
employee.resigned
employee.terminated
leave.request.submitted
leave.request.approved
leave.request.rejected
payroll.run.finalised
attendance.record.corrected
approval.step.completed
```

### Event Payload Rule

Payloads always include entity IDs and the effective date. Full objects are never embedded in the payload. Listeners are responsible for fetching the data they need. This keeps payloads small, avoids stale data problems, and prevents listeners from becoming tightly coupled to the emitter's internal data model.

Example:

```typescript
// packages/types/src/events/employee.events.ts
export interface EmployeeTransferredEvent {
  employeeId: string;
  fromLocationId: string;
  toLocationId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  effectiveDate: string; // ISO date string: YYYY-MM-DD
  lifecycleEventId: string;
}
```

### Migration Path to Microservices

When a module is extracted into its own service, the only change required is in the listener:

- The emitting module continues to call `events.emit('employee.transferred', payload)` unchanged
- The listener's `@OnEvent()` decorator is replaced with a queue subscriber that reads from a Redis or RabbitMQ topic
- The event payload contract (defined in `packages/types`) remains the same

No emitter code changes. No data model changes.

---

## Consequences

**Eventual consistency:** Listeners run after the main transaction commits. This is acceptable for payroll policy updates, leave entitlement recalculation, and notifications. It is NOT acceptable for balance checks or approval gate checks, which must be synchronous queries at request time.

**Event payload versioning:** Once an event is in production, its payload shape is a contract. New fields may be added. Existing fields must not be removed or renamed without a coordinated migration. All event type definitions are versioned in `packages/types/src/events/`.

**Event logging:** All emitted events must be logged at DEBUG level including the event name and payload. This is required for diagnosing event delivery issues and auditing business actions. The structured log format from the logging standards document applies.

**No guaranteed delivery in Phase 1:** EventEmitter2 is in-process. If the server crashes between the main transaction commit and the listener execution, the event is lost. This is an accepted trade-off for Phase 1. BullMQ is used for any operation where at-least-once delivery is required.

---

## Alternatives Considered

**Direct service injection (Module A imports Module B's service)**

Simplest to implement but creates circular dependency risks and hard coupling. Module extraction becomes a rewrite. Ruled out by the module boundary rule in ADR 002.

**Redis pub/sub from day one**

Would provide a natural migration path to microservices without any change at extraction time. However, it adds operational complexity (Redis must always be available for non-background operations) and makes local development harder. Can be adopted in Phase 2 when the first module is extracted.

**RabbitMQ from day one**

Same trade-off as Redis pub/sub, with more configuration overhead. Better suited for Phase 3-4 when multiple services need guaranteed delivery and topic routing.
