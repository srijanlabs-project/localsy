import React from 'react';
import type { Business, Locality, MarketingCoupon } from '../../types';

type OffersManagerPanelProps = {
  localities: Locality[];
  businesses: Business[];
  approvedBusinesses: Business[];
  coupons: MarketingCoupon[];
  filteredCoupons: MarketingCoupon[];
  couponBusinessId: string;
  couponTitle: string;
  couponCode: string;
  couponDiscount: string;
  couponDescription: string;
  couponLocalityId: string;
  couponPincodes: string;
  couponStartDate: string;
  couponEndDate: string;
  couponEditId: string | null;
  onCouponBusinessIdChange: (value: string) => void;
  onCouponTitleChange: (value: string) => void;
  onCouponCodeChange: (value: string) => void;
  onCouponDiscountChange: (value: string) => void;
  onCouponDescriptionChange: (value: string) => void;
  onCouponLocalityIdChange: (value: string) => void;
  onCouponPincodesChange: (value: string) => void;
  onCouponStartDateChange: (value: string) => void;
  onCouponEndDateChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBeginEdit: (coupon: MarketingCoupon) => void;
  onDelete: (coupon: MarketingCoupon) => void;
};

const isCouponActive = (coupon: MarketingCoupon, todayIso: string) => {
  if (coupon.isActive === false) return false;
  const startDate = coupon.startDate || '';
  const endDate = coupon.endDate || coupon.expiryDate || '';
  if (startDate && startDate > todayIso) return false;
  if (endDate && endDate < todayIso) return false;
  return true;
};

export default function OffersManagerPanel({
  localities,
  businesses,
  approvedBusinesses,
  coupons,
  filteredCoupons,
  couponBusinessId,
  couponTitle,
  couponCode,
  couponDiscount,
  couponDescription,
  couponLocalityId,
  couponPincodes,
  couponStartDate,
  couponEndDate,
  couponEditId,
  onCouponBusinessIdChange,
  onCouponTitleChange,
  onCouponCodeChange,
  onCouponDiscountChange,
  onCouponDescriptionChange,
  onCouponLocalityIdChange,
  onCouponPincodesChange,
  onCouponStartDateChange,
  onCouponEndDateChange,
  onSubmit,
  onBeginEdit,
  onDelete,
}: OffersManagerPanelProps) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const activeCount = filteredCoupons.filter((coupon) => isCouponActive(coupon, todayIso)).length;
  const expiringSoonCount = filteredCoupons.filter((coupon) => {
    const endDate = coupon.endDate || coupon.expiryDate || '';
    if (!endDate || endDate < todayIso) return false;
    const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(todayIso).getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Offers & Deals Manager</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Create locality-targeted promotions and keep advertiser offers fresh across search and listing experiences.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="font-bold text-emerald-800">Active</div>
            <div className="text-lg font-extrabold text-slate-950">{activeCount}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="font-bold text-amber-800">Expiring Soon</div>
            <div className="text-lg font-extrabold text-slate-950">{expiringSoonCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="font-bold text-slate-600">Visible</div>
            <div className="text-lg font-extrabold text-slate-950">{filteredCoupons.length}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
          <select
            value={couponBusinessId}
            onChange={(event) => onCouponBusinessIdChange(event.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Select business</option>
            {approvedBusinesses.map((business) => (
              <option key={business.id} value={business.id}>{business.name}</option>
            ))}
          </select>
          <input
            value={couponTitle}
            onChange={(event) => onCouponTitleChange(event.target.value)}
            placeholder="Offer title"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={couponCode}
              onChange={(event) => onCouponCodeChange(event.target.value)}
              placeholder="Coupon code"
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
            <input
              value={couponDiscount}
              onChange={(event) => onCouponDiscountChange(event.target.value)}
              placeholder="Discount label"
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
          </div>
          <textarea
            value={couponDescription}
            onChange={(event) => onCouponDescriptionChange(event.target.value)}
            placeholder="Offer description"
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={couponLocalityId}
              onChange={(event) => onCouponLocalityIdChange(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>{locality.name}</option>
              ))}
            </select>
            <input
              value={couponPincodes}
              onChange={(event) => onCouponPincodesChange(event.target.value)}
              placeholder="Pincodes"
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={couponStartDate}
              onChange={(event) => onCouponStartDateChange(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
            <input
              type="date"
              value={couponEndDate}
              onChange={(event) => onCouponEndDateChange(event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg">
            {couponEditId ? 'Update Offer' : 'Create Offer'}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Offer Library</div>
              <div className="text-[11px] text-slate-500">{coupons.length} total configured offers</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              {filteredCoupons.length} in scope
            </div>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredCoupons.map((coupon) => {
              const business = businesses.find((candidate) => candidate.id === coupon.businessId);
              const localityName = coupon.localityIds?.[0]
                ? localities.find((locality) => locality.id === coupon.localityIds?.[0])?.name || coupon.localityIds?.[0]
                : 'All localities';
              return (
                <div key={coupon.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{coupon.title || coupon.code}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isCouponActive(coupon, todayIso) ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-slate-100 text-slate-600'}`}>
                          {isCouponActive(coupon, todayIso) ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <span className="mt-1 block text-[10px] text-slate-500">{business?.name || coupon.businessId}</span>
                      <span className="block text-[10px] text-slate-500">{localityName}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {(coupon.startDate || coupon.expiryDate)} - {(coupon.endDate || coupon.expiryDate)}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-600">{coupon.discount} | {coupon.code}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onBeginEdit(coupon)}
                        className="rounded border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold text-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(coupon)}
                        className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {coupons.length === 0 && <div className="text-xs text-slate-400">No offers created yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
