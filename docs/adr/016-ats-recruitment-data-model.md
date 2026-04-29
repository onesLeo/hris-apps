# ADR 016: ATS and Recruitment Data Model

**Status:** Accepted
**Date:** 2026-04-29

---

## Context

The current recruitment module is a frontend-only prototype with hardcoded mock data. It demonstrates the correct vocabulary and 4-stage pipeline (Sourcing → Screening → Interview → Offer) but has no backend, no persistence, and no relational model linking candidates to requisitions.

A real ATS must manage the full hiring lifecycle: headcount request and approval, sourcing, application intake, multi-round interviews with scorecards, offer approval, and the handoff that converts an accepted offer into an employee record. Without a proper data model, the system cannot replace a real ATS or position itself as a premium HRIS.

Two structural gaps in the current prototype must be resolved before implementation:

1. **Candidate and requisition are unrelated lists.** In reality one candidate can apply to multiple open roles simultaneously. The join entity — the *application* — is the unit that carries stage, interview history, and offer data. Without it the model cannot represent real hiring activity.

2. **No interview scorecard model.** The scorecard is the data artefact that drives the hire/no-hire decision. Without it, the system is a list tracker, not an ATS.

---

## Decision

### Core Entities and Relationships

```
job_requisitions
  └── job_applications          (one requisition → many applications)
        └── application_stage_log   (append-only stage history)
        └── interviews              (one application → many rounds)
              └── interview_scorecards  (one round → one card per interviewer)
        └── job_offers              (one application → at most one active offer)
              └── offer_approvals      (offer approval chain, reuses workflow engine)

candidates                      (independent of requisitions — reusable talent pool)
  └── job_applications          (one candidate → many applications across roles)

scorecard_templates             (per job family or per requisition)
  └── scorecard_criteria        (the dimensions being rated)
```

---

### Table Definitions

#### `job_requisitions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK | RLS anchor |
| `title` | varchar(200) | e.g. "Senior Backend Engineer" |
| `department_id` | uuid FK → departments | |
| `location_id` | uuid FK → locations | |
| `job_family` | varchar(100) | Groups roles for scorecard template lookup |
| `job_grade` | varchar(50) | Links to compensation band |
| `headcount` | smallint | Number of openings |
| `filled_count` | smallint | Incremented on each hire |
| `justification` | text | Replacement vs. new headcount narrative |
| `job_description_html` | text | Rich-text JD stored as sanitised HTML |
| `status` | enum | `draft` → `open` → `on_hold` → `filled` \| `cancelled` |
| `priority` | enum | `high` \| `medium` \| `low` |
| `target_start_date` | date | |
| `recruiter_id` | uuid FK → users | Assigned internal recruiter |
| `hiring_manager_id` | uuid FK → users | |
| `workflow_instance_id` | uuid FK → workflow_instances | Requisition approval workflow |
| `opened_at` | timestamptz | When status moved to `open` |
| `closed_at` | timestamptz | When status moved to `filled` or `cancelled` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Status transitions:
```
draft → open          (requisition approved)
open  → on_hold       (hiring paused)
open  → filled        (headcount reached, auto-set when filled_count = headcount)
open  → cancelled     (role withdrawn)
on_hold → open        (hiring resumed)
```

---

#### `candidates`

Candidates are **not** system users. They are external people in the talent pool. A candidate record persists across multiple applications and is never deleted — only anonymised on a privacy request.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK | RLS anchor |
| `full_name` | varchar(200) | |
| `email` | varchar(254) | Unique per tenant — used for duplicate detection |
| `phone` | varchar(30) | |
| `source` | enum | `linkedin` \| `referral` \| `career_site` \| `job_board` \| `agency` \| `community` \| `other` |
| `source_detail` | varchar(200) | Agency name, referrer employee ID, board name |
| `resume_file_key` | varchar(500) | Object storage key (S3 / MinIO) |
| `linkedin_url` | varchar(500) | |
| `anonymised_at` | timestamptz | Set on privacy erasure; PII columns nulled after this |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Duplicate detection: on application intake, check for an existing `candidates` row with the same `email` within the tenant. If found, link the new application to the existing candidate rather than creating a duplicate.

---

#### `job_applications`

The join entity. Every candidate-to-requisition pairing is one application row.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK | RLS anchor |
| `requisition_id` | uuid FK → job_requisitions | |
| `candidate_id` | uuid FK → candidates | |
| `stage` | enum | `new` \| `screening` \| `interview` \| `offer` \| `hired` \| `rejected` \| `withdrawn` |
| `rejection_reason` | enum nullable | `underqualified` \| `overqualified` \| `culture_fit` \| `withdrew` \| `offer_declined` \| `position_filled` \| `other` |
| `rejection_note` | text nullable | Free-text detail (internal only) |
| `privacy_consent_at` | timestamptz | When candidate consented to data processing |
| `applied_at` | timestamptz | |
| `updated_at` | timestamptz | |
| UNIQUE | `(tenant_id, requisition_id, candidate_id)` | One application per candidate per role |

