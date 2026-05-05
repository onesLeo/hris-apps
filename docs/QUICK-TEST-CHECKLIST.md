# Quick Test Checklist - Employee Lifecycle E2E

Use this checklist to validate the entire employee lifecycle in ~45-60 minutes.

---

## Phase 1: Organization (5 min) - HR Admin

```
Location: Jakarta HQ | YOG Branch | JKT Branch | SBY Branch
  ☐ Created 4 locations
  ☐ Organization overview shows: 4 Locations

Plant: Under each location
  ☐ Created 4 plants (HQ-ASM, YOG-A, JKT-A, SBY-A)
  ☐ Overview shows: 4 Plants

Department: Under Jakarta HQ
  ☐ Created: HR, Operations, Production, Maintenance, Finance
  ☐ Overview shows: 5 Departments

Team: Under departments
  ☐ Created: HQ People Ops, Yogyakarta Day Shift, Jakarta Night Shift
  ☐ Overview shows: 3 Teams

EXPECTED: 4 Locations | 4 Plants | 5 Departments | 3 Teams | 0 Employees
```

---

## Phase 2: Recruitment (10 min) - HR Admin

```
Requisition
  ☐ Created: "Production Operator" for Production dept, Yogyakarta
  ☐ Submitted for approval
  ☐ Approved → Status: Approved

Offer
  ☐ Created: Budi Santoso, Production Operator, Start 2025-06-01, Salary 4.5M IDR
  ☐ Submitted for approval
  ☐ Approved → Status: Approved
  ☐ Marked accepted → Budi appears in People as "Pre-Boarding"

EXPECTED: 1 Approved Requisition | 1 Accepted Offer | 1 Pre-Boarding Employee (Budi)
```

---

## Phase 3: Onboarding (10 min) - HR Admin

```
Find Budi Santoso in People, Status: Pre-Boarding

Complete Tasks:
  ☐ Personal Info → DOB, Gender, Phone, Address → Complete
  ☐ Tax Info → NPWP, PTKP → Complete
  ☐ Bank Account → Account # masked, Primary → Complete
  ☐ Policy Acknowledgment → Accepted → Complete
  ☐ System Access → Employee role granted → Complete
  
Final:
  ☐ Activate Employee → Status changes to "Active"
  ☐ All tasks show "Completed"

EXPECTED: Budi status = Active | All onboarding tasks = Completed
```

---

## Phase 4: Attendance Setup (5 min) - HR Admin

```
Shift Templates (Attendance > Shift Templates)
  ☐ Day Shift: 08:00-17:00, 60 min break, 15 min grace
  ☐ Night Shift: 19:00-04:00, 45 min break, 15 min grace

Shift Assignment (Attendance > Shift Assignments)
  ☐ Budi → Day Shift → Effective from 2025-06-01 → Save

Holiday Calendar (Attendance > Holiday Calendar)
  ☐ Add 3-5 holidays for 2025 (Pancasila, Independence, Christmas, etc.)

EXPECTED: 2 Shifts | 1 Assignment (Budi to Day Shift) | 3+ Holidays
```

---

## Phase 5: Attendance Testing (10 min) - Employee (Budi)

**LOGOUT as HR Admin → LOGIN as Budi**

```
Normal Clock In/Out:
  ☐ Clock In: 08:05 (5 min late)
  ☐ Work (simulate 8.5 hours)
  ☐ Clock Out: 17:30 (30 min OT)
  ☐ Verify record shows:
    - Worked: 9h 25m ✓
    - Late: 5 min ✓
    - OT: 1h 25m ✓ (9h25m - 8h shift)

Extended Hours (Overtime):
  ☐ Clock In: 07:00 (1h early)
  ☐ Clock Out: 19:00 (2h overtime)
  ☐ Verify OT: ~3h 40m ✓

Late Arrival:
  ☐ Clock In: 08:45 (45 min late, exceeds 15 min grace)
  ☐ Expected late deduction: 30 min (45 - 15 grace)

EXPECTED: 3 attendance records with correct OT, Late calculations
```

---

## Phase 6: Leave Testing (10 min) - Employee (Budi) + HR Admin

**AS BUDI:**

```
View Leave Balance:
  ☐ Navigate: Leave > My Balances
  ☐ See leave types (Annual, Sick, etc.)

Submit Leave Request:
  ☐ New Request
  ☐ Annual Leave, 3 days: 2025-06-10 to 06-12
  ☐ Reason: Family event
  ☐ Status: Pending

SWITCH TO HR ADMIN:

Approve Leave:
  ☐ Approvals > Find Budi's leave request
  ☐ Click Approve
  ☐ Status: Approved

Check Approval Queue:
  ☐ No pending leave items (cleared)

SWITCH BACK TO BUDI:

Verify Balance Updated:
  ☐ Navigate: Leave > My Balances
  ☐ Annual Leave: Taken Days now = 3 ✓

Submit & Reject Leave:
  ☐ New Request: Sick Leave, 1 day
  ☐ Submit
  
AS HR ADMIN:
  ☐ Reject: "Provide medical certificate"
  
AS BUDI:
  ☐ Verify: Rejected status shows reason
  ☐ Verify: Balance NOT deducted (0 days pending)

EXPECTED: 1 Approved leave | 1 Rejected leave | Balance correctly updated
```

---

## Phase 7: Approval Queue (5 min) - HR Admin

