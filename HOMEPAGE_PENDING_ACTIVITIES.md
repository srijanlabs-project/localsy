# Homepage Pending Activities

This file tracks the remaining homepage and admin work after the current round of homepage CMS and responsive layout updates.

## Done This Pass

- Added pre-UAT seller and buyer dashboards.
  - buyer dashboard now shows saved listings, unlocked contacts, verified actions, and submitted reviews
  - seller workspace now locks to the authenticated seller listing when available and shows live CRM, ad lead, offer, and review counts
  - business-card save actions now persist into buyer dashboard activity instead of acting as placeholders
- Added a DB-backed business taxonomy layer for master category management.
  - shared taxonomy seed consumed by client and server
  - `/api/business-taxonomy` read/write API
  - Postgres-backed `business_categories` and `business_subcategories`
  - runtime taxonomy hydration in the app
  - admin UI to create, edit, and delete categories/subcategories
- Added a managed locality routing configuration layer.
  - shared locality seed consumed by client and server
  - `/api/locality-routing-config` read/write API
  - Postgres-backed locality, subdomain, and pincode mapping tables
  - app-side locality routing hydration before homepage config load
  - admin locality and pincode changes now persist through the managed config path
- Added a managed geography configuration layer.
  - shared geography seed consumed by client and server
  - `/api/geography-config` read/write API
  - Postgres-backed state, city, and area tables
  - runtime geography catalog hydration before homepage config load
  - app, portal, admin, and simulator now read geography from the runtime catalog instead of direct hardcoded imports
- Added a managed homepage defaults configuration layer.
  - shared homepage defaults seed consumed by client and server
  - `/api/homepage-defaults-config` read/write API
  - public portal fallback sections now come from managed section templates
  - public portal fallback ad inventory now comes from managed fallback ad templates
  - locality homepage bootstrap layouts now derive from configurable section templates instead of inline hardcoded stacks
- Added a managed SEO discovery configuration layer.
  - shared SEO discovery seed consumed by client and server
  - `/api/seo-discovery-config` read/write API
  - frontend SEO route intents now hydrate from managed config instead of inline constants
  - server SSR locality metadata, sitemap inputs, robots host mapping, and fallback listing names now resolve from managed config
  - admin UI now manages locality SEO metadata, route intents, category labels, and fallback listing groups
- Added admin authoring for managed geography configuration.
  - admin section to create, edit, and delete states
  - admin section to create, edit, and delete cities
  - admin section to create, edit, and delete areas with pincodes
  - save flow wired to `/api/geography-config`
- Added admin authoring for homepage defaults configuration.
  - admin section to manage default homepage section templates
  - admin section to manage fallback listing ad templates
  - admin section to manage hero stat templates and hero banner launch presets
  - save flow wired to `/api/homepage-defaults-config`
- Added managed hero banner defaults to the homepage-defaults configuration path.
  - hero stat templates now hydrate from managed config instead of app/admin hardcoded constants
  - hero banner CTA and launch-duration presets now hydrate from managed config
  - local hero stat locality targeting now saves with real locality IDs instead of pincode parsing
- Added geography validation guardrails for high-scale operations.
  - duplicate state/city/area ID validation
  - duplicate state/city/area name validation in scope
  - relationship integrity validation for state -> city -> area chains
  - business reference protection so geography changes cannot orphan listing mappings
  - locality/pincode routing consistency checks before save
- Moved more homepage rendering responsibility onto the backend resolver path.
  - resolved homepage payloads now include section-level business inventory IDs for business shelves, featured sections, text strips, and verified grids
  - public homepage business sections now prefer resolver-supplied inventory before falling back to legacy client-side selection
  - backend template section filtering now respects locality and pincode targeting before payloads reach the frontend
- Kept resolver snapshots fresher after homepage admin changes.
  - homepage config autosync now best-effort reseeds the scalable CMS state and republishes resolved locality snapshots
  - manual homepage sync now uses the same resolver refresh path instead of leaving snapshot publish as a separate step
- Moved more public homepage shortcuts off hardcoded portal arrays.
  - hero quick-action tiles now come from managed homepage defaults
  - search shortcut categories now come from managed homepage defaults
  - removed the dead unused emergency-service fallback array from the portal code
