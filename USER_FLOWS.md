# User Flows by Role

## Buyer
1. Open site.
2. Select pincode/locality.
3. Browse businesses by category/search/filter.
4. Open business detail.
5. Unlock contact via OTP (static for now).
6. Post review (after OTP verification).

## Seller
1. Open site and submit business application.
2. Fill listing details (name/category/address/owner/contact).
3. Await moderation status.
4. After approval, manage listing content (hours/description/etc.).
5. Use CRM/coupon modules (currently includes mock components).

## Moderator
1. Login with moderator role.
2. Open moderation queue.
3. Review pending applications and metadata.
4. Approve or reject with reason.
5. Review audit logs and flagged activity.

## Admin
1. Login with admin role.
2. Access moderation plus governance controls.
3. Review complete audit log stream.
4. Manage routing defaults and pincode mappings.
5. Perform listing corrections and high-risk actions with audit trace.

## Operator
1. Login with operator role.
2. Perform structured data updates.
3. Validate listing quality and record changes.
4. Escalate moderation/security issues to moderator/admin.

## Shared Control Rules
- All write operations should produce audit entries.
- Contact reveal must remain OTP gated.
- Internal operational controls should not appear on public-facing surfaces.
