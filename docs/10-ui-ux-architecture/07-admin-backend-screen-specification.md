---
id: LOCALISY-DOC-1007
title: Admin Backend — Screen-by-Screen UX Specification (v2)
document: 07-admin-backend-screen-specification.md
version: 2.0
status: Draft — for review
---

# 0. What changed since v1

v1 proposed the information architecture and a fixed role matrix. Based on review, this revision:

- replaces the fixed role matrix with a **Role Builder** — an admin screen to create custom roles with a hand-picked permission selection and assign them to any user (Section 5.27-5.28); the old fixed matrix now ships only as *default seed data* for that builder (Section 7).
- confirms **React Router-style real client-side routing** — one URL per screen — as the routing approach (already assumed throughout Section 5, now called out explicitly in Section 4).
- confirms the **build order** proposed in v1 Section 9, unchanged.
- adds a **background job framework** so bulk uploads (and any long-running admin action) run behind the scenes while the operator keeps working elsewhere (Section 4.4).
- adds a **universal upload → validate → preview pattern** so every upload surface (Listings, Geography, Taxonomy, Pincode) shows the same row-level error/warning preview before committing (Section 4.5).
- adds three new nav groups reserving space for **Analytics & Insights**, **Marketing Automation**, and **AI & Integrations** (Section 3, Section 5.29-5.37).
- the companion [Design Language](06-localisy-design-language.md) doc has been extended with a new Section 11 (Admin & Data-Density Patterns) covering exactly how tables, drawers, the job indicator, and the upload/preview pattern should look — this document defines structure and behavior, that one defines the visual treatment.

# 1. Why this document exists

Today the entire Localisy back office lives inside one component (`AdminConsole.tsx`, ~400KB) and one giant switch of tabs and sub-tabs:

- **Admin Workspace** tab bar → Moderation / Listing Status / Bulk Upload / Taxonomy Mapping / Data Audit
- **Operations Workspace** tab bar → Listings / Homepage CMS / Ads & Offers / Geography & Routing / Updates & Community / Platform Config, each with its own row of sub-tabs (Homepage CMS alone has 7)

There is no dashboard, no persistent navigation, no URL per screen, and moderation, bulk-import, campaign authoring, geography editing, and platform config all render out of the same file with the same shared filter bar. This document proposes a clean information architecture and a screen-by-screen spec so the backend can be rebuilt as a set of focused, navigable screens without losing any capability that exists today.

This is a **written UX specification**, not a visual mockup — it follows the format already used in `docs/10-ui-ux-architecture/`. Visual styling should follow the [Localisy Design Language](06-localisy-design-language.md), including its new admin-specific Section 11.

# 2. Design principles for the new backend

- **One job per screen.** A screen should answer one operational question instead of bundling authoring + review + analytics together.
- **Persistent shell, not repeated chrome.** Navigation, current scope (locality/city), current user/role, and background-job status live in a shell that wraps every screen.
- **Real navigation.** Each screen gets its own URL (e.g. `/admin/moderation`, `/admin/geography/localities`) so it's bookmarkable, back/forward works, and a teammate can be sent a direct link.
- **Maximum one level of sub-navigation.** No deeper than: nav group → screen → (optional) in-screen tab strip.
- **Show role-appropriate nav only.** Hide nav items a role can't use rather than showing them disabled, driven by the Role Builder (Section 5.27) rather than a hardcoded check.
- **Counts and exceptions surface themselves.** Anything shown today as a tab badge becomes a dashboard tile and a nav badge.
- **Long-running work never blocks the operator.** Uploading a file or running a heavy sync starts a background job; the operator can immediately move to another screen and gets notified when it's done (Section 4.4).
- **Every upload proves itself before it commits.** No file lands in the live data until its rows have been validated and the operator has seen exactly what will be inserted, skipped, or flagged (Section 4.5).
- **Internal-only tools stay out of the admin shell.** The floating "Developer Sandbox" role switcher in `App.tsx` stays a separate, internal-only overlay per `PUBLIC_LAUNCH_CHANGES.md` and is not part of this IA.

# 3. Proposed information architecture

Left-hand primary navigation, grouped. Every existing tab/sub-tab is accounted for; new items are marked **(new)**.