- Added direct section authoring on the scalable template path.
  - scalable templates can now add sections from the shared homepage section draft form
  - scalable template sections can now be edited, reordered, duplicated, and deleted directly from the template editor
  - scalable template section editing now reuses the same detailed section controls used by the legacy locality layout editor
- Improved scalable CMS resolver and preview workflows.
  - resolver now falls back to active scoped/global/fallback templates even when no explicit template assignment exists
  - admin resolved-homepage preview now supports device, locality, date, page type, pincode, category, subcategory, and placement-key simulation
  - preview output now surfaces effective resolver context plus section inventory counts for faster QA
- Reduced raw-ID editing inside the scalable CMS authoring flow.
  - template locality targeting now uses guided locality selection instead of freehand ID lists
  - campaign locality/category/subcategory/placement targeting now uses guided structured selectors
  - sponsored listing campaigns now pick approved businesses from a managed selector instead of comma-separated manual IDs
- Added published snapshot visibility to the scalable CMS admin.
  - admins can now inspect recent published locality snapshots with context, template, and payload counts
  - publish workflow is now observable from the same scalable CMS workspace instead of only showing aggregate counts
- Expanded the scalable publish pipeline beyond locality-only snapshots.
  - published snapshot identity now includes placement key so placement-aware payloads do not collide
  - admin can now publish the active preview context, including locality, category, subcategory, pincode, device, page type, and placement key
  - server publish contract now accepts richer publish contexts and remains backward-compatible with older snapshot IDs during rollout
- Added structured bulk publish controls for scalable snapshots.
  - admin can now build scoped publish batches across locality, category, subcategory, pincode, placement, device, and page type
  - bulk publish context generation now preserves valid category/subcategory relationships instead of naive cartesian combinations
  - admins can see how many publish contexts will be generated before publishing the batch
- Added snapshot lifecycle management for the scalable CMS.
  - server now supports deleting published snapshots by exact IDs or structured scoped contexts
  - admin can delete a single published snapshot directly from snapshot history
  - admin can delete a full scoped snapshot set using the same structured locality/category/pincode/device/page-type scope builder used for publishing
- Added overwrite guardrails between legacy mirroring and scalable-authored CMS state.
  - scalable template, assignment, campaign, and template-section edits now detach those records from legacy sync
  - legacy background mirroring now preserves detached or fully scalable-authored entities instead of replacing them
  - homepage sync refresh now skips legacy reseed once the scalable CMS is no longer purely legacy-managed
- Hardened the explicit legacy reseed workflow.
  - standard reseed now blocks when detached scalable-owned entities exist and reports ownership counts instead of silently overwriting them
  - admin now shows legacy-managed versus detached entity counts across templates, assignments, and campaigns
  - destructive legacy rebuild remains available only through an explicit force-reseed action with confirmation
- Added record-level ownership controls in the scalable CMS.
  - scalable template, assignment, and campaign cards now show whether each record is legacy-managed, detached, or fully scalable-owned
  - admins can explicitly detach legacy-seeded records from background legacy sync without making dummy content edits first
- Hardened relational scalable CMS persistence.
  - scalable CMS table sync now uses transactional upserts plus scoped pruning instead of deleting and reinserting every CMS row on each save
  - table-backed scalable CMS reads now preserve mirrored metadata such as `seededFromLegacy`, keeping reseed/ownership guardrails accurate after relational loads
- Tightened published homepage snapshot resolution for public reads.
  - resolved homepage reads now fall back to the best matching published snapshot by locality/category/subcategory/pincode/placement/device/page-type specificity instead of only exact ID hits
  - the public portal now clears stale resolved-homepage state if a context fetch fails instead of continuing to render the previous snapshot payload
- Hardened scalable CMS access and public write protection.
  - scalable CMS config and snapshot read endpoints now require privileged auth instead of being publicly readable
  - browser-originated public/admin write requests now reject cross-origin origins, and public throttled responses include `Retry-After`
- Reduced exposure of broad admin homepage configuration payloads.
  - the full `/api/homepage-config` blob is now privileged-read only, while public runtime bootstrap stays on scoped/public endpoints
  - admin fallback reads now send auth headers before using the full homepage config recovery path
