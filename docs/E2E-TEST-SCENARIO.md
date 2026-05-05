# End-to-End Test Scenario: Complete Employee Lifecycle

This document provides a step-by-step guide to test the entire employee lifecycle from scratch, including organization setup, recruitment, onboarding, attendance, and leave management.

---

## Prerequisites

- [ ] Local stack running (API + Web app)
- [ ] One fresh tenant created (or use existing)
- [ ] One admin user account (for HR Admin role)
- [ ] One employee user account (for Employee role)
- [ ] All databases initialized

---

## Phase 1: Organization Setup (HR Admin)

**Goal:** Create a realistic organizational structure that mirrors a real company.

### Use Case 1.1: Create Organization Structure

**Actors:** HR Admin

**Steps:**

1. **Create Locations (Head Office + Branches)**
   - Navigate to: `Organization → Locations`
   - Click: `Add Location`
   - Create Head Office:
     - Name: `Jakarta HQ`
     - Code: `HQ`
     - Country: `Indonesia`
     - Timezone: `Asia/Jakarta`
     - Clocking Method: `Manual` (for local testing)
     - Status: `Active`
   - Click: Save
   - **Verify:** Location appears in list with live counts

2. **Create Branch Locations**
   - Repeat step 1 for:
     - Name: `Yogyakarta Branch` | Code: `YOG`
     - Name: `Jakarta Branch` | Code: `JKT`
     - Name: `Surabaya Branch` | Code: `SBY`
   - **Verify:** All 4 locations visible in organization overview

3. **Create Plants under Each Location**
   - For `Jakarta HQ`:
     - Click: `Add Plant`
     - Name: `HQ Assembly Plant` | Code: `HQ-ASM`
     - Manager: (leave empty for now)
   - For `Yogyakarta Branch`:
     - Name: `Yogyakarta Plant A` | Code: `YOG-A`
   - For `Jakarta Branch`:
     - Name: `Jakarta Plant A` | Code: `JKT-A`
   - For `Surabaya Branch`:
     - Name: `Surabaya Plant A` | Code: `SBY-A`
   - **Verify:** Plants appear nested under their locations

4. **Create Departments**
   - Navigate to: `Organization → Departments`
   - Create departments under `Jakarta HQ`:
     - `HR` | Code: `HR`
     - `Operations` | Code: `OPS`
     - `Production` | Code: `PROD`
     - `Maintenance` | Code: `MAINT`
     - `Finance` | Code: `FIN`
   - **Verify:** Department tree shows location + hierarchy

5. **Create Teams**
   - Navigate to: `Organization → Teams`
   - Create teams under `HR Department`:
     - `HQ People Ops` | Lead: (leave empty)
   - Create teams under `Production Department`:
     - `Yogyakarta Day Shift` | Lead: (leave empty)
     - `Jakarta Night Shift` | Lead: (leave empty)
   - **Verify:** Team counts update in organization overview

**Expected Outcome:**
- Organization has 4 locations, 4 plants, 5 departments, 3 teams
- Overview cards show: 4 Locations, 4 Plants, 5 Departments, 3 Teams, 0 Employees

---

## Phase 2: Recruitment (HR Admin)

**Goal:** Test the complete hiring workflow from requisition to offer acceptance.

### Use Case 2.1: Create and Approve a Job Requisition

**Actors:** HR Admin (requester + approver)

**Steps:**

1. **Create Requisition**
   - Navigate to: `Recruitment → Requisitions`
   - Click: `New Requisition`
   - Fill in:
     - Job Title: `Production Operator`
     - Department: `Production`
     - Location: `Yogyakarta Branch`
     - Quantity: `1`
     - Description: `Full-time production line operator with shift work experience`
     - Status: Draft
   - Click: Save

2. **Submit for Approval**
   - Click: `Submit for Approval`
   - **Verify:** Status changes to `Pending Approval`
   - **Verify:** Workflow timeline appears showing submission

3. **Approve Requisition**
   - Navigate to: `Approvals`
   - Find: `Production Operator` requisition
   - Click: `Review`
   - Click: `Approve`
   - Add note (optional): `Approved - hiring need confirmed`
   - **Verify:** Requisition status changes to `Approved`
   - **Verify:** Approval removed from queue

**Expected Outcome:**
- Requisition is `Approved` and ready for offer creation
- Approval timeline shows: Submitted → Approved with timestamps

---

### Use Case 2.2: Create and Approve an Offer

