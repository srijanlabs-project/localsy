import React, { useMemo } from 'react';
import { ArrowRight, BadgeCheck, BarChart3, Globe, MapPin, Megaphone, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import type { AdLead, Business, ListingAd, Locality } from '../../types';
import { getBusinessDirectionsUrl, getBusinessGallery, getBusinessPrimaryLocationLabel, getSellerPageSlug } from '../../services/webportal/publicExperience';

type SellerShowcasePageProps = {
  businessId: string;
  businesses: Business[];
  localities: Locality[];
  listingAds: ListingAd[];
  adLeads: AdLead[];
  onOpenListingPage: (businessId: string, localityId?: string) => void;
  onOpenLocalityPage: (localityId: string) => void;
  onClaimListing: (businessId: string) => void;
  onContactSales: (businessId: string) => void;
};

const safeNumber = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export default function SellerShowcasePage({
  businessId,
  businesses,
  localities,
  listingAds,
  adLeads,
  onOpenListingPage,
  onOpenLocalityPage,
  onClaimListing,
  onContactSales,
}: SellerShowcasePageProps) {
  const business = useMemo(() => businesses.find((entry) => entry.id === businessId) || null, [businessId, businesses]);
  const relatedBusinesses = useMemo(() => (
    businesses
      .filter((entry) => entry.status === 'approved')
      .filter((entry) => entry.id !== businessId && entry.localityId === business?.localityId)
      .slice(0, 4)
  ), [business?.localityId, businessId, businesses]);
  const gallery = useMemo(() => (business ? getBusinessGallery(business) : []), [business]);
  const businessAds = useMemo(() => listingAds.filter((ad) => ad.sellerBusinessId === businessId), [businessId, listingAds]);
  const businessLeads = useMemo(() => adLeads.filter((lead) => lead.sellerBusinessId === businessId), [adLeads, businessId]);

  if (!business) {
    return (
      <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-6 lg:px-8">
        <div className="rounded-[24px] border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
          <div className="text-2xl font-black tracking-[-0.04em] text-slate-950">Seller page not found</div>
        </div>
      </section>
    );
  }

  const locality = localities.find((entry) => entry.id === business.localityId) || null;
  const locationLabel = getBusinessPrimaryLocationLabel(localities, business);
  const impressions = businessAds.reduce((sum, ad) => sum + safeNumber(ad.impressions), 0);
  const clicks = businessAds.reduce((sum, ad) => sum + safeNumber(ad.clicks), 0);
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="px-8 py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
              <Megaphone className="h-3.5 w-3.5" />
              Seller Showcase
            </div>
            <h1 className="mt-5 text-[3.4rem] font-black leading-[0.95] tracking-[-0.06em] text-[#0D1B2A]">
              {business.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8f1] px-3 py-1 font-semibold text-[#1b8f5f]">
                <BadgeCheck className="h-4 w-4" />
                {business.verifiedBadge ? 'Verified listing' : 'Seller-ready profile'}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#1E3A8A]" />
                {locationLabel}
              </span>
            </div>
            <p className="mt-5 max-w-[600px] text-[1rem] leading-8 text-slate-600">
              {business.description}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Rating</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{business.rating.toFixed(1)}</div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Leads</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{businessLeads.length}</div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Impressions</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{impressions}</div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">CTR</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{ctr}%</div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpenListingPage(business.id, business.localityId)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white shadow-sm"
              >
                Open listing detail
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onClaimListing(business.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 text-[#1E3A8A]" />
                Claim listing
              </button>
              <button
                type="button"
                onClick={() => onContactSales(business.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#FFD54F] bg-[#FFF4CC] px-5 py-3 text-sm font-semibold text-[#0D1B2A] shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                Contact sales
              </button>
            </div>
          </div>

          <div className="grid gap-3 bg-slate-100 p-4 md:grid-cols-2">
            {gallery.slice(0, 4).map((image, index) => (
              <div key={`${image}-${index}`} className={`${index === 0 ? 'md:col-span-2' : ''} overflow-hidden rounded-[22px]`}>
                <img src={image} alt={`${business.name} ${index + 1}`} className="h-full min-h-[180px] w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr_1fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[1.35rem] font-bold tracking-[-0.03em] text-slate-950">Public trust and business profile</div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div><strong className="text-slate-900">Business types:</strong> {(business.businessTypes || []).join(', ') || 'Local business'}</div>
            <div><strong className="text-slate-900">Service types:</strong> {(business.serviceTypes || []).join(', ') || 'General services'}</div>
            <div><strong className="text-slate-900">Verification:</strong> {(business.verificationTags || []).join(', ') || 'Profile checks in progress'}</div>
            <div><strong className="text-slate-900">SEO tags:</strong> {(business.domainMappingTags || []).join(', ') || 'Local discovery'}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <a href={getBusinessDirectionsUrl(business)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-[#1E3A8A]" />
                Directions
              </a>
              {business.website ? (
                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  <Globe className="h-3.5 w-3.5 text-[#1E3A8A]" />
                  Website
                </a>
              ) : null}
              {business.phone ? (
                <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-[#1E3A8A]" />
                  Call
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950">
            <BarChart3 className="h-5 w-5 text-[#1E3A8A]" />
            Advertiser signal
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div>{businessAds.length} active or historical campaigns linked to this merchant profile.</div>
            <div>{businessLeads.length} lead records currently mapped to this seller account.</div>
            <div>{business.seoPremiumEnabled ? 'Premium SEO visibility is enabled.' : 'Upgrade path available for premium SEO visibility.'}</div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950">Nearby alternatives</div>
          <div className="mt-4 space-y-3">
            {relatedBusinesses.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenListingPage(entry.id, entry.localityId)}
                className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-white"
              >
                <div className="text-sm font-semibold text-slate-900">{entry.name}</div>
                <div className="mt-1 text-xs text-slate-500">{getBusinessPrimaryLocationLabel(localities, entry)}</div>
              </button>
            ))}
            {locality ? (
              <button
                type="button"
                onClick={() => onOpenLocalityPage(locality.id)}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A]"
              >
                Open locality page
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </section>

      </div>

      <div className="mt-3 text-right text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
        Seller slug: /seller/{getSellerPageSlug(business)}
      </div>
    </section>
  );
}
