# Event-Driven Modules: The Module Event Contract Pattern

This guide explains why this codebase uses an event bus for cross-module communication,
how to use it, and how it relates to your Spring ApplicationEventPublisher experience.

---

## Table of Contents

1. Why Events? The Employee Transfer Problem
2. Spring Equivalent: ApplicationEventPublisher + @EventListener
3. NestJS EventEmitter2 Setup
4. Emitting an Event
5. Listening with @OnEvent()
6. Event Payload Design (IDs Only, Not Full Objects)
7. Error Handling in Listeners
8. The EventEmitter vs BullMQ Boundary Rule
9. Microservices Migration Path
10. Testing Events

---

## 1. Why Events? The Employee Transfer Problem

When an employee is transferred to a new department and location, one action triggers side
effects across multiple modules:

| Module        | What it needs to do                                      |
|---------------|----------------------------------------------------------|
| Payroll       | Update the cost centre for the current payroll period    |
| Leave         | Re-evaluate leave entitlements (some policies are location-specific) |
| Attendance    | Update the location assignment for clock-in validation   |
| Notification  | Inform the employee, previous manager, and new manager   |

**Option A — direct service injection (do not use)**

The employee module imports `PayrollService`, `LeaveService`, `AttendanceService`, and
`NotificationService`. It calls each one after saving the transfer.

Problems:
- Each import creates a direct coupling between modules.
- Circular dependencies become likely as the system grows.
- Adding a new side effect (e.g. IT provisioning) requires editing the employee module.
- When payroll is extracted into a separate microservice, every import site must be rewritten.

**Option B — events (this codebase)**

The employee module emits `employee.transferred`. Any module that cares about transfers
subscribes to the event. The employee module has zero knowledge of who is listening.

Benefits:
- New side effects are added by writing a new listener — the emitter is unchanged.
- Module boundaries are enforced: no cross-module imports.
- When payroll becomes a separate service, its listener is replaced with a queue consumer.
  The employee module code does not change.

---

## 2. Spring Equivalent: ApplicationEventPublisher + @EventListener

If you have used Spring's application event system, the NestJS EventEmitter2 pattern is
almost identical.

**Spring Boot**
```java
// Event class
public class EmployeeTransferredEvent {
    private final String employeeId;
    private final String fromDepartmentId;
    private final String toDepartmentId;
    private final String effectiveDate;
    // constructor, getters...
}

// Emitter
@Service
public class EmployeeService {
    private final ApplicationEventPublisher eventPublisher;

    public void transfer(String employeeId, TransferDto dto) {
        // ... save the transfer ...
        eventPublisher.publishEvent(new EmployeeTransferredEvent(
            employeeId,
            previousDeptId,
            dto.getNewDepartmentId(),
            dto.getEffectiveDate()
        ));
    }
}

// Listener in another module
@Component
public class PayrollTransferListener {
    @EventListener
    public void handleTransfer(EmployeeTransferredEvent event) {
        payrollService.updateCostCentre(event.getEmployeeId(), event.getToDepartmentId());
    }
    
    // Async listener
    @EventListener
    @Async
    public void handleTransferAsync(EmployeeTransferredEvent event) { ... }
}
```

**NestJS EventEmitter2** works the same way, with three differences:
1. Events are identified by a string name (`'employee.transferred'`), not by Java class type.
2. Payloads are plain TypeScript interfaces, not Java classes.
3. All listeners are async-capable without any extra annotation.

---

## 3. NestJS EventEmitter2 Setup

**Installation**
```bash
pnpm add @nestjs/event-emitter eventemitter2
```

**Register in AppModule**
```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,     // enables employee.* pattern matching
      delimiter: '.',     // segments are separated by dots
      maxListeners: 20,   // warn if more than 20 listeners on one event
    }),
    EmployeeModule,
    PayrollModule,
    LeaveModule,
    AttendanceModule,
    NotificationModule,
  ],
})
export class AppModule {}
```

The `wildcard: true` option lets a listener subscribe to `employee.*` to receive all employee
events, or to `*.transferred` to receive transfer events from any aggregate.

---

## 4. Emitting an Event

Inject `EventEmitter2` into the service that performs the action and emit after the main
transaction commits.

