# ADR 004: Indonesia First Tax Strategy and Payroll Component Design

**Status:** Accepted
**Date:** 2026-04-27

---

## Context

The first target market is Indonesia. Payroll must handle Indonesian statutory requirements: PPh 21 income tax, BPJS Ketenagakerjaan (JHT, JP, JKK, JKM), and BPJS Kesehatan. The long-term goal is to support multiple countries without changing the core payroll engine. HR admins must be able to add and configure custom allowances and deductions (such as night shift allowance, meal allowance, and salary advance deductions) without developer involvement. Tax rates and BPJS contribution bands change annually and must be updatable through data changes, not code deployments.

---

## Decision

### Jurisdiction Engine Architecture

Build a pluggable jurisdiction engine. The core payroll orchestrator calls a jurisdiction-specific engine by country code. Adding a new country means adding a new engine file. Existing engines are not modified.

```
payroll/
├── engines/
│   ├── jurisdiction.interface.ts    ← contract all engines must implement
│   ├── indonesia/
│   │   ├── pph21-ter.engine.ts     ← PPh 21 using TER method (mandatory since 2024)
│   │   └── bpjs.engine.ts          ← all BPJS contributions
│   └── malaysia/                    ← added later, no changes to core
│       ├── pcb.engine.ts
│       └── epf.engine.ts
```

### PPh 21 TER Method

Use the Tarif Efektif Rata-rata (TER) method as mandated by PMK 168/2023, effective January 2024.

TER categories:

| Category | PTKP Status |
|---|---|
| TER A | TK/0 (single, no dependents) |
| TER B | TK/1, TK/2, TK/3, K/0 (married or some dependents) |
| TER C | K/1, K/2, K/3 (married with dependents) |

TER brackets and rates are stored in the `tax_brackets` table with `effective_from` and `effective_to` dates. When the government updates rates, an admin updates the table. No code deployment is required.

### BPJS Contributions

Current rates as of 2025. All rates are stored in the `contribution_bands` table with effective dates.

| Component | Employer | Employee | Notes |
|---|---|---|---|
| JHT | 3.7% | 2.0% | Total 5.7% |
| JP | 2.0% | 1.0% | Total 3%, wage ceiling applies |
| JKK | 0.24–1.74% | — | Employer only, based on risk category |
| JKM | 0.3% | — | Employer only |
| BPJS Kesehatan | 4.0% | 1.0% | Total 5%, salary ceiling Rp 12,000,000/month |

### Payroll Component Catalog

HR admins can create custom earning and deduction components through the UI. Each component has the following attributes:

- `type`: `earning` | `deduction` | `employer_contribution`
- `formula_type`: `fixed` | `pct_of_basic` | `per_shift_day` | `table_lookup`
- `taxable`: whether the component is included in the PPh 21 calculation base
- `statutory`: whether it is a government-mandated contribution (protected from deletion)

Example components an HR admin would configure:

| Component | Type | Formula |
|---|---|---|
| Tunjangan Makan (meal allowance) | earning | fixed Rp 750,000/month |
| Tunjangan Transportasi | earning | fixed per employee |
| Tunjangan Shift Malam (night shift) | earning | per_shift_day x rate |
| Potongan Kasbon (salary advance) | deduction | fixed amount entered per run |

### Tax Configuration and Annual Updates

Tax brackets, PTKP categories, and contribution bands are stored with `effective_from` and `effective_to` dates. When annual updates occur:

1. An admin inserts new rows with the new `effective_from` date.
2. The engine queries for the row that was effective on the payroll period's `pay_date`.
3. Historical records are preserved so past payroll runs can be recalculated accurately.

---

## Consequences

- PPh 21 TER is more complex to implement than a simple progressive calculation but is legally required from 2024. Using the wrong method produces incorrect tax withholding.
- HR admins have the power to configure allowances but also carry the responsibility. An incorrect `formula_type` will produce incorrect payroll output. Clear documentation and input validation in the UI are required.
- Annual tax table updates require a data migration or admin UI action. They do not require a code deployment or developer involvement.
- Adding a new country (such as Malaysia or Singapore) requires writing a new engine file only. The core payroll orchestrator and existing engines are unchanged.

---

## Alternatives Considered

**Hardcode Indonesian rates in application logic**

Simplest to implement initially but requires a code deployment every time the government changes rates. This happens every year for BPJS and periodically for PPh 21 brackets. Ruled out.

**Single generic tax engine with configuration tables**

Appealing in theory but tax logic varies significantly between jurisdictions (TER vs progressive, different exemption categories, different contribution base definitions). A single generic engine becomes a complex rule interpreter. The pluggable engine approach keeps each jurisdiction's logic isolated and testable.

**Use a third-party payroll calculation library**

No mature, Indonesia-specific open-source library exists that covers TER, BPJS, and custom components in a single package. Building in-house is the only viable option for accurate Indonesian compliance.
