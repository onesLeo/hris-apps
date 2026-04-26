# HRIS Implementation Checklist

Use this checklist as the execution order for `docs/hris-system-plan.md`. Complete each item in sequence unless a dependency is explicitly marked as parallel.

## Phase 0: Project Setup
- [ ] Confirm the first release scope and jurisdictions.
- [ ] Confirm tenant model, initial roles, and required biometric vendors.
- [ ] Create repo structure for app, API, workers, shared libs, docs, and tests.
- [ ] Set up local development environment and environment variables.
- [ ] Create base CI pipeline for lint, typecheck, unit tests, and build.
- [ ] Add ADR folder and documentation convention.

## Phase 1: Foundation
- [ ] Implement authentication provider integration.
- [ ] Implement LDAP / Active Directory directory sync and group-to-role mapping.
- [ ] Add directory mapping tables and external identity linkage.
- [ ] Define directory data model and sync event taxonomy.
- [ ] Implement just-in-time account provisioning and scheduled sync jobs.
- [ ] Add local permission override and audit tracking for directory-driven access.
- [ ] Add directory provisioning workflow and role/group mapping examples.
- [ ] Implement tenant model and tenant-aware request context.
- [ ] Add row-level security strategy and tenant scoping enforcement.
- [ ] Create user, role, permission, and menu access models.
- [ ] Add People menu structure for onboarding, lifecycle, and self-service employment actions.
- [ ] Create organization models for location, department, team, and manager relationships.
- [ ] Add audit log foundation for all mutating actions.

## Phase 2: Employee Core
- [ ] Build employee profile model and employment spell model.
- [ ] Add effective-dated history for assignments, position, and compensation.
- [ ] Implement employee lifecycle event log.
- [ ] Define lifecycle event taxonomy for hire, transfer, promotion, resignation, termination, rehire, and secondment.
- [ ] Implement hire, transfer, promotion, resignation, termination, rehire, and secondment records.
- [ ] Add lifecycle event diagram and state machine documentation.
- [ ] Build employee self-service profile screens.
- [ ] Add import/export for employee records.

## Phase 3: Hiring and Onboarding
- [ ] Implement recruitment handoff into onboarding.
- [ ] Add hire case and onboarding case tables.
- [ ] Implement onboarding task engine.
- [ ] Add onboarding workflow approvals.
- [ ] Add document upload and policy acknowledgement capture.
- [ ] Add payroll and access provisioning hooks on activation.
- [ ] Add onboarding state machine and status transitions.
- [ ] Add onboarding workflow diagram and approval path documentation.
- [ ] Add support for onboarding cancellation, hold, and reactivation scenarios.

## Phase 4: Attendance and Leave
- [ ] Implement location-specific attendance policies.
- [ ] Add shift patterns, shift assignments, and shift rosters.
- [ ] Build clock event ingestion API.
- [ ] Add biometric adapter framework.
- [ ] Implement deduplication and offline sync handling.
- [ ] Build absence detection jobs.
- [ ] Implement leave balances, accruals, public holiday calendars, and leave approvals.

## Phase 5: Workflow and Approvals
- [ ] Build workflow template model.
- [ ] Build workflow instance and step instance model.
- [ ] Add approval resolution logic for manager, HR, plant, and payroll routes.
- [ ] Add delegation and escalation handling.
- [ ] Add conditional steps and skip-duplicate approver rules.

## Phase 6: Payroll and Tax
- [ ] Create payroll period and payroll run models.
- [ ] Add payroll component and payroll policy configuration.
- [ ] Implement overtime calculation engine.
- [ ] Implement attendance deduction engine.
- [ ] Implement statutory contribution engines.
- [ ] Implement jurisdiction-specific tax engines.
- [ ] Add payslip generation.
- [ ] Add payroll approval and finalization.

## Phase 7: Reporting, Compliance, and Integration
- [ ] Build standard reports and dashboards.
- [ ] Add audit search and audit export.
- [ ] Implement privacy workflows for export, erasure, and anonymization.
- [ ] Add notification service for workflow and payroll events.
- [ ] Add integration logs, retries, and dead-letter handling.
- [ ] Add directory sync monitoring, reconciliation, and failure handling.
- [ ] Add external API versioning and SDK generation.

## Phase 8: Testing and Release Readiness
- [ ] Add unit tests for policy resolution, approvals, attendance, payroll, and tax.
- [ ] Add integration tests against real PostgreSQL and Redis.
- [ ] Add E2E flows for onboarding, attendance, leave, approvals, and payroll.
- [ ] Add security checks for secrets, dependencies, and SAST.
- [ ] Add performance tests for payroll batches and attendance ingestion.
- [ ] Add audit reconciliation tests.
- [ ] Confirm production rollback and migration strategy.

## Definition of Done
- [ ] Core modules are usable end to end.
- [ ] Payroll can run for at least one jurisdiction with correct tax calculations.
- [ ] Attendance events can be ingested from at least one device or middleware adapter.
- [ ] Approvals work for hire, transfer, promotion, resignation, and leave.
- [ ] Audit and privacy requirements are in place.
- [ ] Documentation is updated for all implemented modules.
