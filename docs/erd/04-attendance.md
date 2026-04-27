# ERD: Attendance

This domain covers the full attendance pipeline from hardware to processed record. **Devices** (biometric terminals, mobile apps, etc.) are registered per location. Employees are enrolled on specific devices via **device_enrollments**. When an employee clocks in or out the device emits a **clock_event** — a raw, immutable record with a checksum used for integrity verification. A background processing job resolves raw clock events against the employee's active **shift** to produce an **attendance_record** with computed fields such as `worked_minutes`, `late_minutes`, and `overtime_mins`. Both `clock_events` and `attendance_records` are range-partitioned by date for query performance.

```mermaid
erDiagram
    employees {
        uuid id PK
        string employee_no
        string status
    }

    tenants {
        uuid id PK
        string name
    }

    locations {
        uuid id PK
        string name
    }

    shifts {
        uuid id PK
        uuid tenant_id FK
        uuid location_id FK
        string name
        string start_time
        string end_time
        int break_minutes
        boolean overnight
    }

    shift_assignments {
        uuid id PK
        uuid employee_id FK
        uuid shift_id FK
        date effective_from
        date effective_to
    }

    devices {
        uuid id PK
        uuid tenant_id FK
        uuid location_id FK
        string device_code
        string name
        string model
        string protocol
        timestamp last_sync_at
        boolean is_active
    }

    device_enrollments {
        uuid id PK
        uuid device_id FK
        uuid employee_id FK
        timestamp enrolled_at
        boolean is_active
    }

    clock_events {
        uuid id PK
        uuid tenant_id FK
        string device_id
        uuid employee_id FK
        string event_type
        timestamp event_time
        string source
        jsonb raw_payload
        string checksum
        timestamp created_at
    }

    attendance_records {
        uuid id PK
        uuid employee_id FK
        uuid tenant_id FK
        date work_date
        uuid shift_id FK
        timestamp clock_in
        timestamp clock_out
        int worked_minutes
        int late_minutes
        boolean absent
        int overtime_mins
        string status
    }

    tenants ||--o{ shifts : "defines"
    tenants ||--o{ devices : "owns"
    tenants ||--o{ clock_events : "scopes"
    tenants ||--o{ attendance_records : "scopes"
    locations ||--o{ shifts : "scoped to"
    locations ||--o{ devices : "hosts"
    employees ||--o{ shift_assignments : "has"
    shifts ||--o{ shift_assignments : "assigned via"
    shifts ||--o{ attendance_records : "resolves to"
    devices ||--o{ device_enrollments : "has"
    employees ||--o{ device_enrollments : "enrolled on"
    employees ||--o{ clock_events : "generates"
    employees ||--o{ attendance_records : "has"
```
