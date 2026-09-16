# M&J CRM setup

This file records the infrastructure switches needed to move `/admin` from build mode to live mode.

## 1. Dedicated Supabase project

Create a separate Supabase project for M&J Metal in the London / UK-friendly European region.

After creation:

1. Run `supabase/migrations/20260916_mj_crm.sql` in the project.
2. Create a private Storage bucket named `mj-job-files`.
3. Create exactly two initial Auth users, one for Mark and one for Jonathan.
4. Insert both Auth user IDs into `public.mj_admin_users` with initials `MD` and `JB`.
5. Keep RLS enabled. Do not expose a service-role key to browser code.

The first generated job reference is designed to be `MJ018` if the first inserted sequence is 18, and the next new job should continue `MJ019`, `MJ020`, etc. Before live use, confirm the actual existing M&J reference history and seed the highest existing sequence correctly.

## 2. Vercel environment variables

Required for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-side variables to add only when their integrations are enabled:

- `SUPABASE_SECRET_KEY` or the current server-side secret supplied by the new Supabase project
- `MJ_EMAIL_INTEGRATION_SECRET`
- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `XERO_REDIRECT_URI`
- `AI_API_KEY` if an external AI provider is used for quote drafting

Never prefix private secrets with `NEXT_PUBLIC_`.

## 3. Authentication

Use Supabase Auth with individual accounts. `/admin` must redirect unauthenticated visitors to `/admin/login`. Every server mutation must verify the signed-in user is present in `mj_admin_users`.

Approved initial users:

- Mark, initials `MD`
- Jonathan, initials `JB`

## 4. Storage

Private bucket: `mj-job-files`

Suggested path convention:

`{job-id}/{category}/{uuid}-{filename}`

Categories:

- before
- site-survey
- drawings
- quote
- fabrication
- installation
- after
- invoice
- other

Files must be served by short-lived signed URLs, not public bucket URLs.

## 5. Job references

References are database-backed and immutable. Do not calculate the next reference in the browser.

Before launch, seed the database with the correct last used reference. Current working assumption is that M&J is around `MJ018`, but this must be confirmed before first live job creation.

## 6. Email integration

M&J incoming email should be matched in this order:

1. Exact `MJ###` reference in subject/body.
2. Known customer email address with one active job.
3. Otherwise place into an unmatched-email queue for Mark/Jonathan to assign.

AI may suggest an event/status such as customer confirmed, declined, wants changes, payment mentioned or site visit requested, but major status/payment changes should require one-click confirmation.

## 7. Xero integration

M&J CRM should initiate invoice creation while Xero remains the accounting source of truth.

Store back on the job:

- Xero contact ID
- invoice ID/number
- invoice total
- sent status
- amount paid
- balance
- due date
- paid date

Avoid maintaining a second independent accounting ledger in the CRM.

## 8. AI quote workflow

AI input should use only customer-safe job fields plus deliberately selected notes. Internal costing/subcontractor notes must never be sent into customer-facing quote output unless explicitly selected.

Flow:

1. Draft scope from structured job details and selected notes.
2. Mark/Jonathan review and edit.
3. Generate branded PDF.
4. Save PDF as a versioned quote against the job.
5. Email or copy a WhatsApp-ready message.

## 9. Launch checks

Before merging to production:

- Auth redirect tested logged-out and logged-in
- Mark can log in
- Jonathan can log in
- Each user sees only the private admin application
- New job reference increments correctly under concurrent creation
- Customer reuse works
- Status filters and default ordering work
- File uploads remain private
- Quote PDF cannot include internal notes accidentally
- Payment totals reconcile
- Completed and declined jobs sort to the bottom by default
- Mobile admin is usable
- Public website routes are unchanged
