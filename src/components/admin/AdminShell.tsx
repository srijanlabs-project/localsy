import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  BadgePercent,
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Database,
  FolderTree,
  GitBranch,
  Globe2,
  Image,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  ListChecks,
  MapPin,
  Megaphone,
  Newspaper,
  Plug,
  Presentation,
  Rocket,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Users,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../../types';
import { useAdminBackgroundJobs } from '../../contexts/AdminBackgroundJobsContext';

type AdminShellProps = {
  userSession?: UserSession;
  pendingModerationCount: number;
  duplicateCandidateCount: number;
  /** Interim role gates (services/admin/adminRoles.ts) — Moderator doesn't see any of these, same as the legacy console. */
  canManageBulkImport: boolean;
  canReviewDuplicates: boolean;
  canViewListingAnalytics: boolean;
  canManageGeography: boolean;
  canManageHomepageCms: boolean;
  canManageCampaigns: boolean;
  canManageContent: boolean;
  canManagePlatformConfig: boolean;
  canManageIdentityAccess: boolean;
  canManageMerchantOps: boolean;
  canViewAnalyticsInsights: boolean;
  canManageMarketingAutomation: boolean;
  canManageAiIntegrations: boolean;
};

// Global admin shell: top bar + left sidebar nav + content outlet.
// Implements admin-backend-ux-spec.md Section 4 (Global shell), styled per
// design-language.md Section 11.1 (Navy top bar, white/Soft Cream sidebar,
// Royal Blue active-nav accent). This is the first structural piece of the
// AdminConsole.tsx split: each nav item below routes to its own page
// component instead of a giant file switching on internal tab state.
export default function AdminShell({ userSession, pendingModerationCount, duplicateCandidateCount, canManageBulkImport, canReviewDuplicates, canViewListingAnalytics, canManageGeography, canManageHomepageCms, canManageCampaigns, canManageContent, canManagePlatformConfig, canManageIdentityAccess, canManageMerchantOps, canViewAnalyticsInsights, canManageMarketingAutomation, canManageAiIntegrations }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { jobs } = useAdminBackgroundJobs();
  const runningJobCount = jobs.filter((job) => job.status === 'queued' || job.status === 'processing').length;
  const needsReviewJobCount = jobs.filter((job) => job.status === 'needs_review' && !job.acknowledged).length;
  const notificationCount = pendingModerationCount + duplicateCandidateCount + needsReviewJobCount;

  const navLinkClass = ({ isActive }: { isActive: boolean }) => (
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? 'border-l-[3px] border-[#1E3A8A] bg-[#3B82F6]/10 text-[#1E3A8A] pl-[9px]'
        : 'border-l-[3px] border-transparent text-slate-600 hover:bg-slate-100'
    }`
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF5F9]">
      {/* Top bar — Section 4.1 */}
      <header className="flex items-center justify-between bg-[#0D1B2A] px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="text-base font-extrabold tracking-tight">Localisy Admin</span>
          <span className="rounded-full bg-[#FFD54F] px-2.5 py-0.5 text-[10px] font-bold text-[#0D1B2A]">
            Production
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center gap-1.5 text-xs text-white/80">
            {runningJobCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-mono">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFD54F]" />
                {runningJobCount} job{runningJobCount === 1 ? '' : 's'} running
              </span>
            )}
          </div>
          <div className="relative">
            <Bell className="h-4.5 w-4.5 text-white/80" />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FFD54F] px-1 text-[9px] font-bold text-[#0D1B2A]">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">{userSession?.userName || 'Admin'}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
              {userSession?.role || 'admin'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left sidebar — Section 4.2 */}
        <aside className={`flex-shrink-0 border-r border-slate-200 bg-white transition-all ${sidebarCollapsed ? 'w-14' : 'w-60'}`}>
          <nav className="flex flex-col gap-4 p-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Dashboard</div>
              )}
              <NavLink to="/" end className={navLinkClass} title="Dashboard">
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Overview</span>}
              </NavLink>
            </div>

            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Moderation & Governance</div>
              )}
              <NavLink to="/moderation" className={navLinkClass} title="Moderation Queue">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="flex-1">Moderation Queue</span>}
                {pendingModerationCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-800">
                    {pendingModerationCount}
                  </span>
                )}
              </NavLink>
              {canReviewDuplicates && (
                <NavLink to="/duplicate-review" className={navLinkClass} title="Duplicate Review">
                  <Copy className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="flex-1">Duplicate Review</span>}
                  {duplicateCandidateCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-700">
                      {duplicateCandidateCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>

            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Listings</div>
              )}
              <NavLink to="/listing-status" className={navLinkClass} title="Listing Directory">
                <Database className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Listing Directory</span>}
              </NavLink>
              {canManageBulkImport && (
                <NavLink to="/bulk-upload" className={navLinkClass} title="Bulk Import">
                  <UploadCloud className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Bulk Import</span>}
                </NavLink>
              )}
              {canViewListingAnalytics && (
                <NavLink to="/listing-analytics" className={navLinkClass} title="Listing Analytics">
                  <BarChart3 className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Listing Analytics</span>}
                </NavLink>
              )}
            </div>

            {canManageMerchantOps && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Merchant Operations</div>
                )}
                <NavLink to="/merchant/claims" className={navLinkClass} title="Merchant Claims & Verification">
                  <ClipboardCheck className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Merchant Claims &amp; Verification</span>}
                </NavLink>
              </div>
            )}

            {canManageGeography && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Geography & Routing</div>
                )}
                <NavLink to="/geography/localities" className={navLinkClass} title="Localities">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Localities</span>}
                </NavLink>
                <NavLink to="/geography/pincode-routing" className={navLinkClass} title="Pincode Routing">
                  <Route className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Pincode Routing</span>}
                </NavLink>
                <NavLink to="/geography/category-urls" className={navLinkClass} title="Category URLs">
                  <Link2 className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Category URLs</span>}
                </NavLink>
                <NavLink to="/geography/master" className={navLinkClass} title="Geography Master">
                  <Globe2 className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Geography Master</span>}
                </NavLink>
              </div>
            )}

            {canManageHomepageCms && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Homepage CMS</div>
                )}
                <NavLink to="/homepage/layout" className={navLinkClass} title="Layout Builder">
                  <LayoutTemplate className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Layout Builder</span>}
                </NavLink>
                <NavLink to="/homepage/hero" className={navLinkClass} title="Hero Banners">
                  <Image className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Hero Banners</span>}
                </NavLink>
                <NavLink to="/homepage/templates" className={navLinkClass} title="Templates">
                  <Layers className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Templates</span>}
                </NavLink>
                <NavLink to="/homepage/assignments" className={navLinkClass} title="Assignments">
                  <GitBranch className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Assignments</span>}
                </NavLink>
                <NavLink to="/homepage/campaigns" className={navLinkClass} title="Campaign Builder">
                  <Megaphone className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Campaign Builder</span>}
                </NavLink>
                <NavLink to="/homepage/publish" className={navLinkClass} title="Publish & Snapshots">
                  <Rocket className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Publish & Snapshots</span>}
                </NavLink>
              </div>
            )}

            {canManageCampaigns && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Campaigns & Offers</div>
                )}
                <NavLink to="/campaigns/offers" className={navLinkClass} title="Offers">
                  <BadgePercent className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Offers</span>}
                </NavLink>
                <NavLink to="/campaigns/ad-banners" className={navLinkClass} title="Ad Banners">
                  <Presentation className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Ad Banners</span>}
                </NavLink>
                <NavLink to="/campaigns/lead-inbox" className={navLinkClass} title="Lead Inbox">
                  <Inbox className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Lead Inbox</span>}
                </NavLink>
              </div>
            )}

            {canManageContent && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Content & Community</div>
                )}
                <NavLink to="/content/updates" className={navLinkClass} title="Updates Feed">
                  <Newspaper className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Updates Feed</span>}
                </NavLink>
              </div>
            )}

            {canViewAnalyticsInsights && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Analytics & Insights</div>
                )}
                <NavLink to="/analytics/overview" className={navLinkClass} title="Platform Analytics Overview">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Platform Analytics Overview</span>}
                </NavLink>
                <NavLink to="/analytics/search-ai" className={navLinkClass} title="Search & AI Performance">
                  <Bot className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Search & AI Performance</span>}
                </NavLink>
                <NavLink to="/analytics/seo" className={navLinkClass} title="SEO Performance">
                  <Search className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>SEO Performance</span>}
                </NavLink>
              </div>
            )}

            {canManageMarketingAutomation && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Marketing Automation</div>
                )}
                <NavLink to="/automation/rules" className={navLinkClass} title="Automation Rules">
                  <Zap className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Automation Rules</span>}
                </NavLink>
                <NavLink to="/automation/segments" className={navLinkClass} title="Audience Segments">
                  <Layers className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Audience Segments</span>}
                </NavLink>
                <NavLink to="/automation/activity-log" className={navLinkClass} title="Automation Activity Log">
                  <Activity className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Automation Activity Log</span>}
                </NavLink>
              </div>
            )}

            {canManageAiIntegrations && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">AI & Integrations</div>
                )}
                <NavLink to="/ai/provider-config" className={navLinkClass} title="AI Provider Configuration">
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>AI Provider Configuration</span>}
                </NavLink>
                <NavLink to="/ai/knowledge-sources" className={navLinkClass} title="Knowledge & RAG Sources">
                  <Database className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Knowledge & RAG Sources</span>}
                </NavLink>
                <NavLink to="/ai/integration-health" className={navLinkClass} title="Integration Health">
                  <Plug className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Integration Health</span>}
                </NavLink>
              </div>
            )}

            {canManageIdentityAccess && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Identity & Access</div>
                )}
                <NavLink to="/identity/roles" className={navLinkClass} title="Roles & Permissions">
                  <KeyRound className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Roles & Permissions</span>}
                </NavLink>
                <NavLink to="/identity/users" className={navLinkClass} title="User Directory">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>User Directory</span>}
                </NavLink>
              </div>
            )}

            {canManagePlatformConfig && (
              <div className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Config</div>
                )}
                <NavLink to="/platform/api-sync" className={navLinkClass} title="API & Sync">
                  <Plug className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>API & Sync</span>}
                </NavLink>
                <NavLink to="/platform/category-taxonomy" className={navLinkClass} title="Category Taxonomy">
                  <FolderTree className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Category Taxonomy</span>}
                </NavLink>
                <NavLink to="/platform/homepage-defaults" className={navLinkClass} title="Homepage Defaults">
                  <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Homepage Defaults</span>}
                </NavLink>
                <NavLink to="/platform/seo-discovery" className={navLinkClass} title="SEO Discovery">
                  <Search className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>SEO Discovery</span>}
                </NavLink>
                <NavLink to="/platform/import-jobs" className={navLinkClass} title="Import & Job Center">
                  <ListChecks className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Import & Job Center</span>}
                </NavLink>
              </div>
            )}

            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">More</div>
              )}
              <NavLink to="/legacy" className={navLinkClass} title="Full console (legacy)">
                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Full Console</span>}
              </NavLink>
              {!sidebarCollapsed && (
                <p className="px-3 pt-1 text-[10px] leading-snug text-slate-400">
                  Taxonomy Mapping and Data Audit are not yet split into their own pages — they
                  live here for now.
                </p>
              )}
            </div>
          </nav>
        </aside>

        {/* Content area — Section 4.3 */}
        <main className="flex-1 overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
