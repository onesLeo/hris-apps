# ADR 008: Policy Resolution Strategy

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

Many HR rules — attendance tolerances, overtime multipliers, leave entitlements, approval routing, and payroll components — vary between employees, departments, locations, and the company as a whole. A rigid single-value configuration forces HR admins to duplicate rules for every entity. A fully dynamic rules engine is too complex for initial delivery. A middle path is needed: a fixed hierarchy of overrides that is simple to reason about, easy to test, and auditable.

---

## Decision

### Five-Level Hierarchy

Rules resolve from most specific to least specific. The first level that has a configured value wins.

```
Level 1 — Employee override     (most specific)
Level 2 — Department rule
Level 3 — Location rule
Level 4 — Company default
Level 5 — System default        (least specific, always present)
```

This hierarchy applies uniformly across all configurable rules: attendance, overtime, leave, payroll components, and approval routing.

### Resolution Algorithm

```typescript
function resolvePolicy<T>(
  rule: PolicyKey,
  context: { employeeId: string; departmentId: string; locationId: string; tenantId: string },
): T {
  return (
    getEmployeeOverride(rule, context.employeeId) ??
    getDepartmentRule(rule, context.departmentId) ??
    getLocationRule(rule, context.locationId) ??
    getCompanyDefault(rule, context.tenantId) ??
    getSystemDefault(rule)
  );
}
```

### Resolution Path Logging

Every policy resolution must log the winning level and the evaluated context. This log is written at DEBUG level and is required for compliance audits and debugging disputed payroll or leave calculations.

```json
{
  "event": "policy.resolved",
  "rule": "overtime.multiplier",
  "winning_level": "location",
  "winning_entity_id": "loc-sby",
  "evaluated_context": {
    "employee_id": "emp-001",
    "department_id": "dept-ops",
    "location_id": "loc-sby",
    "tenant_id": "tenant-abc"
  },
  "resolved_value": 1.5
}
```

### Database Schema

Policies are stored in a single `policy_rules` table:

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Tenant scope |
| `rule_key` | VARCHAR | e.g. `overtime.multiplier` |
| `level` | ENUM | `employee`, `department`, `location`, `company`, `system` |
| `entity_id` | UUID | ID of the employee, department, or location (null for company/system) |
| `value_json` | JSONB | Serialised rule value |
| `effective_from` | DATE | Start of applicability |
| `effective_to` | DATE | End of applicability (null = currently active) |

### Rule Keys

Rule keys follow the pattern `<module>.<rule_name>` in lowercase snake_case:

```
attendance.late_tolerance_minutes
attendance.overtime_threshold_minutes
overtime.multiplier_weekday
overtime.multiplier_weekend
overtime.multiplier_holiday
leave.annual_entitlement_days
leave.carry_over_limit_days
approval.leave_approver_role
approval.overtime_approver_role
payroll.meal_allowance_amount
```

---

## Consequences

- **Predictability:** Every rule calculation can be traced to a single winning level. There are no hidden aggregations.
- **Auditability:** Resolution path logging makes it possible to reproduce any historical calculation using the same inputs.
- **Performance:** The resolution chain makes at most five database reads. In practice these will be cached per request context.
- **Flexibility boundary:** The hierarchy has exactly five levels. Requests to add sub-department or team-level overrides require an ADR revision.
- **System defaults are immutable:** System-level defaults are seeded at install time and cannot be deleted through the UI. They act as a safety net to ensure every rule always resolves to a value.
