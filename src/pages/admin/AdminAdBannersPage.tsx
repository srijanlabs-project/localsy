import React from 'react';
import type { AdLead, Business, ListingAd, Locality, ScalableCampaign, ScalableHomepageConfigState, UserSession } from '../../types';
import BannerStudioPanel from '../../components/admin/BannerStudioPanel';
import { BUSINESS_CATEGORIES } from '../../categoryMaster';

type AdminAdBannersPageProps = {
  localities: Locality[];
  businesses: Business[];
  listingAds?: ListingAd[];
  adLeads?: AdLead[];
  userSession?: UserSession;
  scalableHomepageConfig?: ScalableHomepageConfigState | null;
  onSaveScalableCampaign?: (campaign: ScalableCampaign) => Promise<unknown> | void;
  onDeleteScalableCampaign?: (campaignId: string) => Promise<unknown> | void;
  onDeleteListingAd?: (adId: string) => void;
  canManage: boolean;
};

// Routed home for admin-backend-ux-spec.md Section 5.20 "Campaigns: Ad Banners", rebuilt as
// the ONE screen every banner is created and managed from.
//
// What it replaced, and why:
//
//   Ad Banners (this page)  ->  homepage_listing_ads   the site never read it
//   Hero Banners            ->  homepage_hero_banners  localStorage only
//   Campaign Builder        ->  campaigns              the only delivered path
//
// Three screens wrote to two stores and only one store was ever served, so a banner
// created here was activated and then invisible, with nothing anywhere saying why. The old
// page's 25 `adXxx` useState hooks, `AdvertiserCreativeFormPanel` and `AdOperationsPanel`
// all drove `homepage_listing_ads`; they are gone rather than kept alongside, because
// leaving a second form in reach is how a banner ends up in the store that is not read.
//
// `BannerStudioPanel` writes CAMPAIGNS — what `resolveHomepageForContext` builds its
// payload from — and its "will / will NOT render" verdict runs the server's own gates
// (status, image, date window, device-vs-slot) in the form, before the operator goes
// looking on the public site.
//
// The legacy records below are read-only and deletable only: they exist so the rows already
// in `homepage_listing_ads` can be cleared out, not so they can be edited back to life.
// Nothing on the site reads them.
export default function AdminAdBannersPage({
  localities,
  businesses,
  listingAds = [],
  userSession,
  scalableHomepageConfig,
  onSaveScalableCampaign,
  onDeleteScalableCampaign,
  onDeleteListingAd,
  canManage,
}: AdminAdBannersPageProps) {
  // A snapshot is served in preference to the live resolver, so the form has to know which
  // localities have one before it can tell the operator what will happen on save.
  const publishedSnapshotLocalityIds = Array.from(new Set(
    (scalableHomepageConfig?.publishedSnapshots || []).map((snapshot) => snapshot.localityId).filter(Boolean)
  ));

  return (
    <div className="space-y-4">
      <BannerStudioPanel
        localities={localities}
        categories={BUSINESS_CATEGORIES}
        businesses={businesses}
        userSession={userSession}
        scalableHomepageConfig={scalableHomepageConfig}
        publishedSnapshotLocalityIds={publishedSnapshotLocalityIds}
        onSaveScalableCampaign={onSaveScalableCampaign}
        onDeleteScalableCampaign={onDeleteScalableCampaign}
        canManage={canManage}
      />

      {listingAds.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">
            Legacy ad records ({listingAds.length})
            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">not served to the site</span>
          </summary>
          <p className="mt-2 text-xs text-slate-500">
            These were created by the old Ad Banners form, which wrote to a store the public site never read.
            Recreate anything still wanted as a banner above, then delete the record here.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[11px]">
              <thead className="text-slate-500">
                <tr>
                  {['Title', 'Placement', 'Dates', 'Status', ''].map((heading) => (
                    <th key={heading} className="px-2 py-1.5 font-bold uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listingAds.map((ad) => (
                  <tr key={ad.id} className="border-t border-slate-100 align-top">
                    <td className="px-2 py-2 font-bold text-slate-900">{ad.title}</td>
                    <td className="px-2 py-2 text-slate-600">{ad.placementKey || '—'}</td>
                    <td className="px-2 py-2 text-slate-600">{ad.startDate || '—'} &rarr; {ad.endDate || '—'}</td>
                    <td className="px-2 py-2 text-slate-600">{ad.workflowStatus || 'draft'}{ad.isActive ? ' · active' : ''}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => onDeleteListingAd?.(ad.id)}
                        disabled={!canManage}
                        className="rounded border border-rose-200 px-2 py-1 font-bold text-rose-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
