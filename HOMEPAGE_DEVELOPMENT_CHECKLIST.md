# Homepage Development Checklist

This checklist is based on the current implementation in `src/App.tsx`, `src/components/WebPortal.tsx`, `src/components/AdminConsole.tsx`, `src/types.ts`, `server.js`, and the launch notes already present in the repo.

## Done

| Area | Development item | Status | Notes |
| --- | --- | --- | --- |
| Homepage architecture | Locality-level homepage layout model exists | Done | Each locality gets a reusable `HomepageLayout` with ordered sections. |
| Homepage architecture | Default homepage section stack is defined | Done | Includes hero, search, emergency, promo, featured, shelf, categories, offers, updates, verified, and trust sections. |
| Hero | Dynamic hero banner section is implemented | Done | Supports locality-specific banners, rotating images, CTA, and pincode-aware targeting. |
| Search | Search and discovery block is implemented | Done | Includes keyword search, category filter, subcategory filter, and quick category chips. |
| Emergency | Emergency services shortcut grid is implemented | Done | Users can jump into urgent service searches from the homepage. |
| Merchandising | Promo banner slot is implemented | Done | Uses scheduled listing ads with placement keys like `homepage_inline_primary`. |
| Merchandising | Featured businesses section is implemented | Done | Pulls featured businesses into a dedicated homepage grid. |
| Merchandising | Curated business shelf section is implemented | Done | Supports category/subcategory-based merchandising shelves. |
| Discovery | Category grid section is implemented | Done | Users can jump from homepage into top categories. |
| Conversion | Offers and deals section is implemented | Done | Active coupons can render as homepage cards. |
| Freshness | Updates feed section is implemented | Done | Community items can render as locality updates on homepage. |
| Trust | Verified businesses grid is implemented | Done | Approved listings render in a dedicated trust-focused section. |
| Trust | Trust strip is implemented | Done | Homepage closes with platform trust signals and stats. |
| Routing | Pincode/locality-aware homepage routing is implemented | Done | Homepage can resolve context from `/pin/...`, locality routes, and SEO routes. |
| SEO | Homepage/locality SEO route foundation is implemented | Done | Clean locality/category URLs, canonical tags, JSON-LD, robots, and sitemap support exist. |
| SEO | SSR SEO shell for homepage-style locality routes is implemented | Done | Server responds with locality/category/listing-aware metadata and initial content. |
| Admin tooling | Homepage layout manager exists in admin | Done | Admin can add, edit, hide, schedule, duplicate, delete, and reorder homepage sections. |
| Admin tooling | Hero banner manager exists in admin | Done | Admin can create, update, activate, and remove hero banners. |
| Admin tooling | Promo ad and offers managers exist | Done | Homepage-linked ads and coupon content can be configured from admin tools. |
| Data layer | Business taxonomy is DB-backed and editable from admin | Done | Categories and subcategories now load through `/api/business-taxonomy` and can be managed without code edits. |
| Architecture | Shared taxonomy seed exists for server/client bootstrap | Done | The runtime catalog can seed DB state consistently during rollout. |
| Data layer | Locality routing config is backend-managed | Done | Localities, subdomains, default locality, and pincode mappings now load through `/api/locality-routing-config`. |
| Architecture | Shared locality seed exists for server/client bootstrap | Done | App and server now share the same locality default source during rollout. |
| Data layer | Geography config is backend-managed | Done | States, cities, and areas now load through `/api/geography-config` and hydrate a shared runtime catalog. |
| Architecture | Shared geography seed exists for server/client bootstrap | Done | App and server now share the same geography default source during rollout. |
| Data layer | Homepage defaults config is backend-managed | Done | Default homepage section templates and fallback listing ad templates now load through `/api/homepage-defaults-config`. |
| Data layer | SEO discovery config is backend-managed | Done | Route intents, locality SEO metadata, category labels, and fallback listing-name groups now load through `/api/seo-discovery-config`. |
| Admin tooling | Geography config is editable from admin | Done | States, cities, and areas can now be managed from admin and saved through `/api/geography-config`. |
| Admin tooling | Homepage defaults are editable from admin | Done | Section templates and fallback listing ads can now be managed from admin and saved through `/api/homepage-defaults-config`. |
| Admin tooling | Hero banner stat presets and launch defaults are admin-managed | Done | Hero stat templates plus default CTA and duration presets now come from managed homepage defaults instead of duplicated frontend constants. |
| Data layer | Runtime seed bootstrap no longer depends on `src/data.ts` | Done | Businesses now hydrate from `/api/businesses` and coupons/community bootstrap from `/api/homepage-config` backed by server-managed JSON files. |
| Data layer | API mode no longer boots managed homepage state from localStorage | Done | Managed businesses, ads, hero banners, layouts, links, coupons, and community content now initialize server-first in API mode, with DB fallback seeded from managed JSON files. |
| Codebase hygiene | Obsolete frontend seed payloads were removed from `src/data.ts` | Done | Legacy business, coupon, and community seed exports have been deleted now that runtime bootstrap is server-managed. |
| Data safety | Geography save guardrails protect live listing references | Done | Geography saves now block duplicate IDs/names, broken state/city/area chains, orphaned business mappings, and locality-pincode routing conflicts. |
| Runtime | Resolver-backed homepage payloads now drive section business inventory | Done | Resolved homepage payloads now include section-level business IDs so featured/shelf/verified sections can render backend-selected inventory instead of only client-side business filtering. |
| Runtime | Homepage autosync now refreshes resolver snapshots | Done | When homepage config is synced in API mode, the app now best-effort reseeds scalable CMS state and republishes resolved snapshots so the public resolver path stays current after admin edits. |
| Data layer | Homepage shortcut decks are backend-managed | Done | Hero quick-action tiles and search shortcut categories now load from managed homepage defaults instead of hardcoded portal arrays. |
| Admin tooling | Scalable templates now support direct section authoring | Done | Templates can now add sections from the shared draft form and directly edit, reorder, duplicate, and delete their own section lists without relying only on locality-layout sync. |
| Admin tooling | Homepage CMS preview supports locality/device/date/page-type simulation | Done | Resolved-homepage preview now supports locality, device, pincode, category, subcategory, date, and placement-aware page-type testing directly from admin. |
| Runtime | Resolver can fall back to active scoped templates without explicit assignments | Done | Active locality/global fallback templates can now resolve directly before legacy homepage-layout fallback is used. |
| Admin tooling | Scalable CMS targeting uses guided selectors instead of raw ID strings | Done | Template locality scope, campaign locality/category/subcategory targeting, placement keys, and sponsored listing business selection now use structured pickers in admin. |
| Admin tooling | Published snapshot history is visible in the scalable CMS workspace | Done | Admin now shows recent published snapshots with locality/context badges plus payload counts for sections, ads, and sponsored listings. |
| Runtime | Published snapshot identity is placement-aware | Done | Snapshot IDs and persisted records now include placement key so different placement-targeted payloads do not overwrite each other. |
| Admin tooling | Preview context can be published directly into scalable snapshots | Done | Admin can now publish the active preview context instead of only publishing whole localities. |
| Admin tooling | Bulk scalable snapshot publishing supports structured rollout scopes | Done | Admin can now generate and publish scoped snapshot batches across locality, category, subcategory, pincode, placement, device, and page type with a visible context count. |
| Admin tooling | Scalable snapshot lifecycle management supports scoped cleanup | Done | Admin can now delete one published snapshot or remove a scoped snapshot batch using the same structured context model used for publishing. |
| Runtime | Legacy mirroring no longer clobbers scalable-authored entities | Done | Scalable-edited templates, assignments, campaigns, and section changes now detach from legacy sync, and guarded refresh flows skip destructive reseed once the scalable CMS has moved beyond bootstrap-only legacy ownership. |
| Admin tooling | Legacy reseed is now safety-aware and ownership-visible | Done | Safe reseed now blocks when scalable-owned detached entities exist, admin shows legacy-vs-detached ownership counts, and force reseed requires explicit confirmation. |
| Admin tooling | Scalable CMS records now expose ownership state and manual detach controls | Done | Template, assignment, and campaign cards now show legacy-managed vs detached vs scalable-owned state, and admins can detach legacy-seeded records without editing the content itself. |
| Runtime | Scalable CMS relational persistence no longer rewrites whole tables on each save | Done | Server now upserts templates, assignments, campaigns, and snapshots transactionally, prunes only removed IDs, and preserves mirrored scalable metadata when reading from relational tables. |
| Admin tooling | Scalable CMS mutations now support entity-level template, assignment, and campaign APIs | Done | Server exposes dedicated entity CRUD routes and the admin now uses them for key template, assignment, and campaign edits instead of relying only on whole-config saves. |
| Runtime | Snapshot publish/delete flows now update state from direct snapshot payloads | Done | Publish and delete endpoints now return updated published snapshots, and the app merges snapshot state directly instead of re-fetching the full scalable CMS config after each operation. |
| Admin tooling | Published snapshot admin actions now use snapshot-scoped scalable CMS endpoints | Done | Admin can refresh published snapshots directly and single-snapshot deletion now uses the dedicated scalable snapshot route instead of only the generic scoped delete path. |
| Admin tooling | Scalable template section authoring now supports section-scoped APIs | Done | Template section create, update, reorder, duplicate, and delete flows now use dedicated section endpoints when available instead of always saving the full template payload. |
| Admin tooling | Scalable template locality sync now supports a scoped backend operation | Done | `Sync Sections` can now call a server-side locality-layout sync route for the selected template instead of relying only on client-side layout reconstruction before save. |
| Admin tooling | Scalable CMS admin entity helpers no longer fall back to full-config saves | Done | Template, assignment, and campaign admin operations now require the scoped scalable callbacks directly, keeping whole-config saves out of ordinary admin editing flows. |
| Runtime | Homepage-layout legacy mirroring now supports a scoped backend sync route | Done | In API mode, homepage layout mirroring now prefers a dedicated backend sync route for scalable templates and assignments instead of pushing separate whole scalable-config writes from the client. |
| Runtime | Legacy campaign mirroring now supports a scoped backend sync route | Done | In API mode, hero banners, listing ads, offers, content blocks, and sponsored-listing mirroring now use a dedicated backend sync route instead of rewriting the whole scalable CMS config from the client for each source collection. |
| Runtime | Managed locality-routing config no longer depends on browser cache in API mode | Done | API mode now boots localities, subdomains, pincode mappings, and default-locality routing from the managed routing config path, and stale locality-routing cache keys are cleared instead of being treated as the source of truth. |
| Admin tooling | Legacy homepage layout section editing now supports scoped backend APIs | Done | API mode homepage section create, update, reorder, duplicate, and delete flows now use dedicated locality-layout section routes instead of relying only on local state followed by a whole homepage-config autosync. |
| Admin tooling | Key legacy homepage content collections now support scoped backend APIs | Done | Hero banners, listing ads, community items, coupons, and locality-category links now persist through dedicated homepage-config collection routes in API mode instead of relying only on local state plus a broad homepage-config autosync, and offers now have edit/delete coverage on the same path. |
| Admin tooling | Legacy homepage layout lifecycle now supports scoped backend APIs | Done | Locality homepage layouts can now be created, replaced, or deleted through dedicated layout routes, and locality create/delete flows persist those layout changes without depending on a full homepage-config sync. |
| Architecture | Ordinary API-mode homepage writes no longer rely on broad homepage-config autosync | Done | Homepage API settings and bulk layout reconciliation now have scoped routes, ordinary homepage edits persist through scoped APIs, and the full homepage-config sync path is retained only for explicit manual sync or recovery flows. |
| Data layer | Ad leads now support managed API/database persistence in API mode | Done | Public ad lead submissions now post to a managed endpoint, admin lead views can load from that endpoint, and ad lead history is no longer browser-primary in API mode. |
| Data layer | API-mode homepage bootstrap now prefers scoped read endpoints | Done | Homepage API settings, layouts, banners, ads, offers, community items, and locality-category links now load through dedicated read routes first, with the full homepage-config blob retained only as a compatibility fallback. |
| Data layer | Legacy homepage collections now persist to dedicated DB tables | Done | Layouts, hero banners, listing ads, coupons, community items, and locality-category links now sync to dedicated homepage tables when Postgres is available, with the legacy homepage-config blob kept only as a mirror/fallback path. |

