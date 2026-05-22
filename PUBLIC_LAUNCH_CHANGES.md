# Public Launch Changes (Required)

## 1. Product Positioning and Public UI
- Replace all "Yellow Pages" branding with "Businesses" terminology across UI copy.
- Keep admin-only and internal controls out of public-facing screens.
- Hide internal topology sections (subdomain/DNS/server mapping) from non-internal users.

## 2. Authentication and Access
- Keep OTP static (`1212`) for now, as requested.
- Restrict admin/moderator/seller impersonation tools in production build (sandbox role switcher should be internal-only).
- Add route-level access gates so admin routes require authenticated admin role.

## 3. Audit Logging (Complete Coverage)
- Log all critical actions:
  - login/logout
  - role switch
  - locality switch
  - search events
  - contact unlock attempts/success
  - business create/update/approve/reject
  - coupon/community/CRM mutations
- Persist audit logs to server/database for production; localStorage is not sufficient for public compliance.

## 4. Data and Backend
- Move business/locality/review/audit data from localStorage to API + database.
- Replace mock/random IP generation with trusted server-side request metadata.
- Add backup/retention policy for audit logs.

## 5. Security and Abuse Controls
- Server-side validation for all write actions.
- Rate limit OTP attempts and review submissions.
- Add CSRF protections and secure cookies/session handling.
- Hide any internal operational metadata from public users.

## 6. Railway Production Setup
- Build command: `npm run build`
- Start command: `npm run start`
- Ensure app binds to `process.env.PORT` and `0.0.0.0`.
- Keep `server.js` serving `dist` and SPA fallback route.

## 7. Operational Readiness
- Add monitoring (health endpoint, uptime alerts, error logs).
- Add incident response path for abuse reports and moderation escalation.
- Add legal/privacy pages and explicit data-use disclosure for OTP and audit logs.
