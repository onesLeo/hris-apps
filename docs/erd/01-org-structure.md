# ERD: Core / Org Structure

This domain defines the foundational organisational hierarchy. A **tenant** represents a single company using the platform (multi-tenant SaaS). Each tenant has one or more **locations** (physical sites, offices, or work areas), and each location (or tenant directly) may have a tree of **departments**. Almost every other table in the system carries a `tenant_id` foreign key that roots it to this hierarchy, and many carry an optional `location_id` or `department_id` as well.

```mermaid
erDiagram
    tenants {
        uuid id PK
        string slug
        string name
        string country_code
        string timezone
        string status
        timestamp created_at
    }

    locations {
        uuid id PK
        uuid tenant_id FK
        string name
        string code
        string country_code
        string state
        string timezone
        string clock_method
        jsonb address
        boolean is_active
    }

    departments {
        uuid id PK
        uuid tenant_id FK
        uuid location_id FK
        uuid parent_id FK
        string name
        string code
        boolean is_active
    }

    tenants ||--o{ locations : "has"
    tenants ||--o{ departments : "has"
    locations ||--o{ departments : "belongs to"
    departments ||--o{ departments : "parent of"
```
