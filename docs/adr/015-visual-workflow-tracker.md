# ADR 015: Visual Workflow Tracker Implementation

## Status
Accepted

## Context
Following the design of the workflow engine in [ADR 009: Workflow Engine Design](./009-workflow-engine-design.md), users need visibility into the status of ongoing transactions (e.g., employee transfers, leave requests, expense claims). Without a visual representation, users and admins cannot easily identify where a request is stuck, who is assigned to the current step, or why a step was skipped. 

We require a system that acts similarly to BPMS platforms (like Intalio), allowing users to track the lifecycle of any workflow-driven entity visually on the screen.

## Decision

We will implement a Visual Workflow Tracker that maps the backend `Workflow Instance` data to a chronological UI component. Because the Phase 1 workflow engine is strictly linear with conditional skips (no parallel approvals), we will use a **Vertical Timeline/Stepper Component** rather than a complex node-based diagram.

### 1. Data Aggregation Strategy (Backend)

The backend will expose a unified endpoint to assemble the workflow timeline. 
Endpoint: `GET /api/workflow-instances/{id}/timeline`

The server will perform the following:
1. Fetch the `WorkflowInstance` and its `current_step_order`.
2. Fetch the associated `WorkflowTemplate` to get the total number of defined steps.
3. Fetch all `WorkflowStepInstance` records associated with the workflow instance ID.
4. Merge the template steps with the executed step instances into a single chronological array.

**Data Transfer Object (DTO) Output Format:**
```json
{
  "workflowInstanceId": "uuid",
  "status": "pending",
  "currentStepOrder": 3,
  "timeline": [
    {
      "stepOrder": 1,
      "name": "Direct Manager Approval",
      "status": "approved",
      "assignee": { "id": "uuid", "name": "Sarah Smith" },
      "decidedAt": "2026-10-10T11:30:00Z",
      "comment": "Looks good."
    },
    {
      "stepOrder": 2,
      "name": "Payroll Review",
      "status": "skipped",
      "assignee": null,
      "decidedAt": "2026-10-10T11:30:01Z",
      "comment": "Condition not met: No salary change."
    },
    {
      "stepOrder": 3,
      "name": "Plant Manager Approval",
      "status": "pending",
      "assignee": { "id": "uuid", "name": "David Lee" },
      "decidedAt": null,
      "comment": null,
      "slaBreached": false
    },
    {
      "stepOrder": 4,
      "name": "HR Finalization",
      "status": "upcoming",
      "assignee": null,
      "decidedAt": null,
      "comment": null
    }
  ]
}
```

### 2. UI Component Design (Frontend)

The frontend will consume the timeline DTO and render a visual timeline using a standard UI library (e.g., Tailwind, MUI, or Ant Design Stepper). 

**Visual Coding Rules:**
- 🟢 **Approved:** Status `approved`. Display the green checkmark, the actual assignee name, timestamp, and optional comment.
- ⚪ **Skipped:** Status `skipped`. Display as greyed-out or faded. Show the skip reason in the comment (e.g., "Duplicate approver" or "Condition false").
- 🔵 **Pending (Active):** Status `pending` matching the `currentStepOrder`. Display as highlighted/pulsating. **Crucially, clearly display the assignee name so the user knows who is holding up the workflow.**
- 🟠 **Escalated:** Status `escalated`. Highlight in orange indicating SLA breach, showing the new escalated assignee.
- 🔴 **Rejected:** Status `rejected`. Display a red cross and the rejection comment.
- 🔒 **Upcoming:** Steps greater than `currentStepOrder`. Displayed as inactive/grey.

### 3. Component Reusability

To ensure consistency across the HRIS, the UI component will be built as a standalone reusable widget: `<WorkflowTimeline instanceId={instanceId} />`.
This widget will be embedded in:
- Leave Request Details Modal
- Expense Claim Details Page
- Employee Lifecycle Change Page (Transfers, Promotions, Terminations)

## Consequences

### Positive
- **Transparency:** Dramatically reduces support tickets querying "Where is my approval at?" by showing exactly whose desk the request is sitting on.
- **Simplicity:** By avoiding complex canvas/node-based libraries (like React Flow) for Phase 1, development velocity remains high. A vertical stepper perfectly maps to linear/conditional arrays.
- **Auditability:** Surfacing skipped and escalated steps builds trust in the automated workflow engine.

### Negative / Limitations
- **Future Complexity:** If Phase 2 introduces parallel approvals (e.g., waiting for both IT and Facilities to approve a transfer simultaneously), a linear stepper UI will become insufficient, requiring a migration to a DAG (Directed Acyclic Graph) visualizer. 

## References
- [ADR 009: Workflow Engine Design](./009-workflow-engine-design.md)