- Aligned admin UI visibility with the stricter privileged API model.
  - limited internal roles now stay in the moderation-facing admin workspace instead of seeing advanced operations/CMS sections that require platform-admin or developer privileges
  - bulk upload, taxonomy mapping, operations workspace, and advanced homepage CMS subsections are hidden until a privileged account is active
- Aligned client-side background sync permissions with the stricter server model.
  - moderator sessions no longer attempt privileged locality-routing, scalable CMS, or ad-lead admin fetches that the server would reject
  - platform-admin and developer roles remain the only browser sessions that trigger privileged scalable/config sync flows
- Added a repeatable access hardening smoke check.
  - `npm run qa:access` now verifies privileged read/write gates and role-aware admin workspace guards from the current codebase
  - this gives the pre-UAT access hardening stream a lightweight regression check alongside lint/build
- Added a repeatable scalable homepage workflow smoke check.
  - `npm run qa:workflow` now verifies the publish/delete/reseed/snapshot/template/assignment/campaign pipeline is still wired from server routes through app handlers into the admin console
  - this gives the pre-UAT homepage/admin flow checklist a lightweight regression check alongside the access smoke, lint, and build steps
- Added a repeatable resolved-homepage smoke check for UAT stability.
  - `npm run qa:resolved-homepage` now verifies resolved-homepage route wiring, published-snapshot selection, authoritative portal use of resolved payloads, and managed Roadpali/Kalamboli launch content coverage
  - this gives the pre-UAT resolver/read-path stream a lightweight regression check alongside `qa:workflow`, `qa:access`, lint, and build
- Added a repeatable resolved-homepage runtime smoke check for publish/read confidence.
  - `npm run qa:resolved-runtime` now boots the local server, publishes Roadpali resolved snapshots through the privileged API, reads them back through `/api/resolved-homepage`, and verifies published-snapshot selection for homepage and category-result contexts
  - the runtime smoke restores `users.json` and `scalable-cms-state.json` afterward so the workspace seed state stays clean between runs
- Added a consolidated pre-UAT verification command.
  - `npm run qa:uat` now runs access hardening, public-write protections, scalable workflow wiring, resolved-homepage static/runtime checks, TypeScript validation, `node --check server.js`, and the production build in one pass
  - `npm run release:check` now reuses the same UAT gate before the release-specific smoke step
- Added explicit resolver provenance for UAT verification.
  - `/api/resolved-homepage` now returns provenance details plus `X-Resolved-Homepage-Source`, `X-Resolved-Homepage-Strategy`, and snapshot/template ID headers when available
  - admin `Resolved Homepage Preview` now surfaces the same provenance so ops can validate whether a page came from a published snapshot or the live resolver and exactly which snapshot was selected
- Split the remaining admin configuration and operations surfaces into focused subsections.
  - platform config now has dedicated `API & Sync`, `Taxonomy`, `Geography Master`, `Homepage Defaults`, and `SEO` subtabs
  - `Geography & Routing` now has dedicated `Locality Pages`, `Pincode Routing`, and `Category URLs` subtabs
  - `Ads & Offers` now has dedicated `Offers`, `Ad Banners`, and `Lead Inbox` subtabs
  - ops teams can switch one subsection at a time instead of scrolling through stacked long pages
- Added native Excel-friendly admin imports for managed taxonomy and geography.
  - business taxonomy now supports downloadable category/subcategory templates plus `.xlsx`, `.xls`, CSV, or tab-separated uploads
  - geography config now supports downloadable state, city, and locality/sub-locality templates plus `.xlsx`, `.xls`, CSV, or tab-separated uploads
  - import flows upsert existing IDs and create new records without code changes
- Added inline subcategory creation from admin listing workflows.
  - taxonomy mapping can create a missing subcategory without leaving the current listing
  - listing status editing and backend listing edit modal can create and immediately select a new subcategory in context
- Hardened public contact unlock writes with verified OTP grant enforcement.
  - `/api/contact-unlock/verify-otp` now returns a short-lived unlock grant token after successful OTP verification
  - `/api/contact-unlock/record-view` now requires that verified grant for anonymous contact unlock writes instead of trusting only the submitted phone number
  - portal and simulator flows now carry the verified unlock grant through the contact-view write path
