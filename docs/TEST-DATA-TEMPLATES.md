# Test Data Templates - Copy/Paste Ready

Use these templates to quickly fill in forms during testing. Just copy the values.

---

## PHASE 1: ORGANIZATION STRUCTURE

### Location 1: Jakarta HQ

```
Name:              Jakarta HQ
Code:              HQ
Country:           Indonesia
State/Province:    DKI Jakarta
Address:           Jl. Sudirman No. 1, Jakarta Pusat
Timezone:          Asia/Jakarta
Clocking Method:   Manual
Status:            Active
```

### Location 2: Yogyakarta Branch

```
Name:              Yogyakarta Branch
Code:              YOG
Country:           Indonesia
State/Province:    D.I. Yogyakarta
Address:           Jl. Malioboro No. 100, Yogyakarta
Timezone:          Asia/Jakarta
Clocking Method:   Manual
Status:            Active
```

### Location 3: Jakarta Branch

```
Name:              Jakarta Branch
Code:              JKT
Country:           Indonesia
State/Province:    DKI Jakarta
Address:           Jl. Gatot Subroto No. 50, Jakarta
Timezone:          Asia/Jakarta
Clocking Method:   Manual
Status:            Active
```

### Location 4: Surabaya Branch

```
Name:              Surabaya Branch
Code:              SBY
Country:           Indonesia
State/Province:    Jawa Timur
Address:           Jl. Ahmad Yani No. 200, Surabaya
Timezone:          Asia/Jakarta
Clocking Method:   Manual
Status:            Active
```

---

### Plant 1: HQ Assembly Plant

```
Location:          Jakarta HQ
Name:              HQ Assembly Plant
Code:              HQ-ASM
Manager:           (leave empty for now)
Status:            Active
```

### Plant 2: Yogyakarta Plant A

```
Location:          Yogyakarta Branch
Name:              Yogyakarta Plant A
Code:              YOG-A
Manager:           (leave empty for now)
Status:            Active
```

### Plant 3: Jakarta Plant A

```
Location:          Jakarta Branch
Name:              Jakarta Plant A
Code:              JKT-A
Manager:           (leave empty for now)
Status:            Active
```

### Plant 4: Surabaya Plant A

```
Location:          Surabaya Branch
Name:              Surabaya Plant A
Code:              SBY-A
Manager:           (leave empty for now)
Status:            Active
```

---

### Departments (All under Jakarta HQ location)

```
Department 1:
  Name:            HR
  Code:            HR
  Location:        Jakarta HQ
  Manager:         (leave empty)
  Status:          Active

Department 2:
  Name:            Operations
  Code:            OPS
  Location:        Jakarta HQ
  Manager:         (leave empty)
  Status:          Active

Department 3:
  Name:            Production
  Code:            PROD
  Location:        Jakarta HQ
  Manager:         (leave empty)
  Status:          Active

Department 4:
  Name:            Maintenance
  Code:            MAINT
  Location:        Jakarta HQ
  Manager:         (leave empty)
  Status:          Active

Department 5:
  Name:            Finance
  Code:            FIN
  Location:        Jakarta HQ
  Manager:         (leave empty)
  Status:          Active
```

---

### Teams

```
Team 1:
  Name:            HQ People Ops
  Department:      HR
  Lead:            (leave empty)
  Status:          Active

Team 2:
  Name:            Yogyakarta Day Shift
  Department:      Production
  Lead:            (leave empty)
  Status:          Active

Team 3:
  Name:            Jakarta Night Shift
  Department:      Production
  Lead:            (leave empty)
  Status:          Active
```

---

## PHASE 2: RECRUITMENT

### Requisition

```
Job Title:         Production Operator
Department:        Production
Location:          Yogyakarta Branch
Quantity:          1
Employment Type:   Full Time
Description:       Full-time production line operator with shift work experience. 
                   Responsible for operating machinery on production line, 
                   monitoring output, and maintaining safety protocols.
Priority:          Medium
Salary Range:      4,000,000 - 5,500,000 IDR
Required Skills:   Machine operation, attention to detail, teamwork
Status:            Draft
```

---

### Offer

