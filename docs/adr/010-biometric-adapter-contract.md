# ADR 010: Biometric Adapter Contract

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

Client factories use a variety of biometric and fingerprint attendance systems (ZKTeco, Suprema, VIRDI, and others). These devices push or expose clock events through different protocols: HTTP webhook push, database polling, file drop (CSV/XML), MQTT, and vendor SDK polling. The attendance module must not be coupled to any specific device vendor. A single new vendor integration must not require changes to the core attendance logic.

---

## Decision

### Adapter Interface

Every vendor integration implements a single adapter interface:

```typescript
// packages/types/src/biometric/adapter.interface.ts
export interface BiometricAdapter {
  readonly vendorId: string;

  /**
   * Start listening for clock events. The adapter calls onEvent for each
   * raw event it receives. The core module never calls vendor-specific code
   * directly — it only calls start(), stop(), and reads from the event stream.
   */
  start(onEvent: (event: RawClockEvent) => Promise<void>): Promise<void>;
  stop(): Promise<void>;
}

export interface RawClockEvent {
  deviceId: string;
  employeePin: string;   // device-local employee identifier
  timestamp: string;     // ISO 8601 UTC
  direction: 'in' | 'out' | 'unknown';
  rawPayload: unknown;   // preserved for audit and replay
}
```

### Ingestion Pipeline

```
Device → Adapter → RawClockEventQueue (BullMQ) → NormalisationWorker → ClockEventStore → AttendanceCalculator
```

1. **Adapter** receives the raw event and pushes it onto the `raw-clock-events` BullMQ queue.
2. **NormalisationWorker** dequeues the event, resolves `employeePin` → `employeeId` using the `device_enrollments` table, deduplicates by `(deviceId, employeePin, timestamp)`, and writes a normalised `clock_events` record.
3. **AttendanceCalculator** processes normalised events into attendance records (present, late, absent, overtime).

### Device Registration

Devices are registered in the `devices` table:

| Column | Description |
|---|---|
| `id` | UUID |
| `tenant_id` | Tenant scope |
| `location_id` | Location the device serves |
| `vendor_id` | Matches `BiometricAdapter.vendorId` |
| `device_serial` | Vendor-assigned serial number |
| `ingestion_protocol` | `webhook` \| `db_poll` \| `file_drop` \| `mqtt` \| `sdk_poll` |
| `config_json` | Connection parameters (encrypted at rest) |

### Employee Enrollment

The `device_enrollments` table maps device-local employee PINs to system employee IDs:

| Column | Description |
|---|---|
| `id` | UUID |
| `device_id` | FK to `devices` |
| `employee_id` | FK to `employees` |
| `employee_pin` | Device-local pin or biometric ID |
| `enrolled_at` | Enrollment timestamp |
| `revoked_at` | Revocation timestamp (null if active) |

### Offline Sync and Deduplication

Devices may be offline and batch-upload events hours or days later. The normalisation worker deduplicates by `(device_id, employee_pin, timestamp)` before writing to `clock_events`. Out-of-order events are accepted; attendance recalculation is triggered for any day where a new event arrives after the initial calculation.

### Supported Protocols (Phase 1)

| Protocol | Adapter Class | Notes |
|---|---|---|
| Webhook push | `WebhookAdapter` | Device pushes JSON to `/api/v1/biometric/ingest/:deviceId` |
| Database polling | `DbPollAdapter` | Worker queries vendor DB on a BullMQ schedule |
| File drop | `FileDropAdapter` | Worker monitors a shared folder for CSV/XML exports |
| MQTT | `MqttAdapter` | Worker subscribes to a broker topic |
| SDK polling | `SdkPollAdapter` | Vendor SDK wrapper, polls on a schedule |

---

## Consequences

- **Vendor isolation:** Changing a vendor device requires writing a new adapter. Core attendance logic is unchanged.
- **Raw payload preservation:** The `rawPayload` field is stored permanently for compliance audits and replay. Storage costs are accepted.
- **Deduplication boundary:** Deduplication is idempotent by `(device_id, employee_pin, timestamp)`. This is sufficient for all known vendors but may need a secondary key for vendors that reuse timestamps within the same second.