```typescript
// apps/api/src/modules/employee/employee.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { db } from '@hris/db';
import { EmployeeTransferredEvent } from '@hris/types/events';

@Injectable()
export class EmployeeService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async transfer(employeeId: string, dto: TransferEmployeeDto): Promise<void> {
    let lifecycleEventId: string;

    // The database transaction must commit first.
    // EventEmitter2 is in-process — emit AFTER the transaction closes.
    await db.transaction(async (tx) => {
      const closed = await this.closeCurrentAssignment(tx, employeeId, dto.effectiveDate);
      await this.insertNewAssignment(tx, employeeId, closed, dto);
      const event = await this.insertLifecycleEvent(tx, employeeId, 'transfer', dto);
      lifecycleEventId = event.id;
    });

    // Transaction committed — now emit the event
    const payload: EmployeeTransferredEvent = {
      employeeId,
      fromDepartmentId: dto.fromDepartmentId,
      toDepartmentId:   dto.newDepartmentId,
      fromLocationId:   dto.fromLocationId,
      toLocationId:     dto.newLocationId,
      effectiveDate:    dto.effectiveDate,
      lifecycleEventId: lifecycleEventId!,
    };

    this.eventEmitter.emit('employee.transferred', payload);
    // Log the event for traceability (structured logging standard)
    console.debug({ event: 'employee.transferred', payload }, 'event emitted');
  }
}
```

**Important:** emit events after the transaction commits, not inside the transaction callback.
If you emit inside the transaction and the transaction later rolls back, listeners will have
acted on data that does not exist in the database.

---

## 5. Listening with @OnEvent()

Any `@Injectable()` class can listen to events. The listener class must be a provider in a
module that is loaded by `AppModule`.

```typescript
// apps/api/src/modules/payroll/listeners/employee-transfer.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmployeeTransferredEvent } from '@hris/types/events';
import { PayrollService } from '../payroll.service';

@Injectable()
export class EmployeeTransferListener {
  constructor(private readonly payrollService: PayrollService) {}

  @OnEvent('employee.transferred', { async: true })
  async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
    await this.payrollService.updateCostCentreAfterTransfer(
      payload.employeeId,
      payload.toDepartmentId,
      payload.effectiveDate,
    );
  }
}
```

```typescript
// apps/api/src/modules/leave/listeners/employee-transfer.listener.ts
@Injectable()
export class LeaveTransferListener {
  constructor(private readonly leaveService: LeaveService) {}

  @OnEvent('employee.transferred', { async: true })
  async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
    await this.leaveService.recalculateEntitlements(
      payload.employeeId,
      payload.toLocationId,
      payload.effectiveDate,
    );
  }
}
```

Register the listener as a provider in the module:
```typescript
// apps/api/src/modules/payroll/payroll.module.ts
@Module({
  providers: [
    PayrollService,
    PayrollRepository,
    EmployeeTransferListener,  // must be listed here to be instantiated
  ],
})
export class PayrollModule {}
```

**Wildcard subscriptions**

```typescript
// Listen to any event starting with 'employee.'
@OnEvent('employee.*', { async: true })
async handleAnyEmployeeEvent(payload: unknown): Promise<void> {
  // useful for audit logging of all employee actions
}
```

---

## 6. Event Payload Design (IDs Only, Not Full Objects)

This is the most important rule for event payloads.

**Wrong — embedding full objects**
```typescript
// Do NOT do this
export interface EmployeeTransferredEvent {
  employee: {         // the full employee record at emit time
    id: string;
    employeeNo: string;
    status: string;
    // ... 20 more fields
  };
  newAssignment: {    // the full new assignment
    departmentId: string;
    locationId: string;
    // ...
  };
}
```

Problems with full objects in payloads:
- The payload becomes large (hundreds of bytes instead of tens).
- If a listener runs 100ms after emit, the data may have changed — **stale data**.
- The listener's type safety depends on the emitter's internal data model. When the emitter
  changes its schema, all listeners break.
- When migrating to microservices, the payload must cross a network boundary — large payloads
  increase latency and serialisation cost.

**Correct — IDs and context only**
```typescript
// packages/types/src/events/employee.events.ts
export interface EmployeeTransferredEvent {
  employeeId:       string;
  fromDepartmentId: string;
  toDepartmentId:   string;
  fromLocationId:   string;
  toLocationId:     string;
  effectiveDate:    string;   // ISO date: YYYY-MM-DD
  lifecycleEventId: string;   // for tracing back to the HR action
}

export interface EmployeeHiredEvent {
  employeeId:      string;
  tenantId:        string;
  effectiveDate:   string;
  lifecycleEventId: string;
}

export interface PayrollRunFinalisedEvent {
  payrollRunId:   string;
  tenantId:       string;
  periodStart:    string;
  periodEnd:      string;
  employeeCount:  number;
}
```