```
Candidate Name:    Budi Santoso
Candidate Email:   budi.santoso@example.com
Position:          Production Operator
Department:        Production
Location:          Yogyakarta Branch
Employment Type:   Full Time
Start Date:        2025-06-01
Salary:            4,500,000
Currency:          IDR
Contract Type:     Permanent
Notice Period:     30 days
Notes:             Offer for experienced operator with 3 years manufacturing experience

Interview Rating:  4.5/5 (if tracked)
Recommendation:    Strong candidate, accepted 2025-05-20
```

---

## PHASE 3: ONBOARDING

### Task 1: Personal Information Verification

```
Date of Birth:     1990-05-15
Gender:            Male
Nationality:       Indonesian
Phone:             +62 812-3456-7890
Address:           Jl. Yogyakarta No. 123
City:              Yogyakarta
Province:          D.I. Yogyakarta
Postal Code:       55000
```

### Task 2: Tax Information

```
NPWP:              12.345.678.9-012.345
NPWP Status:       Active
PTKP Category:     TK-0 (Unmarried)
Proof Document:    (Upload dummy file)
```

### Task 3: Bank Account Details

```
Bank Name:         Bank Mandiri
Account Number:    0123456789
Account Holder:    Budi Santoso
Account Type:      Savings Account
Is Primary:        Yes
Notes:             Main salary account
```

### Task 4: Policy Acknowledgment

```
Policies to Accept:
  ☑ Employee Handbook
  ☑ Code of Conduct
  ☑ Confidentiality Agreement
  ☑ Data Protection Policy

Signature:         Digitally accepted
Acknowledgment:    I acknowledge and accept all company policies
Date:              (Auto-filled with today's date)
```

### Task 5: System Access Provisioning

```
User Role:         Employee
Applications:      
  ☑ Attendance System
  ☑ Leave Management
  ☑ Employee Profile
  ☑ Reports (Read-only)
Email:             budi.santoso@example.com
Status:            Active
```

---

## PHASE 4: ATTENDANCE SETUP

### Shift Template 1: Day Shift

```
Name:              Day Shift
Code:              DAY
Start Time:        08:00
End Time:          17:00
Break Minutes:     60
Grace (Late):      15
Status:            Active
```

### Shift Template 2: Night Shift

```
Name:              Night Shift
Code:              NIGHT
Start Time:        19:00
End Time:          04:00 (next day)
Break Minutes:     45
Grace (Late):      15
Status:            Active
```

---

### Shift Assignment

```
Employee:          Budi Santoso
Shift:             Day Shift
Effective From:    2025-06-01
Effective To:      (Leave empty = ongoing)
Status:            Active
```

---

### Holiday Calendar 2025

```
Holiday 1:
  Date:            2025-01-01
  Name:            New Year's Day
  Type:            Public Holiday

Holiday 2:
  Date:            2025-06-01
  Name:            Pancasila Day
  Type:            Public Holiday

Holiday 3:
  Date:            2025-08-17
  Name:            Independence Day
  Type:            Public Holiday

Holiday 4:
  Date:            2025-12-25
  Name:            Christmas Day
  Type:            Public Holiday

Holiday 5:
  Date:            2025-12-26
  Name:            Joint Leave
  Type:            Company Holiday
```

---

## PHASE 5: ATTENDANCE TESTING

### Scenario 1: Normal Day with Late + Overtime

**TIME TRACKING (as employee Budi):**

```
Shift:             Day Shift (08:00-17:00, 60 min break = 8h work)
Clock In:          08:05
Clock Out:         17:30
Actual Worked:     9 hours 25 minutes

CALCULATIONS:
  Clock span:      08:05 to 17:30 = 9h 25m
  Minus break:     9h 25m - 60 min = 8h 25m NET WORKED
  Expected shift:  8h 00m
  Late deduction:  08:05 - 08:00 = 5 min (within 15 min grace → 0 deduction)
  Overtime:        8h 25m - 8h = 25 min ✓

VERIFY IN SYSTEM:
  - Worked: 8h 25m
  - Late: 0 min (within grace)
  - Overtime: 25 min
```

### Scenario 2: Extended Hours (Heavy Overtime)

