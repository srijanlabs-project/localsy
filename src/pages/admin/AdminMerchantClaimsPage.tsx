import React, { useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, ShieldQuestion } from 'lucide-react';
import type { Business, Locality } from '../../types';

type AdminMerchantClaimsPageProps = {
  businesses: Business[];
  localities: Locality[];
  onUpdateBusiness?: (business: Business) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.9 "Merchant Claims & Verification" —
// Section 9 build step 6, Phase 2 per the spec's own sequencing note ("timing depends on
// merchant self-service leaving the current simulator"). NET NEW — there is no legacy console
// tab to port and no "claim" concept anywhere in this app's data model (confirmed by searching
// types.ts and DATABASE_SCHEMA.md: no MerchantClaim table/type exists at all).
//
// Per the user's standing instruction for screens like this ("local-state UI, clearly marked"),
// this page is SEMI-REAL, not a full mockup: it reads and writes the three real trust-layer
// fields that already exist on `Business` (`kycStatus`, `verifiedBadge`, `govRegistered`) via
// the real `onUpdateBusiness` callback — approving/rejecting here actually updates the business
// record, same as every other admin action in this app. What is honestly NOT real, and is
// disclosed in the banner below rather than implied: there is no merchant-initiated "claim my
// listing" submission flow anywhere in the product today. This screen surfaces businesses by
// their current trust-layer field values, not a real inbound claims queue — a merchant cannot
// actually trigger an entry to show up here; an admin populates these fields directly.
export default function AdminMerchantClaimsPage({
  businesses,
  localities,
  onUpdateBusiness,
}: AdminMerchantClaimsPageProps) {
  const [localityFilter, setLocalityFilter] = useState<'all' | string>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'none'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const localityNameById = useMemo(() => {
    const map: Record<string, string> = {};
    localities.forEach((locality) => { map[locality.id] = locality.name; });
    return map;
  }, [localities]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const effectiveKyc = business.kycStatus || 'none';
      if (kycFilter !== 'all' && effectiveKyc !== kycFilter) return false;
      if (localityFilter !== 'all' && business.localityId !== localityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const searchable = `${business.name} ${business.ownerName || ''} ${business.phone} ${business.email || ''}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [businesses, kycFilter, localityFilter, searchQuery]);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId]
  );

  const pendingCount = useMemo(() => businesses.filter((b) => (b.kycStatus || 'none') === 'pending').length, [businesses]);

  const handleApprove = (business: Business) => {
    if (!onUpdateBusiness) return;
    onUpdateBusiness({ ...business, kycStatus: 'verified', verifiedBadge: true });
    notify(`Marked "${business.name}" as verified.`);
  };

  const handleReject = (business: Business) => {
    if (!onUpdateBusiness) return;
    onUpdateBusiness({ ...business, kycStatus: 'none', verifiedBadge: false });
    notify(`Reset "${business.name}" to unverified.`);
  };

  const handleToggleGovRegistered = (business: Business) => {
    if (!onUpdateBusiness) return;
    const next = !business.govRegistered;
    onUpdateBusiness({ ...business, govRegistered: next });
    notify(`${next ? 'Marked' : 'Unmarked'} "${business.name}" as government-registered.`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Merchant Claims &amp; Verification</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Review and set trust-layer verification status for businesses in the directory.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">This isn't a real claims inbox yet.</span> There is no merchant-facing "claim
          my listing" flow in the product today, so nothing here was submitted by a merchant — this screen just lets an
          admin set the existing verified-badge / KYC status / government-registered fields directly on a business
          record. The approve/reject/toggle actions below are real (they write straight to the business record via the
          same update path every other admin screen uses); the "claim submission" concept itself is not.
        </p>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs sm:flex-row sm:items-center">
        <div className="flex gap-1">
          {(['pending', 'verified', 'none', 'all'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setKycFilter(status)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold capitalize transition ${
                kycFilter === status ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
              {status === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
        <select
          value={localityFilter}
          onChange={(event) => setLocalityFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          <option value="all">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>{locality.name}</option>
          ))}
        </select>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, owner, phone, or email"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-1 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filteredBusinesses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No businesses match this filter.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Business</th>
                  <th className="px-3 py-2 font-semibold">Locality</th>
                  <th className="px-3 py-2 font-semibold">KYC</th>
                  <th className="px-3 py-2 font-semibold">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBusinesses.map((business) => (
                  <React.Fragment key={business.id}>
                    <tr
                      onClick={() => setSelectedBusinessId(business.id)}
                      className={`cursor-pointer align-top hover:bg-slate-50 ${selectedBusinessId === business.id ? 'bg-[#3B82F6]/5' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{business.name}</div>
                        <div className="text-[10px] text-slate-400">{business.ownerName || 'No owner on file'}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{localityNameById[business.localityId] || business.localityId}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          (business.kycStatus || 'none') === 'verified'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                            : (business.kycStatus || 'none') === 'pending'
                              ? 'border-amber-200 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}>
                          {business.kycStatus || 'none'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {business.verifiedBadge ? (
                          <BadgeCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ShieldQuestion className="h-4 w-4 text-slate-300" />
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {!selectedBusiness ? (
            <p className="text-xs text-slate-400">Select a business from the list to review and update its verification status.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedBusiness.name}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{selectedBusiness.address}</p>
              </div>
              <dl className="space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Owner</dt>
                  <dd className="font-medium text-slate-700">{selectedBusiness.ownerName || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Phone</dt>
                  <dd className="font-medium text-slate-700">{selectedBusiness.phone}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Email</dt>
                  <dd className="font-medium text-slate-700">{selectedBusiness.email || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Gov. registered</dt>
                  <dd className="font-medium text-slate-700">{selectedBusiness.govRegistered ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleApprove(selectedBusiness)}
                  disabled={!onUpdateBusiness}
                  className="rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Approve &amp; mark verified
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(selectedBusiness)}
                  disabled={!onUpdateBusiness}
                  className="rounded-lg border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reject / reset to unverified
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGovRegistered(selectedBusiness)}
                  disabled={!onUpdateBusiness}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {selectedBusiness.govRegistered ? 'Unmark' : 'Mark'} government-registered
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