Each listener fetches the data it needs using the IDs in the payload:
```typescript
@OnEvent('employee.transferred', { async: true })
async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
  // Listener is responsible for fetching what it needs
  const assignment = await this.payrollRepository.getCurrentAssignment(payload.employeeId);
  const department = await this.payrollRepository.getDepartment(payload.toDepartmentId);
  // ... use fresh data, not stale payload data
}
```

---

## 7. Error Handling in Listeners

A listener error must not crash the emitting request. The transfer was saved — the HTTP
response should return 200. Listener failures are logged and may be retried separately.

**Wrap each listener in try/catch:**
```typescript
@OnEvent('employee.transferred', { async: true })
async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
  try {
    await this.payrollService.updateCostCentreAfterTransfer(
      payload.employeeId,
      payload.toDepartmentId,
      payload.effectiveDate,
    );
  } catch (error) {
    // Log the failure — do not rethrow
    console.error(
      { event: 'employee.transferred', employeeId: payload.employeeId, error },
      'PayrollTransferListener failed',
    );
    // Optionally: enqueue a BullMQ retry job here for critical operations
  }
}
```

**Why not rethrow?**

EventEmitter2 collects errors from async listeners but does not propagate them back to the
emitter call site after the event is emitted. Rethrowing from a listener causes an unhandled
Promise rejection that may crash the Node.js process. Always catch.

**When the operation is critical (must not be lost):**

If the cost centre update is business-critical and must not be skipped even if the server
restarts between the transfer and the listener execution, push a BullMQ job from the listener
instead of doing the work inline:

```typescript
@OnEvent('employee.transferred', { async: true })
async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
  try {
    // Push to BullMQ — the queue provides at-least-once delivery
    await this.payrollQueue.add('update-cost-centre', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  } catch (error) {
    console.error({ event: 'employee.transferred', error }, 'Failed to enqueue cost centre update');
  }
}
```

---

## 8. The EventEmitter vs BullMQ Boundary Rule

Not everything belongs on the EventEmitter2 bus. Use this decision table (from ADR 003):

| Operation                                      | Use                 | Reason                                               |
|------------------------------------------------|---------------------|------------------------------------------------------|
| Update leave policy after transfer             | EventEmitter2       | Fast, synchronous in-process, no retry needed        |
| Update cost centre after transfer              | EventEmitter2       | Fast, acceptable eventual consistency                |
| Send notification after hire                   | EventEmitter2       | Notification module handles delivery internally      |
| Monthly payroll calculation                    | BullMQ              | Long-running, must survive server restarts           |
| Generate PDF payslip                           | BullMQ              | CPU-intensive, needs retry on failure                |
| Send email                                     | BullMQ              | External call, must retry on transient failures      |
| Attendance batch recalculation                 | BullMQ              | High volume, needs concurrency control               |
| Sync biometric device data                     | BullMQ              | External I/O, needs retry and job visibility         |

**The rule in plain English:**

- EventEmitter2 = fast in-process side effects where losing one event on a server crash is
  acceptable (Phase 1 trade-off).
- BullMQ = anything that is slow, external, CPU-heavy, or where at-least-once delivery is
  required.

Do not put payroll calculations in an EventEmitter listener just because they are triggered
by a `payroll.run.created` event. Emit the event, then in the listener, enqueue a BullMQ job
that does the actual calculation.

---

## 9. Microservices Migration Path

Because event payloads contain only IDs and context (not full objects), and because the event
names are strings (not Java class types), the migration from in-process events to a message
queue requires changing only the listener — not the emitter.

**Phase 1 — Modular monolith (current)**
```
EmployeeService.transfer()
  -> eventEmitter.emit('employee.transferred', payload)
     -> PayrollTransferListener.handleTransfer(payload)   [in-process, same JVM equivalent]
     -> LeaveTransferListener.handleTransfer(payload)
     -> AttendanceTransferListener.handleTransfer(payload)
```

**Phase 2 — Payroll extracted to its own service**

The employee module code is unchanged. The payroll listener is replaced with a message queue
consumer:

```typescript
// Before (Phase 1): in apps/api/src/modules/payroll/listeners/
@OnEvent('employee.transferred', { async: true })
async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
  await this.payrollService.updateCostCentreAfterTransfer(...);
}

// After (Phase 2): in apps/payroll-service/src/consumers/
// Replace @OnEvent with a RabbitMQ or Redis Streams consumer
// The payload type is identical — it comes from packages/types
@RabbitSubscribe({
  exchange: 'hris.events',
  routingKey: 'employee.transferred',
  queue: 'payroll.employee.transferred',
})
async handleTransfer(payload: EmployeeTransferredEvent): Promise<void> {
  await this.payrollService.updateCostCentreAfterTransfer(...);
}
```

