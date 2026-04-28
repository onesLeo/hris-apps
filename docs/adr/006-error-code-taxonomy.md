# ADR 006: API Error Code Taxonomy and i18n Strategy

**Status:** Accepted
**Date:** 2026-04-27

---

## Context

The API serves both Indonesian and English-speaking users. The frontend needs machine-readable error codes to drive conditional UI behaviour (for example, showing a different screen for an insufficient leave balance versus a missing required field). Validation errors must return all invalid fields simultaneously so users do not discover errors one at a time. Error messages must be translatable without changing the error codes that the frontend depends on.

---

## Decision

### Error Code Format

`<domain>.<entity>.<problem>` in lowercase snake_case.

Domains: `employee`, `leave`, `attendance`, `payroll`, `approval`, `auth`, `tenant`, `validation`, `integration`

Examples:

```
validation.fields
validation.field.required
validation.field.invalid_format
validation.field.date_before_from
employee.not_found
employee.assignment.date_overlap
leave.balance.insufficient
leave.request.already_approved
payroll.run.already_finalised
payroll.run.period_locked
approval.step.not_assignee
approval.step.already_decided
auth.token.expired
auth.token.invalid
auth.mfa.required
tenant.limit.employees_exceeded
```

### HTTP Status Code Mapping

| Status | Meaning |
|---|---|
| 400 | Structural validation error (wrong type, missing required field) |
| 401 | Not authenticated (no token or token expired) |
| 403 | Authenticated but not permitted (wrong role, wrong scope) |
| 404 | Entity not found |
| 409 | Conflict (duplicate, already finalised, date overlap) |
| 422 | Valid request but fails a business rule (insufficient balance, period locked) |
| 429 | Rate limited |
| 500 | Unexpected server error (stack trace and internal detail must never be exposed) |

### Response Shape

**Field validation errors (400) — return all fields at once:**

```json
{
  "error": {
    "code": "validation.fields",
    "message": "Beberapa field tidak valid",
    "fields": [
      {
        "field": "from_date",
        "code": "validation.field.required",
        "message": "Tanggal mulai wajib diisi"
      },
      {
        "field": "to_date",
        "code": "validation.field.date_before_from",
        "message": "Tanggal selesai harus setelah tanggal mulai"
      },
      {
        "field": "leave_type_id",
        "code": "validation.field.required",
        "message": "Jenis cuti wajib dipilih"
      }
    ]
  }
}
```

**Business rule error (422):**

```json
{
  "error": {
    "code": "leave.balance.insufficient",
    "message": "Saldo cuti tidak mencukupi",
    "detail": {
      "requested_days": 5,
      "available_days": 3,
      "leave_type": "annual"
    }
  }
}
```

**Not found (404):**

```json
{
  "error": {
    "code": "employee.not_found",
    "message": "Karyawan tidak ditemukan"
  }
}
```

### i18n Strategy

- The `code` field is always English snake_case. It never changes. The frontend uses it for conditional logic and routing.
- The `message` field is in the language of the request, determined by the `Accept-Language` header (`id` or `en`).
- Translation strings live in the api's i18n folder: `src/i18n/en/errors.json` and `src/i18n/id/errors.json`.
- The frontend can use the `message` directly for display, or it can translate using the `code` in its own i18n layer if it needs to override the wording.
- `detail` fields are always raw values (numbers, dates, identifiers). They are never pre-translated strings, so the frontend can format them as needed.

---

## Consequences

- All NestJS exception filters must produce this exact response shape without exception. A global exception filter handles this centrally so individual controllers do not need to format errors manually.
- The `code` is the stable contract between frontend and backend. The `message` text can be improved, corrected, or retranslated without any frontend code changes.
- Returning all field errors at once requires collecting all validation failures before responding. NestJS `ValidationPipe` with `whitelist: true` handles this automatically when class-validator decorators are applied to DTO classes.
- The `detail` object on business rule errors is optional but strongly encouraged when numeric context is available (balance, limits, counts). This allows the frontend to render helpful messages such as "You requested 5 days but only 3 are available" without string parsing.

---

## Alternatives Considered

**Use HTTP status codes alone without a code field**

Simple but forces the frontend to parse message strings to distinguish errors within the same status code. Not machine-readable. Ruled out.

**Use numeric error codes (e.g. 4001, 4002)**

Numeric codes are compact but not self-documenting. Developers must look up a table to understand what `4023` means. String codes like `leave.balance.insufficient` are immediately readable in logs and in frontend code.

**Return errors one at a time (stop at first failure)**

Common in simple implementations but creates a poor user experience: the user fixes one field, submits again, and discovers the next error. Collecting all errors in one response is standard practice for form-heavy applications and is the behaviour NestJS ValidationPipe provides by default.

**Centralise all translations in the frontend only**

Would mean the backend always returns English messages and the frontend translates everything. This works but requires the frontend to maintain a translation for every possible error code, including rarely seen server-side errors. The hybrid approach (backend translates common messages, frontend can override) is more practical.
