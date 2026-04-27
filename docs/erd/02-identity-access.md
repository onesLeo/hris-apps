# ERD: Identity / Access

This domain manages who can log in and what they are permitted to do. **Users** are human principals scoped to a tenant. **Roles** may be system-wide (shared across tenants) or tenant-specific, and are assigned to users via **user_role_assignments**, which carry an optional scope (e.g. a specific location or department) and an expiry. Federated login is supported through **identity_providers** (SAML, OIDC, etc.), with each user's external account tracked in **external_identity_accounts**.

```mermaid
erDiagram
    tenants {
        uuid id PK
        string slug
        string name
    }

    users {
        uuid id PK
        uuid tenant_id FK
        string email
        string display_name
        string status
        boolean mfa_enabled
        timestamp last_login_at
        timestamp created_at
    }

    roles {
        uuid id PK
        uuid tenant_id FK
        string code
        string name
        boolean is_system
    }

    user_role_assignments {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        string scope_type
        uuid scope_id
        uuid granted_by FK
        timestamp granted_at
        timestamp expires_at
        string source
    }

    identity_providers {
        uuid id PK
        uuid tenant_id FK
        string name
        string protocol
        jsonb config
        boolean is_active
    }

    external_identity_accounts {
        uuid id PK
        uuid user_id FK
        uuid provider_id FK
        string external_sub
        string username
        timestamp last_synced_at
        string sync_status
    }

    tenants ||--o{ users : "has"
    tenants ||--o{ identity_providers : "configures"
    tenants ||--o{ roles : "owns"
    users ||--o{ user_role_assignments : "subject of"
    roles ||--o{ user_role_assignments : "assigned via"
    users ||--o{ user_role_assignments : "grants"
    users ||--o{ external_identity_accounts : "has"
    identity_providers ||--o{ external_identity_accounts : "authenticates"
```