The `packages/types` package is the shared contract. Both the monolith and the extracted
service depend on the same type definition. A breaking change to the payload type surfaces as
a TypeScript compile error in both services.

---

## 10. Testing Events

**Unit test: verify the event is emitted**

```typescript
// apps/api/src/modules/employee/employee.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmployeeService } from './employee.service';

describe('EmployeeService — transfer', () => {
  let service: EmployeeService;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        // ... other dependencies
      ],
    }).compile();

    service      = module.get(EmployeeService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('emits employee.transferred after a successful transfer', async () => {
    await service.transfer('EMP-1', {
      newDepartmentId: 'DEPT-FIN',
      newLocationId:   'LOC-JKT',
      effectiveDate:   '2026-05-01',
      initiatedById:   'USER-HR',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'employee.transferred',
      expect.objectContaining({
        employeeId:     'EMP-1',
        toDepartmentId: 'DEPT-FIN',
        effectiveDate:  '2026-05-01',
      }),
    );
  });
});
```

**Unit test: verify the listener does the right thing**

Test the listener in isolation by calling the handler method directly. You do not need to
go through EventEmitter2 to test listener logic:

```typescript
// apps/api/src/modules/payroll/listeners/employee-transfer.listener.spec.ts
import { EmployeeTransferListener } from './employee-transfer.listener';
import { PayrollService } from '../payroll.service';

describe('EmployeeTransferListener', () => {
  let listener: EmployeeTransferListener;
  let payrollService: jest.Mocked<PayrollService>;

  beforeEach(() => {
    payrollService = {
      updateCostCentreAfterTransfer: jest.fn().mockResolvedValue(undefined),
    } as any;
    listener = new EmployeeTransferListener(payrollService);
  });

  it('calls updateCostCentreAfterTransfer with correct arguments', async () => {
    await listener.handleTransfer({
      employeeId:       'EMP-1',
      fromDepartmentId: 'DEPT-HR',
      toDepartmentId:   'DEPT-FIN',
      fromLocationId:   'LOC-BDG',
      toLocationId:     'LOC-JKT',
      effectiveDate:    '2026-05-01',
      lifecycleEventId: 'LC-999',
    });

    expect(payrollService.updateCostCentreAfterTransfer).toHaveBeenCalledWith(
      'EMP-1',
      'DEPT-FIN',
      '2026-05-01',
    );
  });

  it('does not throw when payrollService fails', async () => {
    payrollService.updateCostCentreAfterTransfer.mockRejectedValue(
      new Error('DB connection timeout'),
    );

    // Must not throw — listener swallows the error
    await expect(
      listener.handleTransfer({
        employeeId:       'EMP-1',
        fromDepartmentId: 'DEPT-HR',
        toDepartmentId:   'DEPT-FIN',
        fromLocationId:   'LOC-BDG',
        toLocationId:     'LOC-JKT',
        effectiveDate:    '2026-05-01',
        lifecycleEventId: 'LC-999',
      }),
    ).resolves.not.toThrow();
  });
});
```

**Integration test: end-to-end event flow**

```typescript
// apps/api/src/modules/employee/employee-events.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { EmployeeModule } from '../employee/employee.module';
import { PayrollModule } from '../payroll/payroll.module';

describe('Employee transfer event integration', () => {
  let app: TestingModule;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
        EmployeeModule,
        PayrollModule,
      ],
    }).compile();
    await app.init();

    eventEmitter = app.get(EventEmitter2);
  });

  afterAll(() => app.close());

  it('PayrollTransferListener receives the event emitted by EmployeeService', async () => {
    const received: unknown[] = [];
    eventEmitter.on('employee.transferred', (payload) => received.push(payload));

    // Trigger the transfer through the service
    const employeeService = app.get(EmployeeService);
    await employeeService.transfer('EMP-1', { /* dto */ });

    // Allow async listeners to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ employeeId: 'EMP-1' });
  });
});
```

For integration tests that hit the database, use a test PostgreSQL instance (Docker Compose
spins one up in the `docker/docker-compose.yml`). Do not use an in-memory SQLite substitute —
this codebase uses PostgreSQL-specific features (RLS, `pgEnum`, date functions) that SQLite
does not support.