Stage transitions:
```
new → screening → interview → offer → hired
                                    → rejected (at any stage)
                → rejected
new → withdrawn (candidate drops out at any stage)
```

---

#### `application_stage_log`

Append-only audit trail of every stage change on an application.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid FK → job_applications | |
| `from_stage` | enum nullable | null on first entry |
| `to_stage` | enum | |
| `changed_by` | uuid FK → users | |
| `note` | text nullable | |
| `changed_at` | timestamptz | |

---

#### `interviews`

One row per interview round. A single application may have multiple rounds (HR screening, technical panel, hiring manager, C-level).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK | RLS anchor |
| `application_id` | uuid FK → job_applications | |
| `round_number` | smallint | 1, 2, 3 … |
| `interview_type` | enum | `phone` \| `video` \| `onsite` \| `technical` \| `panel` \| `case_study` |
| `scheduled_at` | timestamptz nullable | |
| `duration_minutes` | smallint | |
| `meeting_link` | varchar(500) nullable | Zoom / Teams URL |
| `scorecard_template_id` | uuid FK → scorecard_templates nullable | |
| `overall_recommendation` | enum nullable | `strong_hire` \| `hire` \| `no_hire` \| `strong_no_hire` — set after all scorecards submitted |
| `status` | enum | `scheduled` \| `completed` \| `cancelled` \| `no_show` |
| `created_at` | timestamptz | |

---

#### `interview_interviewers`

Which users are on the panel for a given interview round.

| Column | Type | Notes |
|---|---|---|
| `interview_id` | uuid FK → interviews | |
| `user_id` | uuid FK → users | |
| `is_lead` | boolean | Lead interviewer coordinates the round |
| PK | `(interview_id, user_id)` | |

---

#### `interview_scorecards`

One scorecard per interviewer per round. An interview round is considered complete when all assigned interviewers have submitted.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `interview_id` | uuid FK → interviews | |
| `interviewer_id` | uuid FK → users | |
| `recommendation` | enum | `strong_hire` \| `hire` \| `no_hire` \| `strong_no_hire` |
| `overall_score` | smallint | 1–5 |
| `strengths` | text nullable | |
| `concerns` | text nullable | |
| `submitted_at` | timestamptz nullable | null = draft |
| `created_at` | timestamptz | |

---

#### `scorecard_templates` and `scorecard_criteria`

Reusable evaluation dimensions per job family. HR defines these once; they are attached to interview rounds automatically based on `job_requisitions.job_family`.

```
scorecard_templates
  id, tenant_id, name, job_family, created_at

scorecard_criteria
  id, template_id, criterion_name, description, weight, display_order
  -- e.g. "System Design", "Communication", "Culture Fit"
```

`interview_scorecard_ratings` (per criterion, per scorecard):
```
  scorecard_id FK, criterion_id FK, score (1–5), comment
  PK (scorecard_id, criterion_id)
```

---

#### `job_offers`

One offer per application. Only one offer can be `active` at a time; a declined offer can be followed by a revised offer.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK | RLS anchor |
| `application_id` | uuid FK → job_applications | |
| `offer_version` | smallint | 1 = first offer; 2 = revised after negotiation |
| `base_salary` | numeric(14,2) | Encrypted at rest via EncryptionService |
| `currency` | char(3) | ISO 4217 |
| `allowances_json` | jsonb | Named allowances: `[{name, amount}]` |
| `employment_type` | enum | `permanent` \| `contract` \| `probation` |
| `probation_months` | smallint nullable | |
| `proposed_start_date` | date | |
| `offer_letter_file_key` | varchar(500) nullable | Signed offer letter in object storage |
| `status` | enum | `draft` → `pending_approval` → `sent` → `accepted` \| `declined` \| `expired` \| `withdrawn` |
| `expires_at` | timestamptz | |
| `workflow_instance_id` | uuid FK → workflow_instances | Offer approval chain |
| `sent_at` | timestamptz nullable | |
| `responded_at` | timestamptz nullable | |
| `created_by` | uuid FK → users | |
| `created_at` | timestamptz | |

Status transitions:
```
draft → pending_approval  (submitted for internal approval)
pending_approval → sent   (workflow approved; offer delivered to candidate)
sent → accepted           (candidate signs)
sent → declined           (candidate rejects)
sent → expired            (expires_at passed with no response)
sent → withdrawn          (company retracts before response)
accepted → (triggers onboarding handoff — see below)
```

---

### Onboarding Handoff

When `job_offers.status` transitions to `accepted`:

1. Emit domain event `recruitment.offer.accepted` (payload: `offer_id`, `application_id`, `candidate_id`, `requisition_id`, `proposed_start_date`, `base_salary`, `currency`, `employment_type`).
2. An `OnboardingHandler` subscribes and:
   - Creates a `employees` row pre-populated from `candidates` (name, email, phone) and `job_offers` (salary, start date, employment type, department, location from the requisition).
   - Sets `employees.status = 'pre_boarding'` (new status, not yet `active`).
   - Creates an `onboarding_cases` row linked to the employee (Phase 3 module).
