---
id: LOCALISY-DOC-1006
title: Localisy Design Language
document: 06-localisy-design-language.md
version: 1.1
status: Active
---

# 1. Purpose

This document defines the visual language that should be followed for all Localisy screens, pages, and product surfaces.

This is the default design contract for:

- public web pages
- locality landing pages
- category and listing pages
- merchant workflows
- admin and operator tools
- mobile-responsive layouts

# 2. Brand Direction

Localisy should feel:

- local and human
- credible and structured
- warm but not playful
- modern but not overly futuristic
- fast and approachable

The design should balance trust and discovery.

It should feel like a serious local platform, not a generic directory template.

# 3. Core Palette

Use these as the primary brand tokens:

| Token | Role | Value |
|---|---|---|
| `Localisy Navy` | primary background, primary button, navigation | `#0D1B2A` |
| `Localisy Royal Blue` | secondary action, links, active states | `#1E3A8A` |
| `Localisy Sky Blue` | selected UI accents, charts, supportive highlights | `#3B82F6` |
| `Localisy Lemon Yellow` | brand highlight, emphasis, positive CTA contrast | `#FFD54F` |
| `Localisy Soft Cream` | page background tint, warm supporting surfaces | `#FFF5F9` |
| `Localisy Slate Gray` | body copy, neutral borders, icons | `#64748B` |
| `White` | cards, inputs, overlays | `#FFFFFF` |

# 4. Typography

Use `Inter` as the default font family for all product surfaces.

Recommended scale:

| Style | Weight | Size | Line Height |
|---|---|---|---|
| `H1` | `700` | `56px` | `64px` |
| `H2` | `600` | `40px` | `48px` |
| `H3` | `600` | `28px` | `36px` |
| `Body Large` | `500` | `16px` | `24px` |
| `Body` | `400` | `14px` | `20px` |
| `Caption` | `400` | `12px` | `18px` |

Typography rules:

- headings should use tight tracking and strong hierarchy
- body copy should stay clean and readable
- avoid decorative typefaces for production surfaces
- keep labels and captions crisp and compact

# 5. Shape System

Preferred radius scale:

- `4px`
- `8px`
- `12px`
- `16px`
- `20px`
- `24px`

Usage guidance:

- buttons: `10px` to `14px`
- input fields: `10px` to `14px`
- cards: `16px` to `24px`
- feature panels and hero containers: `20px` to `24px`
- pills and chips: fully rounded

# 6. Shadow System

Preferred shadows:

- `Shadow 1`: `0 2px 4px rgba(15,23,42,0.06)`
- `Shadow 2`: `0 8px 24px rgba(15,23,42,0.08)`
- `Shadow 3`: `0 16px 40px rgba(15,23,42,0.12)`

Usage guidance:

- default cards should use subtle shadows
- elevated CTAs and hero panels can use stronger shadows
- avoid muddy or overly diffuse shadows

# 7. Component Rules

## 7.1 Navigation

- navigation bars should feel light, structured, and premium
- logo and location context should be clearly visible
- primary search should be central when discovery is core to the page
- important actions should use brand color contrast instead of random accent colors

## 7.2 Buttons

- primary buttons: Localisy Navy background with white text
- secondary buttons: white or pale background with navy or royal blue border/text
- tertiary buttons: minimal, text-led, low visual weight
- icon buttons: outlined and compact

## 7.3 Cards

- cards should be white or very lightly tinted
- card content should be structured with clear top, body, and action zones
- icons should use soft tinted circular or rounded-square containers
- avoid noisy gradients on ordinary cards

## 7.4 Inputs and Search

- inputs should be white with soft borders
- active focus states should use royal blue or sky blue
- search bars should be generous, central, and uncluttered

## 7.5 Status and Badges

- use calm tinted fills for informational states
- never use saturated red/green blocks unless the state truly needs urgency
- status chips should be compact and readable

# 8. Layout Principles

Every Localisy screen should prefer:

- generous white space
- strong content grouping
- clean sectional rhythm
- simple scanning paths
- localized context near the top of the screen

Avoid:

- dashboard clutter on public pages
- too many competing accent colors
- overly dark full-page layouts for default web surfaces
- instruction-like text blocks disguised as UI

# 9. Locality Page Rules

For locality landing pages specifically:

- keep the location selector and search prominent
- use a strong hero with a local visual or locality summary
- category browsing should be visual, compact, and easy to scan
- featured businesses should feel premium and trustworthy
- supporting panels such as map, highlights, and business CTA should align to the right rail when space allows
- chips, stats, and badges should use Localisy tones and spacing conventions

# 10. Implementation Rule

For all future Localisy screen design and page design work:

1. start from this design language first
2. use Localisy token colors before inventing new colors
3. use `Inter` and the defined hierarchy
4. use the approved radius and shadow scales
5. keep component styling consistent across public, merchant, and admin surfaces

If a new screen intentionally diverges, the divergence should be explicit and justified by context, not accidental styling drift.

# 11. Admin & Data-Density Patterns

