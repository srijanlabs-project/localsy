---
id: LOCALISY-DOC-1008
title: Customer-Facing Frontend — Screen-by-Screen UX Specification (v1)
document: 08-customer-frontend-screen-specification.md
version: 1.0
status: Draft — for review
---

# 1. Why this document exists

The admin backend's problem was one 400KB file switching tabs with no real navigation. A first look at the customer-facing frontend suggested it didn't have that problem — `App.tsx` does real URL-driven routing (`national` / `city/:cityId` / `seller/:slug` / bare locality routes, with `popstate` support), and there are dedicated components per page (`NationalDirectoryPage`, `CityDirectoryUiV1`, `SellerShowcasePage`).

A closer read found the same problem recurring one layer down, plus two others worth fixing at the same time:

- **`WebPortal.tsx` is the public-frontend's own monolith.** At 7,659 lines it owns an internal `activePortalTab` (`'listings' | 'community' | 'merchant'`) and renders the locality homepage, search/category results, listing detail, a buyer dashboard, and a full merchant CRM/campaign workspace — five distinct jobs — as conditional blocks inside one component, not as routes. Outer routing is real; this component just doesn't use it.
- **There are two parallel implementations of the same screens.** `LocalityLandingUiV1.tsx`, `CategoryResultsUiV1.tsx`, and `ListingDetailUiV1.tsx` exist as standalone components reachable only at preview routes (`/ui/locality-home-v1`, `/ui/category-results-v1`, `/ui/listing-detail-v1`), disconnected from real data and session state. The *live* versions of those same three screens are hand-rolled again, inline, inside `WebPortal.tsx`. Neither is uniformly "the good one" — see Section 7.
- **Design language conformance is split roughly along an old/new line**, not a screen-by-screen line. `WebPortal.tsx`, `LocalityLandingUiV1.tsx`, and `CityDirectoryUiV1.tsx` use generic near-black (`#111827`) and Tailwind amber (`#F59E0B`) instead of Localisy Navy and Lemon Yellow, and the merchant dashboard inside `WebPortal.tsx` uses default Tailwind slate/indigo/emerald/violet plus emoji icons. `CategoryResultsUiV1.tsx`, `ListingDetailUiV1.tsx`, `NationalDirectoryPage.tsx`, `SellerShowcasePage.tsx`, and the shared `localisyPublicPrimitives.tsx` are correctly on-brand. The already-approved static mock (`05-locality-landing-ui-mock-v1.html`) also uses the correct tokens — meaning the *implemented* `LocalityLandingUiV1.tsx` has drifted from the very mock it was supposedly built from.

This document does three things at once: proposes the customer-facing information architecture as real routed screens (Section 3), specifies each screen with its current state and what needs to change (Section 5), and gives a consolidation plan for the monolith and the duplicate-implementation problem (Section 6-7) so "closing the frontend" means something concrete rather than a restatement of good intentions.

# 2. Design principles

Same core principles as the admin spec (one job per screen, real navigation, consistent shell, role-appropriate content), plus three specific to the public side:

- **One implementation per screen, not two.** Every screen in Section 5 names a single authoritative component. Where a live and a preview version both exist today, one is designated the target and the other is retired once parity is reached — never left as two silently-diverging copies.
- **Locality context is the spine, not a side effect.** Per the design language's Section 9, the selected locality/pincode should stay visible and consistent from national → city → locality → category → listing, using one shared header/context component instead of each page rolling its own.
- **Brand tokens are non-negotiable on customer-facing surfaces.** These are the pages the public actually sees; drift here is more costly than in admin. Every screen below states its current conformance and the specific fix if it drifts.

# 3. Proposed information architecture (routes)