## Pending

| Area | Development item | Status | Notes |
| --- | --- | --- | --- |
| Architecture | Replace JSON-heavy homepage config with scalable DB-backed CMS foundation | Priority | Needed for 200-500+ localities with locality/category-aware hero banners, ads, sponsored listings, offers, and content. |
| Architecture | Introduce reusable templates, targeting rules, campaign entities, and published snapshots | Priority | Final page payloads should be resolved on the backend and served as locality-aware snapshots rather than assembled from hardcoded or client-managed config state. |
| Data layer | Seed remaining hardcoded fallbacks into DB-backed configuration records | Priority | Taxonomy, locality routing, runtime geography, homepage defaults, SEO discovery, their admin authoring, runtime seed bootstrap, legacy seed cleanup, and hero draft presets are now covered; `INITIAL_REVIEWS` and `INITIAL_CRM_CONTACTS` are the intentional remaining frontend seeds for now. |
| Admin tooling | Migrate Homepage CMS from direct config blob editing to structured entity management | Priority | Admin should manage templates, sections, locality overrides, campaigns, scheduling, preview, and publish workflows. |
| Performance | Add resolver and publish flow suitable for 500 localities and 1,000+ listings per locality | Priority | Reads should come from published snapshots or equivalent cached resolved payloads rather than repeated client-side assembly. |
| Discovery | Advanced search modes need launch decision and enablement | Pending | Voice, image, and AI search flows are coded but hidden behind `SIMPLE_SEARCH_FORM = true`. |
| Discovery | Advanced filter deck needs enablement and QA | Pending | Rich filters exist in code but are hidden behind `SHOW_REFINED_FILTERS = false`. |
| Navigation | Portal tabbed homepage experience needs launch decision | Pending | Community and merchant tabs exist but public tabs are hidden behind `SHOW_PORTAL_TABS = false`. |
| Public UX | Subdomain/location mapping widget should stay removed or be redesigned | Pending | Old mapping UI exists in code but is disabled with `showSubdomainLocationMapping = false`. |
| Content ops | Final hero copy, images, offers, and updates need real launch content | Pending | Structure exists, but homepage quality now depends on curated production content per locality. |
| Content ops | Empty-state content strategy for optional sections needs polish | Pending | Promo, offers, updates, and shelf sections disappear when content is missing; launch may need designed fallbacks. |
| Data layer | Some operational state still relies on `localStorage` | Pending | `INITIAL_REVIEWS`, `INITIAL_CRM_CONTACTS`, audit logs, user session state, viewed-listing cache, and local-mode fallbacks still need a fuller managed persistence story. |
| Data layer | Remaining operational/runtime state should move fully to API/database | Pending | Reviews, CRM contacts, audit logs, user session/view caches, local-mode fallback state, and any remaining legacy mirrors still need a fuller managed persistence story. |
| Security | Public homepage flows need stronger production protection | Pending | Launch notes still call for server-side validation, rate limits, CSRF protection, and secure session handling. |
| Security | Missing response headers should be added | Pending | `Strict-Transport-Security` and `Content-Security-Policy` are missing from the current production scan and should be added before release hardening is considered complete. |
| Access control | Sandbox/admin-only controls need full production hardening | Pending | Repo notes still call out route-level admin gating and hiding internal tools from public users. |
| Seller ops | Seller dashboard needs to be built | Done | Merchant workspace now locks to the seller-owned listing when available, shows real CRM/ad lead/offer/review counts, and keeps the existing campaign and CRM tools as the pre-UAT seller dashboard. |
| Buyer ops | Buyer dashboard needs to be built | Done | Buyers now get a dedicated dashboard for saved listings, unlocked contacts, verified actions, and submitted reviews, all driven from managed app state instead of placeholder buttons. |
| Security | VAPT test needs to be executed | Pending | Application auth, role isolation, upload surfaces, and data exposure need an external-style verification pass. |
| Performance | Load test needs to be executed | Pending | High-locality traffic, homepage throughput, OTP, and media upload paths still need stress validation. |
| Compliance | Legal/privacy pages and data-use disclosure are still needed | Pending | Especially relevant because homepage can trigger OTP, audit logging, and lead capture. |
| Observability | Homepage production monitoring still needs completion | Pending | Health endpoint exists, but launch notes still require alerts, error monitoring, and operational readiness. |
| QA | End-to-end homepage QA checklist still needs execution | Pending | Needs pass across desktop/mobile, section combinations, pincode routing, SEO routes, and empty-content scenarios. |

