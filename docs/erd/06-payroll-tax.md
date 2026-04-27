# ERD: Payroll / Tax

This domain covers the full payroll calculation pipeline and the tax reference tables it depends on. A **payroll_period** defines the calendar window (e.g. April 2026). One or more **payroll_runs** are executed against a period — typically one per location or employment type. Each run produces a **payroll_run_item** per employee, storing gross pay, deductions, employer contributions, net pay, and the full component breakdown in JSONB. A **payslip** document is generated from each run item.

Tax calculations draw on four reference tables that are all effective-dated so that annual regulatory changes (new PTKP thresholds, revised brackets, updated contribution rates) can be loaded ahead of time without affecting prior-period recalculations:
- **tax_jurisdictions** identifies the tax engine to invoke (e.g. Indonesia PPh 21, Philippines BIR).
- **tax_brackets** define progressive income tax rates.
- **ptkp_categories** define Indonesian non-taxable income thresholds by marital/dependent status.
- **contribution_bands** define statutory social-security contribution rates and wage ceilings (e.g. BPJS).

**payroll_components** (earnings, deductions, benefits) are configured at tenant level with formula rules, and assigned to employees, departments, or locations via **component_assignments**.

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

    users {
        uuid id PK
        string email
    }

    payroll_periods {
        uuid id PK
        uuid tenant_id FK
        string label
        date start_date
        date end_date
        date pay_date
        string status
    }

    payroll_runs {
        uuid id PK
        uuid period_id FK
        uuid tenant_id FK
        uuid location_id FK
        string status
        uuid initiated_by FK
        uuid approved_by FK
        timestamp started_at
        timestamp finalised_at
    }

    payroll_run_items {
        uuid id PK
        uuid run_id FK
        uuid employee_id FK
        string currency
        numeric gross_pay
        numeric total_deductions
        numeric employer_contributions
        numeric net_pay
        jsonb components
        jsonb tax_detail
        boolean locked
    }

    payslips {
        uuid id PK
        uuid run_item_id FK
        uuid employee_id FK
        uuid tenant_id FK
        string period_label
        string file_path
        timestamp generated_at
    }

    tax_jurisdictions {
        uuid id PK
        uuid tenant_id FK
        string country_code
        string code
        string name
        string engine_class
        boolean is_active
    }

    tax_brackets {
        uuid id PK
        uuid jurisdiction_id FK
        string bracket_type
        numeric income_from
        numeric income_to
        numeric rate
        date effective_from
        date effective_to
    }

    ptkp_categories {
        uuid id PK
        uuid jurisdiction_id FK
        string code
        string description
        numeric annual_amount
        date effective_from
        date effective_to
    }

    contribution_bands {
        uuid id PK
        uuid jurisdiction_id FK
        string code
        string name
        numeric employee_rate
        numeric employer_rate
        numeric wage_ceiling
        numeric wage_floor
        date effective_from
        date effective_to
    }

    payroll_components {
        uuid id PK
        uuid tenant_id FK
        string code
        string name
        string type
        string formula_type
        jsonb formula_config
        boolean taxable
        boolean statutory
        boolean is_active
    }

    component_assignments {
        uuid id PK
        uuid component_id FK
        string scope_level
        uuid scope_id
        jsonb value_override
        date effective_from
        date effective_to
    }

    tenants ||--o{ payroll_periods : "owns"
    tenants ||--o{ payroll_runs : "owns"
    tenants ||--o{ payroll_components : "defines"
    tenants ||--o{ tax_jurisdictions : "customises"
    tenants ||--o{ payslips : "owns"
    payroll_periods ||--o{ payroll_runs : "has"
    locations ||--o{ payroll_runs : "scopes"
    users ||--o{ payroll_runs : "initiated by"
    users ||--o{ payroll_runs : "approved by"
    payroll_runs ||--o{ payroll_run_items : "contains"
    employees ||--o{ payroll_run_items : "included in"
    payroll_run_items ||--|| payslips : "generates"
    employees ||--o{ payslips : "receives"
    tax_jurisdictions ||--o{ tax_brackets : "has"
    tax_jurisdictions ||--o{ ptkp_categories : "has"
    tax_jurisdictions ||--o{ contribution_bands : "has"
    payroll_components ||--o{ component_assignments : "assigned via"
```