| Route | Screen | Roles |
|---|---|---|
| `/` or `/national` | National Directory | Anonymous, Buyer |
| `/city/:cityId` | City Directory | Anonymous, Buyer |
| `/locality/:localitySlug` | Locality Landing | Anonymous, Buyer |
| `/locality/:localitySlug/category/:categorySlug` and `/search?q=` | Category & Search Results | Anonymous, Buyer |
| `/listing/:businessId` | Listing Detail | Anonymous, Buyer |
| `/seller/:slug` | Seller Showcase (public merchant profile) | Anonymous, Buyer |
| `/claim/:businessId` **(new)** | Claim & Onboarding | Anonymous → Seller |
| `/dashboard` **(elevated to a real route)** | Buyer Dashboard | Buyer |
| `/merchant` **(elevated to a real route)** | Merchant Workspace (CRM & Campaigns) | Seller |
| `/merchant/listing/:businessId/edit` **(new)** | Listing Editor | Seller |

Modals/overlays layered on top of any route: Auth Modal, OTP Verification Modal, Pincode Selection Modal, Location Picker. These aren't routes — they're documented in Section 5 as shared overlays.

# 4. Global shell

- **Header**: unify every page on `LocalisyPreviewHeader` from `localisyPublicPrimitives.tsx` — today `LocalityLandingUiV1.tsx` and `CityDirectoryUiV1.tsx` each hand-roll their own header instead of using it, which is why they've drifted furthest from the brand tokens.
- **Locality/pincode context bar**: current selection visible in the header on every discovery page (national → city → locality → category → listing), backed by the existing Pincode Selection Modal and Location Picker rather than each page re-deriving it.
- **Search**: one shared search/autosuggest component (the existing `filterSearchSuggestions` logic in `WebPortal.tsx` is functionally solid per the submodule spec — it needs to move to a shared component so National/City/Locality pages don't each reimplement it).
- **Auth state**: Auth Modal is the single entry point for login/register across every page; once authenticated, the header shows the Buyer Dashboard or Merchant Workspace entry point depending on role.

# 5. Screen-by-screen specification

Each entry: **Purpose**, **Current state**, **Roles**, **Layout**, **Key actions**, **Notes**.

## 5.1 National Directory

- **Purpose:** SEO/discovery landing aggregating businesses/cities/states; top-categories grid; featured businesses across markets; high-coverage localities.
- **Current state:** `webportal/NationalDirectoryPage.tsx` — single implementation, on-brand, reasonably production-ready.
- **Roles:** Anonymous, Buyer.
- **Layout:** Hero with aggregate stats → top-category grid → featured businesses → high-coverage-localities sidebar.
- **Key actions:** Drill into a city or category; pincode/location entry to jump straight to a locality.
- **Notes:** Add explicitly to `02-screen-inventory.md` — it exists and works but isn't named in that doc today.

## 5.2 City Directory

- **Purpose:** Browse localities and categories within a city.
- **Current state:** `ux/CityDirectoryUiV1.tsx` — single implementation (no live/preview split), but **off-brand**: generic near-black instead of Navy, Tailwind amber instead of Lemon Yellow, hand-rolled header instead of the shared primitive.
- **Roles:** Anonymous, Buyer.
- **Layout:** Header/search → category tiles → business cards grouped by category → promo cards.
- **Key actions:** Select a category or locality; search.
- **Notes:** Needs a token pass (swap `#111827`→Navy, `#F59E0B`→Lemon Yellow) and a swap to `LocalisyPreviewHeader`. No consolidation issue here — just a conformance fix.

## 5.3 Locality Landing

- **Purpose:** The primary tenant-scoped homepage — hero, category grid, featured/regular listings, community content, and (for authenticated sellers) merchant tab access.
- **Current state:** **Two implementations.** The live route renders this inline inside `WebPortal.tsx` (real data, real session). `ux/LocalityLandingUiV1.tsx` is a separate, disconnected component reachable only at `/ui/locality-home-v1` / `/ux/locality-home-v1` — and despite being the newer-looking "V1" component, it's the one that's drifted off-brand (`#111827`, `#F59E0B`, a 12-color `CATEGORY_ACCENTS` array where only 2 of 12 are brand tokens).
- **Roles:** Anonymous, Buyer, Seller (sees an additional entry point into Merchant Workspace).
- **Layout:** Hero (rotating banner/ad content) → category grid → featured listings → regular listings → community content block.
- **Key actions:** Browse category, open a listing, unlock contact (OTP), post a community item.
- **Notes:** This is the highest-priority consolidation target (Section 6). Recommendation: rebuild as its own routed component reusing the *approved static mock's* tokens (`05-locality-landing-ui-mock-v1.html` — correct brand hex throughout) rather than continuing from either existing implementation, then retire both the `WebPortal`-inline version and the disconnected `LocalityLandingUiV1.tsx` preview.

## 5.4 Category & Search Results

- **Purpose:** Show matching businesses for a category browse or a free-text search — currently the same underlying flow either way.
- **Current state:** **Two implementations.** Live: inline inside `WebPortal.tsx` (`isResultsPage` branch) with a grid/map toggle. Preview-only: `ux/CategoryResultsUiV1.tsx` at `/ui/category-results-v1` — this one **is** on-brand and includes a filter rail and sponsored panel not present in the live version.
- **Roles:** Anonymous, Buyer.
- **Layout:** Filter rail (locality/category/subcategory/price/rating) → result grid or map toggle → sponsored panel → pagination.
- **Key actions:** Filter, sort, switch grid/map, open a listing.
- **Notes:** Docs (`04-documentation-handoff-and-design-scope.md`) list "category results page" and "search results page" as two separate Wave 1 screens; in practice they're one code path today. Recommend formalizing them as **one screen with two entry points** (category browse vs. search query) rather than building a second screen to match the docs — update the docs to reflect this instead. `CategoryResultsUiV1.tsx` is the stronger reference to build the real, data-connected version from.

## 5.5 Listing Detail

- **Purpose:** Full business profile — trust signals, contact unlock, reviews, related businesses.
- **Current state:** **Two implementations**, same pattern as 5.3/5.4: live inline in `WebPortal.tsx`, and a disconnected, on-brand preview at `ux/ListingDetailUiV1.tsx` / `/ui/listing-detail-v1`.
- **Roles:** Anonymous, Buyer.
- **Layout:** Hero → contact/trust-signal cards → OTP-gated contact reveal → reviews list → review submission form → related businesses.
- **Key actions:** Unlock contact (OTP), submit a review, share/save, view related listings.
- **Notes:** `ListingDetailUiV1.tsx` is the stronger reference (on-brand, cleaner structure) — same consolidation pattern as 5.3/5.4: build the real version from it, then retire the `WebPortal`-inline copy and the disconnected preview route.

## 5.6 Seller Showcase (public merchant profile)

- **Purpose:** Public-facing profile for a merchant — stats, claim/contact-sales CTAs, gallery, nearby alternatives.
- **Current state:** `webportal/SellerShowcasePage.tsx` — single implementation, on-brand, close to production-ready.
- **Roles:** Anonymous, Buyer, prospective Seller.
- **Layout:** Header/stats (rating, leads, impressions, CTR) → claim/contact-sales CTA → gallery → nearby alternatives.
- **Key actions:** Claim listing, contact sales.
- **Notes:** The "Claim listing" CTA currently only fires a lead-callback stub (`handleClaimListingLead` in `App.tsx`) — it does not lead anywhere yet. That gap is closed by 5.7.

## 5.7 Claim & Onboarding *(new)*

- **Purpose:** Let a prospective merchant claim an existing unclaimed listing, or submit a new business for listing — the flow named in the docs (`04-documentation-handoff-and-design-scope.md` §5.2 "claim business entry," "add business onboarding") but not yet built.
- **Current state:** Does not exist as a screen; only a lead-capture stub exists on 5.6.
- **Roles:** Anonymous → Seller (post-claim).
- **Layout:** Multi-step: (1) identity/contact capture, (2) business verification (claim an existing listing by matching details, or submit new details), (3) confirmation + what happens next (moderation queue, per the admin spec's Merchant Claims & Verification screen).
- **Key actions:** Submit claim, submit new listing, track status.
- **Notes:** This is the customer-facing counterpart to the admin backend's Merchant Claims & Verification screen (admin spec Section 5.9) — build them together; a claim submitted here is what populates that admin queue.

## 5.8 Buyer Dashboard *(elevate to a real route)*

- **Purpose:** Saved listings, compare queue, contact-unlock history, reviews the buyer has written.
- **Current state:** Exists in code as a tab inside `WebPortal.tsx`, but is **not documented anywhere** — `01-information-architecture.md` only vaguely gestures at "buyer account views" under Authenticated Layers, `02-screen-inventory.md` doesn't list it at all.
- **Roles:** Buyer (authenticated).
- **Layout:** Saved listings grid → compare queue → contact-unlock history → my reviews.
- **Key actions:** Remove a saved listing, open a comparison, edit/delete a review.
- **Notes:** Give it a real route (`/dashboard`) instead of a `WebPortal` tab, and add it to the IA/screen-inventory docs — it's a real, working feature that's currently invisible in the documentation.

## 5.9 Merchant Workspace (CRM & Campaigns) *(elevate to a real route)*

- **Purpose:** The seller-side counterpart to admin's Campaigns — CRM contacts, coupon/offer management, lead inbox, WhatsApp-style campaign dispatch.
- **Current state:** Exists as a tab inside `WebPortal.tsx` (`:5804` onward) and is the **most off-brand surface found** — default Tailwind slate/indigo/emerald/sky/amber/violet colors plus emoji icons (💼🗄️), a direct contradiction of the design language's "avoid too many competing accent colors" rule. The "WhatsApp campaign" send action is a client-side `alert()`, not a real send.
- **Roles:** Seller (authenticated, claimed listing).
- **Layout:** CRM contact list → coupon/offer manager → lead inbox → campaign composer.
- **Key actions:** Add/edit CRM contact, create coupon, respond to lead, compose and (eventually, really) send a campaign.
- **Notes:** Needs both a route (`/merchant`) and a full token pass to brand colors — this is the customer-facing screen furthest from ready. The "campaign dispatched" alert should become a real background job (reusing the async job pattern from the admin spec, Section 4.4) once there's a real send channel behind it.

## 5.10 Listing Editor *(new)*

- **Purpose:** Let an approved merchant manage their own listing content (hours, description, photos, categories) after approval — named in `FEATURE_CATALOG.md`'s live-feature list ("after approval, manage listing content") but no dedicated screen exists.
- **Current state:** Does not exist.
- **Roles:** Seller (authenticated, claimed/approved listing).
- **Layout:** Form sections mirroring the admin Listing Directory's edit fields (name, description, hours, photos, categories, service area), with a save/preview step before publishing changes live.
- **Key actions:** Edit and save fields, preview before publish.
- **Notes:** Edits from a merchant likely need the same moderation-aware treatment as new submissions (either auto-publish minor fields, queue major changes for moderation) — flag this as an open policy question, not just a UI question, before building.

## 5.11 Review Submission (inline flow, not a separate screen)

- **Purpose:** Let a buyer submit a rating/review after OTP verification.
- **Current state:** Implemented inline within Listing Detail (both the live and preview versions). This is a reasonable pattern — no need to force it into its own page.
- **Roles:** Buyer (OTP-verified).
- **Layout:** Inline form on Listing Detail: rating, comment, optional photo/video.
- **Key actions:** Submit review (server-verified via OTP, not the static-OTP behavior `MOCK_FEATURES.md` still describes — see Section 8).
- **Notes:** Keep inline; just make sure it's documented as a defined component rather than ad hoc markup once Listing Detail is consolidated (5.5).

## 5.12 No-Results State

- **Purpose:** Recovery UI when a search/category/locality query returns nothing.
- **Current state:** `webportal/NoResultsState.tsx` — suggested categories, nearby localities, fallback recommended businesses, "Request Human Recommendation" CTA. Matches the search/autosuggest spec's zero-result recovery section well.
- **Roles:** Anonymous, Buyer.
- **Layout:** As above.
- **Key actions:** Try a suggested category/locality, request human help.
- **Notes:** Solid as-is; no changes needed beyond making sure it's reused consistently by whichever consolidated Category & Search Results component replaces the current two.

## 5.13 Results Map View

- **Purpose:** Map-based alternative to the results grid.
- **Current state:** `webportal/ResultsMapView.tsx` — **the "map" is not a real map.** Pins are placed via a synthetic projection function onto a CSS gradient/grid background; there is no map SDK underneath. This was not previously flagged in `MOCK_FEATURES.md`.
- **Roles:** Anonymous, Buyer.
- **Layout:** Toggled from Category & Search Results.
- **Key actions:** Toggle grid/map, click a pin to open a listing.
- **Notes:** Add to the mock-features inventory (Section 8) and to `PUBLIC_LAUNCH_CHANGES.md` — a fake map on a public results page is a more visible integrity problem than most of the already-known mocks. Needs a real map SDK (e.g. Google Maps or Mapbox) before public launch.

## 5.14 Shared overlays: Auth, OTP, Pincode, Location

- **Auth Modal** (`AuthModal.tsx`) — tabbed login/register, calls real `/api/auth/*` endpoints. Production-ready; shows a `devOtpHint` only when the backend explicitly flags dev mode, which is the correct pattern (not a hardcoded client-side bypass).
- **OTP Verification Modal** (`OtpVerificationModal.tsx`) — contact-unlock gate, calls real `/api/contact-unlock/*` endpoints. **Note:** `MOCK_FEATURES.md` still describes this as a static OTP (`1212`) — that's stale; the actual implementation is server-verified. Reconcile the doc (Section 9).
- **Pincode Selection Modal** (`PincodeSelectionModal.tsx`) — 6-digit pincode → locality routing with quick-pick chips. Functionally solid; contains one leftover label reading "Location-Based Yellow Pages Routing" that should be renamed alongside the rest of the "Yellow Pages" → "Businesses" branding cleanup already required by `PUBLIC_LAUNCH_CHANGES.md`.
- **Location Picker** (`GoogleLocationPicker.tsx`) — confirmed simulated: hardcoded lat/lng and mock addresses keyed off city-name substring matching, with random jitter. Matches what `MOCK_FEATURES.md` already says. Needs a real geolocation/Maps integration before public launch, same launch-blocking category as 5.13's fake map.

# 6. Consolidating the `WebPortal.tsx` monolith

Mirrors the admin backend's core fix. `WebPortal.tsx` currently renders five distinct screens (Locality Landing, Category & Search Results, Listing Detail, Buyer Dashboard, Merchant Workspace) as tab/conditional state inside one 7,659-line file instead of using the routing that already exists at the `App.tsx` level.

1. Rebuild each of the five as its own routed component (Section 3's route table), each owning its own data-fetching instead of sharing `WebPortal`'s combined state.
2. For the three with a disconnected preview twin (Locality Landing, Category & Search Results, Listing Detail — Sections 5.3-5.5), build the real version from whichever twin is closer to on-brand and better structured (the preview component in two of three cases; the approved static mock for Locality Landing specifically), not from scratch and not from the `WebPortal`-inline version.
3. Once a consolidated screen reaches parity with what `WebPortal.tsx` currently does (same data, same actions), retire both the old inline block and the disconnected `/ui/*` preview route for that screen — don't leave three versions of "done."
4. Buyer Dashboard and Merchant Workspace (Sections 5.8-5.9) have no preview twin to draw from — build them fresh as routed screens directly out of `WebPortal.tsx`'s current inline versions, applying the design-language token fixes as part of the move (this is where the worst drift is, so don't just relocate the existing markup unchanged).

# 7. Design language conformance fixes

Concrete, not general advice:

| Where | Problem | Fix |
|---|---|---|
| `WebPortal.tsx`, `LocalityLandingUiV1.tsx`, `CityDirectoryUiV1.tsx` | `#111827` used for headers/ink | Replace with Navy `#0D1B2A` |
| Same files | `#F59E0B` (Tailwind amber) used for highlights | Replace with Lemon Yellow `#FFD54F` |
| `LocalityLandingUiV1.tsx` `CATEGORY_ACCENTS` (12 colors, 2 on-brand) | Arbitrary rainbow accent set | Replace with a small, brand-safe accent set (Navy / Royal Blue / Sky Blue / Slate Gray, used consistently, not one-hue-per-category) |
| `WebPortal.tsx` merchant dashboard | Tailwind default slate/indigo/emerald/sky/amber/violet + emoji icons | Rebuild on Localisy tokens per Design Language Section 7 (icon buttons outlined and compact, not emoji) as part of the 5.9 rebuild |
| `LocalityLandingUiV1.tsx`, `CityDirectoryUiV1.tsx` | Hand-rolled headers instead of the shared primitive | Adopt `LocalisyPreviewHeader` from `localisyPublicPrimitives.tsx` everywhere |

`CategoryResultsUiV1.tsx`, `ListingDetailUiV1.tsx`, `NationalDirectoryPage.tsx`, `SellerShowcasePage.tsx`, and `localisyPublicPrimitives.tsx` need no color fixes — they're already correct and should be treated as the reference set for anything new.

# 8. Non-production elements found on customer-facing surfaces (extends `MOCK_FEATURES.md`)

- **Fake map** (5.13) — not previously documented; a bigger integrity risk than most existing entries since it's on a public results page, not an internal tool.
- **Simulated location picker** (5.14) — already documented, confirmed still accurate.
- **Simulated voice/image search** in `WebPortal.tsx` — already documented, confirmed still accurate.
- **Simulated WhatsApp campaign dispatch** (`WebPortal.tsx:1350`, a client-side `alert()`) — not previously documented as a customer/merchant-facing mock; should be listed alongside the other simulated modules.
- **Developer Sandbox / Moderator Login Gate ships in the production bundle**, gated only by a hardcoded `PRODUCTION_MODE = true` flag in `App.tsx` (`:1431`) rather than being excluded at build time. `PUBLIC_LAUNCH_CHANGES.md` already says this should be "internal-only in production build" — today it's suppressed, not removed, which is a weaker guarantee. Recommend a build-time strip (e.g. excluded from the production bundle entirely) instead of a runtime flag before public launch.
- **`MOCK_FEATURES.md` is stale on OTP**: it still describes a static OTP (`1212`); the actual `OtpVerificationModal.tsx` and `AuthModal.tsx` call real backend endpoints. Fix the doc, don't fix the (already-correct) code.

# 9. Docs to update alongside this spec

- `02-screen-inventory.md` — add National Directory, Seller Showcase, Buyer Dashboard, Claim & Onboarding, Listing Editor.
- `01-information-architecture.md` — replace the vague "buyer account views" / "merchant workspace" line under Authenticated Layers with the explicit routes from Section 3.
- `04-documentation-handoff-and-design-scope.md` — reconcile "search results page" vs "category results page" into the single merged screen described in 5.4; add the fake-map and WhatsApp-dispatch mocks to its risk awareness.
- `MOCK_FEATURES.md` — correct the stale static-OTP claim; add the fake map and simulated WhatsApp dispatch.
- `PUBLIC_LAUNCH_CHANGES.md` — add the build-time sandbox-stripping recommendation (Section 8) and the real-map/real-location-integration requirement (Sections 5.13-5.14) to its existing security/readiness list.

# 10. Sequencing

1. **Shell unification** — adopt `LocalisyPreviewHeader` everywhere, fix City Directory's token drift (5.2) — cheapest, most visible win.
2. **Consolidate Locality Landing, Category & Search Results, Listing Detail** (5.3-5.5) — highest-traffic public screens, and the ones with the duplicate-implementation problem actively causing drift.
3. **Buyer Dashboard and Merchant Workspace as real routes** (5.8-5.9) — same move-and-fix pattern, Merchant Workspace gets the heaviest token rework.
4. **Claim & Onboarding, Listing Editor** (5.7, 5.10) — net new; sequence alongside the admin backend's Merchant Claims & Verification screen (admin spec Section 5.9) since they're two ends of the same workflow.
5. **Real map and real location picker** (5.13, 5.14) — these are third-party integration work, not just UI, so they can run in parallel with the above rather than blocking it; treat as a public-launch gate regardless of when they land.
6. **Docs reconciliation** (Section 9) — do alongside step 1, not after everything else, so the documentation doesn't drift further while the rebuild is in progress.