**Actors:** HR Admin (creator + approver)

**Steps:**

1. **Create Offer**
   - From approved Requisition, click: `Create Offer`
   - Fill in:
     - Candidate Name: `Budi Santoso`
     - Candidate Email: `budi.santoso@example.com`
     - Position: `Production Operator` (auto-filled)
     - Department: `Production` (auto-filled)
     - Location: `Yogyakarta Branch` (auto-filled)
     - Salary: `4,500,000` IDR
     - Employment Type: `Full Time`
     - Start Date: `2025-06-01`
     - Notes: `Offer for experienced operator`
   - Click: Save

2. **Submit Offer for Approval**
   - Click: `Submit for Approval`
   - **Verify:** Status: `Pending Approval`
   - **Verify:** Workflow timeline shows submission

3. **Approve Offer**
   - Navigate to: `Approvals`
   - Find: `Budi Santoso - Production Operator` offer
   - Click: `Approve`
   - **Verify:** Offer status: `Approved`

4. **Candidate Accepts Offer**
   - Navigate to: `Approvals` (still as HR Admin)
   - Find: `Budi Santoso` offer
   - Click: `Mark as Accepted` (or simulate acceptance)
   - **Verify:** Status: `Accepted`
   - **Verify:** New row appears in `People` → `Pre-Boarding` employees

**Expected Outcome:**
- Offer is `Accepted`
- `Budi Santoso` appears in `People` with status `Pre-Boarding`
- Onboarding case is ready to start

---

## Phase 3: Onboarding (HR Admin)

**Goal:** Complete the onboarding process and activate the employee.

### Use Case 3.1: Complete Onboarding Tasks

**Actors:** HR Admin, Employee (Budi)

**Steps:**

1. **View Pre-Boarding Employee**
   - Navigate to: `People`
   - Find: `Budi Santoso`
   - Status: `Pre-Boarding`
   - Click: Open employee row

2. **Start Onboarding**
   - Click: `Start Onboarding` or `Onboarding` tab
   - **Verify:** Onboarding modal/drawer shows tasks in sequence
   - Expected tasks:
     - Personal Information Verification
     - Tax Information (NPWP)
     - Bank Account Details
     - Policy Acknowledgment
     - System Access Provisioning

3. **Complete Personal Information**
   - Task: `Personal Information Verification`
   - Status: Open
   - Enter:
     - Date of Birth: `1990-05-15`
     - Gender: `Male`
     - Phone: `+62 812-3456-7890`
     - Address: `Jl. Yogyakarta No. 123, Yogyakarta`
   - Mark as: `Complete`
   - **Verify:** Task status changes to `Completed`

4. **Complete Tax Information**
   - Task: `Tax Information`
   - Provide:
     - NPWP: `12.345.678.9-012.345` (dummy)
     - PTKP Category: `TK-0` (Unmarried)
   - Upload: Proof document (optional)
   - Mark as: `Complete`
   - **Verify:** Status: `Completed`

5. **Complete Bank Account**
   - Task: `Bank Account Details`
   - Enter:
     - Bank Name: `Bank Mandiri`
     - Account Number: `0123456789` (dummy)
     - Account Holder: `Budi Santoso`
     - Primary Account: `Yes`
   - Mark as: `Complete`

6. **Policy Acknowledgment**
   - Task: `Policy Acknowledgment`
   - Upload/Review: Employee handbook
   - Checkbox: `I acknowledge and accept all policies`
   - Add signature note: `Digitally accepted`
   - Mark as: `Complete`

7. **System Access**
   - Task: `System Access Provisioning`
   - Assign: Employee role
   - Grant Access to: Attendance, Leave, Profile, Reports
   - Mark as: `Complete`

8. **Activate Employee**
   - Click: `Activate` or `Complete Onboarding`
   - **Verify:** Employee status changes to `Active`
   - **Verify:** Onboarding case status: `Activated`
   - **Verify:** All tasks marked `Completed`

**Expected Outcome:**
- `Budi Santoso` status: `Active`
- All onboarding tasks completed
- Ready for attendance/shift assignment

---

## Phase 4: Attendance Setup (HR Admin)

**Goal:** Configure shifts and assign the employee to a shift.

### Use Case 4.1: Create Shift Templates

**Actors:** HR Admin

**Steps:**