```
Navigate: Approvals

Verify Completed Items:
  ☐ Requisition: Production Operator → Approved (cleared from queue)
  ☐ Offer: Budi Santoso → Accepted (cleared from queue)
  ☐ Leave Request: Approved leave → Cleared from queue
  ☐ Any pending → Listed with dates

Timeline View:
  ☐ Requisition detail: Shows Created → Submitted → Approved with timestamps
  ☐ Offer detail: Shows Complete workflow timeline
  ☐ Leave detail: Shows Requested → Approved with dates

EXPECTED: Approval queue clean | All completed items show full audit trail
```

---

## Phase 8: Employee Self-Service (5 min) - Budi

```
View Profile:
  ☐ Navigate: Profile
  ☐ See: Name, Email, Dept (Production), Location (Yogyakarta)
  ☐ See: Job Title (Production Operator), Hire Date (2025-06-01)
  ☐ See: Employment Type (Full Time)

Edit Profile (limited):
  ☐ Update: Phone, Address → Save works
  ☐ Cannot edit: Employee ID, Dept, Salary, Job Title (restricted) ✓

Data Isolation:
  ☐ CANNOT see other employees in People list (or marked as HR-only)
  ☐ CANNOT see salary/tax data
  ☐ CANNOT see other employee leave/attendance

EXPECTED: Limited self-service access | No cross-employee data visible
```

---

## Phase 9: HR Final Verification (5 min) - HR Admin

```
Employee Master Record:
  ☐ Navigate: People > Budi Santoso
  ☐ Verify all data present:
    - Personal: DOB ✓ Gender ✓ Phone ✓ Address ✓
    - Employment: Dept ✓ Location ✓ Plant ✓ Job Title ✓
    - Tax: NPWP ✓ PTKP ✓
    - Bank: Account (masked) ✓
    - Status: Active ✓

Employment Spell:
  ☐ Current spell shows: Production dept, Yogyakarta, effective 2025-06-01
  ☐ Effective To: Empty/null (current assignment)

Lifecycle Events:
  ☐ Shows: 2025-06-01 - Hired (linked to requisition)
  ☐ No transfers/suspensions yet (correct)

EXPECTED: Complete employee record | All fields populated | Current employment spell active
```

---

## Data Summary After All Phases

| Entity | Count | Status |
|--------|-------|--------|
| Locations | 4 | Active |
| Plants | 4 | Active |
| Departments | 5 | Active |
| Teams | 3 | Active |
| Employees | 1 | Active |
| Requisitions | 1 | Approved |
| Offers | 1 | Accepted |
| Shifts | 2 | Active |
| Shift Assignments | 1 | Active |
| Attendance Records | 3+ | With OT/Late |
| Leave Requests | 2 | (1 Approved, 1 Rejected) |
| Approvals Completed | 5+ | (Requisition, Offer, Leave) |

---

## Critical Pass/Fail Tests

| Test | Must Pass |
|------|-----------|
| Requisition → Approval → Cleared from queue | ✓ |
| Offer → Acceptance → Creates Pre-Boarding employee | ✓ |
| Onboarding → All tasks complete → Activates employee | ✓ |
| Clock in/out → Calculates worked, late, OT minutes correctly | ✓ |
| Leave request → Approval → Balance deducted correctly | ✓ |
| Approval queue → Clears after decisions | ✓ |
| Employee cannot see other employee data | ✓ |
| Audit trail shows who approved what and when | ✓ |

---

## Common Defects to Watch

- [ ] **OT Wrong:** If Budi works 9h 25m (8h shift), OT should be 1h 25m, not 1h 30m
- [ ] **Late Wrong:** If grace is 15 min, 45 min late = 30 min deduction, not 45 min
- [ ] **Balance Not Updated:** After leaving approved, balance shows 0 instead of -3
- [ ] **Approval Stuck:** Item stays in queue after clicking approve
- [ ] **Data Isolation:** Employee sees other employee records (SECURITY BUG)
- [ ] **Workflow Incomplete:** Timeline missing intermediate steps
- [ ] **Shift Shows Too Early:** Shift appears before effective_from date
- [ ] **Cannot Activate:** Onboarding completes but can't activate employee

---

## Estimated Timeline

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1: Org Setup | 5 min | Click intensive but straightforward |
| Phase 2: Recruitment | 10 min | 2 approvals |
| Phase 3: Onboarding | 10 min | 5 tasks to complete |
| Phase 4: Attendance Setup | 5 min | 2 shifts + 1 assignment + holidays |
| Phase 5: Attendance Testing | 10 min | 3 clock in/out scenarios |
| Phase 6: Leave Testing | 10 min | 2 requests (1 approve, 1 reject) |
| Phase 7: Approval Verification | 5 min | Check queue and timelines |
| Phase 8: Employee Self-Service | 5 min | Limited access + data isolation |
| Phase 9: HR Final Verification | 5 min | Master record + lifecycle events |
| **TOTAL** | **~65 min** | Full E2E validation |

---

## Success = All Green

```
✅ Organization created
✅ Hiring workflow complete
✅ Onboarding activated employee
✅ Shifts assigned
✅ Attendance with correct OT/Late calculations
✅ Leave request approved
✅ All approvals cleared from queue
✅ Employee self-service isolated
✅ Complete audit trail
✅ Master record accurate
```

---

Use this for quick smoke testing!