```
Shift:             Day Shift (08:00-17:00)
Clock In:          07:00 (1h early)
Clock Out:         19:00 (2h overtime)
Actual Worked:     ~11h 40m

CALCULATIONS:
  Clock span:      07:00 to 19:00 = 12h
  Minus break:     12h - 60 min = 11h
  Expected shift:  8h
  Overtime:        11h - 8h = 3h ✓

VERIFY IN SYSTEM:
  - Worked: 11h 00m
  - Late: 0 min (early)
  - Overtime: 3h
```

### Scenario 3: Late Arrival (Exceeds Grace)

```
Shift:             Day Shift (08:00-17:00)
Grace Period:      15 minutes
Clock In:          08:45 (45 minutes late)
Clock Out:         17:00

CALCULATIONS:
  Late amount:     08:45 - 08:00 = 45 min
  Grace used:      15 min
  Actual deduction: 45 - 15 = 30 min
  Worked:          8h 15m (worked from 08:45 to 17:00 = 8h 15m)
  Overtime:        8h 15m - 8h = 15 min

VERIFY IN SYSTEM:
  - Clock In: 08:45
  - Late: 30 min
  - Worked: ~8h 15m
  - Overtime: 15 min
```

---

## PHASE 6: LEAVE MANAGEMENT

### Leave Request 1: Approved (Annual Leave)

```
Employee:          Budi Santoso
Leave Type:        Annual Leave
From Date:         2025-06-10
To Date:           2025-06-12
Days:              3
Reason:            Family event in hometown
Status:            Pending (then Approved)

BEFORE APPROVAL:
  Annual Leave Balance:
    - Entitled: X days
    - Taken: 0 days
    - Pending: 3 days ← (pending request)

AFTER APPROVAL:
  Annual Leave Balance:
    - Entitled: X days
    - Taken: 3 days ← (updated)
    - Pending: 0 days
```

### Leave Request 2: Rejected (Sick Leave)

```
Employee:          Budi Santoso
Leave Type:        Sick Leave
From Date:         2025-06-20
To Date:           2025-06-20
Days:              1
Reason:            Medical appointment
Status:            Pending (then Rejected)

Rejection Reason:  Please provide medical certificate with supporting documents

RESULT:
  - Status: Rejected
  - Balance unchanged (0 days taken, 0 days pending)
  - Employee can resubmit with attachments
```

### Leave Request 3: Cancellation (Cancel Approved)

```
Original Request:
  - Leave Type:    Annual Leave
  - From Date:     2025-06-10
  - To Date:       2025-06-12
  - Status:        Approved
  - Days Taken:    3

After Cancellation:
  - Status:        Cancelled
  - Days Taken:    0 ← (reverted)
  - Reason:        Plans changed
  
VERIFY:
  - Leave balance restored to 0 taken days
  - Approval timeline shows cancellation
```

---

## PHASE 7 & 8: EMPLOYEE SELF-SERVICE DATA

### Employee Profile (as Budi)

```
Full Name:         Budi Santoso
Employee ID:       (Auto-generated, e.g., EMP-001)
Email:             budi.santoso@example.com
Phone:             +62 812-3456-7890
Date of Birth:     1990-05-15
Gender:            Male
Nationality:       Indonesian

Employment Info:
  Department:      Production
  Location:        Yogyakarta Branch
  Plant:           Yogyakarta Plant A
  Job Title:       Production Operator
  Hire Date:       2025-06-01
  Employment Type: Full Time
  Work Arrangement: Office
  Status:          Active

Address:           Jl. Yogyakarta No. 123
City:              Yogyakarta
Province:          D.I. Yogyakarta
```

### Profile Update (Limited Self-Service)

```
CAN EDIT:
  ☑ Phone: +62 812-9999-8888
  ☑ Address: Jl. Baru No. 456
  ☑ City: Yogyakarta
  ☑ Personal preferences (if available)

CANNOT EDIT (HR Only):
  ☐ Employee ID
  ☐ Name
  ☐ Department
  ☐ Location
  ☐ Job Title
  ☐ Hire Date
  ☐ Salary
  ☐ Employment Type
```

---

## PHASE 9: AUDIT VERIFICATION