1. **Create Shift Templates**
   - Navigate to: `Attendance → Shift Templates`
   - Click: `New Shift`
   
   **Shift 1: Day Shift**
   - Name: `Day Shift`
   - Code: `DAY`
   - Start Time: `08:00`
   - End Time: `17:00`
   - Break: `60` minutes
   - Grace (Late): `15` minutes
   - Status: `Active`
   - Click: Save
   
   **Shift 2: Night Shift**
   - Name: `Night Shift`
   - Code: `NIGHT`
   - Start Time: `19:00`
   - End Time: `04:00` (next day)
   - Break: `45` minutes
   - Grace (Late): `15` minutes
   - Status: `Active`
   - Click: Save

2. **Verify Shifts Created**
   - **Verify:** Both shifts appear in list
   - **Verify:** Can see start/end times and break minutes

**Expected Outcome:**
- 2 shift templates configured
- Both `Active` and ready for assignment

---

### Use Case 4.2: Assign Shifts to Employee

**Actors:** HR Admin

**Steps:**

1. **Assign Shift to Budi**
   - Navigate to: `Attendance → Shift Assignments`
   - Click: `New Assignment`
   - Employee: `Budi Santoso`
   - Shift: `Day Shift` (08:00-17:00)
   - Effective From: `2025-06-01` (hire date)
   - Effective To: (leave empty = ongoing)
   - Click: Save
   
   - **Verify:** Assignment appears in list
   - **Verify:** Shows: `Budi Santoso | Day Shift | 08:00-17:00`

2. **View Employee Shift**
   - Navigate to: `People`
   - Find: `Budi Santoso`
   - Open employee detail
   - **Verify:** Shows assigned shift: `Day Shift`

**Expected Outcome:**
- `Budi Santoso` assigned to `Day Shift`
- Can now perform clock in/out

---

### Use Case 4.3: Configure Holiday Calendar

**Actors:** HR Admin

**Steps:**

1. **Set Up Holidays**
   - Navigate to: `Attendance → Holiday Calendar`
   - View: Year `2025`
   - Add Public Holidays:
     - `2025-06-01`: Pancasila Day
     - `2025-08-17`: Independence Day
     - `2025-12-25`: Christmas Day
   - Click: Add each holiday
   - **Verify:** Holidays appear in calendar

**Expected Outcome:**
- Holiday calendar configured
- Employees won't get marked late/absent on holidays

---

## Phase 5: Attendance & Overtime Tracking (Employee + HR Admin)

**Goal:** Test clock in/out and verify overtime tracking.

### Use Case 5.1: Normal Day Clock In/Out

**Actors:** Employee (Budi)

**Steps:**

1. **Sign In as Employee**
   - Logout as HR Admin
   - Login as: `Budi Santoso`

2. **Clock In (Normal)**
   - Navigate to: `Attendance`
   - Click: `Clock In`
   - Time: `08:05` (5 minutes late)
   - **Verify:** Shows clock-in time and elapsed time
   - **Verify:** Status: `Clocked In`

3. **Work During Day**
   - (Simulate working 8.5 hours)

4. **Clock Out**
   - Click: `Clock Out`
   - Time: `17:30` (30 minutes overtime)
   - **Verify:** Shows worked duration
   - **Verify:** Calculates: 9 hours 25 minutes worked

5. **View Attendance Record**
   - Navigate to: `Attendance → My Records` (or `Attendance` tab)
   - Find: Today's date
   - **Verify:** Shows:
     - Clock In: `08:05`
     - Clock Out: `17:30`
     - Worked: `9h 25m`
     - Late: `5 min`
     - Overtime: `1h 25m` (expected: 9h 25m - 8h = 1h 25m)

**Expected Outcome:**
- Attendance record created
- Overtime correctly calculated: `1h 25m`
- Late minutes: `5 min`

---

### Use Case 5.2: Overtime Day

**Actors:** Employee (Budi), HR Admin (reviewer)

**Steps:**

1. **Clock In/Out with Extended Hours (as Budi)**
   - Clock In: `07:00` (1 hour early)
   - Clock Out: `19:00` (2 hours overtime)
   - Worked: `11h 40m` (minus 1h break)
   - **Verify:** Overtime = `3h 40m`

2. **HR Admin Reviews Overtime**
   - Switch to: HR Admin role
   - Navigate to: `Attendance`
   - Find: `Budi Santoso` records
   - **Verify:** Overtime hours visible in records
   - **Verify:** Can see daily breakdown:
     - 08:00 shift (9h 25m worked, 1h 25m OT)
     - 07:00-19:00 shift (11h 40m worked, 3h 40m OT)

