# ERD: Approvals / Workflow

This domain provides a generic multi-step approval engine used by leave requests and lifecycle events. A **workflow_template** defines the approval steps (as JSONB) for a given request type (e.g. `leave_request`, `termination`) and can be scoped to a tenant, location, or department. When a request is submitted, a **workflow_instance** is created from the matching template, capturing the requestor and the entity being approved. Each step in the workflow produces a **workflow_step_instance** record that tracks the assignee, their decision, any delegation, and timestamps.

The `approval_ref` column on `leave_requests` and `lifecycle_events` points back to the relevant `workflow_instances.id`, making it easy to query the full approval trail for any HR action.

```mermaid
erDiagram
    tenants {
        uuid id PK
        string name
    }

    users {
        uuid id PK
        string email
        string display_name
    }

    workflow_templates {
        uuid id PK
        uuid tenant_id FK
        string code
        string request_type
        string scope_type
        uuid scope_id
        jsonb steps
        boolean is_active
    }

    workflow_instances {
        uuid id PK
        uuid template_id FK
        uuid tenant_id FK
        string request_type
        string entity_type
        uuid entity_id
        uuid requestor_id FK
        string status
        timestamp started_at
        timestamp completed_at
    }

    workflow_step_instances {
        uuid id PK
        uuid instance_id FK
        int step_index
        string step_type
        uuid assignee_id FK
        string status
        string decision
        uuid delegated_to FK
        string comment
        timestamp decided_at
        timestamp due_at
    }

    tenants ||--o{ workflow_templates : "defines"
    tenants ||--o{ workflow_instances : "owns"
    workflow_templates ||--o{ workflow_instances : "instantiated as"
    users ||--o{ workflow_instances : "requests"
    workflow_instances ||--o{ workflow_step_instances : "has"
    users ||--o{ workflow_step_instances : "assigned to"
    users ||--o{ workflow_step_instances : "delegated to"
```