| Nav Group | Screens in group | Roles that see this group |
|---|---|---|
| **Dashboard** | Overview **(new)** | All internal roles |
| **Moderation & Governance** | Moderation Queue · Duplicate Review **(elevated)** · Audit Log | Moderator, Operator, Admin |
| **Listings** | Listing Directory · Bulk Import · Taxonomy Mapping · Listing Analytics **(elevated)** | Operator, Admin (Listing Directory also read-only to Moderator) |
| **Merchant Operations** **(new group)** | Merchant Claims & Verification | Admin (Phase 2 — Section 9) |
| **Geography & Routing** | Localities · Pincode Routing · Category URLs · Geography Master | Admin, Operator |
| **Homepage CMS** | Layout Builder · Hero Banners · Templates · Assignments · Publish & Snapshots | Admin |
| **Campaigns & Offers** | Offers · Ad Banners · Lead Inbox | Admin, Growth Operator |
| **Content & Community** | Updates Feed | Admin, Growth Operator |
| **Analytics & Insights** **(new group)** | Platform Analytics Overview · Search & AI Performance **(reserved)** · SEO Performance | Admin, Growth Operator |
| **Marketing Automation** **(new group)** | Automation Rules · Audience Segments · Automation Activity Log | Admin, Growth Operator (Phase 3 — Section 9) |
| **AI & Integrations** **(new group)** | AI Provider Configuration · Knowledge & RAG Sources · Integration Health | Admin only (Phase 3 — Section 9) |
| **Identity & Access** **(new group)** | User Directory · Roles & Permissions | Admin only |
| **Platform Config** | API & Sync · Category Taxonomy · Homepage Defaults · SEO Discovery · Import & Job Center **(new)** | Admin only |

"Elevated" = currently gated to `admin`/`developer` only. Section 7 gives the default per-screen permission set that ships as seed data inside the Role Builder.

# 4. Global shell

## 4.1 Top bar
- Left: Localisy admin logo/wordmark + environment tag (Production / Staging).
- Center-left: **scope selector** — locality (and city, once city aggregation ships). Persists across every locality-scoped screen (Homepage CMS, Geography, Campaigns, Content).
- Right, in order: **background-job indicator** (Section 4.4), notification bell (merged pending-moderation + failed-import + duplicate-candidate count), user avatar/name + role badge, logout.

## 4.2 Left sidebar
- Grouped nav per Section 3, collapsible groups, current screen highlighted.
- Numeric badges on: Moderation Queue, Duplicate Review, Bulk Import (failed-row count), Audit Log (flagged count).
- Collapsible to an icon-only rail for wide data tables.

## 4.3 Content area
- **Page header**: screen title, one-line purpose text, primary action button top-right.
- **Filter bar**: the existing shared filter pattern (`AdminConsoleSharedControls.tsx`), scoped to the screen instead of the whole console.
- **Body**: table, card grid, or form depending on screen.
- **States**: every screen defines an empty state, a loading skeleton, and an error state with retry (see Design Language Section 11.9).

## 4.4 Background jobs & notifications *(new)*

This is the direct answer to "bulk upload should keep running behind the scenes while the user does other work."

- Every long-running admin action — CSV/Excel bulk import (Listings, Geography Master, Pincode Routing, Taxonomy), a large export, a bulk status change, a sitemap resubmission — runs as a **background job**, not a blocking in-page spinner.
- Starting a job (e.g. clicking "Commit Import") immediately hands control back to the operator; they can navigate to any other screen while it processes.
- The top-bar job indicator (Design Language 11.7) shows a live count of running jobs from anywhere in the admin. Opening it lists every job: origin screen, file name, status (`queued` → `processing` → `needs review` → `done`/`failed`), and a progress bar.
- When a job reaches `needs review` (validation found errors/warnings) or `done`, the operator gets a toast notification and the job's row becomes clickable, deep-linking straight to that job's preview/result (Section 4.5) even if they're now on a completely different screen.
- Jobs persist across a page refresh/re-login until acknowledged, so an import kicked off before lunch is still visible and actionable when the operator comes back.
- Full history lives on **Import & Job Center** (Section 5.38) for anything older than what fits in the quick panel, or for jobs started by someone else on the same team.

## 4.5 Universal upload, validation & preview pattern *(new)*

Applies identically to every current and future upload surface: Bulk Import (5.6), Geography Master Excel upload (5.13), Pincode Routing CSV upload (5.11), Category Taxonomy spreadsheet upload (5.24), and any future one.