**Expected Outcome:**
- Overtime correctly tracked for extended work days
- OT visible in attendance records for payroll purposes

---

### Use Case 5.3: Late Arrival

**Actors:** Employee (Budi), HR Admin (reviewer)

**Steps:**

1. **Clock In Late (as Budi)**
   - Shift starts: `08:00`
   - Clock In: `08:45` (45 minutes late, exceeds 15-min grace)
   - Late minutes: `30 min` (45 - 15 grace = 30)
   - Clock Out: `17:00`
   - **Verify:** Late minutes recorded

2. **HR Admin Views Late Records**
   - Switch to: HR Admin
   - Navigate to: `Attendance`
   - Find: Late arrival day
   - **Verify:** Shows:
     - Late: `30 min`
     - Grace used: `15 min`
     - Actual deduction: `30 min`

**Expected Outcome:**
- Late arrival correctly recorded
- Grace period applied
- Late deduction calculated

---

### Use Case 5.4: Absence (No Clock In/Out)

**Actors:** Employee (Budi), HR Admin (reviewer)

**Steps:**

1. **Simulate Absence**
   - No clock in/out for a workday
   - Navigate to: `Attendance → My Records` (as Budi)
   - **Verify:** Day shows as:
     - Status: `Absent`
     - Worked: `0 min`
     - OR shows as `Pending` waiting for HR action

2. **HR Admin Marks Absence**
   - Switch to: HR Admin
   - Navigate to: `Attendance`
   - Find: Absence day
   - Click: Mark as `Absent`
   - Reason: (optional)
   - **Verify:** Status: `Absent`
   - **Verify:** Can't be confused with approved leave

**Expected Outcome:**
- Absence properly recorded
- Distinct from approved leave

---

## Phase 6: Leave Management (Employee + HR Admin)

**Goal:** Test leave balance, requests, and approval workflow.

### Use Case 6.1: Check Leave Balance

**Actors:** Employee (Budi)

**Steps:**

1. **View Leave Balance (as Budi)**
   - Navigate to: `Leave`
   - Click: `My Balances`
   - **Verify:** Shows leave types and balances
   - Expected balances (assuming fresh hire June 1):
     - Annual Leave: `0 or X days` (depends on policy)
     - Sick Leave: `Y days`
     - Others: as configured
   - **Verify:** Can see:
     - Entitled Days
     - Taken Days
     - Pending Days
     - Carried Over Days

2. **Understand Balance Structure**
   - Annual Leave allocated: (depends on company policy)
   - Accrual: (check if accrued already for June)

**Expected Outcome:**
- Leave balances visible
- Shows breakdown of entitled vs. taken vs. pending

---

### Use Case 6.2: Submit Leave Request

**Actors:** Employee (Budi), HR Admin (approver)

**Steps:**

1. **Create Leave Request (as Budi)**
   - Click: `New Request`
   - Leave Type: `Annual Leave`
   - From Date: `2025-06-10`
   - To Date: `2025-06-12` (3 days)
   - Reason: `Family event in hometown`
   - Click: Submit
   - **Verify:** Status: `Pending`
   - **Verify:** Request appears in queue

2. **Workflow Approval Path**
   - Expected flow for non-HR employee:
     1. Direct Manager approval (if assigned)
     2. Plant Manager approval (if assigned to plant)
     3. HR/HRIS manager final approval
   
   - Since Budi has no manager assigned yet, might skip to Plant Manager or HR

3. **Check Approval Queue (as HR Admin)**
   - Switch to: HR Admin
   - Navigate to: `Approvals`
   - Find: `Budi Santoso - Annual Leave (3 days)`
   - **Verify:** Shows:
     - Requested dates: 2025-06-10 to 2025-06-12
     - Requested by: `Budi Santoso`
     - Status: `Pending Your Approval`

4. **Approve Leave Request**
   - Click: `Review`
   - Review note: `Approved - dates clear`
   - Click: `Approve`
   - **Verify:** Status changes to `Approved`
   - **Verify:** Removed from approval queue

5. **Verify Leave Balance Updated (as Budi)**
   - Switch to: Budi
   - Navigate to: `Leave → My Balances`
   - **Verify:** Annual Leave changed:
     - Taken Days: `+3`
     - Pending Days: `-3`

