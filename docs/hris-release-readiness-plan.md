# HRIS Release Readiness Plan

This document turns the current implementation status into a practical release gate.
It is organized by what must be finished before an internal pilot, what must be
finished before public launch, and what can safely wait until after launch.

## Release Goals

- Deliver a real, auditable HRIS flow end to end.
- Avoid silent mock behavior in production.
- Prove that hiring, onboarding, attendance, leave, approvals, and payroll work
  against real infrastructure.
- Ship one jurisdiction correctly before expanding to more countries.

## Assumptions

- The first production rollout is a controlled pilot, not a broad public launch.
- One tenant, one country, and one attendance ingestion path are enough for pilot.
- Recruitment, onboarding, attendance, leave, approvals, and payroll are the
  minimum operational core.
- Anything marked as a fallback or simulation in the codebase is not acceptable
  for production behavior.

## 1. Must-Fix Before Pilot

These items block real users from trusting the system.

### Identity and Access

- Keep `DEV_AUTH_BYPASS` effective only when `NODE_ENV=development`.
- Enforce MFA for admin, HR, payroll, and security roles.
- Implement role-based scoping on the People screen.
- Block employees from HR-only screens.
- Restrict managers to direct reports where applicable.

### Hiring and Onboarding

- Replace simulated offer approval with real workflow instance creation.
- Ensure requisition approval and offer approval both use the workflow engine.
- Finish ATS producer wiring for `recruitment.offer.accepted` end to end.
- Remove recruitment UI fallback behavior in production.
- Confirm onboarding still works when the event payload contains either
  `employeeId` or `employeeShell`.
- Verify activation hooks succeed or fail loudly with visible audit events.

### Attendance and Leave

- Keep at least one device or middleware adapter working end to end.
- Validate clock-in and clock-out ingestion against real data.
- Confirm absence detection, holidays, and leave balances behave correctly.
- Verify leave approvals use the same workflow behavior as other approval flows.

### Payroll

- Complete one jurisdiction end to end.
- Finish statutory calculations, payroll components, and payslip generation.
- Prove payroll finalization locks data and preserves audit history.
- Add test coverage for the exact fixtures used in the pilot jurisdiction.

### Testing and Verification

- Add E2E flows for onboarding, attendance, leave, approvals, and payroll.
- Run integration tests against real PostgreSQL and Redis.
- Add regression tests for the remaining fallback and simulation paths.
- Verify audit logging for every mutating operation in the pilot scope.
- For a manual local walkthrough, follow [docs/local-pilot-test-guide.md](docs/local-pilot-test-guide.md).

### Operational Safety

- Prove backup and restore works in a clean environment.
- Verify migration and rollback procedure.
- Add health checks and smoke checks for the full stack.
- Add alerting or at least actionable logs for failed domain events and jobs.

## 2. Must-Fix Before Public Launch

These items are not necessarily pilot blockers, but they are needed before
general rollout or customer expansion.

### Access and Security

- Finish directory sync and external identity linkage.
- Add rate limiting and API key management for external consumers.
- Add stronger session handling if browser session mode is introduced later.
- Add privacy workflows for export, erasure, and anonymization.

### Workflow and Reporting

- Complete delegation and escalation handling.
- Finish conditional routing and duplicate approver handling.
- Embed workflow timelines in leave and lifecycle change screens.
- Add audit search and audit export.
- Add standard reports and dashboards.

### Payroll and Compliance

- Build the payroll component catalog.
- Add admin UI for payroll policy configuration.
- Add annual tax table update management.
- Add report generation for government or compliance submissions if required by
  the target market.

### Deployment Readiness

- Build the production image and release artifact process.
- Document install-time bootstrap for secrets, database, cache, and storage.
- Verify upgrade and rollback on a staged environment.
- Confirm support for the intended deployment topology.
- Add license handling only if the delivery model requires it.

## 3. Nice-To-Have After Launch

These are valuable, but they should not delay launch.

- Performance management.
- Learning and development.
- AI features.
- Additional payroll jurisdictions.
- WhatsApp or other low-cost integrations.
- White labeling and theme customization.
- Org chart improvements.
- Smart roster generation.
- Advanced analytics and predictive features.

## Pilot Exit Criteria

The product is ready for pilot when all of the following are true:

- Hiring can move from requisition to employee activation without simulation.
- Attendance can ingest real events from at least one supported source.
- Leave requests can be approved and reflected in balances.
- Payroll can run correctly for the chosen jurisdiction.
- Access control is enforced in production, not only in the UI.
- Audit trails and failure handling are working.
- Backup, restore, and migration rollback have been verified.
- End-to-end tests pass on the real stack.

## Suggested Sequencing

1. Finish access control and remove production fallbacks.
2. Make hiring and onboarding fully real.
3. Lock down attendance, leave, and one payroll jurisdiction.
4. Add E2E and integration verification.
5. Harden deployment and recovery.
6. Expand scope only after the pilot is stable.

## Notes

- If a feature still depends on mock data, simulated approval, or temporary
  bypass logic, it should be treated as non-production ready.
- If the product is being sold to a customer, the minimum bar should be higher
  than a successful demo.
