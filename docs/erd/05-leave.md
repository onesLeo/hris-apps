# ERD: Leave

This domain manages employee leave entitlements, requests, and the holiday calendars that determine working days. **leave_types** define the rules for each type of absence (annual leave, sick leave, etc.), including whether it accrues and whether unused days carry over. **leave_balances** track per-employee, per-year entitlement and consumption. When an employee submits a **leave_request** it may be routed through a **workflow_instance** for approval.

Holiday calendars are sourced at the country/region level (**holiday_calendars** and **public_holidays**) and linked to specific locations via the **location_holiday_calendars** junction table. Tenants can also define one-off **company_holidays** (e.g. a company anniversary) that apply globally or to a specific location.

```mermaid
erDiagram
    employees {
        uuid id PK
        string employee_no
    }

    tenants {
        uuid id PK
        string name
    }

    locations {
        uuid id PK
        string name
    }

    workflow_instances {
        uuid id PK
        string status
    }

    users {
        uuid id PK
        string email
    }

    leave_types {
        uuid id PK
        uuid tenant_id FK
        string code
        string name
        boolean paid
        boolean accrual_based
        boolean carry_over
    }

    leave_balances {
        uuid id PK
        uuid employee_id FK
        uuid leave_type_id FK
        int year
        numeric entitled_days
        numeric taken_days
        numeric pending_days
        numeric carried_over
    }

    leave_requests {
        uuid id PK
        uuid employee_id FK
        uuid tenant_id FK
        uuid leave_type_id FK
        date from_date
        date to_date
        numeric days_requested
        string reason
        string status
        uuid approval_ref FK
        timestamp created_at
    }

    holiday_calendars {
        uuid id PK
        string country_code
        string region_code
        int year
        string name
        string source
        uuid tenant_id FK
    }

    public_holidays {
        uuid id PK
        uuid calendar_id FK
        date date
        string name
        string name_en
        boolean is_substitute
        date original_date
    }

    company_holidays {
        uuid id PK
        uuid tenant_id FK
        uuid location_id FK
        date date
        string name
        uuid created_by FK
    }

    location_holiday_calendars {
        uuid location_id FK
        uuid calendar_id FK
    }

    tenants ||--o{ leave_types : "defines"
    tenants ||--o{ leave_requests : "scopes"
    tenants ||--o{ holiday_calendars : "customises"
    tenants ||--o{ company_holidays : "defines"
    employees ||--o{ leave_balances : "has"
    employees ||--o{ leave_requests : "submits"
    leave_types ||--o{ leave_balances : "tracked by"
    leave_types ||--o{ leave_requests : "requested as"
    workflow_instances ||--o{ leave_requests : "approved via"
    holiday_calendars ||--o{ public_holidays : "contains"
    locations ||--o{ company_holidays : "applies to"
    users ||--o{ company_holidays : "created by"
    locations ||--o{ location_holiday_calendars : "linked"
    holiday_calendars ||--o{ location_holiday_calendars : "linked"
```