## Pre-UAT Focus

1. Security + access hardening.
   - keep route-level admin gating complete for write APIs
   - hide internal/admin-only UI from public users where still exposed
   - add `Strict-Transport-Security`
   - add `Content-Security-Policy`
   - add basic protection on public write flows
2. Resolver/publish stability.
   - ensure homepage reads come from the intended resolved/scalable path for UAT localities
   - verify publish flow is consistent across locality/category/page variants
3. Critical persistence completion.
   - finish only the remaining persistence that can break homepage/admin UAT flows
   - avoid broad post-UAT persistence migrations in this pass
4. UAT QA pack.
   - desktop/mobile homepage QA
   - pincode/locality routing
   - section combinations
   - empty-state handling
   - admin create/edit/publish flows
5. Launch content for selected UAT localities.
   - hero banners
   - offers
   - featured businesses
   - updates

## Post-UAT Backlog

1. Complete the broader scalable DB-backed locality CMS foundation for 500-locality scale.
2. Move the remaining non-critical operational state off `localStorage` and legacy mirrors.
3. Expand seller and buyer dashboards beyond pre-UAT scope as needed.
4. Decide whether advanced search, portal tabs, and refined filters should launch.
5. Complete the wider production-readiness pack: monitoring, compliance, full VAPT, and load testing.
