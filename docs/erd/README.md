# HRIS Entity Relationship Diagrams

This directory contains domain-specific ERD diagrams for the HRIS system, written in Mermaid `erDiagram` syntax. Each file covers one logical domain so that each diagram remains readable without becoming overcrowded.

---

## Domains

| File | Domain | Description |
|------|--------|-------------|
| [01-org-structure.md](01-org-structure.md) | Core / Org Structure | Tenants, locations, and departments. The foundational hierarchy every other domain hangs off. |
| [02-identity-access.md](02-identity-access.md) | Identity / Access | Users, roles, role assignments, and SSO/identity provider integrations. |
| [03-employee-lifecycle.md](03-employee-lifecycle.md) | Employee / Lifecycle | Employees, employment spells, effective-dated assignments, compensation history, and tax profiles. |
| [04-attendance.md](04-attendance.md) | Attendance | Shift definitions, shift assignments, biometric/clock devices, raw clock events, and processed attendance records. |
| [05-leave.md](05-leave.md) | Leave | Leave types, per-employee balances, leave requests, public holiday calendars, and company holidays. |
| [06-payroll-tax.md](06-payroll-tax.md) | Payroll / Tax | Payroll periods, runs, line items, payslips, tax jurisdictions, brackets, PTKP categories, statutory contribution bands, and payroll components. |
| [07-approvals.md](07-approvals.md) | Approvals / Workflow | Generic workflow templates, running instances, and per-step decision records used by leave requests and lifecycle events. |
| [08-policy-audit.md](08-policy-audit.md) | Policy / Audit | Tenant- and scope-specific policy rules and the append-only audit event log. |

---

## Notes

- Anchor tables (e.g. `tenants`, `employees`, `users`) appear in multiple diagrams in a minimal form to provide context without duplicating detail.
- All IDs are UUIDs unless otherwise noted.
- Tables marked `[partitioned]` are range-partitioned by date in production.
- Effective-dated rows (`effective_from` / `effective_to`) are used throughout payroll, compensation, assignments, and tax tables to preserve full history without overwriting records.
