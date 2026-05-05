# Local Pilot Test Guide

Use this checklist to smoke-test the app locally as close to a real pilot as possible.
The flow is organized by role so you can switch between HR Admin and Employee exactly
the way the product is meant to be used.

## Before You Start

- [ ] Start the local stack and confirm both API and web are reachable.
- [ ] Make sure one tenant, one country, and one seeded employee set are available.
- [ ] If you need the seeded onboarding path, create or verify a `Pre_Boarding` employee.
- [ ] Use real login if it is already working locally; otherwise use the temporary dev bypass only for local testing.
- [ ] Keep one HR Admin account and one Employee account ready for role-based testing.

## Fresh Tenant Bootstrap

Use these sample values if you are starting from a blank tenant and want the setup to feel like a real company.

1. Create the head office location first.
2. Create branch locations next.
3. Create one plant under each location.
4. Add departments inside the locations.
5. Add teams inside the departments.
6. Assign real users or seeded users later as managers and approvers.

Suggested starter values:

- Head Office: `Jakarta HQ` with code `HO`, timezone `Asia/Jakarta`
- Branch 1: `Yogyakarta Branch` with code `YOG`
- Branch 2: `Jakarta Branch` with code `JKT`
- Branch 3: `Tangerang Branch` with code `TGR`
- Branch 4: `Surabaya Branch` with code `SBY`
- Plant examples:
- `HO Assembly Plant` under `Jakarta HQ`
- `Yogyakarta Plant A` under `Yogyakarta Branch`
- `Jakarta Plant A` under `Jakarta Branch`
- `Tangerang Plant A` under `Tangerang Branch`
- `Surabaya Plant A` under `Surabaya Branch`
- Department examples:
- `HR`
- `Operations`
- `Production`
- `Maintenance`
- `Finance`
- `IT`
- Team examples:
- `HQ People Ops`
- `Yogyakarta Day Shift`
- `Jakarta Night Shift`
- `Tangerang Packing Team`
- `Surabaya Line A`

Approver setup suggestion:

- Plant manager: one user per plant who approves branch-level leave and operational actions.
- HR approver: one central HRIS or HR manager who handles the final review.
- Direct manager: the employee's reporting manager if you want the manager approval step to appear.

## Recommended Org Mapping

Use this mapping when you want the data to feel close to a real multi-site company.
It fits the current model in the app without needing hardcoded demo data.

| Business concept | Current app object | Example setup |
| --- | --- | --- |
| Managing Director / Group Head | Tenant-level leadership + admin user | One person at the top of the tenant, usually an HRIS admin or super admin |
| Head Office | `Location` | `Jakarta HQ` |
| Branch | `Location` | `Yogyakarta Branch`, `Jakarta Branch`, `Tangerang Branch`, `Surabaya Branch` |
| Plant | `Plant` under a `Location` | `Yogyakarta Plant A`, `Jakarta Plant A`, `Tangerang Plant A`, `Surabaya Plant A` |
| Supervisor | Employee `managerId` or team lead | The direct reporting manager for a worker group |
| Workers | Employee records | Staff assigned to the correct plant, department, and team |
| Central HR approver | Role `hris_admin` or `hr_manager` | Final leave and workflow review |

Recommended reporting structure:

1. Put the managing director at the tenant top level.
2. Create each branch as a `Location`.
3. Create one or more `Plant` records under each branch.
4. Assign a `Plant Manager` user to each plant.
5. Create `Department` records under the right location.
6. Create `Team` records under the right department.
7. Assign supervisors by linking employees with `managerId`.
8. Assign workers to the correct plant and direct manager.

Recommended leave approval path:

1. Employee submits leave.
2. Direct manager approves first, if the employee has one.
3. Plant manager approves second, if the employee has a plant assigned.
4. HRIS or HR manager does the final review.

If the requester is an HR employee:

- Do not let them approve their own leave.
- Route the final step to another HRIS admin or HR manager.
- Keep the plant and manager steps if the HR employee still reports into a plant or supervisor.

If the requester is a branch worker:

- Use the direct manager step when the worker has a supervisor.
- Use the plant manager step when the worker belongs to a plant.
- Keep the HR final step for central oversight.

This is the closest fit to the current code path:

- `employee.managerId` drives the direct manager approval.
- `employment_spells.plantId` drives the plant manager approval.
- The workflow engine already understands `direct_manager`, `plant_manager`, and `hr_manager`.

## Recommended Test Order

1. HR Admin sets up the working structure.
2. HR Admin creates a requisition and pushes it through approvals.
3. HR Admin completes onboarding for the hired employee.
4. HR Admin configures shifts and attendance coverage.
5. Employee clocks in, applies leave, and checks their own data.
6. HR Admin reviews approvals, attendance, and leave outcomes.

