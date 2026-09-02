import React, { useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import type { Locality } from '../../types';

type PincodeMapping = { pincode: string; localityId: string };

type AdminPincodeRoutingPageProps = {
  localities: Locality[];
  pincodeMappings?: PincodeMapping[];
  defaultLocalityId?: string;
  onChangeDefaultLocalityId?: (localityId: string) => void;
  onAddPincodeMapping?: (pincode: string, localityId: string) => void;
  onDeletePincodeMapping?: (pincode: string, localityId?: string) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.11 "Geography: Pincode Routing" —
// Section 9 build step 3. Ported from AdminConsole.tsx's Geography & Routing > Pincode
// Routing subtab. One deliberate change from the legacy tab: the "add mapping" form used
// uncontrolled DOM inputs via document.getElementById there; this fresh page uses normal
// React state for the same fields instead — same behavior, no other differences.
export default function AdminPincodeRoutingPage({
  localities,
  pincodeMappings = [],
  defaultLocalityId,
  onChangeDefaultLocalityId,
  onAddPincodeMapping,
  onDeletePincodeMapping,
}: AdminPincodeRoutingPageProps) {
  const [newPincode, setNewPincode] = useState('');
  const [newLocalityId, setNewLocalityId] = useState(localities[0]?.id || '');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleAddMapping = () => {
    const pin = newPincode.replace(/\D/g, '').trim();
    const locId = newLocalityId || localities[0]?.id || '';
    if (pin.length !== 6) {
      setError('Please supply a valid 6-digit Indian Pincode code.');
      setNotice('');
      return;
    }
    const exactDuplicate = pincodeMappings.find((mapping) => mapping.pincode === pin && mapping.localityId === locId);
    if (exactDuplicate) {
      setError(`Pincode ${pin} is already bound to this directory node.`);
      setNotice('');
      return;
    }
    // A pincode can legitimately straddle more than one locality, so a pincode
    // already owned by a DIFFERENT locality is no longer blocked here — it's
    // added as an additional shared destination instead of stealing the
    // binding away from whoever had it first.
    const sharedWith = pincodeMappings.filter((mapping) => mapping.pincode === pin);
    setError('');
    onAddPincodeMapping?.(pin, locId);
    setNewPincode('');
    if (sharedWith.length > 0) {
      const otherNames = sharedWith
        .map((mapping) => localities.find((loc) => loc.id === mapping.localityId)?.name.split(',')[0] || mapping.localityId)
        .join(', ');
      setNotice(`Pincode ${pin} now also routes to this node (shared with ${otherNames}).`);
    } else {
      setNotice('');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Pincode Routing</h2>
        <p className="mt-0.5 text-xs text-slate-500">Maintain pincode-to-locality routing.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1E3A8A]" />
            Pincode Routing Engine
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure static bindings mapping postal codes to active Hyper Local pages. A pincode can route to more than one locality when it genuinely straddles them — visitors will be asked to pick.
          </p>
        </div>

        <div className="bg-[#3B82F6]/5 p-3 rounded-xl border border-[#3B82F6]/20 space-y-1.5">
          <label className="block text-[10px] font-bold text-[#1E3A8A] uppercase tracking-tight">Default Fallback Page:</label>
          <select
            value={defaultLocalityId}
            onChange={(event) => onChangeDefaultLocalityId?.(event.target.value)}
            className="w-full bg-white border border-[#3B82F6]/30 rounded-lg text-xs p-2 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] font-sans cursor-pointer text-[#1E3A8A] font-semibold"
          >
            {localities.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name.split(',')[0]} (Fallback Default)
              </option>
            ))}
          </select>
          <span className="text-[9px] text-[#1E3A8A]/80 block leading-tight">This page opens automatically on first visit when a user enters an unactivated pincode, clicks skip, or views general landing info.</span>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Active Mappings ({pincodeMappings.length})</span>
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {pincodeMappings.map((mapping) => {
              const matchedLoc = localities.find((l) => l.id === mapping.localityId);
              return (
                <div key={`${mapping.pincode}-${mapping.localityId}`} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded-xl font-mono">
                  <span className="font-bold text-slate-800">PIN {mapping.pincode}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[11px] text-slate-600 font-semibold">{matchedLoc?.name.split(',')[0] || mapping.localityId}</span>
                    <button
                      type="button"
                      onClick={() => onDeletePincodeMapping?.(mapping.pincode, mapping.localityId)}
                      className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete this binding mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {pincodeMappings.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-xs italic">No postal codes mapped yet.</div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Custom Entry</span>
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/5 px-3 py-2 text-[11px] font-semibold text-[#1E3A8A]">
              {notice}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Pincode</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 410210"
                value={newPincode}
                onChange={(event) => setNewPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] font-mono text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Open Page</label>
              <select
                value={newLocalityId}
                onChange={(event) => setNewLocalityId(event.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] font-sans text-slate-700 cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden"
              >
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name.split(',')[0]}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddMapping}
            className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-[#3B82F6]/40"
          >
            <MapPin className="h-3.5 w-3.5" /> Add Pincode Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
