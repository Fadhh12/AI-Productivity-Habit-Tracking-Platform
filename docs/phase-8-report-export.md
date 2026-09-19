# Phase 8 — Monthly Report Export (CSV / PDF)

Adds a way to take the cached monthly rollup out of the app: a new endpoint
streams the same data already shown on the Reports page as a downloadable
CSV or PDF file.

## Backend

`GET /api/reports/monthly/export?month=YYYY-MM&format=csv|pdf`
(`src/modules/rollup/rollup.controller.ts`)

- Reuses `RollupService.getMonthlyFromCache` — no re-aggregation, so export
  is only ever as fresh as the last computed/refreshed rollup for that month.
  Returns `404` if that month hasn't been computed yet (client should call
  `POST /api/reports/refresh` first, same as the existing `monthly` read
  endpoint's `available: false` path).
- `format` and `month` are validated via `ExportReportDto`
  (`src/modules/rollup/dto/export-report.dto.ts`) — same `YYYY-MM` regex as
  the existing `QueryMonthlyReportDto`, plus `@IsIn(['csv', 'pdf'])`.
- File generation lives in `src/modules/rollup/report-export.util.ts`,
  pure functions taking a `MonthlyRollupSummary`:
  - `buildReportCsv` — hand-built CSV (no library needed), with proper
    quote/comma/newline escaping for habit and goal names. Four sections:
    category distribution, checkin status counts, habit streak trend, goal
    progress.
  - `buildReportPdf` — same four sections rendered with `pdfkit`
    (new dependency), returned as an in-memory `Buffer` by collecting the
    document's `data` stream events.
- The controller writes the file directly via `@Res() res: Response`
  (`Content-Type` + `Content-Disposition: attachment`) instead of Nest's
  default JSON response wrapping, since this route returns a file, not JSON.

## Frontend

- `apiDownload(path, filename)` added to `frontend/lib/api.ts` — mirrors
  `apiFetch`'s auth-header + 401-refresh-retry logic, but reads the response
  as a `Blob` and triggers a browser download via a temporary `<a download>`
  instead of parsing JSON.
- Reports page (`frontend/app/(app)/reports/page.tsx`) got two new buttons,
  "CSV" and "PDF", next to the existing "Refresh laporan" button. Both are
  disabled while a report isn't available yet or while an export is already
  in flight, and show a spinner icon during the download.

## Manual verification

- `npm run build` (backend) and `npx tsc --noEmit` (frontend) both pass.
- `npm test` — all 22 existing unit tests still pass (export code has no
  business logic worth a unit test; it's pure formatting of data already
  covered by `rollup-calculator.util.spec.ts`).
- Not yet verified against a live server + real Claude/Postgres/Redis
  instance in this session — do that before treating this as fully shipped
  (start the stack per the README, log in, hit "Refresh laporan" once so a
  cached month exists, then try both export buttons).
