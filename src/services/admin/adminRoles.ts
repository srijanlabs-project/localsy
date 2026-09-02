// Interim role-based visibility for the new admin pages, ported from the exact check
// AdminConsole.tsx already used for its own tab bar (`canUsePrivilegedAdminWorkspace`) —
// this is not a new policy, just the same rule applied to the new shell/routes.
//
// admin-backend-ux-spec.md Section 3 calls for full Role Builder-driven nav visibility
// (5.27); that hasn't been built. Until it exists, this mirrors Section 7's default seed
// data as closely as the current `UserRole` union allows. Two known gaps, both pre-existing
// and outside this file's scope to fix: `UserRole` has no distinct "Growth Operator" value,
// and App.tsx's own admin entry gate (`canAccessAdmin` in App.tsx) doesn't include
// 'operator' at all, so operator-role users can't reach `/admin` today regardless of what
// this module returns.
import type { UserRole } from '../../types';

/** Admin + Developer only — matches AdminConsole.tsx's existing bulk-upload/taxonomy-mapping gate. */
export const isPrivilegedAdminRole = (role?: UserRole | string) => (
  ['admin', 'developer'].includes(String(role || ''))
);

/** Whether this role can mutate listings from the Listing Directory (edit fields, bulk actions, merge duplicates). Moderator is view-only per Section 7's seed table. */
export const canEditListings = (role?: UserRole | string) => isPrivilegedAdminRole(role) || String(role || '') === 'operator';

/** Whether this role can reach Bulk Import. Moderator is excluded, same as the legacy console. */
export const canManageBulkImport = (role?: UserRole | string) => isPrivilegedAdminRole(role) || String(role || '') === 'operator';

/** Whether this role can reach Duplicate Review (spec 5.3). Section 7 seed table: Admin + Operator get Full. */
export const canReviewDuplicates = (role?: UserRole | string) => isPrivilegedAdminRole(role) || String(role || '') === 'operator';

/**
 * Whether this role can reach Listing Analytics (spec 5.8). Section 7 seed table calls for
 * Admin + Growth Operator; `UserRole` has no distinct Growth Operator value yet (see module
 * header), so this is Admin/Developer-only until that role exists — narrower than the spec's
 * intent, not wider, so it's a safe interim default.
 */
export const canViewListingAnalytics = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/** Whether this role can reach the Geography & Routing group (Localities, Pincode Routing, Category URLs, Geography Master — spec 5.10-5.13). Section 7 seed table: Admin + Operator get Full. */
export const canManageGeography = (role?: UserRole | string) => isPrivilegedAdminRole(role) || String(role || '') === 'operator';

/**
 * Whether this role can reach the Homepage CMS group (Layout Builder, Hero Banners, Templates,
 * Assignments, Campaign Builder, Publish & Snapshots — spec 5.14-5.18, plus the unofficial
 * Campaign Builder 6th screen). Section 7 seed table: "Homepage CMS (all 5 screens) | Full | — |
 * — | —" — Admin only, no Operator, unlike Geography's row. Same narrowing rationale as
 * `canViewListingAnalytics`.
 */
export const canManageHomepageCms = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the Campaigns & Offers group (Offers, Ad Banners, Lead Inbox —
 * spec 5.19-5.21). Section 7 seed table calls for Admin + Growth Operator; same gap as
 * `canViewListingAnalytics` (no distinct Growth Operator role value yet), so this is
 * Admin/Developer-only until that role exists.
 */
export const canManageCampaigns = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the Content & Community group (Updates Feed — spec 5.22).
 * Section 7 seed table calls for Admin + Growth Operator; same Growth-Operator-role gap as
 * `canManageCampaigns`, so this is Admin/Developer-only until that role exists.
 */
export const canManageContent = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the Platform Config group (API & Sync, Category Taxonomy,
 * Homepage Defaults, SEO Discovery, Import & Job Center — spec 5.23-5.26, 5.38). Section 7
 * seed table: Admin only (SEO Discovery has a view-only note for Growth Operator, moot until
 * that role exists), matching `canManageHomepageCms`'s Admin-only pattern.
 */
export const canManagePlatformConfig = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the Identity & Access group (Roles & Permissions / Role Builder,
 * User Directory — spec 5.27-5.28). Section 3/7: Admin only. Both screens behind this gate are
 * local-state mockups (no real accounts/roles backend exists yet — see each page's own banner);
 * this gate only controls who can see that mockup, it is not itself the enforcement point the
 * Role Builder is meant to become.
 */
export const canManageIdentityAccess = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach Merchant Claims & Verification (spec 5.9). Section 3: Admin only,
 * Phase 2. Semi-real screen — reads/writes the existing `Business.kycStatus`/`verifiedBadge`/
 * `govRegistered` fields via the real `onUpdateBusiness` callback, but there is no actual
 * merchant-initiated claim-submission flow behind it yet (see the page's own banner).
 */
export const canManageMerchantOps = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the Analytics & Insights group (Platform Analytics Overview,
 * Search & AI Performance, SEO Performance — spec 5.29-5.31). Section 7 seed table calls for
 * Admin + Growth Operator; same pre-existing gap as `canViewListingAnalytics`/`canManageCampaigns`
 * (no distinct Growth Operator role value yet), so this is Admin/Developer-only until that role
 * exists — narrower than the spec's intent, judged safe the same way those earlier gates were.
 */
export const canViewAnalyticsInsights = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the Marketing Automation group (Automation Rules, Audience
 * Segments, Automation Activity Log — spec 5.32-5.34). Section 7 seed table calls for
 * Admin + Growth Operator; same pre-existing gap as `canViewAnalyticsInsights`/`canManageCampaigns`
 * (no distinct Growth Operator role value yet), so this is Admin/Developer-only until that role
 * exists. All three screens behind this gate are local-state mockups — there is no real
 * trigger/notification-sending engine in this app yet (confirmed: no email/SMS/push library is
 * installed anywhere in the repo) — see each page's own banner.
 */
export const canManageMarketingAutomation = (role?: UserRole | string) => isPrivilegedAdminRole(role);

/**
 * Whether this role can reach the AI & Integrations group (AI Provider Configuration, Knowledge
 * & RAG Sources, Integration Health — spec 5.35-5.37). Section 7 seed table: Admin only, no
 * Operator/Growth Operator column filled in — matches `canManageHomepageCms`'s pattern directly,
 * no narrowing needed. All three screens behind this gate are local-state mockups or honest
 * empty-state shells — see each page's own banner for what's real vs illustrative.
 */
export const canManageAiIntegrations = (role?: UserRole | string) => isPrivilegedAdminRole(role);