- Tightened public-write challenge integrity and privileged auth registration writes.
  - `/api/auth/register` now enforces the same trusted-origin browser write gate as other privileged mutation routes
  - public registration OTP verify and contact unlock OTP verify now cross-check the signed challenge token against the persisted OTP challenge record before completing verification
- Added a repeatable public-write hardening smoke check.
  - `npm run qa:public-writes` now verifies throttle coverage on current public write routes plus the OTP-grant and trusted-origin protections on the highest-risk auth/contact flows
  - this gives the pre-UAT abuse-protection stream a lightweight regression check alongside `qa:access`, `qa:workflow`, lint, and build
- Seeded launch-ready managed content for the first UAT localities.
  - `homepage-config.json` now contains curated Roadpali and Kalamboli hero banners, hero stats, active listing ads, locality-targeted offers, published updates, locality-category links, and explicit homepage layouts
  - the seeded layouts use managed section records so the legacy-to-scalable sync path has real locality homepage structure to publish for UAT
- Added entity-level scalable CMS mutation endpoints and admin wiring.
  - server now exposes dedicated create/update/delete routes for scalable templates, assignments, and campaigns
  - admin template, assignment, and campaign mutations now use entity-focused API calls instead of only sending the full scalable CMS config blob
- Tightened snapshot publish/delete flows around direct snapshot payloads.
  - server publish and delete endpoints now return the updated published snapshot collection instead of forcing a broader CMS refresh pattern
  - app snapshot publish/delete handlers now update scalable snapshot state directly from API responses instead of re-fetching the entire scalable CMS config
- Added snapshot-scoped admin actions on the scalable CMS path.
  - scalable CMS now exposes direct snapshot list and single-snapshot delete endpoints
  - admin published-snapshot cards can refresh snapshot state directly and use the snapshot-specific delete route for single-record cleanup
- Reduced whole-template fallback usage for scalable template section authoring.
  - server now exposes section-scoped routes for scalable template section create, update, reorder, duplicate, and delete operations
  - admin template section actions now prefer those direct section APIs instead of always rebuilding and saving the entire template payload
- Moved scalable template locality-section sync onto a scoped backend route.
  - server now supports syncing a template’s section set directly from a selected locality homepage layout
  - admin `Sync Sections` now prefers the server-side locality sync operation instead of reconstructing the source layout entirely in the client before save
- Removed the broad full-config fallback from the scalable CMS admin action layer.
  - template, assignment, and campaign admin helpers now depend on scoped scalable CMS callbacks instead of silently falling back to whole-config saves
  - the generic scalable admin mutation path is now reserved for broader background sync/reseed workflows rather than ordinary entity editing
- Moved homepage-layout legacy mirroring onto a scoped backend sync route in API mode.
  - server now supports syncing scalable templates and assignments from legacy homepage layouts through a dedicated legacy-layout sync endpoint
  - app background homepage-layout mirroring now prefers that backend sync route instead of pushing two whole scalable-config writes from the client in API mode
- Moved legacy campaign mirroring onto a scoped backend sync route in API mode.
  - server now supports syncing hero banners, listing ads, offers, content blocks, and sponsored listings through a dedicated legacy-campaign sync endpoint backed by homepage config and business DB state
  - app background legacy campaign mirroring now prefers that backend sync route instead of saving the entire scalable CMS config blob from the client for each source collection
- Moved legacy homepage layout section editing onto scoped backend routes in API mode.
  - server now supports create, update, reorder, duplicate, and delete operations for a single locality homepage layout section set without requiring a full homepage-config PUT
  - app homepage section admin actions now use those scoped layout-section APIs in API mode and mark the matching homepage-config signature as already synced so broad autosync does not immediately rewrite the whole config blob again
- Moved key legacy homepage content collections onto scoped backend routes in API mode.
  - server now exposes collection-level persistence routes for hero banners, listing ads, community items, coupons, and locality-category links
  - app handlers for those content collections now persist through the dedicated routes in API mode and pre-mark the matching homepage-config signature so broad autosync does not immediately resend the whole config blob for the same change
  - offer manager now supports edit/delete through the same scoped coupon route set instead of leaving offers as create-only legacy records