1. **Upload** — drag-drop or file picker, with a link to the expected column spec for that surface. The file is accepted and handed to a background job (Section 4.4) immediately; the screen does not block waiting for the whole file to parse.
2. **Validate** — the job parses and validates every row: required fields present, formats correct, duplicate-against-existing-data check, foreign keys (locality/category/pincode) resolvable.
3. **Preview** — once validation finishes, a preview screen (or drawer, for smaller files) shows one row per source row with a status icon (valid / warning / error), a summary strip of total/valid/warning/error counts, and the specific reason for any warning or error on click. This is reachable either immediately (if the operator stayed on the screen) or later via the job notification (Section 4.4).
4. **Commit or fix** — the operator commits the valid rows (warnings can usually still be committed with a confirmation; errors are excluded and can be downloaded as a corrected-and-reupload file), or cancels the job entirely. Nothing touches live data until this explicit commit step.

# 5. Screen-by-screen specification

Each entry: **Purpose**, **Roles**, **Layout**, **Key data & actions**, **Notes**.

## 5.1 Dashboard — Overview *(new)*

- **Purpose:** Land here first. Answer "what needs my attention right now."
- **Roles:** All internal roles; content adapts per role.
- **Layout:** Stat tiles (pending moderation, duplicate candidates, active localities, live campaigns, running/failed jobs, audit flags) → "Needs review" panel (merged clickable list from moderation + duplicates + jobs needing review) → "Recent activity" panel (latest audit entries).
- **Key data & actions:** Every tile deep-links into the relevant screen, pre-filtered. No editing here.
- **Notes:** Doesn't exist today; highest-value addition.

## 5.2 Moderation Queue

- **Purpose:** Review and act on pending business submissions.
- **Roles:** Moderator, Operator, Admin.
- **Layout:** Filter bar → queue table → detail drawer with approve/reject (reason required) controls.
- **Key data & actions:** Approve, reject, request more info, bulk-approve for high-confidence import batches.
- **Notes:** Same `ModerationQueue.tsx` data; now its own routed screen.

## 5.3 Duplicate Review

- **Purpose:** Resolve likely-duplicate listings before they pollute the directory.
- **Roles:** Admin, Operator.
- **Layout:** Candidate list with confidence score → side-by-side comparison → merge / keep-separate / snooze decision.
- **Key data & actions:** Merge, keep separate, snooze; every decision audited.
- **Notes:** Promoted out of the Listing Status scroll (was buried under the table + analytics panel).

## 5.4 Audit Log

- **Purpose:** Full, filterable trail of internal actions.
- **Roles:** Admin (full); Moderator/Operator (own actions, read-only).
- **Layout:** Filter bar (actor, action type, **date range**, locality) → paginated table.
- **Key data & actions:** Read-only; export-to-CSV.
- **Notes:** Adds the date-range filter flagged as missing in the homepage tracker.

## 5.5 Listing Directory

- **Purpose:** Browse, search, and manage the business directory.
- **Roles:** Operator, Admin (edit); Moderator (read-only).
- **Layout:** Filter bar → dense table → row actions (edit, suspend, feature) → bulk-select toolbar.
- **Key data & actions:** Edit inline/drawer, bulk status change, jump to a flagged business's Duplicate Review entry.
- **Notes:** Analytics and duplicates split out to their own screens (5.3, 5.8).

## 5.6 Bulk Import

- **Purpose:** Upload business CSV/Excel data.
- **Roles:** Operator, Admin.
- **Layout:** Follows the universal upload pattern (Section 4.5) end to end: upload zone → background job → preview (per-row inserted / skipped-duplicate / needs-fix, with error download) → commit (rows land as `pending` for moderation).
- **Key data & actions:** Upload, walk away, get notified, review preview, commit or cancel.
- **Notes:** Runs as a background job now — this is the primary "keep running while I do other work" scenario.

## 5.7 Taxonomy Mapping

- **Purpose:** Fix listings whose category/subcategory couldn't be auto-mapped.
- **Roles:** Admin, Operator.
- **Layout:** Unmapped list → inferred-category suggestion → manual override.
- **Key data & actions:** Accept, manually assign, bulk-assign by keyword.
- **Notes:** Same as today's `TaxonomyMappingWorkspace`.

## 5.8 Listing Analytics

