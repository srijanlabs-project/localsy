import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import type { AdminConsoleProps, AdminWorkspaceTab } from '../AdminConsole';
import AdminShell from './AdminShell';
import { AdminBackgroundJobsProvider } from '../../contexts/AdminBackgroundJobsContext';
import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import AdminModerationPage from '../../pages/admin/AdminModerationPage';
import AdminListingDirectoryPage from '../../pages/admin/AdminListingDirectoryPage';
import AdminDuplicateReviewPage from '../../pages/admin/AdminDuplicateReviewPage';
import AdminListingAnalyticsPage from '../../pages/admin/AdminListingAnalyticsPage';
import AdminBulkImportPage from '../../pages/admin/AdminBulkImportPage';
import AdminLocalitiesPage from '../../pages/admin/AdminLocalitiesPage';
import AdminPincodeRoutingPage from '../../pages/admin/AdminPincodeRoutingPage';
import AdminCategoryUrlsPage from '../../pages/admin/AdminCategoryUrlsPage';
import AdminGeographyMasterPage from '../../pages/admin/AdminGeographyMasterPage';
import AdminHomepageLayoutPage from '../../pages/admin/AdminHomepageLayoutPage';
import AdminHeroBannersPage from '../../pages/admin/AdminHeroBannersPage';
import AdminHomepageTemplatesPage from '../../pages/admin/AdminHomepageTemplatesPage';
import AdminHomepageAssignmentsPage from '../../pages/admin/AdminHomepageAssignmentsPage';
import AdminHomepageCampaignsPage from '../../pages/admin/AdminHomepageCampaignsPage';
import AdminHomepagePublishPage from '../../pages/admin/AdminHomepagePublishPage';
import AdminOffersPage from '../../pages/admin/AdminOffersPage';
import AdminAdBannersPage from '../../pages/admin/AdminAdBannersPage';
import AdminLeadInboxPage from '../../pages/admin/AdminLeadInboxPage';
import AdminUpdatesFeedPage from '../../pages/admin/AdminUpdatesFeedPage';
import AdminApiSyncPage from '../../pages/admin/AdminApiSyncPage';
import AdminCategoryTaxonomyPage from '../../pages/admin/AdminCategoryTaxonomyPage';
import AdminHomepageDefaultsPage from '../../pages/admin/AdminHomepageDefaultsPage';
import AdminSeoDiscoveryPage from '../../pages/admin/AdminSeoDiscoveryPage';
import AdminImportJobCenterPage from '../../pages/admin/AdminImportJobCenterPage';
import AdminMerchantClaimsPage from '../../pages/admin/AdminMerchantClaimsPage';
import AdminRoleBuilderPage from '../../pages/admin/AdminRoleBuilderPage';
import AdminUserDirectoryPage from '../../pages/admin/AdminUserDirectoryPage';
import AdminPlatformAnalyticsPage from '../../pages/admin/AdminPlatformAnalyticsPage';
import AdminSearchAiPerformancePage from '../../pages/admin/AdminSearchAiPerformancePage';
import AdminSeoPerformancePage from '../../pages/admin/AdminSeoPerformancePage';
import AdminAutomationRulesPage from '../../pages/admin/AdminAutomationRulesPage';
import AdminAudienceSegmentsPage from '../../pages/admin/AdminAudienceSegmentsPage';
import AdminAutomationActivityLogPage from '../../pages/admin/AdminAutomationActivityLogPage';
import AdminAiProviderConfigPage from '../../pages/admin/AdminAiProviderConfigPage';
import AdminKnowledgeRagSourcesPage from '../../pages/admin/AdminKnowledgeRagSourcesPage';
import AdminIntegrationHealthPage from '../../pages/admin/AdminIntegrationHealthPage';
import { computeDuplicateReviewCandidates } from '../../services/admin/duplicateReview';
import {
  canEditListings, canManageAiIntegrations, canManageBulkImport, canManageCampaigns, canManageContent,
  canManageGeography, canManageHomepageCms, canManageIdentityAccess, canManageMarketingAutomation,
  canManageMerchantOps, canManagePlatformConfig, canReviewDuplicates, canViewAnalyticsInsights,
  canViewListingAnalytics,
} from '../../services/admin/adminRoles';

