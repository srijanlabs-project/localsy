# VAPT Checklist

This checklist is for the Localisy web app, admin console, seller/buyer flows, OTP flows, media uploads, and the API surface behind the homepage and dashboards.

## Scope

- Frontend web app
- Admin console
- Seller dashboard
- Buyer dashboard
- OTP registration and login flows
- Contact unlock flow
- Media upload and proxy endpoints
- Business, homepage, and audit APIs
- S3-compatible storage configuration
- PostgreSQL and file fallback persistence

## Test Environment

- Use staging first
- Use separate test accounts for buyer, seller, admin, and developer
- Use test phone numbers for OTP
- Use test media files only
- Record every finding with request, response, role, and impact

## Authentication

- [ ] Verify public login only works through OTP
- [ ] Verify public registration creates the user only after OTP success
- [ ] Verify platform admin login uses password plus OTP
- [ ] Verify OTP expiry blocks reuse
- [ ] Verify OTP resend cannot be brute forced
- [ ] Verify OTP challenges cannot be replayed
- [ ] Verify login token tampering fails
- [ ] Verify logout removes access

## Authorization

- [ ] Buyer cannot access seller features
- [ ] Seller cannot access another seller's dashboard or listings
- [ ] Seller cannot edit listings they do not own
- [ ] Buyer cannot edit business, homepage, or admin records
- [ ] Admin-only endpoints reject non-admin users
- [ ] Public endpoints cannot mutate protected records

## Data Exposure

- [ ] Check API responses for hidden internal IDs and secrets
- [ ] Check browser storage for sensitive data leakage
- [ ] Check audit logs for overexposed personal data
- [ ] Check CRM/contact data access by role
- [ ] Check seller dashboard data is only visible to the correct seller

## Input Validation

- [ ] Test XSS in business names, descriptions, reviews, community posts, and banners
- [ ] Test HTML injection in CMS fields
- [ ] Test JSON schema abuse on create/update endpoints
- [ ] Test path and key validation on upload endpoints
- [ ] Test long strings, Unicode, and malformed payloads

## Upload and Storage

- [ ] Verify only authorized roles can upload media
- [ ] Verify uploaded files cannot be used to overwrite unrelated objects
- [ ] Verify public access to bucket objects is not wider than intended
- [ ] Verify proxy endpoint does not bypass authorization
- [ ] Verify old uploaded images do not become private unexpectedly

## Rate Limiting and Abuse

- [ ] Verify OTP send attempts are throttled
- [ ] Verify OTP verify attempts are throttled
- [ ] Verify contact unlock is limited by day, login, IP, and device
- [ ] Verify search and listing browsing cannot be scraped excessively
- [ ] Verify media upload cannot be spammed
- [ ] Verify business update APIs cannot be spammed

## Contact View Controls

- [ ] Same login cannot exceed the daily contact view limit
- [ ] Same IP cannot exceed the daily contact view limit
- [ ] Same device ID cannot exceed the daily contact view limit
- [ ] Limit errors are shown clearly in the UI
- [ ] Contact unlock is not granted when the limit is exceeded

## Seller and Buyer Dashboards

- [ ] Seller sees only owned listings
- [ ] Seller sees listing views, phone views, leads, and clicks
- [ ] Buyer sees saved listings and verified activity
- [ ] Dashboard endpoints enforce ownership on the server
- [ ] Dashboard data cannot be read by another user role

## Audit and Logging

- [ ] Audit logs cannot be forged from the client
- [ ] Audit records use server-derived IP and user-agent
- [ ] Failed auth attempts are logged
- [ ] Contact unlock denials are logged
- [ ] Sensitive values are not written into logs

## Infrastructure

- [ ] Verify S3 credentials are correct and scoped
- [ ] Verify bucket name is correct in all environments
- [ ] Verify environment variables are not exposed to the client bundle
- [ ] Verify security headers are present
- [ ] Verify CORS is not overly permissive
- [ ] Verify database credentials have least privilege

## Performance and Load

- [ ] Run concurrent homepage traffic
- [ ] Run OTP request and verify load
- [ ] Run upload load
- [ ] Run dashboard traffic under concurrency
- [ ] Check for memory growth or slow responses

## Handling Cyber Attack

### Immediate Response

1. Disable or rate-limit the affected endpoint.
2. Revoke suspicious tokens or sessions.
3. Rotate secrets if a credential leak is suspected.
4. Review logs for IP, device, user, and path patterns.
5. Temporarily block abusive IPs or user agents.
6. Preserve evidence before deleting logs.
7. Notify the platform owner and operations team.

### Common Attack Types

- OTP brute force
- Credential stuffing
- CSRF against write endpoints
- XSS through content fields
- IDOR on dashboards and listing records
- Upload abuse
- API flooding / resource exhaustion
- Bucket object exposure

### Recovery

- Patch the vulnerable path
- Retest the exploit
- Confirm log coverage
- Confirm rate limiting
- Confirm no data was exposed beyond scope
- Document root cause and mitigation

## Reporting Format

- Severity
- Affected endpoint or screen
- Role required
- Reproduction steps
- Evidence
- Impact
- Fix recommendation
- Retest result