### Approval Timeline - Requisition

```
EVENT 1 - Created:
  Timestamp:       2025-05-15 10:30 AM
  Actor:           HR Admin
  Action:          Created requisition
  Details:         "Production Operator" for Production dept

EVENT 2 - Submitted:
  Timestamp:       2025-05-15 10:45 AM
  Actor:           HR Admin
  Action:          Submitted for approval
  Details:         Waiting for approval

EVENT 3 - Approved:
  Timestamp:       2025-05-15 11:00 AM
  Actor:           HR Admin
  Action:          Approved
  Details:         Approved - hiring need confirmed

FINAL STATUS:      Approved
```

### Approval Timeline - Offer

```
EVENT 1 - Created:
  Timestamp:       2025-05-17 09:00 AM
  Actor:           HR Admin
  Action:          Created offer
  Details:         Budi Santoso for Production Operator

EVENT 2 - Submitted:
  Timestamp:       2025-05-17 09:15 AM
  Actor:           HR Admin
  Action:          Submitted for approval
  Details:         Waiting for approval

EVENT 3 - Approved:
  Timestamp:       2025-05-17 09:30 AM
  Actor:           HR Admin
  Action:          Approved
  Details:         (no additional notes)

EVENT 4 - Accepted:
  Timestamp:       2025-05-20 02:00 PM
  Actor:           System (candidate accepted via email link)
  Action:          Accepted by candidate
  Details:         Ready for onboarding

FINAL STATUS:      Accepted
```

### Approval Timeline - Leave Request

```
EVENT 1 - Submitted:
  Timestamp:       2025-06-09 02:30 PM
  Actor:           Budi Santoso
  Action:          Submitted leave request
  Details:         Annual Leave, 3 days (2025-06-10 to 06-12)
                   Reason: Family event in hometown

EVENT 2 - Approved:
  Timestamp:       2025-06-09 04:45 PM
  Actor:           HR Admin
  Action:          Approved
  Details:         Approved - dates clear
                   Balance updated: +3 days to Taken

FINAL STATUS:      Approved
BALANCE IMPACT:    Annual Leave Taken: 0 → 3 days
```

---

## VALIDATION VALUES AFTER ALL PHASES

```
ORGANIZATION STRUCTURE:
  Locations:             4 (Jakarta HQ, YOG, JKT, SBY)
  Plants:                4 (one per location)
  Departments:           5 (HR, OPS, PROD, MAINT, FIN)
  Teams:                 3 (HQ People Ops, Yogyakarta Day Shift, Jakarta Night Shift)
  Employees:             1 (Budi Santoso - Active)

RECRUITMENT:
  Requisitions:          1 (Production Operator - Approved)
  Offers:                1 (Budi Santoso - Accepted)
  Pre-Boarding:          0 (converted to Active)

ONBOARDING:
  Onboarding Cases:      1 (Budi - Completed/Activated)
  Onboarding Tasks:      5 (all Completed)

ATTENDANCE:
  Shifts:                2 (Day, Night)
  Shift Assignments:     1 (Budi → Day Shift)
  Attendance Records:    3+ (with various scenarios)
  Holiday Calendar:      5 holidays

LEAVE:
  Leave Requests:        2 (1 Approved, 1 Rejected)
  Leave Balance Changes: Annual Leave -3 days (approved request)

APPROVALS:
  Completed Approvals:   5+ (Requisition, Offer, Leave)
  Approval Queue:        0 (all cleared)
```

---

## Tips for Faster Testing

1. **Copy-Paste Email:** Use `budi.santoso@example.com` for all references
2. **Use Today's Date:** For actual dates, use current date, not 2025-06-01 (unless testing past dates)
3. **Repeat Dates:** For testing multiple scenarios same day, use same date
4. **Timezone:** All times automatically in `Asia/Jakarta` timezone per location
5. **Keep IDs:** Once created, note location/dept IDs for quick dropdown selection
6. **Screenshot:** Take screenshot after Phase 1 org setup as baseline
7. **Bookmark URLs:** Bookmark `/People`, `/Attendance`, `/Leave` for quick navigation

---

End of Test Data Templates