## HR Admin Checklist

### 1. Organization

- [ ] Open `Organization`.
- [ ] If the tenant is blank, click `Add Location` first and create the head office and each branch.
- [ ] Add the physical `Plant` records under each branch location.
- [ ] Open each location row and verify the code, country, timezone, and clocking method are correct.
- [ ] Click `Add Department` and attach each department to the correct location.
- [ ] Click `Add Team` and attach each working team to the correct department.
- [ ] Confirm the overview cards update to show the live employee, location, plant, department, and leader counts.
- [ ] Verify the attendance location has the expected timezone and clocking method before testing clock-in flows.

### 2. Recruitment

- [ ] Open `Recruitment`.
- [ ] Create a requisition, or select an existing one.
- [ ] Submit the requisition for approval.
- [ ] Open the requisition detail view and confirm the approval timeline is visible.
- [ ] Approve the requisition from `Approvals`.
- [ ] Create an offer for the approved requisition.
- [ ] Submit the offer for approval and approve it from `Approvals`.
- [ ] Confirm that offer acceptance creates the onboarding handoff.

### 3. People and Onboarding

- [ ] Open `People`.
- [ ] Find the pre-boarding employee row created from the offer handoff.
- [ ] Open the onboarding modal or row action.
- [ ] Complete the onboarding tasks in order.
- [ ] Upload any required attachments and add policy acknowledgement notes if the task asks for them.
- [ ] Hold and reactivate the onboarding case once, if you want to test the state transitions.
- [ ] Activate the employee and confirm the status changes to active.

### 4. Attendance Setup

- [ ] Open `Attendance`.
- [ ] Go to `Shift Templates`.
- [ ] Create a shift template with realistic start, end, break, and grace times.
- [ ] Go to `Shift Assignments`.
- [ ] Assign that shift to the active employee.
- [ ] Go to `Holiday Calendar`.
- [ ] Verify the expected public holidays and any company override holidays.
- [ ] If you need to validate overtime behavior, seed or adjust backend policy data first. There is no dedicated UI for overtime rules yet.

### 5. Leave Review

- [ ] Open `Leave`.
- [ ] Confirm the employee's leave balances are visible.
- [ ] Review any submitted leave request.
- [ ] For branch employees, confirm the workflow routes through manager or plant approval before final HR review.
- [ ] For HR employees, confirm the workflow routes to the HRIS/admin review path instead of self-approval.
- [ ] Approve or reject the request in `Approvals`, then confirm the balance changes afterward.

### 6. Approvals Queue

- [ ] Open `Approvals`.
- [ ] Confirm the requisition and offer approvals clear from the queue.
- [ ] Confirm the leave request approval clears from the queue.
- [ ] If the employee has an approval role, verify their assigned workflow items too.
- [ ] Confirm plant approvals appear for employees assigned to a branch plant.

## Employee Checklist

### 1. Leave

- [ ] Sign in as the Employee account.
- [ ] Open `Leave`.
- [ ] Check the leave balance summary first.
- [ ] Submit a leave request.
- [ ] Confirm the request appears in pending status.
- [ ] Sign back in as the assigned approver from `Approvals` and approve the request.
- [ ] Return to the Employee account and confirm the leave request is now approved.

### 2. Attendance

- [ ] Open `Attendance`.
- [ ] Use the clock panel to clock in.
- [ ] Use the clock panel to clock out later in the day.
- [ ] Confirm the attendance record shows the expected clock-in, clock-out, and worked minutes.
- [ ] If the workday goes beyond the shift window, verify overtime minutes are captured in the record.

### 3. Profile

- [ ] Open `Profile`.
- [ ] Confirm the employee can see only their own data.
- [ ] Update a small self-service field if that workflow is enabled in your local setup.

## End-To-End Pass Criteria

- [ ] Requisition approval completes and the requisition moves forward.
- [ ] Offer approval and acceptance create the onboarding handoff.
- [ ] Onboarding tasks complete and activation succeeds.
- [ ] Shift assignment appears on the employee's attendance data.
- [ ] Clock-in and clock-out create a daily attendance record.
- [ ] Leave request submission reserves balance and approval finalizes it.
- [ ] Plant assignment is visible on the employee record or workflow path.
- [ ] Approvals queue is empty for the completed items.
- [ ] Any overtime you expect from the test is reflected in attendance records.

## Notes

- OT rules are currently backend-driven. Use seeded policy data or test fixtures to
  validate them locally.
- For a brand-new tenant, the cleanest setup order is `Organization -> Recruitment -> People -> Attendance -> Leave`, because the People and Attendance screens depend on live locations, plants, and departments.
- This guide mirrors the same business areas covered by the pilot tests, but it is
  intentionally manual so you can verify the UI, workflow, and data together.