**Expected Outcome:**
- Leave request approved
- Balance updated
- Approval queue cleaned
- Leave dates reserved for employee

---

### Use Case 6.3: Reject Leave Request

**Actors:** Employee (Budi), HR Admin (approver)

**Steps:**

1. **Submit Another Leave Request (as Budi)**
   - Click: `New Request`
   - Leave Type: `Sick Leave`
   - From Date: `2025-06-20`
   - To Date: `2025-06-20` (1 day)
   - Reason: `Medical appointment`
   - Click: Submit
   - **Verify:** Status: `Pending`

2. **Reject Request (as HR Admin)**
   - Navigate to: `Approvals`
   - Find: `Budi Santoso - Sick Leave`
   - Click: `Review`
   - Reason for rejection: `Please provide medical certificate`
   - Click: `Reject`
   - **Verify:** Status: `Rejected`

3. **Employee Sees Rejection (as Budi)**
   - Navigate to: `Leave`
   - Find: Rejected request
   - **Verify:** Shows rejection reason
   - **Verify:** Balance NOT deducted (still `0 days pending`)

**Expected Outcome:**
- Leave request rejected with reason
- Balance unaffected
- Employee can resubmit with documentation

---

### Use Case 6.4: Cancel Approved Leave

**Actors:** Employee (Budi), HR Admin

**Steps:**

1. **Cancel Previously Approved Leave (as Budi)**
   - Navigate to: `Leave`
   - Find: Approved 3-day leave (2025-06-10 to 06-12)
   - Click: `Cancel Request`
   - Reason: `Plans changed`
   - Click: Confirm
   - **Verify:** Status: `Cancelled`

2. **Verify Balance Restored**
   - Click: `My Balances`
   - **Verify:** Annual Leave:
     - Taken Days: `0` (reset)
     - Pending Days: `0` (cleared)

3. **HR Admin Sees Cancellation**
   - Switch to: HR Admin
   - Navigate to: `Approvals`
   - Find: Cancelled leave request
   - **Verify:** Shows cancellation audit trail

**Expected Outcome:**
- Leave cancelled successfully
- Balance restored
- Audit trail maintained

---

## Phase 7: Approval Workflow End-to-End (HR Admin)

**Goal:** Verify all approvals are tracked and completed.

### Use Case 7.1: Review Complete Approval Queue

**Actors:** HR Admin

**Steps:**

1. **Navigate to Approvals**
   - Click: `Approvals`
   - **Verify:** Shows all pending approvals in order:
     - Requisitions (should be empty - approved earlier)
     - Offers (should be empty - accepted earlier)
     - Leave requests (might have pending if not fully tested)
     - Onboarding (should be empty - completed)

2. **Approval Statistics**
   - **Verify:** Shows:
     - Total pending: should be low or 0 (if all tested)
     - Overdue: 0 (if all recent)
     - By type: breakdown of each workflow type

3. **Filter and Sort**
   - Filter by: `Status: Pending`
   - Filter by: `Type: Leave Request`
   - Sort by: `Date Requested`
   - **Verify:** Filters work correctly

**Expected Outcome:**
- All completed approvals cleared from queue
- Only pending approvals remain
- Audit trail shows all decision history

---

### Use Case 7.2: Verify Workflow Timeline

**Actors:** HR Admin

**Steps:**

1. **Open Requisition Detail**
   - Navigate to: `Recruitment → Requisitions`
   - Find: `Production Operator` requisition
   - Click: Open detail view
   - **Verify:** Workflow Timeline shows:
     - `2025-05-XX 10:30` - Created by: HR Admin
     - `2025-05-XX 11:00` - Submitted for Approval
     - `2025-05-XX 11:15` - Approved by: HR Admin
     - Each step with timestamp and actor

2. **Open Offer Detail**
   - Click: Offer for `Budi Santoso`
   - **Verify:** Workflow Timeline shows:
     - Created → Submitted → Approved → Accepted
     - All steps timestamped and attributed

3. **Open Leave Request Detail**
   - Navigate to: `Leave`
   - Find: An approved leave request
   - Click: Detail view
   - **Verify:** Workflow Timeline shows:
     - Requested → Submitted → Approved
     - Shows dates and approver name

**Expected Outcome:**
- Complete audit trail visible
- All timestamps accurate
- All actor information preserved

---

## Phase 8: Employee Self-Service (Budi)

**Goal:** Verify employee can view their own data and manage profile.

### Use Case 8.1: Employee Profile View

