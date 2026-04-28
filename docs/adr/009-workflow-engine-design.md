# ADR 009: Workflow Engine Design

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

HR processes such as leave requests, employee transfers, promotions, and expense claims require multi-step approval flows. The approval chain varies by location, department, and request type. Some steps may be conditionally skipped (for example, payroll review is skipped for requests below a salary impact threshold). Escalation is needed when an approver does not act within a defined SLA. A workflow engine must be configurable by HR admins through the UI without code changes.

---

## Decision

### Model

Workflows are modelled as two tables: a template and an instance.

**Workflow Template** defines the reusable structure:
- `id`, `tenant_id`, `name`, `trigger_event` (e.g. `leave.request.submitted`)
- `steps`: ordered list of step definitions

**Workflow Step Definition** (embedded in template):
- `step_order`: integer, determines sequence
- `name`: human-readable label
- `assignee_rule`: how to resolve the approver — `direct_manager`, `hr_manager`, `payroll_manager`, `plant_manager`, `specific_role`, `specific_user`
- `condition`: optional JSONLogic expression; if false the step is skipped
- `sla_hours`: hours before escalation triggers
- `escalate_to`: assignee rule for the escalation target

**Workflow Instance** is created when a trigger event fires:
- `id`, `tenant_id`, `template_id`, `trigger_entity_type`, `trigger_entity_id`
- `status`: `pending` | `approved` | `rejected` | `cancelled`
- `current_step_order`
- `context_json`: snapshot of the data used for condition evaluation

**Workflow Step Instance** tracks each approval action:
- `id`, `workflow_instance_id`, `step_order`
- `assignee_id`: resolved at runtime
- `status`: `pending` | `approved` | `rejected` | `skipped` | `escalated`
- `decided_at`, `comment`

### Step Execution Flow

```
trigger event received
  → create WorkflowInstance
  → resolve step 1 assignee
  → create StepInstance(step=1, status=pending)
  → notify assignee

assignee approves step N
  → StepInstance(N).status = approved
  → emit approval.step.completed event
  → if more steps: advance to step N+1 (skip if condition false)
  → if last step approved: WorkflowInstance.status = approved
                           → emit <module>.approved event

assignee rejects any step
  → StepInstance.status = rejected
  → WorkflowInstance.status = rejected
  → emit <module>.rejected event
```

### Duplicate Approver Rule

If the resolved approver for step N+1 is the same person who approved step N, step N+1 is automatically approved. This prevents a manager from approving their own request twice. The skip is logged in the step instance with `status = skipped` and `comment = "duplicate_approver"`.

### Delegation

An approver may delegate their approval authority to another user for a date range. Delegation records are stored in the `approval_delegations` table. The assignee resolver checks for an active delegation before returning the direct approver.

### Escalation

A BullMQ job is scheduled when a step instance is created with `sla_hours` configured. If the job fires and the step is still `pending`, the step status is set to `escalated` and a new step instance is created for the escalation target.

---

## Consequences

- **Configurability:** HR admins can create and modify workflow templates through the UI without developer involvement.
- **Auditability:** Every decision — including skips, delegations, and escalations — is recorded as a step instance row.
- **Complexity ceiling:** The engine handles linear and conditional flows. Parallel approval (two approvers who must both agree) and split paths are out of scope for Phase 1.
- **Event dependency:** The engine is wired to EventEmitter2 (ADR 003). The trigger event fires the instance creation; step completion events notify downstream modules.