- **Purpose:** Directory health and engagement per business/locality.
- **Roles:** Admin, Growth Operator.
- **Layout:** Filter → charts (top-viewed, unlock rate, review trend) → drill-down table.
- **Key data & actions:** Read-only; export.
- **Notes:** Operational, per-business altitude — distinct from the platform-wide dashboards in Analytics & Insights (5.29-5.31).

## 5.9 Merchant Claims & Verification *(new — Phase 2)*

- **Purpose:** Claim/verification and KYC review, matching the Merchant Operations sub-module not yet built.
- **Roles:** Admin.
- **Layout:** Claim queue → detail view with approve/reject and KYC status control.
- **Key data & actions:** Approve, reject with reason, set KYC status, grant merchant edit permission.
- **Notes:** Nav slot reserved; timing depends on merchant self-service leaving the current simulator.

## 5.10 Geography: Localities

- **Purpose:** Create and manage locality pages.
- **Roles:** Admin, Operator.
- **Layout:** Search → locality list → create/edit drawer.
- **Key data & actions:** Create, edit, activate/deactivate.
- **Notes:** Same scope as today's Localities sub-tab.

## 5.11 Geography: Pincode Routing

- **Purpose:** Maintain pincode-to-locality routing.
- **Roles:** Admin, Operator.
- **Layout:** Search-by-pincode → routing table → manual override form; bulk pincode sheet upload follows the universal upload pattern (Section 4.5).
- **Key data & actions:** Add/edit mapping, mark fallback, bulk-upload.
- **Notes:** Natural home for the geography CSV cleanup work currently in progress; uploads here now run as background jobs with a validation preview instead of a blocking import.

## 5.12 Geography: Category URLs

- **Purpose:** Manage locality+category landing routes.
- **Roles:** Admin, Operator.
- **Layout:** Filter → URL list → create/edit form.
- **Key data & actions:** Create, edit, deactivate.
- **Notes:** Unchanged in scope.

## 5.13 Geography Master

- **Purpose:** Manage states/cities/areas master data.
- **Roles:** Admin.
- **Layout:** States → Cities → Areas list/tree → inline edit; Excel upload follows the universal upload pattern (Section 4.5).
- **Key data & actions:** Add/edit records; bulk upload with preview.
- **Notes:** Moved next to the other Geography screens instead of living under Platform Config.

## 5.14 Homepage CMS: Layout Builder

- **Purpose:** Arrange homepage sections for a locality.
- **Roles:** Admin.
- **Layout:** Locality selector → ordered section list with drag-to-reorder → per-section config panel.
- **Key data & actions:** Add/reorder/edit/delete section, live preview link.
- **Notes:** Same scope as today's Layout sub-tab, now full width.

## 5.15 Homepage CMS: Hero Banners

- **Purpose:** Manage hero banners and top stat cards.
- **Roles:** Admin.
- **Layout:** Locality selector → banner list → create/edit form.
- **Key data & actions:** Add, edit, reorder, activate/deactivate.
- **Notes:** Unchanged in scope.

## 5.16 Homepage CMS: Templates

- **Purpose:** Reusable scalable homepage templates.
- **Roles:** Admin.
- **Layout:** Template list → editor (same section-builder as 5.14) + "sync from live locality."
- **Key data & actions:** Create/duplicate/delete, edit sections, mark fallback.
- **Notes:** Unchanged in scope.

## 5.17 Homepage CMS: Assignments

- **Purpose:** Map templates to locality/category/subcategory/pincode targeting.
- **Roles:** Admin.
- **Layout:** Assignment table → create/edit form.
- **Key data & actions:** Create, adjust priority, deactivate.
- **Notes:** Unchanged in scope.

## 5.18 Homepage CMS: Publish & Snapshots

- **Purpose:** Publish resolved homepage payloads and inspect what's live.
- **Roles:** Admin.
- **Layout:** Publish controls → snapshot history, each openable to preview.
- **Key data & actions:** Publish, re-seed legacy data, load a resolved preview.
- **Notes:** Merges today's two sub-tabs into one workflow.

## 5.19 Campaigns: Offers

- **Purpose:** Locality-targeted offers/deals.
- **Roles:** Admin, Growth Operator.
- **Layout:** Filter → offer list → create/edit form.
- **Key data & actions:** Create, edit, expire, view usage.
- **Notes:** Unchanged in scope.