const AdminConsole = lazy(() => import('../AdminConsole'));

const LEGACY_TAB_VALUES: AdminWorkspaceTab[] = ['moderation', 'listing-status', 'bulk-upload', 'taxonomy-mapping', 'data-audit'];
const normalizeLegacyTab = (value?: string): AdminWorkspaceTab => (
  LEGACY_TAB_VALUES.includes(value as AdminWorkspaceTab) ? (value as AdminWorkspaceTab) : 'taxonomy-mapping'
);

function LegacyConsolePage(props: AdminConsoleProps & { fixedTab?: AdminWorkspaceTab }) {
  const params = useParams<{ tab?: string }>();
  const { fixedTab, ...consoleProps } = props;
  const initialAdminWorkspaceTab = fixedTab || normalizeLegacyTab(params.tab);
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading full console...</div>}>
      <AdminConsole {...consoleProps} initialAdminWorkspaceTab={initialAdminWorkspaceTab} />
    </Suspense>
  );
}

/** Interim role gate, shared by every route below that isn't open to every internal role (services/admin/adminRoles.ts). */
function RequireAccess({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  if (!allowed) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// New router root for the admin experience (admin-backend-ux-spec.md Sections 3-4 and 9,
// build steps 1-3: "Shell + Dashboard + Moderation Queue + Listing Directory", then
// "Duplicate Review + Listing Analytics split-out", then the "Geography group"). Mounted
// from App.tsx exactly where <AdminConsole> used to be mounted directly, with the same prop
// surface, so nothing about how the rest of the app enters admin mode needs to change.
//
// Route paths deliberately match the path segments App.tsx's existing openAdminWorkspace()
// already pushes (/admin, /admin/moderation, /admin/listing-status, /admin/bulk-upload,
// /admin/taxonomy-mapping, /admin/data-audit) so every existing entry point keeps working.
// /admin/duplicate-review, /admin/listing-analytics, and /admin/geography/* are net-new
// routes from steps 2-3 with no legacy entry point to preserve. The one intentional
// behavior change: bare /admin now lands on the new Dashboard (spec 5.1) instead of the
// Moderation tab — Moderation moved to its own explicit route.
export default function AdminApp(props: AdminConsoleProps) {
  const {
    businesses, localities, auditLogs, adLeads, listingAds, userSession, onUpdateBusiness, onApprove, onReject,
    pincodeMappings, onBulkImportBusinesses, businessTaxonomy, onSaveBusinessTaxonomy, scalableHomepageConfig,
    onCreateLocality, onDeleteLocality, onAddPincodeMapping, onDeletePincodeMapping,
    defaultLocalityId, onChangeDefaultLocalityId,
    localityCategoryLinks, onCreateLocalityCategoryLink, onDeleteLocalityCategoryLink,
    geographyConfig, onSaveGeographyConfig,
    heroBanners, homepageDefaultsConfig, onCreateHeroBanner, onUpdateHeroBanner, onDeleteHeroBanner,
    homepageLayouts, onCreateHomepageSection, onUpdateHomepageSection, onDeleteHomepageSection,
    onDuplicateHomepageSection, onMoveHomepageSection,
    onSaveScalableTemplate, onDeleteScalableTemplate, onCreateScalableTemplateSection,
    onUpdateScalableTemplateSection, onReorderScalableTemplateSections, onDuplicateScalableTemplateSection,
    onDeleteScalableTemplateSection, onSyncScalableTemplateSectionsFromLocality,
    onSaveScalableAssignment, onDeleteScalableAssignment,
    onSaveScalableCampaign, onDeleteScalableCampaign,
    apiConfiguration, onReseedScalableHomepageConfig, onPublishResolvedHomepages,
    onDeleteResolvedHomepageSnapshots, onRefreshScalablePublishedSnapshots, onDeleteScalablePublishedSnapshot,
    coupons, onAddCoupon, onUpdateCoupon, onDeleteCoupon,
    onCreateListingAd, onUpdateListingAd, onDeleteListingAd,
    communityItems, onAddCommunityItem, onUpdateCommunityItem, onDeleteCommunityItem,
    onUpdateApiConfiguration, onSyncHomepageConfig,
    onSaveHomepageDefaultsConfig,
    seoDiscoveryConfig, onSaveSeoDiscoveryConfig,
  } = props;

  const pendingModerationCount = businesses.filter((b) => b.status === 'pending').length;
  const duplicateCandidateCount = computeDuplicateReviewCandidates(businesses).length;
  const role = userSession?.role;
  const canEdit = canEditListings(role);
  const canManageImports = canManageBulkImport(role);
  const canReview = canReviewDuplicates(role);
  const canViewAnalytics = canViewListingAnalytics(role);
  const canManageGeo = canManageGeography(role);
  const canManageHomepage = canManageHomepageCms(role);
  const canManageCampaignsGroup = canManageCampaigns(role);
  const canManageContentGroup = canManageContent(role);
  const canManagePlatform = canManagePlatformConfig(role);
  const canManageIdentity = canManageIdentityAccess(role);
  const canManageMerchant = canManageMerchantOps(role);
  const canViewAnalyticsInsightsGroup = canViewAnalyticsInsights(role);
  const canManageMarketingAutomationGroup = canManageMarketingAutomation(role);
  const canManageAiIntegrationsGroup = canManageAiIntegrations(role);

  return (
    <AdminBackgroundJobsProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route
            element={(
              <AdminShell
                userSession={userSession}
                pendingModerationCount={pendingModerationCount}
                duplicateCandidateCount={duplicateCandidateCount}
                canManageBulkImport={canManageImports}
                canReviewDuplicates={canReview}
                canViewListingAnalytics={canViewAnalytics}
                canManageGeography={canManageGeo}
                canManageHomepageCms={canManageHomepage}
                canManageCampaigns={canManageCampaignsGroup}
                canManageContent={canManageContentGroup}
                canManagePlatformConfig={canManagePlatform}
                canManageIdentityAccess={canManageIdentity}
                canManageMerchantOps={canManageMerchant}
                canViewAnalyticsInsights={canViewAnalyticsInsightsGroup}
                canManageMarketingAutomation={canManageMarketingAutomationGroup}
                canManageAiIntegrations={canManageAiIntegrationsGroup}
              />
            )}
          >
            <Route
              index
              element={(
                <AdminDashboardPage
                  businesses={businesses}
                  localities={localities}
                  auditLogs={auditLogs}
                  scalableHomepageConfig={scalableHomepageConfig}
                />
              )}
            />
            <Route
              path="moderation"
              element={(
                <AdminModerationPage
                  businesses={businesses}
                  localities={localities}
                  onApprove={onApprove}
                  onReject={onReject}
                  onUpdateBusiness={onUpdateBusiness}
                />
              )}
            />
            <Route
              path="listing-status"
              element={(
                <AdminListingDirectoryPage
                  businesses={businesses}
                  localities={localities}
                  onUpdateBusiness={onUpdateBusiness}
                  businessTaxonomy={businessTaxonomy}
                  onSaveBusinessTaxonomy={onSaveBusinessTaxonomy}
                  canEdit={canEdit}
                />
              )}
            />
            <Route
              path="bulk-upload"
              element={(
                <RequireAccess allowed={canManageImports}>
                  <AdminBulkImportPage
                    businesses={businesses}
                    localities={localities}
                    pincodeMappings={pincodeMappings}
                    onBulkImportBusinesses={onBulkImportBusinesses}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="duplicate-review"
              element={(
                <RequireAccess allowed={canReview}>
                  <AdminDuplicateReviewPage
                    businesses={businesses}
                    onUpdateBusiness={onUpdateBusiness}
                    canReview={canReview}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="listing-analytics"
              element={(
                <RequireAccess allowed={canViewAnalytics}>
                  <AdminListingAnalyticsPage
                    businesses={businesses}
                    auditLogs={auditLogs}
                    adLeads={adLeads}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="geography/localities"
              element={(
                <RequireAccess allowed={canManageGeo}>
                  <AdminLocalitiesPage
                    localities={localities}
                    businesses={businesses}
                    onCreateLocality={onCreateLocality}
                    onDeleteLocality={onDeleteLocality}
                    onAddPincodeMapping={onAddPincodeMapping}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="geography/pincode-routing"
              element={(
                <RequireAccess allowed={canManageGeo}>
                  <AdminPincodeRoutingPage
                    localities={localities}
                    pincodeMappings={pincodeMappings}
                    defaultLocalityId={defaultLocalityId}
                    onChangeDefaultLocalityId={onChangeDefaultLocalityId}
                    onAddPincodeMapping={onAddPincodeMapping}
                    onDeletePincodeMapping={onDeletePincodeMapping}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="geography/category-urls"
              element={(
                <RequireAccess allowed={canManageGeo}>
                  <AdminCategoryUrlsPage
                    localities={localities}
                    localityCategoryLinks={localityCategoryLinks}
                    onCreateLocalityCategoryLink={onCreateLocalityCategoryLink}
                    onDeleteLocalityCategoryLink={onDeleteLocalityCategoryLink}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="geography/master"
              element={(
                <RequireAccess allowed={canManageGeo}>
                  <AdminGeographyMasterPage
                    geographyConfig={geographyConfig}
                    onSaveGeographyConfig={onSaveGeographyConfig}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="homepage/layout"
              element={(
                <RequireAccess allowed={canManageHomepage}>
                  <AdminHomepageLayoutPage
                    localities={localities}
                    businesses={businesses}
                    homepageLayouts={homepageLayouts}
                    onCreateHomepageSection={onCreateHomepageSection}
                    onUpdateHomepageSection={onUpdateHomepageSection}
                    onDeleteHomepageSection={onDeleteHomepageSection}
                    onDuplicateHomepageSection={onDuplicateHomepageSection}
                    onMoveHomepageSection={onMoveHomepageSection}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="homepage/hero"
              element={(
                <RequireAccess allowed={canManageHomepage}>
                  <AdminHeroBannersPage
                    localities={localities}
                    heroBanners={heroBanners}
                    homepageDefaultsConfig={homepageDefaultsConfig}
                    userSession={userSession}
                    onCreateHeroBanner={onCreateHeroBanner}
                    onUpdateHeroBanner={onUpdateHeroBanner}
                    onDeleteHeroBanner={onDeleteHeroBanner}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="homepage/templates"
              element={(
                <RequireAccess allowed={canManageHomepage}>
                  <AdminHomepageTemplatesPage
                    localities={localities}
                    businesses={businesses}
                    homepageLayouts={homepageLayouts}
                    scalableHomepageConfig={scalableHomepageConfig}
                    onSaveScalableTemplate={onSaveScalableTemplate}
                    onDeleteScalableTemplate={onDeleteScalableTemplate}
                    onCreateScalableTemplateSection={onCreateScalableTemplateSection}
                    onUpdateScalableTemplateSection={onUpdateScalableTemplateSection}
                    onReorderScalableTemplateSections={onReorderScalableTemplateSections}
                    onDuplicateScalableTemplateSection={onDuplicateScalableTemplateSection}
                    onDeleteScalableTemplateSection={onDeleteScalableTemplateSection}
                    onSyncScalableTemplateSectionsFromLocality={onSyncScalableTemplateSectionsFromLocality}
                    onPublishResolvedHomepages={onPublishResolvedHomepages}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="homepage/assignments"
              element={(
                <RequireAccess allowed={canManageHomepage}>
                  <AdminHomepageAssignmentsPage
                    localities={localities}
                    scalableHomepageConfig={scalableHomepageConfig}
                    onSaveScalableAssignment={onSaveScalableAssignment}
                    onDeleteScalableAssignment={onDeleteScalableAssignment}
                    onPublishResolvedHomepages={onPublishResolvedHomepages}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="homepage/campaigns"
              element={(
                <RequireAccess allowed={canManageHomepage}>
                  <AdminHomepageCampaignsPage
                    localities={localities}
                    businesses={businesses}
                    listingAds={listingAds}
                    scalableHomepageConfig={scalableHomepageConfig}
                    onSaveScalableCampaign={onSaveScalableCampaign}
                    onDeleteScalableCampaign={onDeleteScalableCampaign}
                    onPublishResolvedHomepages={onPublishResolvedHomepages}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="homepage/publish"
              element={(
                <RequireAccess allowed={canManageHomepage}>
                  <AdminHomepagePublishPage
                    localities={localities}
                    pincodeMappings={pincodeMappings}
                    apiConfiguration={apiConfiguration}
                    scalableHomepageConfig={scalableHomepageConfig}
                    onReseedScalableHomepageConfig={onReseedScalableHomepageConfig}
                    onPublishResolvedHomepages={onPublishResolvedHomepages}
                    onDeleteResolvedHomepageSnapshots={onDeleteResolvedHomepageSnapshots}
                    onRefreshScalablePublishedSnapshots={onRefreshScalablePublishedSnapshots}
                    onDeleteScalablePublishedSnapshot={onDeleteScalablePublishedSnapshot}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="campaigns/offers"
              element={(
                <RequireAccess allowed={canManageCampaignsGroup}>
                  <AdminOffersPage
                    localities={localities}
                    businesses={businesses}
                    coupons={coupons}
                    onAddCoupon={onAddCoupon}
                    onUpdateCoupon={onUpdateCoupon}
                    onDeleteCoupon={onDeleteCoupon}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="campaigns/ad-banners"
              element={(
                <RequireAccess allowed={canManageCampaignsGroup}>
                  <AdminAdBannersPage
                    localities={localities}
                    businesses={businesses}
                    listingAds={listingAds}
                    adLeads={adLeads}
                    userSession={userSession}
                    onCreateListingAd={onCreateListingAd}
                    onUpdateListingAd={onUpdateListingAd}
                    onDeleteListingAd={onDeleteListingAd}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="campaigns/lead-inbox"
              element={(
                <RequireAccess allowed={canManageCampaignsGroup}>
                  <AdminLeadInboxPage
                    adLeads={adLeads}
                    listingAds={listingAds}
                    businesses={businesses}
                    localities={localities}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="content/updates"
              element={(
                <RequireAccess allowed={canManageContentGroup}>
                  <AdminUpdatesFeedPage
                    localities={localities}
                    communityItems={communityItems}
                    userSession={userSession}
                    onAddCommunityItem={onAddCommunityItem}
                    onUpdateCommunityItem={onUpdateCommunityItem}
                    onDeleteCommunityItem={onDeleteCommunityItem}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="platform/api-sync"
              element={(
                <RequireAccess allowed={canManagePlatform}>
                  <AdminApiSyncPage
                    apiConfiguration={apiConfiguration}
                    onUpdateApiConfiguration={onUpdateApiConfiguration}
                    onSyncHomepageConfig={onSyncHomepageConfig}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="platform/category-taxonomy"
              element={(
                <RequireAccess allowed={canManagePlatform}>
                  <AdminCategoryTaxonomyPage
                    businessTaxonomy={businessTaxonomy}
                    onSaveBusinessTaxonomy={onSaveBusinessTaxonomy}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="platform/homepage-defaults"
              element={(
                <RequireAccess allowed={canManagePlatform}>
                  <AdminHomepageDefaultsPage
                    homepageDefaultsConfig={homepageDefaultsConfig}
                    onSaveHomepageDefaultsConfig={onSaveHomepageDefaultsConfig}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="platform/seo-discovery"
              element={(
                <RequireAccess allowed={canManagePlatform}>
                  <AdminSeoDiscoveryPage
                    localities={localities}
                    seoDiscoveryConfig={seoDiscoveryConfig}
                    onSaveSeoDiscoveryConfig={onSaveSeoDiscoveryConfig}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="platform/import-jobs"
              element={(
                <RequireAccess allowed={canManagePlatform}>
                  <AdminImportJobCenterPage />
                </RequireAccess>
              )}
            />
            <Route
              path="merchant/claims"
              element={(
                <RequireAccess allowed={canManageMerchant}>
                  <AdminMerchantClaimsPage
                    businesses={businesses}
                    localities={localities}
                    onUpdateBusiness={onUpdateBusiness}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="identity/roles"
              element={(
                <RequireAccess allowed={canManageIdentity}>
                  <AdminRoleBuilderPage />
                </RequireAccess>
              )}
            />
            <Route
              path="identity/users"
              element={(
                <RequireAccess allowed={canManageIdentity}>
                  <AdminUserDirectoryPage
                    localities={localities}
                    userSession={userSession}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="analytics/overview"
              element={(
                <RequireAccess allowed={canViewAnalyticsInsightsGroup}>
                  <AdminPlatformAnalyticsPage
                    businesses={businesses}
                    localities={localities}
                    auditLogs={auditLogs}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="analytics/search-ai"
              element={(
                <RequireAccess allowed={canViewAnalyticsInsightsGroup}>
                  <AdminSearchAiPerformancePage />
                </RequireAccess>
              )}
            />
            <Route
              path="analytics/seo"
              element={(
                <RequireAccess allowed={canViewAnalyticsInsightsGroup}>
                  <AdminSeoPerformancePage
                    businesses={businesses}
                    localities={localities}
                  />
                </RequireAccess>
              )}
            />
            <Route
              path="automation/rules"
              element={(
                <RequireAccess allowed={canManageMarketingAutomationGroup}>
                  <AdminAutomationRulesPage />
                </RequireAccess>
              )}
            />
            <Route
              path="automation/segments"
              element={(
                <RequireAccess allowed={canManageMarketingAutomationGroup}>
                  <AdminAudienceSegmentsPage businesses={businesses} localities={localities} />
                </RequireAccess>
              )}
            />
            <Route
              path="automation/activity-log"
              element={(
                <RequireAccess allowed={canManageMarketingAutomationGroup}>
                  <AdminAutomationActivityLogPage />
                </RequireAccess>
              )}
            />
            <Route
              path="ai/provider-config"
              element={(
                <RequireAccess allowed={canManageAiIntegrationsGroup}>
                  <AdminAiProviderConfigPage />
                </RequireAccess>
              )}
            />
            <Route
              path="ai/knowledge-sources"
              element={(
                <RequireAccess allowed={canManageAiIntegrationsGroup}>
                  <AdminKnowledgeRagSourcesPage />
                </RequireAccess>
              )}
            />
            <Route
              path="ai/integration-health"
              element={(
                <RequireAccess allowed={canManageAiIntegrationsGroup}>
                  <AdminIntegrationHealthPage />
                </RequireAccess>
              )}
            />
            <Route path="taxonomy-mapping" element={<LegacyConsolePage {...props} fixedTab="taxonomy-mapping" />} />
            <Route path="data-audit" element={<LegacyConsolePage {...props} fixedTab="data-audit" />} />
            <Route path="legacy" element={<LegacyConsolePage {...props} />} />
            <Route path="legacy/:tab" element={<LegacyConsolePage {...props} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminBackgroundJobsProvider>
  );
}