**Actors:** Employee (Budi)

**Steps:**

1. **Sign In as Budi**
   - Login with Budi credentials

2. **View Profile**
   - Click: `Profile` (from nav or top-right menu)
   - **Verify:** Shows personal information:
     - Name: `Budi Santoso`
     - Email: `budi.santoso@example.com`
     - Employee ID: (auto-generated)
     - Department: `Production`
     - Location: `Yogyakarta Branch`
     - Plant: (if assigned)
     - Job Title: `Production Operator`
     - Hire Date: `2025-06-01`
     - Employment Type: `Full Time`

3. **View Sensitive Data Restrictions**
   - **Verify:** Cannot see:
     - Other employees' data
     - Salary information
     - Tax information
     - Bank accounts (own? - depends on policy)

**Expected Outcome:**
- Employee can view own profile only
- No access to other employee data
- Self-service information available

---

### Use Case 8.2: Update Self-Service Profile Fields

**Actors:** Employee (Budi)

**Steps:**

1. **Update Contact Information**
   - Click: `Edit Profile`
   - Update:
     - Phone: `+62 812-9999-8888`
     - Address: `Jl. Baru No. 456`
   - Click: Save
   - **Verify:** Changes saved
   - **Verify:** Audit log shows who updated and when

2. **Cannot Edit Restricted Fields**
   - **Verify:** Cannot edit:
     - Employee ID
     - Department
     - Salary
     - Job Title
     - Hire Date
   - (These require HR Admin approval)

**Expected Outcome:**
- Limited self-service update capability
- Restrictions enforced
- Audit trail maintained

---

## Phase 9: HR Admin Final Verification

**Goal:** Confirm all data consistency and audit trails.

### Use Case 9.1: Verify Employee Master Data

**Actors:** HR Admin

**Steps:**

1. **Open Employee Detail**
   - Navigate to: `People`
   - Find: `Budi Santoso`
   - Click: Open detail
   - **Verify:** All information present and accurate:
     - Personal: DOB, Gender, Phone, Address ✓
     - Employment: Job Title, Department, Location, Plant ✓
     - Tax: NPWP, PTKP Category ✓
     - Bank: Account details (masked) ✓
     - Status: `Active` ✓
     - Hire Date: `2025-06-01` ✓

2. **View Employment Spell**
   - **Verify:** Shows current employment spell:
     - Department: `Production`
     - Location: `Yogyakarta Branch`
     - Plant: (if assigned)
     - Employment Type: `Full Time`
     - Work Arrangement: `Office`
     - Effective From: `2025-06-01`
     - Effective To: (null/empty = current)

3. **Check Lifecycle Events**
   - **Verify:** Shows event log:
     - `2025-06-01 - Hired` - Requisition: `Production Operator`
     - Any transfers/promotions/changes would appear here

**Expected Outcome:**
- Complete employee record with all required fields
- Employment spell current and accurate
- Lifecycle events recorded

---

### Use Case 9.2: Audit Trail Verification

**Actors:** HR Admin

**Steps:**

1. **Verify Approval Decisions Are Logged**
   - Navigate to: `Approvals`
   - Look for: Completed items (if any history view exists)
   - **Verify:** Each decision shows:
     - Who approved/rejected
     - When
     - Decision reason
     - Outcome

2. **Verify Attendance Audit**
   - Navigate to: `Attendance`
   - View: `Budi Santoso` attendance records
   - Click: Any record
   - **Verify:** Shows:
     - Clock in time (and who recorded if manual)
     - Clock out time
     - Worked/late/OT calculations
     - Any manual adjustments (who, when, reason)

3. **Verify Leave Audit**
   - Navigate to: `Leave`
   - Find: A leave request history
   - **Verify:** Shows complete timeline:
     - Requested date/time
     - Approver name and date
     - Approval/rejection/cancellation dates

**Expected Outcome:**
- Complete audit trail for compliance
- All decisions traceable to user
- Timestamps accurate

---

## Test Data Summary

After completing all phases, you should have:

| Item | Count | Status |
|------|-------|--------|
| Locations | 4 | Active |
| Plants | 4 | Active |
| Departments | 5 | Active |
| Teams | 3 | Active |
| Employees | 1 (Budi) | Active |
| Requisitions | 1 | Approved |
| Offers | 1 | Accepted |
| Shift Templates | 2 | Active |
| Shift Assignments | 1 | Active |
| Attendance Records | ~10+ | Various (normal, OT, late, absent) |
| Leave Requests | 2-3 | (approved, rejected, cancelled) |
| Approvals Completed | ~5+ | (requisition, offer, leave) |

