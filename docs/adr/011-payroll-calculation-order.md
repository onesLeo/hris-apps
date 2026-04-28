# ADR 011: Payroll Calculation Order

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

A payroll run involves multiple calculation steps that have hard dependencies between them: gross pay must be known before tax can be calculated; attendance deductions must be subtracted before the taxable base is finalised; BPJS contributions use a capped salary figure that is different from the gross figure. Without a defined and enforced calculation order, implementations drift and produce incorrect results.

---

## Decision

### Calculation Stages

A payroll run executes the following stages in strict sequence. Each stage reads the outputs of the stages above it and writes its own outputs into the `payroll_run_items` record. No stage may read from a stage that has not yet completed.

```
Stage 1  — Base Salary Resolution
Stage 2  — Attendance Deductions
Stage 3  — Earning Components
Stage 4  — Gross Pay
Stage 5  — BPJS Contribution Calculation
Stage 6  — PPh 21 TER Calculation
Stage 7  — Other Deductions
Stage 8  — Net Pay
Stage 9  — Employer Contribution Summary
Stage 10 — Run Finalisation
```

### Stage Definitions

**Stage 1: Base Salary Resolution**
- Reads the employee's effective salary record for the payroll period's `pay_date`.
- Uses the employment spell model to handle mid-period promotions (pro-rate by calendar days if the effective date falls within the period).
- Output: `base_salary`

**Stage 2: Attendance Deductions**
- Reads normalised attendance records for the period.
- Applies policy-resolved rules for late arrivals, early departures, and unauthorised absences.
- Output: `attendance_deduction_amount`, `deduction_detail_json`

**Stage 3: Earning Components**
- Evaluates all `earning` type payroll components assigned to the employee (via the 5-level policy hierarchy, ADR 008).
- Supports `fixed`, `pct_of_basic`, `per_shift_day` formula types.
- Output: `earnings_total`, `earnings_breakdown_json`

**Stage 4: Gross Pay**
- `gross_pay = base_salary - attendance_deduction_amount + earnings_total`
- Output: `gross_pay`

**Stage 5: BPJS Contribution Calculation**
- Reads BPJS rates from `contribution_bands` effective on `pay_date`.
- BPJS Kesehatan salary cap: Rp 12,000,000/month (capped, not `gross_pay`).
- JP salary ceiling applies separately.
- Calculates employee and employer shares for all 5 BPJS components.
- Output: `bpjs_employee_total`, `bpjs_employer_total`, `bpjs_breakdown_json`

**Stage 6: PPh 21 TER Calculation**
- Taxable income base: `gross_pay + taxable_allowances - bpjs_employee_total` (BPJS employee share reduces the tax base).
- Selects TER category (A/B/C) from employee's PTKP status.
- Reads applicable TER bracket from `tax_brackets` effective on `pay_date`.
- Output: `pph21_amount`, `ter_category`, `ter_rate`, `taxable_income`

**Stage 7: Other Deductions**
- Evaluates all `deduction` type payroll components (salary advances, loan repayments, etc.).
- Output: `other_deductions_total`, `other_deductions_breakdown_json`

**Stage 8: Net Pay**
- `net_pay = gross_pay - bpjs_employee_total - pph21_amount - other_deductions_total`
- Output: `net_pay`

**Stage 9: Employer Contribution Summary**
- Aggregates employer-side costs: `base_salary + earnings_total + bpjs_employer_total`.
- Output: `total_employer_cost`

**Stage 10: Run Finalisation**
- Validates that all items in the run have status `completed`.
- Locks the run (`status = finalised`). Finalised runs are immutable.
- Emits `payroll.run.finalised` event.

### Immutability After Finalisation

Once a run is finalised, no `payroll_run_items` row may be updated. Corrections require a new adjustment run referencing the original run ID. This is required for audit compliance.

### Mid-Period Changes

If an employee's salary changes mid-period, Stage 1 calculates two sub-periods and sums the pro-rated amounts. The calculation detail is written to `salary_proration_json`.

---

## Consequences

- **Correctness:** The stage order enforces the legal calculation sequence mandated by Indonesian tax law (gross before TER, BPJS employee share reduces taxable base).
- **Testability:** Each stage is a pure function of its inputs. Stage-level unit tests can verify correctness independently.
- **Auditability:** Every intermediate value is stored in the `payroll_run_items` record. Any historical run can be inspected to understand exactly how the net pay was derived.
- **Constraint:** Stages must not be reordered or parallelised. Any future jurisdiction engine must follow the same stage contract.
