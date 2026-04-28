# ADR 013: Reporting Storage Strategy

**Status:** Accepted
**Date:** 2026-04-28

---

## Context

HR reports include headcount snapshots, turnover analysis, attendance summaries, payroll cost breakdowns, and compliance exports. These reports query across large date ranges and aggregate data from multiple tables. Running these queries directly against the OLTP PostgreSQL database risks degrading response times for transactional operations (leave submissions, payroll runs, attendance writes) and creates long-running locks during report generation.

---

## Decision

### Phase 1: Reporting Views on the OLTP Database

In Phase 1, reports are served from PostgreSQL materialised views and pre-computed summary tables. This avoids introducing a separate data warehouse at a stage when data volume is low and the report set is limited.

**Approach:**
- Create a dedicated `reporting` schema in the same PostgreSQL database.
- Populate it with materialised views refreshed on a BullMQ schedule (nightly by default, with manual refresh available for HR admins).
- Report queries read from the `reporting` schema only — they never join against the live OLTP tables.
- The API serves report data from the `reporting` schema via a dedicated `ReportingModule`.

**Materialised views included in Phase 1:**

| View | Refresh cadence | Description |
|---|---|---|
| `reporting.headcount_daily` | Nightly | Employee count by location, department, and date |
| `reporting.turnover_monthly` | Nightly | Hires, exits, and turnover rate by month |
| `reporting.attendance_summary_daily` | Nightly | Present/absent/late counts by location and date |
| `reporting.payroll_cost_monthly` | After payroll finalisation | Gross, net, tax, and BPJS totals by department |
| `reporting.leave_balance_snapshot` | Nightly | Leave balances by employee and type |

### Phase 2+: Separate Read Replica or Analytical Store

When data volume or report complexity outgrows materialised views, the strategy evolves:

1. **Read replica first:** Add a PostgreSQL read replica. Point the reporting service at the replica. No schema changes required.
2. **ClickHouse or DuckDB second:** If analytical query latency becomes a problem, introduce a column-oriented store. Populate it via Change Data Capture (CDC) using Debezium or a BullMQ-based export job.

This phased approach avoids over-engineering for Phase 1 data volumes while leaving a clear upgrade path.

### Report Generation for Exports

Large report exports (CSV, PDF) are generated as BullMQ jobs. The API returns a job ID immediately; the client polls `/api/v1/reports/jobs/:jobId` for status. When the job is complete, a pre-signed download URL is returned. This prevents HTTP timeouts on large exports and allows the UI to show a progress indicator.

### Data Retention

- Materialised views are snapshots only — they do not store data that cannot be recomputed from the OLTP tables.
- Payroll and attendance records in the OLTP database are append-only and never deleted (ADR on audit and compliance, to be written).
- Exported files are stored in the configured object storage (local filesystem for client-hosted, S3-compatible for cloud) and expire after 24 hours.

---

## Consequences

- **Phase 1 simplicity:** No additional infrastructure is required beyond the existing PostgreSQL instance. The reporting schema is managed by Drizzle migrations alongside the OLTP schema.
- **Refresh lag:** Nightly materialised view refreshes mean reports may be up to 24 hours stale. For most HR reporting use cases this is acceptable. Real-time dashboards that require live data must query the OLTP tables directly via dedicated, indexed queries — not via the materialised views.
- **Migration path is data-only:** Moving to a read replica or analytical store in Phase 2 requires repointing the reporting service connection string and recreating the views/tables in the new store. No application logic changes are required beyond the data access layer.
