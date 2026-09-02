import React from 'react';
import { Check, CheckCircle, XCircle } from 'lucide-react';
import { Business, Locality } from '../../types';
import { MASTER_AREAS } from '../../geographyMaster';
import {
  BUSINESS_CATEGORIES,
  getCategoryById,
  getSubcategoriesForCategory,
  getSubcategoryById,
  resolveDefaultSubcategoryId,
} from '../../categoryMaster';
import { getBusinessImageUrl, getCategoryFallbackImage, hasUploadedBusinessImage } from '../../utils/businessImage';

type ModerationQueueProps = {
  pendingBusinesses: Business[];
  localities: Locality[];
  rejectionActive: Record<string, boolean>;
  rejectionReasons: Record<string, string>;
  editedHrs: Record<string, string>;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onToggleRejectActive: (id: string, active: boolean) => void;
  onRejectReasonChange: (id: string, reason: string) => void;
  onHoursChange: (id: string, hours: string) => void;
  onUpdateBusiness?: (business: Business) => void;
};

export default function ModerationQueue({
  pendingBusinesses,
  localities,
  rejectionActive,
  rejectionReasons,
  editedHrs,
  onApprove,
  onReject,
  onToggleRejectActive,
  onRejectReasonChange,
  onHoursChange,
  onUpdateBusiness,
}: ModerationQueueProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Intake Moderation Queue
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Review submitted business requests from Hyper Local proprietors. Real-time verification simulator.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-mono font-semibold text-amber-800">
          {pendingBusinesses.length} Pending Approval
        </span>
      </div>

      {pendingBusinesses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
          <Check className="mx-auto mb-2 h-10 w-10 text-emerald-500 opacity-60" />
          <p className="text-sm font-medium text-slate-700">All applications processed!</p>
          <p className="mt-1 text-xs text-slate-400">No new Hyper Local businesses waiting in the moderation queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBusinesses.map((business) => {
            const locality = localities.find((entry) => entry.id === business.localityId);
            const isRejecting = rejectionActive[business.id];

            return (
              <div key={business.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 tracking-tight md:flex-row">
                <img
                  src={getBusinessImageUrl(business)}
                  alt={business.name}
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getCategoryFallbackImage(business.categoryId);
                  }}
                  className={`h-16 w-16 flex-shrink-0 self-start rounded-lg border border-slate-200 bg-slate-100 md:self-center ${
                    hasUploadedBusinessImage(business) ? 'object-cover' : 'object-contain p-2'
                  }`}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold leading-tight text-slate-900">{business.name}</h4>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {getCategoryById(business.categoryId)?.name || business.categoryId}
                      {business.subcategoryId && ` / ${getSubcategoryById(business.subcategoryId)?.name || business.subcategoryId}`}
                    </span>
                    {onUpdateBusiness && (
                      <>
                        <select
                          value={business.categoryId}
                          onChange={(event) => {
                            const nextCategory = event.target.value;
                            onUpdateBusiness({
                              ...business,
                              categoryId: nextCategory,
                              subcategoryId: resolveDefaultSubcategoryId(nextCategory),
                            });
                          }}
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                          title="Change listing category"
                        >
                          {BUSINESS_CATEGORIES.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={business.subcategoryId}
                          onChange={(event) => onUpdateBusiness({ ...business, subcategoryId: event.target.value })}
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                          title="Change listing subcategory"
                        >
                          {getSubcategoriesForCategory(business.categoryId).map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    {locality && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800">
                        Locality target: {locality.name}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-xs italic text-slate-600">{business.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {business.areasOfOperation?.map((areaId) => {
                      const area = MASTER_AREAS.find((entry) => entry.id === areaId);
                      return (
                        <span key={areaId} className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                          Area: {area ? area.name : areaId}
                        </span>
                      );
                    })}
                    {business.gpsCoordinates && (
                      <span className="rounded border border-sky-100 bg-sky-50 px-2 py-0.5 font-mono text-[10px] text-sky-700">
                        GPS: {business.gpsCoordinates.lat}, {business.gpsCoordinates.lng}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-lg border border-slate-200/50 bg-slate-100/40 p-2.5 pt-2 text-xs font-mono text-slate-500 md:grid-cols-2 lg:grid-cols-3">
                    <div className="truncate">{business.phone || 'Not provided'}</div>
                    <div className="truncate">{business.email || 'No Email Specified'}</div>
                    <div className="truncate text-blue-600">
                      {business.website ? (
                        <a href={business.website} hrefLang="en" target="_blank" rel="noreferrer">
                          {business.website}
                        </a>
                      ) : (
                        'No Website'
                      )}
                    </div>
                    <div className="col-span-full mt-1 font-sans text-slate-600">Address: {business.address}</div>
                    <div className="col-span-full mt-2.5 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Hours Adjustment:</span>
                      <input
                        type="text"
                        value={editedHrs[business.id] !== undefined ? editedHrs[business.id] : business.hours || '10:00 AM - 08:30 PM'}
                        onChange={(event) => onHoursChange(business.id, event.target.value)}
                        className="w-44 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-sans focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                      />
                    </div>
                    {business.ownerName && (
                      <div className="col-span-full mt-0.5 font-sans italic text-slate-700">
                        Applicant Proprietor: {business.ownerName}
                      </div>
                    )}
                  </div>

                  {isRejecting ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-red-100 bg-red-50 p-3">
                      <label className="block text-xs font-semibold text-slate-700">Specify Rejection Reason:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={rejectionReasons[business.id] || ''}
                          onChange={(event) => onRejectReasonChange(business.id, event.target.value)}
                          placeholder="e.g. Missing license documentation, incorrect address or invalid category"
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onReject(business.id, rejectionReasons[business.id] || 'Rejected after auditing review guidelines.');
                            onToggleRejectActive(business.id, false);
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleRejectActive(business.id, false)}
                          className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border-t border-slate-200/60 pt-2">
                      <button
                        type="button"
                        onClick={() => onApprove(business.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleRejectActive(business.id, true)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