3. Increments `job_requisitions.filled_count`; sets `status = 'filled'` if `filled_count = headcount`.

This is the canonical boundary between the ATS and the HR core. The ATS domain is responsible up to offer acceptance. The employee module owns the record from that point forward.

---

### Domain Events

Following ADR 003, the ATS emits the following events via EventEmitter2:

| Event | Trigger | Consumers |
|---|---|---|
| `recruitment.requisition.opened` | Status → `open` | Notification module |
| `recruitment.application.received` | Application created | Notification to recruiter |
| `recruitment.application.stage_changed` | Stage transition | Notification to candidate + recruiter |
| `recruitment.interview.scheduled` | Interview row created with `scheduled_at` | Calendar/notification |
| `recruitment.offer.sent` | Offer status → `sent` | Notification to candidate |
| `recruitment.offer.accepted` | Offer status → `accepted` | **Onboarding handler** (creates employee + onboarding case) |
| `recruitment.offer.declined` | Offer status → `declined` | Notification to recruiter |
| `recruitment.requisition.filled` | `filled_count = headcount` | Notification to hiring manager |

---

### API Endpoints (Phase 9)

```
POST   /api/v1/requisitions                        Create requisition (draft)
PATCH  /api/v1/requisitions/:id                    Update requisition
POST   /api/v1/requisitions/:id/submit             Submit for approval
GET    /api/v1/requisitions                        List (cursor-paginated, filterable by status)
GET    /api/v1/requisitions/:id                    Detail with pipeline counts

POST   /api/v1/candidates                          Create candidate (intake form or manual)
GET    /api/v1/candidates/:id                      Candidate profile

POST   /api/v1/requisitions/:id/applications       Apply (links candidate to requisition)
PATCH  /api/v1/applications/:id/stage              Advance or reject application
GET    /api/v1/requisitions/:id/applications       List applications for a role

POST   /api/v1/applications/:id/interviews         Schedule an interview round
PATCH  /api/v1/interviews/:id                      Update schedule / status
POST   /api/v1/interviews/:id/scorecards           Submit scorecard (interviewer)
GET    /api/v1/interviews/:id/scorecards           List scorecards for a round

POST   /api/v1/applications/:id/offers             Create offer (draft)
POST   /api/v1/offers/:id/submit                   Submit offer for approval
POST   /api/v1/offers/:id/send                     Mark as sent to candidate
POST   /api/v1/offers/:id/accept                   Record candidate acceptance → triggers handoff
POST   /api/v1/offers/:id/decline                  Record candidate decline
```

---

### Frontend Screens (Phase 9)

The existing `RecruitmentScreen` UI is a valid starting point. The following additions are needed:

1. **Requisition detail page** — pipeline count per stage, list of linked applications, approve/reject requisition button when workflow is pending.
2. **Application kanban or list** — per requisition, grouped by stage, drag-to-advance stage.
3. **Candidate profile drawer** — opens from any application row; shows CV link, all applications across roles, interview history.
4. **Interview scheduling modal** — date/time picker, interviewer multi-select, meeting link field, scorecard template picker.
5. **Scorecard form** — per-criterion rating (1–5), free text strengths/concerns, recommendation dropdown; read-only for non-interviewers.
6. **Offer form** — salary, allowances, start date, employment type, expiry date; submit triggers the approval workflow.
7. **Offer approval view** — reuses `<WorkflowTimeline />` from ADR 015.

---

## Consequences

### Positive
- **End-to-end ATS:** Covers the full hiring lifecycle from headcount request to employee creation. No parallel ATS tool needed.
- **Talent pool:** Candidates persist across applications, enabling rehire and future-role matching.
- **Audit completeness:** `application_stage_log` and `offer_approvals` provide a full history of every hiring decision.
- **Onboarding integration:** The offer-acceptance event is the clean handoff to Phase 3 onboarding without manual data re-entry.

### Negative / Risks
- **Scope:** This is a substantial module. Phase 9 should be sequenced after Phase 3 (onboarding) is in place so the handoff can be tested end-to-end.
- **Privacy:** Candidate PII (name, email, resume) is subject to UU PDP and must be anonymisable on request. The `anonymised_at` column on `candidates` signals this; a scheduled job nulls the PII fields.
- **No calendar integration in Phase 9:** Interview scheduling writes a `meeting_link` free-text field. Google Calendar / Outlook sync is a Phase 9b enhancement, not a Phase 9 requirement.
- **No job board posting API in Phase 9:** Posting to LinkedIn / JobStreet requires OAuth integrations with those platforms. Phase 9 supports manual sourcing and direct application links only. External posting is a Phase 9b enhancement.

---

## References

- [ADR 003: Module Event Contract](./003-module-event-contract.md) — domain event bus
- [ADR 009: Workflow Engine Design](./009-workflow-engine-design.md) — requisition and offer approval chains
- [ADR 015: Visual Workflow Tracker](./015-visual-workflow-tracker.md) — offer approval UI
- [HRIS Implementation Checklist — Phase 9](../hris-implementation-checklist.md)