- Moved legacy homepage layout lifecycle onto scoped backend routes in API mode.
  - server now supports direct create/update and delete operations for a locality homepage layout without requiring a full homepage-config PUT
  - locality provisioning and decommissioning now persist their default layout changes through the dedicated layout route instead of depending on broad homepage autosync
- Removed the broad homepage-config autosync path from ordinary API-mode homepage editing flows.
  - server now supports scoped persistence for managed homepage API settings and bulk legacy homepage layout reconciliation
  - app ordinary API-mode homepage edits now persist through scoped collection, layout, section, or API-settings routes, while the full homepage-config PUT path remains reserved for explicit manual sync and recovery workflows
- Moved ad lead capture and admin lead visibility onto a managed API path in API mode.
  - server now supports managed ad lead read/create and ad-scoped cleanup endpoints backed by DB or fallback storage
  - app API mode now submits public ad leads to the managed endpoint, loads admin ad lead views from that endpoint, and no longer treats browser storage as the primary source for ad lead history
- Moved API-mode homepage bootstrap toward scoped read endpoints instead of a single config blob read.
  - server now exposes scoped read routes for homepage API settings, layouts, hero banners, listing ads, offers, community items, and locality-category links
  - app homepage bootstrap and reset recovery now prefer those scoped endpoints, with the full homepage-config read retained only as a compatibility fallback
- Moved legacy homepage collections off `app_state['homepage_config']` as their primary database store.
  - server now persists locality layouts, hero banners, listing ads, offers, community items, and locality-category links through dedicated homepage tables when Postgres is available
  - homepage-config blob storage remains as a mirror/fallback path, but ordinary DB-backed homepage collection reads and writes now resolve from the dedicated table set first
- Moved runtime bootstrap for seed listings, community content, and coupons off direct `src/data.ts` usage in the app.
  - businesses now bootstrap from managed server-side `businesses.json` / `/api/businesses`
  - coupons and community items now bootstrap from managed `homepage-config.json` / `/api/homepage-config`
  - client cache version bumped so browsers refresh onto the managed bootstrap source
- Reduced API-mode dependency on localStorage for managed homepage state.
  - API mode no longer boots businesses, ads, hero banners, locality-category links, layouts, coupons, or community items from local browser storage
  - server now seeds DB-backed `businesses` and `homepage_config` from managed JSON files when `app_state` is empty
- Reduced API-mode dependency on localStorage for managed locality-routing state.
  - API mode now boots localities, subdomains, pincode mappings, and default-locality routing from the managed locality-routing configuration path instead of browser cache
  - entering API mode now clears stale managed locality-routing cache keys so routing reads stay aligned with the backend-owned config
- Removed obsolete frontend seed payloads from `src/data.ts`.
  - deleted legacy `INITIAL_BUSINESSES`
  - deleted legacy `INITIAL_COMMUNITY_ITEMS`
  - deleted legacy `INITIAL_COUPONS`
  - `src/data.ts` now only retains the smaller review and CRM seed collections still used by the current runtime
- Protected `PUT /api/homepage-config` with bearer-token auth for `platform_admin` and `developer` users.
- Updated the client sync path to send the auth token when saving homepage config.
- Completed backend control for homepage sections.
  - ordered category selection for `category_grid` and `emergency_grid`
  - section locality targeting
  - full edit/create coverage for section metadata already stored in the model
- Finished the Updates Feed Manager workflow.
  - create
  - edit
  - delete
  - schedule
  - filter by locality/type/date/status
- Added image upload support for community/content updates so posts can carry media like banners and ads.
- Fixed mobile header auth actions so sign-in, advertiser, admin, and logout controls are visible on phone widths.
- Reduced homepage localStorage mirroring in API mode so the server-backed config is closer to the source of truth.

## Still Pending

## Pre-UAT Checklist

1. Security + access hardening.
   - verify route-level admin gating for remaining write endpoints
   - hide internal/admin-only UI from public users where still exposed
   - verify `Strict-Transport-Security` and `Content-Security-Policy` in the deployed UAT environment
   - extend abuse protection review beyond auth/contact/ad-lead/audit flows only if new public write surfaces are introduced
