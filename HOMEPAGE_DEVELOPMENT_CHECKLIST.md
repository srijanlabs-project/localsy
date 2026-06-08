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

## Pending

| Area | Development item | Status | Notes |
| --- | --- | --- | --- |
| Discovery | Advanced search modes need launch decision and enablement | Pending | Voice, image, and AI search flows are coded but hidden behind `SIMPLE_SEARCH_FORM = true`. |
| Discovery | Advanced filter deck needs enablement and QA | Pending | Rich filters exist in code but are hidden behind `SHOW_REFINED_FILTERS = false`. |
| Navigation | Portal tabbed homepage experience needs launch decision | Pending | Community and merchant tabs exist but public tabs are hidden behind `SHOW_PORTAL_TABS = false`. |
| Public UX | Subdomain/location mapping widget should stay removed or be redesigned | Pending | Old mapping UI exists in code but is disabled with `showSubdomainLocationMapping = false`. |
| Content ops | Final hero copy, images, offers, and updates need real launch content | Pending | Structure exists, but homepage quality now depends on curated production content per locality. |
| Content ops | Empty-state content strategy for optional sections needs polish | Pending | Promo, offers, updates, and shelf sections disappear when content is missing; launch may need designed fallbacks. |
| Data layer | Homepage configuration still relies heavily on `localStorage` | Pending | Layouts, hero banners, ads, coupons, community, audit logs, and session data are still client-persisted. |
| Data layer | Homepage-related content should move fully to API/database | Pending | Only some business syncing is wired to server today; homepage data sources are not fully server-backed. |
| Security | Public homepage flows need stronger production protection | Pending | Launch notes still call for server-side validation, rate limits, CSRF protection, and secure session handling. |
| Security | Missing response headers should be added | Pending | `Strict-Transport-Security` and `Content-Security-Policy` are missing from the current production scan and should be added before release hardening is considered complete. |
| Access control | Sandbox/admin-only controls need full production hardening | Pending | Repo notes still call out route-level admin gating and hiding internal tools from public users. |
| Seller ops | Seller dashboard needs to be built | Pending | Seller-owned listings, views, phone views, and lead metrics still need a real dashboard and backend data model. |
| Buyer ops | Buyer dashboard needs to be built | Pending | Saved listings, contacted businesses, and verified user activity still need a dedicated dashboard experience. |
| Security | VAPT test needs to be executed | Pending | Application auth, role isolation, upload surfaces, and data exposure need an external-style verification pass. |
| Performance | Load test needs to be executed | Pending | High-locality traffic, homepage throughput, OTP, and media upload paths still need stress validation. |
| Compliance | Legal/privacy pages and data-use disclosure are still needed | Pending | Especially relevant because homepage can trigger OTP, audit logging, and lead capture. |
| Observability | Homepage production monitoring still needs completion | Pending | Health endpoint exists, but launch notes still require alerts, error monitoring, and operational readiness. |
| QA | End-to-end homepage QA checklist still needs execution | Pending | Needs pass across desktop/mobile, section combinations, pincode routing, SEO routes, and empty-content scenarios. |

## Priority Order

1. Move homepage state and content off `localStorage` into API/database-backed storage.
2. Finalize public-safe launch UX by removing or hardening internal-only controls.
3. Curate real homepage content for each locality: hero banners, featured businesses, offers, and updates.
4. Decide whether advanced search, portal tabs, and refined filters should launch now or remain disabled.
5. Complete production readiness items: security, monitoring, and legal/privacy pages.
6. Build seller and buyer dashboards, then validate analytics and access flows.
7. Run VAPT and load testing before release.
