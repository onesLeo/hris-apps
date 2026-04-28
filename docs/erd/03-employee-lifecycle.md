# ERD: Employee / Lifecycle

This domain models the full lifecycle of an employee from hire to separation. An **employee** record links to an optional **user** (system access) and is partitioned into one or more **employment_spells** — contiguous periods of active employment (e.g. original hire, rehire). All position, compensation, and tax data hang off a spell, making it straightforward to model rehires without losing history.

**employee_assignments** and **employee_compensation** are effective-dated: each row carries `effective_from`/`effective_to`, so the full history of role changes, department moves, and pay adjustments is preserved as immutable rows rather than overwrites. **lifecycle_events** capture discrete HR actions (hire, transfer, promotion, termination) and may reference a **workflow_instance** when approval is required.

```mermaid
erDiagram
    tenants {
        uuid id PK
        string name
    }

    users {
        uuid id PK
        string email
    }

    locations {
        uuid id PK
        string name
    }

    departments {
        uuid id PK
        string name
    }

    workflow_instances {
        uuid id PK
        string status
    }

    tax_jurisdictions {
        uuid id PK
        string code
        string name
    }

    employees {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string employee_no
        string status
        timestamp created_at
    }

    employment_spells {
        uuid id PK
        uuid employee_id FK
        uuid tenant_id FK
        date start_date
        date end_date
        string end_reason
        boolean is_current
    }

    employee_assignments {
        uuid id PK
        uuid employee_id FK
        uuid spell_id FK
        uuid location_id FK
        uuid department_id FK
        string job_title
        string job_grade
        uuid manager_id FK
        string cost_centre
        date effective_from
        date effective_to
    }

    employee_compensation {
        uuid id PK
        uuid employee_id FK
        uuid spell_id FK
        string currency
        numeric base_salary
        string pay_frequency
        date effective_from
        date effective_to
    }

    lifecycle_events {
        uuid id PK
        uuid employee_id FK
        uuid tenant_id FK
        string event_type
        date effective_date
        uuid initiated_by FK
        jsonb payload
        uuid approval_ref FK
        timestamp created_at
    }

    employee_tax_profiles {
        uuid id PK
        uuid employee_id FK
        uuid jurisdiction_id FK
        string ptkp_category
        string npwp
        date effective_from
        date effective_to
    }

    tenants ||--o{ employees : "employs"
    tenants ||--o{ employment_spells : "scopes"
    tenants ||--o{ lifecycle_events : "owns"
    users ||--o{ employees : "linked to"
    employees ||--o{ employment_spells : "has"
    employees ||--o{ employee_assignments : "has"
    employees ||--o{ employee_compensation : "has"
    employees ||--o{ lifecycle_events : "subject of"
    employees ||--o{ employee_tax_profiles : "has"
    employment_spells ||--o{ employee_assignments : "scopes"
    employment_spells ||--o{ employee_compensation : "scopes"
    locations ||--o{ employee_assignments : "placed at"
    departments ||--o{ employee_assignments : "belongs to"
    employees ||--o{ employee_assignments : "manager of"
    users ||--o{ lifecycle_events : "initiated by"
    workflow_instances ||--o{ lifecycle_events : "approved via"
    tax_jurisdictions ||--o{ employee_tax_profiles : "governs"
```
