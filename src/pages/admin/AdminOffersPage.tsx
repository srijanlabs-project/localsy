import React, { useState } from 'react';
import type { Business, Locality, MarketingCoupon } from '../../types';
import { parsePincodeList } from '../../services/admin/adminConsoleUtils';
import OffersManagerPanel from '../../components/admin/OffersManagerPanel';

type AdminOffersPageProps = {
  localities: Locality[];
  businesses: Business[];
  coupons?: MarketingCoupon[];
  onAddCoupon?: (coupon: Omit<MarketingCoupon, 'id' | 'usageCount'>) => void;
  onUpdateCoupon?: (coupon: MarketingCoupon) => Promise<unknown> | void;
  onDeleteCoupon?: (couponId: string) => Promise<unknown> | void;
};

// Routed home for admin-backend-ux-spec.md Section 5.19 "Campaigns: Offers"
// ("Offers & Deals Manager"). Reuses the existing, fully-controlled
// `OffersManagerPanel` presentational component unchanged and the existing
// `AdminConsoleProps` coupon callback props unchanged. Local state/handlers
// ported verbatim from `src/components/AdminConsole.tsx`:
//   - lines 392-401: the 9 `couponXxx` useState hooks
//   - lines 750-761: `resetCouponForm`
//   - lines 763-774: `beginEditCoupon`
//   - lines 1866-1903: `handleCreateCouponSubmit`
// The legacy Campaigns > Offers tab in AdminConsole.tsx is left completely
// untouched.
//
// Deliberate deviation: the legacy `filteredCoupons` derivation (lines
// 1208-1218) filters against the console's SHARED cross-cutting filter bar
// state (`adminLocalityFilter` / `adminCategoryFilter` / `adminSearchQuery`).
// This page has no shared filter bar, so it owns a small local filter scoped
// just to this screen (`offersLocalityFilter` + `offersSearchQuery`), applying
// the same filter logic shape against local state instead. The legacy
// category filter is dropped along with it since there is no local category
// filter control on this screen.
export default function AdminOffersPage({
  localities,
  businesses,
  coupons = [],
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
}: AdminOffersPageProps) {
  const primaryLocalityId = localities[0]?.id || '';

  const [couponBusinessId, setCouponBusinessId] = useState('');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponStartDate, setCouponStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [couponEndDate, setCouponEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [couponLocalityId, setCouponLocalityId] = useState(primaryLocalityId);
  const [couponPincodes, setCouponPincodes] = useState('');
  const [couponEditId, setCouponEditId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [offersLocalityFilter, setOffersLocalityFilter] = useState<'all' | string>('all');
  const [offersSearchQuery, setOffersSearchQuery] = useState('');

  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const resetCouponForm = () => {
    setCouponBusinessId('');
    setCouponTitle('');
    setCouponCode('');
    setCouponDiscount('');
    setCouponDescription('');
    setCouponStartDate(new Date().toISOString().slice(0, 10));
    setCouponEndDate(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
    setCouponLocalityId(primaryLocalityId);
    setCouponPincodes('');
    setCouponEditId(null);
  };

  const beginEditCoupon = (coupon: MarketingCoupon) => {
    setCouponEditId(coupon.id);
    setCouponBusinessId(coupon.businessId);
    setCouponTitle(coupon.title || '');
    setCouponCode(coupon.code);
    setCouponDiscount(coupon.discount);
    setCouponDescription(coupon.description);
    setCouponStartDate(coupon.startDate || new Date().toISOString().slice(0, 10));
    setCouponEndDate(coupon.endDate || coupon.expiryDate || new Date().toISOString().slice(0, 10));
    setCouponLocalityId(coupon.localityIds?.[0] || primaryLocalityId);
    setCouponPincodes((coupon.pincodes || []).join(', '));
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponBusinessId || !couponTitle.trim() || !couponCode.trim() || !couponDiscount.trim() || !couponDescription.trim()) {
      triggerNotification('Please fill offer business, title, code, discount, and description.');
      return;
    }

    const couponPayload = {
      businessId: couponBusinessId,
      title: couponTitle.trim(),
      code: couponCode.trim(),
      discount: couponDiscount.trim(),
      description: couponDescription.trim(),
      startDate: couponStartDate,
      expiryDate: couponEndDate,
      endDate: couponEndDate,
      isActive: true,
      localityIds: couponLocalityId ? [couponLocalityId] : [],
      pincodes: parsePincodeList(couponPincodes),
      badgeText: couponDiscount.trim(),
      ctaText: 'Claim Offer',
      targetBusinessId: couponBusinessId
    };

    if (couponEditId) {
      onUpdateCoupon?.({
        ...couponPayload,
        id: couponEditId,
        usageCount: coupons.find((coupon) => coupon.id === couponEditId)?.usageCount || 0,
      });
      triggerNotification('Offer updated successfully.');
    } else {
      onAddCoupon?.(couponPayload);
      triggerNotification('Offer created successfully.');
    }

    resetCouponForm();
  };

  const handleDeleteCoupon = (coupon: MarketingCoupon) => {
    onDeleteCoupon?.(coupon.id);
    if (couponEditId === coupon.id) {
      resetCouponForm();
    }
    triggerNotification('Offer deleted successfully.');
  };

  // Local-only filter scoped to this screen (see header comment for why this
  // differs from the legacy shared filter bar).
  const filteredCoupons = coupons.filter((coupon) => {
    const business = businesses.find((entry) => entry.id === coupon.businessId);
    if (offersLocalityFilter !== 'all' && !(coupon.localityIds || []).includes(offersLocalityFilter) && business?.localityId !== offersLocalityFilter) return false;
    if (offersSearchQuery.trim()) {
      const query = offersSearchQuery.trim().toLowerCase();
      const searchable = `${coupon.title || ''} ${coupon.code} ${coupon.description} ${business?.name || ''}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  const approvedBusinesses = businesses.filter((business) => business.status === 'approved');

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Offers</h2>
        <p className="mt-0.5 text-xs text-slate-500">Create and manage locality-targeted promotions and advertiser offers.</p>
      </div>
      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:flex-row sm:items-center">
        <select
          value={offersLocalityFilter}
          onChange={(event) => setOffersLocalityFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <option value="all">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>{locality.name}</option>
          ))}
        </select>
        <input
          value={offersSearchQuery}
          onChange={(event) => setOffersSearchQuery(event.target.value)}
          placeholder="Search offers by title, code, description, or business"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-1"
        />
      </div>

      <OffersManagerPanel
        localities={localities}
        businesses={businesses}
        approvedBusinesses={approvedBusinesses}
        coupons={coupons}
        filteredCoupons={filteredCoupons}
        couponBusinessId={couponBusinessId}
        couponTitle={couponTitle}
        couponCode={couponCode}
        couponDiscount={couponDiscount}
        couponDescription={couponDescription}
        couponLocalityId={couponLocalityId}
        couponPincodes={couponPincodes}
        couponStartDate={couponStartDate}
        couponEndDate={couponEndDate}
        couponEditId={couponEditId}
        onCouponBusinessIdChange={setCouponBusinessId}
        onCouponTitleChange={setCouponTitle}
        onCouponCodeChange={setCouponCode}
        onCouponDiscountChange={setCouponDiscount}
        onCouponDescriptionChange={setCouponDescription}
        onCouponLocalityIdChange={setCouponLocalityId}
        onCouponPincodesChange={setCouponPincodes}
        onCouponStartDateChange={setCouponStartDate}
        onCouponEndDateChange={setCouponEndDate}
        onSubmit={handleCreateCouponSubmit}
        onBeginEdit={beginEditCoupon}
        onDelete={handleDeleteCoupon}
      />
    </div>
  );
}