2. Resolver/publish stability.
   - make sure homepage reads come from the intended resolved/scalable path for UAT localities
   - verify publish flow for locality/category/page variants
3. Critical persistence completion.
   - finish only the remaining persistence that can break homepage/admin UAT flows
   - defer broader persistence migrations until after UAT
4. UAT QA pack.
   - desktop/mobile homepage QA
   - pincode/locality routing
   - section combinations
   - empty-state handling
   - admin create/edit/publish flows
   - execution checklist now captured in `UAT_QA_CHECKLIST.md`
5. Launch content for selected UAT localities.
   - hero banners
   - offers
   - featured businesses
   - updates
   - Roadpali and Kalamboli seed content is now present in managed config; remaining work is UAT review/tuning and any additional locality rollout content

### P0: Scalable Locality CMS Rebuild

This is now the top-priority stream for the project. The current locality homepage model works for early rollout, but it is not the right long-term architecture for 200-500+ localities with category-aware banners, sponsored listings, offers, and content. We are replacing the current JSON-heavy homepage configuration path with a normalized, database-driven, resolver-based CMS and merchandising system.

Target scale for this track:

- 500 localities
- 1,000+ listings per locality
- 10-12 ad slots per locality
- 10 sponsored listings per locality
- 3-4 hero banners per locality
- locality-aware offers, updates, and content blocks
- category-aware and subcategory-aware targeting

Implementation goals:

1. Move homepage configuration from large `app_state` JSON blobs into relational tables.
2. Introduce reusable templates, section definitions, targeting rules, campaign objects, and override priority handling.
3. Add backend resolver logic so pages are assembled from locality/category/pincode/device context instead of hardcoded arrays.
4. Add published snapshot support so frontend reads fast resolved locality payloads rather than joining many config sources client-side.
5. Replace hardcoded fallback categories, quick actions, emergency cards, ads, and homepage sections with DB-backed fallback records flagged via metadata such as `is_fallback`.
6. Make ad, sponsored listing, offer, and content placement configurable per locality, category, subcategory, slot, and schedule.
7. Add admin support for template assignment, locality overrides, campaign management, preview, and publish workflows.

Priority implementation sequence:

1. Backend schema for templates, sections, targeting, campaigns, and published snapshots.
2. Resolver service for locality-aware page assembly with specificity ordering.
3. Seed migration from current hardcoded/default homepage data into configuration-backed fallback records.
4. API endpoints for authoring, publishing, and reading resolved homepage payloads.
5. Frontend migration from local config rendering to resolved payload rendering.
6. Admin CMS migration from direct JSON editing to structured entity management.
7. Load and QA validation for large-locality scale.

Remaining hardcoded sources that still need the same DB/configuration treatment:

1. Remaining small frontend seed collections should still be migrated when we take the trust/CRM persistence pass.
   - `INITIAL_REVIEWS`
   - `INITIAL_CRM_CONTACTS`

1. Move homepage state and content fully off `localStorage` into API/database-backed persistence.
2. Add preview-oriented controls in Homepage CMS.
   - device preview
   - locality preview
   - date-aware preview
3. Add bulk actions and advanced flags in Listings Ops.
   - featured
   - verified
   - status-based bulk updates
4. Add date-range filters where campaign and content managers need them.
5. Complete the broader production hardening pass.
   - monitoring and alerting
   - full security review beyond UAT-safe guardrails
6. Run VAPT testing of the application.
   - auth and session review
   - role-based access review
   - data exposure and upload review
7. Run load testing.
   - high-locality browse traffic
   - homepage and search throughput
   - OTP and upload path stability
8. Finish launch QA.
   - desktop/mobile layout pass
   - large-locality dataset pass
   - empty-state pass
   - homepage section overflow/carousel behavior
9. Resolve remaining public UI polish items.
   - section spacing and card alignment edge cases
   - category label overflow in compact layouts

## Post-UAT Backlog

1. Complete the scalable locality CMS rebuild: schema, resolver, publish pipeline, and DB-backed fallbacks.
2. Move geography, locality, and remaining homepage fallback datasets into managed configuration records.
3. Finish the broader persistence migration beyond UAT-critical flows.
4. Run VAPT and load testing before release.
5. Run final responsive QA across the homepage and mobile nav.
