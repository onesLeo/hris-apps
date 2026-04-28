# ADR 012: Identity Provider Choice

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

The HRIS platform requires authentication with MFA enforcement for admin and sensitive roles, LDAP/Active Directory integration for enterprise clients, and a portable installation model for client-hosted deployments. The identity provider must be self-hostable (clients who run the system on-premise cannot depend on a third-party SaaS identity service), support standard protocols (OIDC, OAuth 2.0, SAML 2.0), and be maintained as an open-source project with an active community.

---

## Decision

### Primary IdP: Keycloak

Keycloak is selected as the identity provider for all authentication and authorisation concerns.

**Rationale:**
- Open-source (Apache 2.0), self-hostable, and included in the Docker Compose stack.
- Native OIDC and OAuth 2.0 issuer — works with any OIDC-aware client library.
- LDAP/AD federation built in — HR clients with existing AD directories connect without custom code.
- SAML 2.0 support for clients who require SSO with existing enterprise systems.
- Fine-grained authorization policies via Keycloak Authorization Services.
- MFA enforcement configurable per realm, per role, and per client.
- JIT (just-in-time) user provisioning supported via identity brokering.

### Integration Architecture

```
Browser / Mobile
    ↓  Authorization Code + PKCE
Keycloak (auth server)
    ↓  access_token (JWT, RS256)
HRIS API (resource server)
    ↓  validates JWT signature, reads claims
    ↓  resolves tenant_id, user_id, roles from claims
AppModule (RBAC + ABAC engine)
```

The API never stores passwords. All authentication flows go through Keycloak. The API validates the JWT on every request using Keycloak's JWKS endpoint.

### JWT Claim Convention

The API reads the following claims from the Keycloak-issued JWT:

| Claim | Value |
|---|---|
| `sub` | Keycloak user UUID (mapped to `users.keycloak_id`) |
| `tenant_id` | Custom claim added via Keycloak mapper |
| `roles` | Realm-level roles (mapped to HRIS role names) |
| `email` | User email |
| `preferred_username` | Login username |

### LDAP/AD Sync

Keycloak's built-in LDAP user federation provider handles directory sync. The HRIS system reacts to Keycloak user creation events via the Keycloak event listener (webhook to `/api/v1/internal/idp/user-sync`). This triggers JIT account creation in the HRIS database.

### MFA Policy

MFA is enforced at the Keycloak realm level for the following roles:
- `hris_admin`
- `hr_manager`
- `payroll_manager`
- `security_officer`

TOTP (authenticator app) is the primary MFA method. Email OTP is available as a fallback.

### Offline / Air-Gapped Clients

For clients with no external network access:
- Keycloak runs as a container in the same Docker Compose stack as the API and web app.
- Keycloak uses an embedded H2 database in development; PostgreSQL in production.
- JWT validation uses the locally-hosted JWKS endpoint — no outbound network call.

---

## Consequences

- **Keycloak operational dependency:** The API cannot authenticate users if Keycloak is unavailable. In the client-hosted topology, this means Keycloak must be included in the backup and restore procedures.
- **Token expiry and refresh:** Short-lived access tokens (15 minutes) with refresh tokens (8 hours) are the default. The web frontend handles token refresh transparently using Keycloak's JS adapter or a standard OIDC client library.
- **No custom auth code in Phase 1:** The decision to use Keycloak means there is no password hashing, session storage, or OAuth flow code in the HRIS codebase. This reduces the attack surface significantly.
- **Future flexibility:** If a client requires a different IdP (Azure AD, Okta), the HRIS API's dependency on Keycloak is limited to JWT validation and the JIT sync webhook. Swapping the IdP requires reconfiguring the JWKS endpoint URL and claim mapping — not a code rewrite.