## 5.20 Campaigns: Ad Banners

- **Purpose:** Banner creative, placement, targeting, run state.
- **Roles:** Admin, Growth Operator.
- **Layout:** Filter → banner list → creative form with review/approve step.
- **Key data & actions:** Create, submit-for-review, approve/reject, activate/pause.
- **Notes:** Unifies two stacked panels into one screen.

## 5.21 Campaigns: Lead Inbox

- **Purpose:** Review ad-banner lead-form enquiries.
- **Roles:** Admin, Growth Operator.
- **Layout:** Filter → lead list → detail panel.
- **Key data & actions:** Mark contacted/qualified/discarded, export.
- **Notes:** Unchanged in scope.

## 5.22 Content: Updates Feed

- **Purpose:** Publish locality-specific homepage updates.
- **Roles:** Admin, Growth Operator.
- **Layout:** Locality/type/status filter (new) → update list → create/edit/schedule form.
- **Key data & actions:** Create, edit, delete, schedule.
- **Notes:** Adds filters and edit/schedule flow already flagged as open follow-ups in the homepage tracker.

## 5.23 Platform Config: API & Sync

- **Purpose:** Platform endpoints, sync mode, publish paths.
- **Roles:** Admin only.
- **Layout:** Config form grouped by concern, "test connection" per group.
- **Key data & actions:** Edit and save; every change audited.
- **Notes:** Unchanged in scope.

## 5.24 Platform Config: Category Taxonomy

- **Purpose:** Category/subcategory master list.
- **Roles:** Admin only.
- **Layout:** Category tree → inline edit; spreadsheet upload follows the universal upload pattern (Section 4.5).
- **Key data & actions:** Add/edit/deactivate, reorder, bulk import.
- **Notes:** Cross-linked from Listing Directory and Taxonomy Mapping.

## 5.25 Platform Config: Homepage Defaults

- **Purpose:** Shared hero defaults and homepage preset fallbacks.
- **Roles:** Admin only.
- **Layout:** Form grouped by default type.
- **Key data & actions:** Edit and save.
- **Notes:** Unchanged in scope.

## 5.26 Platform Config: SEO Discovery

- **Purpose:** SEO/discovery defaults, sitemap submission.
- **Roles:** Admin, Growth Operator.
- **Layout:** Config form → "Submit sitemaps" action.
- **Key data & actions:** Edit defaults, trigger submission, view status.
- **Notes:** Its monitoring counterpart is SEO Performance (5.31).

## 5.27 Identity & Access: Roles & Permissions (Role Builder) *(new)*

