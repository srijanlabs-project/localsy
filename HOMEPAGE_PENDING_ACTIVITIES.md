# Homepage Pending Activities

This file tracks the remaining homepage and admin work after the current round of homepage CMS and responsive layout updates.

## Done This Pass

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
5. Complete production hardening.
   - route-level admin gating for remaining write endpoints
   - abuse/rate-limit protections where required
   - monitoring and alerting
   - add missing security headers: `Strict-Transport-Security` and `Content-Security-Policy`
6. Add Seller Dashboard.
   - listings owned by seller
   - listing views and phone views
   - leads, clicks, and performance summary
7. Add Buyer Dashboard.
   - saved listings
   - contacted businesses
   - OTP history / verified actions
8. Run VAPT testing of the application.
   - auth and session review
   - role-based access review
   - data exposure and upload review
9. Run load testing.
   - high-locality browse traffic
   - homepage and search throughput
   - OTP and upload path stability
10. Finish launch QA.
   - desktop/mobile layout pass
   - large-locality dataset pass
   - empty-state pass
   - homepage section overflow/carousel behavior
11. Resolve remaining public UI polish items.
   - section spacing and card alignment edge cases
   - category label overflow in compact layouts

## Priority Order

1. Finish backend persistence and remaining protected write routes.
2. Tighten admin filters, bulk actions, and preview controls.
3. Add seller and buyer dashboards, then validate analytics surfaces.
4. Run VAPT and load testing before release.
5. Run final responsive QA across the homepage and mobile nav.