---

## Pass/Fail Criteria

### PASS Conditions:
- [ ] Organization structure created and visible
- [ ] Requisition created, submitted, and approved
- [ ] Offer created, submitted, approved, and accepted
- [ ] Onboarding completed with all tasks finished
- [ ] Employee activated and can log in
- [ ] Shift templates created and assigned
- [ ] Clock in/out records created with worked minutes
- [ ] Overtime calculated correctly (worked - 8h = OT)
- [ ] Late minutes calculated with grace period
- [ ] Leave request submitted and approved
- [ ] Leave balance deducted correctly
- [ ] Leave request rejection and cancellation work
- [ ] Approval queue shows pending items
- [ ] Approval queue clears after decisions
- [ ] Workflow timeline shows complete audit trail
- [ ] Employee cannot see other employee data
- [ ] Audit logs show who did what and when

### FAIL Conditions:
- [ ] Any workflow step blocked without clear error message
- [ ] Approval not removing from queue after decision
- [ ] Overtime calculation incorrect
- [ ] Leave balance not updating after approval
- [ ] Data showing for wrong employee (data isolation issue)
- [ ] Missing required fields cause ambiguous errors
- [ ] Workflow timeline incomplete or missing steps
- [ ] Cannot edit employee data after hire

---

## Notes for Testers

1. **Timing:** Complete full scenario in one session if possible
2. **Data Cleanup:** If retesting, delete employee first and clear shifts
3. **Role Switching:** Logout completely between HR Admin ↔ Employee role changes
4. **Timezone:** All times should respect Yogyakarta timezone (`Asia/Jakarta`)
5. **Currency:** All salary amounts in IDR
6. **Language:** Test in both Indonesian and English if available

---

## Defects to Watch For

- [ ] OT calculation with extended hours over multiple hours
- [ ] Late calculation with partial grace period (e.g., 10 min late with 15 min grace)
- [ ] Leave balance showing negative (shouldn't happen)
- [ ] Approvals disappearing from queue before decision
- [ ] Employee data visible to other employees
- [ ] Workflow status not matching timeline
- [ ] Shift assignment effective dates not respected (e.g., showing shift before effective_from date)
- [ ] Approval notification not sent (if email configured)
- [ ] Onboarding task order not enforced
- [ ] Cannot re-clock-in if already clocked in without clock-out

---

## Quick Test Checklist

Use this to quickly verify all major flows:

```
ORGANIZATION SETUP:
  [ ] Create locations (4)
  [ ] Create plants (4)
  [ ] Create departments (5)
  [ ] Create teams (3)

RECRUITMENT:
  [ ] Create requisition
  [ ] Approve requisition
  [ ] Create offer
  [ ] Approve offer
  [ ] Accept offer → Pre-boarding

ONBOARDING:
  [ ] Complete all tasks (personal, tax, bank, policy, access)
  [ ] Activate employee

ATTENDANCE:
  [ ] Create shift templates (2)
  [ ] Assign shift to employee
  [ ] Clock in/out (normal day)
  [ ] Verify OT calculated
  [ ] Clock in late
  [ ] Verify late deduction
  [ ] Verify attendance record detail

LEAVE:
  [ ] Check leave balance
  [ ] Submit leave request
  [ ] Approve leave
  [ ] Verify balance updated
  [ ] Reject a leave request
  [ ] Cancel approved leave

APPROVALS:
  [ ] View approval queue
  [ ] Verify requisition approval in history
  [ ] Verify offer approval in history
  [ ] Verify leave approval in history

EMPLOYEE SELF-SERVICE:
  [ ] View profile as employee
  [ ] Cannot see other employee data
  [ ] Update contact info

HR VERIFICATION:
  [ ] Complete employee record
  [ ] Audit trail shows all changes
  [ ] Workflow timeline complete
```

---

## Success Indicators

✅ **Full E2E Coverage** = All checks pass above

✅ **Data Consistency** = No orphaned records, all references valid

✅ **Audit Complete** = Who, What, When, Why for every action

✅ **Role-based Access** = Employee sees only own data, HR sees all

✅ **Workflow Status** = Accurate at all stages, never goes backward

✅ **Calculations Correct** = OT, Late, Leave balance, all math right

---

End of Test Plan