This section extends the design language for internal, data-dense admin and operator surfaces (moderation queues, listing tables, geography managers, campaign builders, role/permission editors). It introduces no new colors, type, radii, or shadows outside Sections 3-6 — it only specifies how the existing tokens apply to dense, operational screens, per `07-admin-backend-screen-specification.md`.

## 11.1 Application shell

- Top bar: Localisy Navy background, white wordmark, environment tag as a small pill (Lemon Yellow fill for Production so it is impossible to miss, Slate Gray tint for Staging).
- Left sidebar: white or Soft Cream background, not Navy — nested navigation should not compete with the Navy top bar. Active nav item uses a Royal Blue left-border accent plus a pale tinted background, never a bold color fill.
- Content canvas: white or very light neutral background. Admin screens should read as calm workspaces, not marketing surfaces — avoid the dark/Navy treatment used for public hero panels.

## 11.2 Tables (dense data grids)

- Row height stays compact (36-40px) on high-density screens (Listing Directory, Audit Log) and can expand to 48-52px on lower-density screens (Localities, Templates).
- Header row: Slate Gray text on white or very light gray, sticky on scroll for long tables.
- Row hover: pale Sky Blue tint only, never a saturated fill.
- Sortable columns: Slate Gray caret icon, turns Royal Blue when the column is the active sort.
- Zebra striping is optional and should stay barely-there if used at all — prefer whitespace and row dividers over color banding.

## 11.3 Filter bar

- Sits directly under the page header; white background, soft border; inputs follow Section 7.4 (soft-bordered, Royal Blue/Sky Blue focus ring).
- Applied filters render as removable chips (fully rounded, per Section 5) below the filter controls, so the operator can see what's narrowing the current view without reopening the filter bar.

## 11.4 Side drawers and detail panels

- Used for single-record detail/edit (a moderation row, a listing, a role definition) instead of full-page navigation.
- Slide in from the right; white background; `Shadow 3`; 420-560px wide depending on content density.
- Drawer header: record title, close (X), and the primary action button pinned to the top-right of the drawer — never buried at the bottom of a long scroll.

## 11.5 Status badges and chips

- Follow the existing tinted-fill rule (Section 7.5): pending = Slate Gray tint, approved/active = calm green tint, rejected/error = calm red tint, sponsored/featured = Lemon Yellow tint. Never a full-saturation red/green block.
- Role badges next to a user's name use Royal Blue text on a pale Royal Blue background regardless of which role it is, so a role reads as "a role" at a glance without needing a distinct color per role (which would collide with the status-badge palette).

## 11.6 Permission matrix (Role Builder)

- Renders as a table: rows = nav groups/screens, columns = permission levels (View / Create-Edit / Approve-Publish / Delete-High-risk).
- Use plain checkboxes or toggles per cell — no color fills — since this is a configuration surface, not a status display, and should stay visually quiet even when the list of screens is long.
- Group-header rows (one per nav group) use a Soft Cream band with bold Slate Gray text to break up the list.

## 11.7 Background job / async upload indicator

- Lives in the top bar, to the right of the notification bell: a small pill with a spinner and a running-job count (e.g. "2 processing"), Royal Blue tint.
- Clicking it opens a slide-over panel (same treatment as 11.4) listing jobs: file name, screen of origin, status (queued / processing / needs review / done / failed), a progress bar, and a "View results" link once complete.
- A completed job also raises a toast (bottom-right, white background, `Shadow 2`, a calm green or red accent bar on the left edge depending on outcome) that stays until dismissed or after 8 seconds, then folds into the jobs panel — it should never block the screen the operator is currently on.

## 11.8 Upload → validate → preview pattern

- Upload zone: dashed Slate Gray border, turns Sky Blue on drag-over, white background — kept identical across every upload surface (Bulk Import, Geography Excel, Taxonomy spreadsheet, Pincode CSV) so it is instantly recognizable as "this is an upload control" wherever it appears.
- Preview table: one row per source row, with a leading status icon column (valid = calm green check, warning = Lemon Yellow triangle, error = calm red X); the reason for a warning/error shows on hover or click rather than cluttering every row with inline text.
- Summary strip above the preview table: total / valid / warning / error counts as compact stat chips, so the operator can judge import health before scrolling the table.

## 11.9 Empty, loading, and error states

- Empty state: centered outlined icon in Slate Gray, one line of explanation, and a primary action button only where one applies (e.g. no button needed for "No pending listings — you're caught up"; a "Create your first locality" button where creation is the obvious next step).
- Loading: skeleton rows/cards matching the eventual layout, not a spinner takeover — the shell and filter bar should still look interactive while data loads.
- Error: an inline banner (calm red tint) with the failure reason and a Retry button, shown in place of the content — never a full-page crash state for one failed fetch.

## 11.10 Implementation rule (admin-specific)

As with Section 10, admin screens start from the existing token set — nothing in this section introduces a new color, font, radius, or shadow. It only defines how the system already defined in Sections 3-8 applies to dense, operational, configuration-heavy surfaces.
