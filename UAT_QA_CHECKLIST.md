# UAT QA Checklist

This checklist is the pre-UAT execution pack for the scalable locality-aware homepage, routing, ads, offers, sponsored listings, and admin publishing flows.

## 1) Test Setup

- [ ] Confirm the deployed UAT build starts cleanly and `GET /api/health` returns `ok: true`.
- [ ] Run `npm run qa:access`.
- [ ] Run `npm run qa:public-writes`.
- [ ] Run `npm run qa:workflow`.
- [ ] Prepare test users for `buyer`, `seller`, `admin`, and `developer`.
- [ ] Prepare at least 2 active UAT localities.
- Suggested baseline localities:
  - `Roadpali`
  - `Kalamboli`
- [ ] Prepare at least 1 locality with partial or empty optional content for empty-state checks.
- [ ] Prepare at least 1 category-targeted page and 1 subcategory-targeted page.

## 2) Homepage Visual QA

- [ ] Desktop homepage loads for each selected UAT locality without layout breaks.
- [ ] Mobile homepage loads for each selected UAT locality without layout breaks.
- [ ] Hero banner content matches the selected locality.
- [ ] Search, category shortcuts, and homepage section ordering match the published configuration.
- [ ] No admin/internal-only controls are visible in public homepage views.
- [ ] Section spacing, typography, and CTA states remain usable on narrow screens.
- [ ] Homepage still renders correctly when premium/sponsored image-only sections are absent.

## 3) Routing QA

- [ ] Direct locality route resolves the correct homepage.
- [ ] Pincode route resolves the intended locality homepage.
- [ ] Category route resolves the intended locality/category homepage.
- [ ] Subcategory route resolves the intended locality/subcategory homepage.
- [ ] Switching between two UAT localities does not leak the previous locality’s hero, offers, or featured listings.
- [ ] Invalid or unmapped pincode falls back to the configured default locality/page.
- [ ] Canonical URL and metadata update correctly across locality/category variations.

## 4) Section Combination QA

- [ ] Homepage renders correctly with hero + offers + updates + featured businesses together.
- [ ] Homepage renders correctly with only core sections enabled.
- [ ] Homepage renders correctly when ads are enabled and offers are disabled.
- [ ] Homepage renders correctly when offers are enabled and ads are disabled.
- [ ] Homepage renders correctly when sponsored listing sections are enabled.
- [ ] Homepage renders correctly when a category-specific campaign overlays a locality campaign.
- [ ] Resolver/published snapshot output stays stable when multiple targeted sections exist for the same locality.

## 5) Empty-State QA

- [ ] No crash when a locality has no offers.
- [ ] No crash when a locality has no updates.
- [ ] No crash when a locality has no featured businesses.
- [ ] No crash when a locality has no active ad banners.
- [ ] No crash when a category/subcategory route has low or zero matching businesses.
- [ ] Empty states do not leave broken cards, broken image boxes, or blank white gaps that look like failed loads.

## 6) Search and Discovery QA

- [ ] Search suggestions appear smoothly while typing.
- [ ] Search suggestions include business names as intended when category/subcategory does not match first.
- [ ] Search results route opens the expected locality/category context.
- [ ] Search is responsive on desktop.
- [ ] Search is responsive on mobile.
- [ ] No page blanking or console-breaking errors occur while typing in search.

## 7) Contact Unlock and Public Write QA

- [ ] Contact unlock OTP sends successfully for a valid public user flow.
- [ ] Contact unlock does not complete with an invalid OTP.
- [ ] Contact unlock does not record a view without a verified unlock grant.
- [ ] Contact unlock daily limit blocks repeated access as expected.
- [ ] Ad lead submission works for a live ad placement.
- [ ] Ad lead submission rejects malformed payloads gracefully.
- [ ] Audit event creation still works for normal browser flows without flooding logs.

## 8) Admin Create/Edit QA

- [ ] Admin can open `Admin Workspace` and `Operations Workspace`.
- [ ] `Homepage CMS` subtabs switch cleanly and do not overload a single page.
- [ ] `Platform Config` subtabs switch cleanly and load the intended manager only.
- [ ] `Geography & Routing` subtabs switch cleanly between locality pages, routing, and URL links.
- [ ] `Ads & Offers` subtabs switch cleanly between offers, banners, and lead inbox.
- [ ] Taxonomy and geography imports accept native `.xlsx` as well as flat-file templates.
- [ ] `npm run qa:resolved-homepage` passes before UAT publish sign-off.
- [ ] `npm run qa:resolved-runtime` passes before UAT publish sign-off.
- [ ] Resolved preview or network response clearly shows source/strategy/snapshot provenance during UAT publish verification.
- [ ] `npm run qa:uat` passes as the consolidated pre-UAT gate.
- [ ] Admin can create and edit hero banners.
- [ ] Admin can create and edit offers.
- [ ] Admin can create and edit listing ads.
- [ ] Admin can create and edit locality/category links.
- [ ] Admin can edit taxonomy and geography from the split config sections.
- [ ] Admin can upload taxonomy template files from Excel-exported CSV/tab-separated files.
- [ ] Admin can upload geography template files from Excel-exported CSV/tab-separated files.
- [ ] Admin can create a missing subcategory inline while editing a listing.

## 9) Publish and Resolver QA

- [ ] Admin can preview resolved homepage output for a selected locality.
- [ ] Admin can preview category-targeted output.
- [ ] Admin can preview subcategory-targeted output.
- [ ] Admin can publish a single resolved homepage context.
- [ ] Admin can publish scoped snapshot batches.
- [ ] Published snapshot history refreshes correctly after publish.
- [ ] Public route reads the intended published/scalable path after publish.
- [ ] Updating content and re-publishing changes the public result as expected.
- [ ] Snapshot delete flow works for a single snapshot.
- [ ] Snapshot scoped delete flow works for a batch/scope.

## 10) Ads, Offers, and Sponsored QA

- [ ] Locality-specific ad banners appear only where targeted.
- [ ] Inactive ad banners do not appear on the frontend.
- [ ] Offer cards appear only where targeted.
- [ ] Sponsored listing presentation appears only where targeted.
- [ ] Non-premium listings do not incorrectly show premium-only photo treatment.
- [ ] Category-aware targeting works for ads/offers/sponsored content.
- [ ] Date-based start/end activation behaves correctly.

## 11) Role and Access QA

- [ ] Buyer can use public homepage and contact unlock flow.
- [ ] Seller can access seller dashboard/workspace only for owned business context.
- [ ] Admin can access homepage/admin configuration and publish flows.
- [ ] Developer can access privileged admin/config paths.
- [ ] Moderator or limited roles do not see privileged config/CMS areas that require admin/developer.

## 12) Defect Logging

- [ ] Record screen or route where issue occurred.
- [ ] Record tested locality, category, subcategory, and pincode context.
- [ ] Record role used.
- [ ] Record whether issue was seen on desktop, mobile, or both.
- [ ] Attach screenshot and console/network evidence for failures.
- [ ] Mark issue as `Blocker`, `High`, `Medium`, or `Low`.

## Exit Criteria

- [ ] No blocker defects remain in homepage load, routing, publish, admin create/edit, or OTP/contact unlock flows.
- [ ] No high-severity cross-locality content leakage remains.
- [ ] No high-severity admin access-control regression remains.
- [ ] Selected UAT localities have production-like hero, offers, featured businesses, and updates loaded.
- [ ] UAT sign-off is recorded by product/ops/admin owners.
