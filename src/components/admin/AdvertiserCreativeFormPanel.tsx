import React from 'react';
import type { Business, ListingAd, Locality } from '../../types';

type AdvertiserCreativeFormPanelProps = {
  localities: Locality[];
  approvedBusinesses: Business[];
  categoryPicker: React.ReactNode;
  adTitle: string;
  adDescription: string;
  adBadge: string;
  adCtaText: string;
  adStartDate: string;
  adEndDate: string;
  adWorkflowStatus: NonNullable<ListingAd['workflowStatus']>;
  adBillingModel: NonNullable<ListingAd['billingModel']>;
  adRotationMode: NonNullable<ListingAd['rotationMode']>;
  adActionType: ListingAd['actionType'];
  adBgColor: string;
  adPlannedBudget: string;
  adSpentBudget: string;
  adCpcBid: string;
  adImpressions: string;
  adClicks: string;
  adReviewNotes: string;
  adLocalityId: string;
  adPlacementKey: string;
  adTags: string;
  adImageUrl: string;
  adDeviceTarget: NonNullable<ListingAd['deviceTarget']>;
  adMobileRowPosition: string;
  adPincodes: string;
  adTargetUrl: string;
  adTargetBusinessId: string;
  adSellerBusinessId: string;
  adImageUploading: boolean;
  adEditId: string | null;
  adFormError: string;
  adPreviewImageUrl?: string;
  adImageFolder: string;
  onAdTitleChange: (value: string) => void;
  onAdDescriptionChange: (value: string) => void;
  onAdBadgeChange: (value: string) => void;
  onAdCtaTextChange: (value: string) => void;
  onAdStartDateChange: (value: string) => void;
  onAdEndDateChange: (value: string) => void;
  onAdWorkflowStatusChange: (value: NonNullable<ListingAd['workflowStatus']>) => void;
  onAdBillingModelChange: (value: NonNullable<ListingAd['billingModel']>) => void;
  onAdRotationModeChange: (value: NonNullable<ListingAd['rotationMode']>) => void;
  onAdActionTypeChange: (value: ListingAd['actionType']) => void;
  onAdBgColorChange: (value: string) => void;
  onAdPlannedBudgetChange: (value: string) => void;
  onAdSpentBudgetChange: (value: string) => void;
  onAdCpcBidChange: (value: string) => void;
  onAdImpressionsChange: (value: string) => void;
  onAdClicksChange: (value: string) => void;
  onAdReviewNotesChange: (value: string) => void;
  onAdLocalityIdChange: (value: string) => void;
  onAdPlacementKeyChange: (value: string) => void;
  onAdTagsChange: (value: string) => void;
  onAdImageUrlChange: (value: string) => void;
  onAdImageFileChange: (file: File | null) => void;
  onAdDeviceTargetChange: (value: NonNullable<ListingAd['deviceTarget']>) => void;
  onAdMobileRowPositionChange: (value: string) => void;
  onAdPincodesChange: (value: string) => void;
  onAdTargetUrlChange: (value: string) => void;
  onAdTargetBusinessIdChange: (value: string) => void;
  onAdSellerBusinessIdChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export default function AdvertiserCreativeFormPanel({
  localities,
  approvedBusinesses,
  categoryPicker,
  adTitle,
  adDescription,
  adBadge,
  adCtaText,
  adStartDate,
  adEndDate,
  adWorkflowStatus,
  adBillingModel,
  adRotationMode,
  adActionType,
  adBgColor,
  adPlannedBudget,
  adSpentBudget,
  adCpcBid,
  adImpressions,
  adClicks,
  adReviewNotes,
  adLocalityId,
  adPlacementKey,
  adTags,
  adImageUrl,
  adDeviceTarget,
  adMobileRowPosition,
  adPincodes,
  adTargetUrl,
  adTargetBusinessId,
  adSellerBusinessId,
  adImageUploading,
  adEditId,
  adFormError,
  adPreviewImageUrl,
  adImageFolder,
  onAdTitleChange,
  onAdDescriptionChange,
  onAdBadgeChange,
  onAdCtaTextChange,
  onAdStartDateChange,
  onAdEndDateChange,
  onAdWorkflowStatusChange,
  onAdBillingModelChange,
  onAdRotationModeChange,
  onAdActionTypeChange,
  onAdBgColorChange,
  onAdPlannedBudgetChange,
  onAdSpentBudgetChange,
  onAdCpcBidChange,
  onAdImpressionsChange,
  onAdClicksChange,
  onAdReviewNotesChange,
  onAdLocalityIdChange,
  onAdPlacementKeyChange,
  onAdTagsChange,
  onAdImageUrlChange,
  onAdImageFileChange,
  onAdDeviceTargetChange,
  onAdMobileRowPositionChange,
  onAdPincodesChange,
  onAdTargetUrlChange,
  onAdTargetBusinessIdChange,
  onAdSellerBusinessIdChange,
  onSubmit,
  onReset,
}: AdvertiserCreativeFormPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-extrabold text-slate-950">Advertiser Creative and Delivery Form</h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Create campaigns, adjust targeting, budgets, billing models, and rotation rules from one controlled form.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <input value={adTitle} onChange={(event) => onAdTitleChange(event.target.value)} placeholder="Ad title" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        <textarea value={adDescription} onChange={(event) => onAdDescriptionChange(event.target.value)} placeholder="Ad description" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        <div className="grid grid-cols-2 gap-2">
          <input value={adBadge} onChange={(event) => onAdBadgeChange(event.target.value)} placeholder="Badge" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
          <input value={adCtaText} onChange={(event) => onAdCtaTextChange(event.target.value)} placeholder="CTA text" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={adStartDate} onChange={(event) => onAdStartDateChange(event.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
          <input type="date" value={adEndDate} onChange={(event) => onAdEndDateChange(event.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select value={adWorkflowStatus} onChange={(event) => onAdWorkflowStatusChange(event.target.value as NonNullable<ListingAd['workflowStatus']>)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="paused">Paused</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
          <select value={adBillingModel} onChange={(event) => onAdBillingModelChange(event.target.value as NonNullable<ListingAd['billingModel']>)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="fixed">Fixed Placement</option>
            <option value="cpc">CPC</option>
            <option value="lead">Cost Per Lead</option>
          </select>
          <select value={adRotationMode} onChange={(event) => onAdRotationModeChange(event.target.value as NonNullable<ListingAd['rotationMode']>)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="even">Even Rotation</option>
            <option value="weighted">Weighted Rotation</option>
            <option value="random">Random Rotation</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={adActionType} onChange={(event) => onAdActionTypeChange(event.target.value as ListingAd['actionType'])} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="landing_page">Landing Page</option>
            <option value="landing_listing">Landing Listing</option>
            <option value="lead_form">Lead Generation Form</option>
          </select>
          <input type="color" value={adBgColor} onChange={(event) => onAdBgColorChange(event.target.value)} className="border border-slate-200 rounded-lg h-9 w-full bg-slate-50" />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input value={adPlannedBudget} onChange={(event) => onAdPlannedBudgetChange(event.target.value)} placeholder="Planned budget" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
          <input value={adSpentBudget} onChange={(event) => onAdSpentBudgetChange(event.target.value)} placeholder="Spent budget" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
          <input value={adCpcBid} onChange={(event) => onAdCpcBidChange(event.target.value)} placeholder="CPC bid" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
          <input value={adImpressions} onChange={(event) => onAdImpressionsChange(event.target.value)} placeholder="Impressions" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={adClicks} onChange={(event) => onAdClicksChange(event.target.value)} placeholder="Clicks" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
          <input value={adReviewNotes} onChange={(event) => onAdReviewNotesChange(event.target.value)} placeholder="Review notes or internal notes" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={adLocalityId} onChange={(event) => onAdLocalityIdChange(event.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            {localities.map((locality) => (
              <option key={locality.id} value={locality.id}>{locality.name}</option>
            ))}
          </select>
          <input value={adPlacementKey} onChange={(event) => onAdPlacementKeyChange(event.target.value)} placeholder="Placement key" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        </div>
        {categoryPicker}
        <input value={adTags} onChange={(event) => onAdTagsChange(event.target.value)} placeholder="Target tags, comma separated (pickle, food, salon)" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input value={adImageUrl} onChange={(event) => onAdImageUrlChange(event.target.value)} placeholder="Banner image URL (optional if uploading)" className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 md:col-span-2" />
          <select value={adDeviceTarget} onChange={(event) => onAdDeviceTargetChange(event.target.value as NonNullable<ListingAd['deviceTarget']>)} className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="all">Desktop + Mobile</option>
            <option value="desktop">Desktop Only</option>
            <option value="mobile">Mobile Only</option>
          </select>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
          <div className="font-semibold text-slate-700">Upload ad image</div>
          <input type="file" accept="image/*" onChange={(event) => onAdImageFileChange(event.target.files?.[0] || null)} className="mt-2 block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-indigo-700" />
          <div className="mt-1 text-[10px] text-slate-500">Uploads to <span className="font-mono">{adImageFolder}</span></div>
          {adPreviewImageUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <img src={adPreviewImageUrl} alt="Ad creative preview" className="h-32 w-full object-cover" />
            </div>
          )}
        </div>
        {adDeviceTarget !== 'desktop' && (
          <input value={adMobileRowPosition} onChange={(event) => onAdMobileRowPositionChange(event.target.value)} placeholder="Mobile row position (after section row)" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        )}
        <input value={adPincodes} onChange={(event) => onAdPincodesChange(event.target.value)} placeholder="Target pincodes" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono" />
        {adActionType === 'landing_page' && (
          <input type="url" value={adTargetUrl} onChange={(event) => onAdTargetUrlChange(event.target.value)} placeholder="https://example.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" />
        )}
        {adActionType === 'landing_listing' && (
          <select value={adTargetBusinessId} onChange={(event) => onAdTargetBusinessIdChange(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <option value="">Select target listing</option>
            {approvedBusinesses.map((business) => (
              <option key={business.id} value={business.id}>{business.name}</option>
            ))}
          </select>
        )}
        <select value={adSellerBusinessId} onChange={(event) => onAdSellerBusinessIdChange(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
          <option value="">No seller mapping (platform only)</option>
          {approvedBusinesses.map((business) => (
            <option key={business.id} value={business.id}>{business.name}</option>
          ))}
        </select>
        <button type="submit" disabled={adImageUploading} className="w-full rounded-lg bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          {adImageUploading ? 'Uploading...' : (adEditId ? 'Update Ad Banner' : 'Create Ad Banner')}
        </button>
        {adFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{adFormError}</div>}
        {adEditId && (
          <button type="button" onClick={onReset} className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700">Cancel Edit</button>
        )}
      </form>
    </div>
  );
}