- **Purpose:** Create custom roles with a hand-picked permission selection instead of the fixed admin/developer-vs-everyone check — the enforcement point for every role reference elsewhere in this document.
- **Roles:** Admin only.
- **Layout:** Role list (name, description, # users assigned, last modified, source: "built-in" or "custom") → **Create Role**: name + description, then a permission matrix (Design Language 11.6) — one row per nav-group/screen from Section 3, four columns: **View / Create-Edit / Approve-Publish / Delete-High-risk**. Not every screen uses all four (e.g. Audit Log only ever needs View + Export); the matrix disables columns that don't apply to a given row.
- **Key data & actions:** Create role, clone an existing role as a starting point, edit permissions on a custom role, deactivate a role, delete a role only once zero users are assigned (with a forced reassignment prompt if users are still on it).
- **Notes:** The four built-in roles referenced throughout Section 5 (Admin, Moderator, Operator, Growth Operator) ship as **pre-built, editable roles** using Section 7 as their starting permission set — they are not hardcoded exceptions, just roles that happen to come pre-configured. Any new job function (e.g. "Locality Partner" who can only touch one locality's Offers and Updates Feed) can be created here without a code change.

## 5.28 Identity & Access: User Directory *(new)*

- **Purpose:** Manage individual accounts and assign each one a role from 5.27.
- **Roles:** Admin only.
- **Layout:** User list (name, email, role, locality scope, status, last login) → invite/edit drawer.
- **Key data & actions:** Invite user, change role, restrict a user to a specific locality/city scope, suspend/reactivate, force logout.
- **Notes:** Locality-scope restriction lets, for example, an Operator role be handed to one person for one locality only — directly answers the "locality-scoped operator restrictions" open question already flagged in the Admin Operations module spec.

## 5.29 Analytics & Insights: Platform Analytics Overview *(new)*

- **Purpose:** Platform-wide traffic and engagement, aggregated across localities/cities — the strategic counterpart to the per-business Listing Analytics (5.8).
- **Roles:** Admin, Growth Operator.
- **Layout:** Locality/city/date-range filter → summary tiles (page views, searches, contact-unlocks, reviews, new listings) → trend charts → locality/city leaderboard table.
- **Key data & actions:** Read-only; export; drill into a locality to jump to its Listing Analytics.
- **Notes:** Net new — no existing component; first buildable Analytics screen since it only needs data already being logged (audit events, search logs) rather than a new AI/RAG layer.

## 5.30 Analytics & Insights: Search & AI Performance *(reserved — Phase 3)*

- **Purpose:** Once hybrid search/RAG/chat and WhatsApp ship (per the AI Knowledge Platform architecture docs), report the platform's own named success metrics: answer accuracy, response time, multilingual quality, WhatsApp resolution rate.
- **Roles:** Admin, Growth Operator.
- **Layout:** Metric tiles for each named success metric → query-volume and failure-reason breakdown → sample transcript review panel.
- **Key data & actions:** Read-only; flag a bad answer for review.
- **Notes:** Cannot be built ahead of the AI chat/search features themselves; nav slot reserved so Analytics & Insights doesn't need restructuring later.

## 5.31 Analytics & Insights: SEO Performance *(new)*

- **Purpose:** Monitor organic performance — the reporting counterpart to configuring defaults in 5.26.
- **Roles:** Admin, Growth Operator.
- **Layout:** Filter (locality/category/date range) → indexed-page count, sitemap submission history and status, organic traffic trend.
- **Key data & actions:** Read-only; re-trigger a sitemap submission (deep link back to 5.26).
- **Notes:** Net new; can reuse data already produced by the existing `seo:submit-sitemaps` script and SEO Discovery config.

## 5.32 Marketing Automation: Automation Rules *(new — Phase 3)*

- **Purpose:** Trigger-based automation instead of every campaign action being manual (e.g. "when a business is approved in locality X, auto-send a welcome coupon"; "when a lead sits unactioned 3 days, notify the assigned operator").
- **Roles:** Admin, Growth Operator.
- **Layout:** Rule list (name, trigger, action, status) → rule editor: trigger type, condition, target audience (from 5.33), action (send coupon / notify / tag), enable/disable toggle.
- **Key data & actions:** Create, edit, enable/disable, view last-fired time.
- **Notes:** Net new. Depends on Campaigns & Offers (5.19-5.21) and a notification-sending capability already existing before rules can act on them — sequence after those.

## 5.33 Marketing Automation: Audience Segments *(new — Phase 3)*

- **Purpose:** Define reusable audience segments (e.g. "unlocked contact but never reviewed," "merchant inactive 30+ days") for use in automation rules and manual campaigns.
- **Roles:** Admin, Growth Operator.
- **Layout:** Segment list (name, definition, live count) → segment builder (condition rows combined with AND/OR).
- **Key data & actions:** Create, edit, preview matching count, use in an Automation Rule or a Campaign.
- **Notes:** Net new.

## 5.34 Marketing Automation: Automation Activity Log *(new — Phase 3)*

- **Purpose:** Read-only log of what each automation rule fired, when, and on whom — required for trust before automation runs unsupervised against real users.
- **Roles:** Admin, Growth Operator.
- **Layout:** Filter (rule, date range, outcome) → paginated log table.
- **Key data & actions:** Read-only; export.
- **Notes:** Net new; should ship alongside 5.32, not after — automation without a visible activity trail is a support liability.

## 5.35 AI & Integrations: AI Provider Configuration *(new — Phase 3)*

- **Purpose:** Manage the AI providers in use — today `GEMINI_API_KEY` is a bare environment variable with no admin-facing control; the architecture docs also target OpenAI for embeddings/chat/classification.
- **Roles:** Admin only.
- **Layout:** Provider list (Gemini, OpenAI, future) → per-provider config (API key entry with masked display, default model per use case: chat / embeddings / classification) → usage & cost summary.
- **Key data & actions:** Add/rotate a key, set default model per use case, view usage/cost trend.
- **Notes:** Net new; a small, buildable first step even before the full RAG/chat feature ships, since it just formalizes what's currently a raw env var.

## 5.36 AI & Integrations: Knowledge & RAG Sources *(reserved — Phase 3)*

- **Purpose:** Admin-facing view of the document ingestion pipeline described in the AI Knowledge Platform architecture (PDF/Excel/CSV sources → chunking → embedding).
- **Roles:** Admin only.
- **Layout:** Source list (document, type, ingestion status, chunk count, embedding status, last updated) → re-ingest / reindex action → failure detail.
- **Key data & actions:** Trigger ingestion, view failures, reindex.
- **Notes:** Depends on the ingestion pipeline existing (Phase 3+ of the platform roadmap); nav slot reserved now.

## 5.37 AI & Integrations: Integration Health *(new — Phase 3)*

- **Purpose:** One screen to see whether external integrations are actually working — AI provider uptime, WhatsApp Cloud API status once live, any future connector.
- **Roles:** Admin only.
- **Layout:** Integration list (name, status, last successful call, error count) → alert history.
- **Key data & actions:** Read-only; retry a failed connection check.
- **Notes:** Net new; becomes far more valuable once WhatsApp (Phase 7 of the platform roadmap) is live, but the AI Provider Configuration entry (5.35) is enough to justify building the screen shell earlier.

## 5.38 Platform Config: Import & Job Center *(new)*

- **Purpose:** Full history and management of every background job (Section 4.4) across all upload surfaces, beyond what fits in the quick top-bar panel.
- **Roles:** Admin, Operator (their own jobs); Admin sees every user's jobs.
- **Layout:** Filter (screen of origin, status, date, initiated-by) → job table → detail view reusing the same preview screen from Section 4.5.
- **Key data & actions:** Re-open a job's preview, cancel a running job, re-run a failed job, download the original file and the error report.
- **Notes:** Net new; the necessary companion to making bulk upload asynchronous — without it, a job that finished while the operator was elsewhere would be hard to find again later.

# 6. What moves where (migration map)

| Today | Becomes |
|---|---|
| Admin Workspace → Moderation | Moderation & Governance → Moderation Queue |
| Admin Workspace → Listing Status (table + analytics + duplicates stacked) | Listings → Listing Directory, split into Moderation & Governance → Duplicate Review and Listings → Listing Analytics |
| Admin Workspace → Bulk Upload | Listings → Bulk Import, now a background job with the universal preview pattern |
| Admin Workspace → Taxonomy Mapping | Listings → Taxonomy Mapping |
| Admin Workspace → Data Audit | Moderation & Governance → Audit Log |
| Operations → Geography → Locality Pages / Routing / Category URLs | Geography & Routing → Localities / Pincode Routing / Category URLs |
| Operations → Platform Config → Geography Master | Geography & Routing → Geography Master |
| Operations → Homepage CMS (7 sub-tabs) | Homepage CMS group, Publish + Snapshots merged into one screen |
| Operations → Ads & Offers | Campaigns & Offers group |
| Operations → Updates & Community | Content & Community → Updates Feed |
| Operations → Platform Config → API/Taxonomy/Defaults/SEO | Platform Config group, one screen each |
| *(none)* | Dashboard *(new)* |
| *(none)* | Merchant Claims & Verification *(new, phase 2)* |
| *(none)* | Identity & Access → User Directory + Roles & Permissions *(new)* |
| *(none)* | Analytics & Insights group *(new)* |
| *(none)* | Marketing Automation group *(new, phase 3)* |
| *(none)* | AI & Integrations group *(new, phase 3)* |
| *(none)* | Platform Config → Import & Job Center *(new)* |
| `App.tsx` floating Developer Sandbox role switcher | Stays outside the admin shell entirely; not part of this IA |

# 7. Default role seed data

Section 5.27's Role Builder replaces a fixed, hardcoded matrix — but it still needs starting values. These four roles ship pre-built and are editable like any custom role:

| Screen | Admin | Moderator | Operator | Growth Operator |
|---|---|---|---|---|
| Dashboard | Full | Full (moderation-focused) | Full | Full (growth-focused) |
| Moderation Queue | Full | Full | Full | — |
| Duplicate Review | Full | — | Full | — |
| Audit Log | Full | Own actions, view-only | Own actions, view-only | — |
| Listing Directory | Full | View-only | Full | — |
| Bulk Import | Full | — | Full | — |
| Taxonomy Mapping | Full | — | Full | — |
| Listing Analytics | Full | — | — | Full |
| Merchant Claims & Verification | Full | — | — | — |
| Geography (all 4 screens) | Full | — | Full | — |
| Homepage CMS (all 5 screens) | Full | — | — | — |
| Campaigns & Offers (all 3 screens) | Full | — | — | Full |
| Updates Feed | Full | — | — | Full |
| Analytics & Insights (all 3 screens) | Full | — | — | Full |
| Marketing Automation (all 3 screens) | Full | — | — | Full |
| AI & Integrations (all 3 screens) | Full | — | — | — |
| Identity & Access (both screens) | Full | — | — | — |
| Platform Config (all, incl. Import & Job Center) | Full | — | — | SEO Discovery view-only |

Until the Role Builder ships, the app can keep using the current binary admin/developer-vs-everyone check as an interim default that approximates this table — it does not need to block earlier build-order steps.

# 8. Component reuse

Existing components map cleanly onto the new screens and can mostly move file-for-file into per-screen routes:

`ModerationQueue` → 5.2 · `DuplicateReviewQueue` → 5.3 · `DataAuditWorkspace` → 5.4 · `ListingStatusWorkspace` (split) → 5.5 · `ListingAnalyticsPanel` → 5.8 · `BulkUploadWorkspace` → 5.6 · `TaxonomyMappingWorkspace` → 5.7 · `GeographyConfigManager` → 5.10-5.12 · `BusinessTaxonomyManager` → 5.24 · `HomepageDefaultsManager` → 5.25 · `SeoDiscoveryManager` → 5.26 · `EditableHomepageSectionCard` → 5.14/5.16 · `HeroBannerManagerPanel` → 5.15 · `OffersManagerPanel` → 5.19 · `AdOperationsPanel` + `AdvertiserCreativeFormPanel` → 5.20 · `AdLeadInboxPanel` → 5.21 · `AdminConsoleSharedControls` (filter bar) → reused across nearly every screen.

Fully net-new, with no existing component to reuse: the background job framework and job indicator (4.4), the universal upload/preview pattern as a shared component (4.5), Role Builder (5.27), User Directory (5.28), all three Analytics & Insights screens (5.29-5.31), all three Marketing Automation screens (5.32-5.34), all three AI & Integrations screens (5.35-5.37), and Import & Job Center (5.38).

The core technical change is structural: give each screen its own route/component instead of one 400KB file switching on nested tab state, and let the shell (Section 4) own navigation, scope, and job status instead of each tab re-deriving it.

# 9. Sequencing (confirmed)

Build order, unchanged from v1 and confirmed:

1. **Shell + Dashboard + Moderation Queue + Listing Directory** — highest daily usage, biggest current clutter. Include the background-job framework and universal upload pattern (4.4, 4.5) here, since Bulk Import needs them immediately and every later upload screen reuses the same infrastructure rather than rebuilding it.
2. **Duplicate Review + Listing Analytics split-out.**
3. **Geography group** — consolidates the routing/master-data split, unblocks the in-progress pincode cleanup work; its uploads use the pattern built in step 1.
4. **Homepage CMS group** — mechanical migration, 7 sub-tabs → 5 screens.
5. **Campaigns, Content, remaining Platform Config screens**, including Import & Job Center (5.38) once there's enough job history across screens to warrant a dedicated view.
6. **Identity & Access (Role Builder + User Directory)** and **Merchant Claims & Verification** — net-new, phase 2. Role Builder should land before opening the admin console up to more roles/teams, since it's the enforcement point referenced by every screen's role column.
7. **Analytics & Insights** — Platform Analytics Overview and SEO Performance are buildable in this phase since they only need data already being logged; Search & AI Performance stays reserved until the AI chat/search feature itself exists.
8. **Marketing Automation and AI & Integrations** — phase 3, sequenced after Campaigns/Content (automation needs something to trigger) and after the AI Knowledge Platform's ingestion/RAG work respectively; AI Provider Configuration (5.35) is the one exception that can move earlier since it only formalizes the existing `GEMINI_API_KEY` env var into an admin screen.

**Merchant Operations timing** unchanged from v1 — the nav slot for 5.9 is reserved, but building it depends on merchant self-service moving off the current simulator per `FEATURE_CATALOG.md`'s "Do Later" note.
