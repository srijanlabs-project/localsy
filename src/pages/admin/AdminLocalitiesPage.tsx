import React, { useState } from 'react';
import { Check, PlusCircle, Trash2 } from 'lucide-react';
import type { Business, Locality } from '../../types';
import { getPublicLocalityUrl } from '../../services/admin/adminConsoleUtils';

type AdminLocalitiesPageProps = {
  localities: Locality[];
  businesses: Business[];
  onCreateLocality: (name: string, subdomain: string, description: string, image: string) => void;
  onDeleteLocality: (id: string) => void;
  onAddPincodeMapping?: (pincode: string, localityId: string) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.10 "Geography: Localities" — Section 9
// build step 3. Ported from AdminConsole.tsx's Geography & Routing > Localities subtab
// (create form + existing-localities grid), unchanged behavior, new location. The legacy
// console's own copy of this tab is left untouched, same low-risk pattern used for step 1/2.
export default function AdminLocalitiesPage({
  localities,
  businesses,
  onCreateLocality,
  onDeleteLocality,
  onAddPincodeMapping,
}: AdminLocalitiesPageProps) {
  const [newLocName, setNewLocName] = useState('');
  const [newLocSubdomain, setNewLocSubdomain] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocImg, setNewLocImg] = useState('');
  const [newLocPincodes, setNewLocPincodes] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLocalitySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newLocName || !newLocSubdomain) {
      notify('Please fill in Name and Subdomain!');
      return;
    }

    let cleanSub = newLocSubdomain.toLowerCase().trim();
    if (!cleanSub.includes('.')) {
      cleanSub = `${cleanSub}.yellowpages.io`;
    }

    const defaultImg = newLocImg.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80';
    const newLocalityId = newLocName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mappedPins = newLocPincodes
      .split(/[\s,]+/)
      .map((pin) => pin.replace(/\D/g, '').trim())
      .filter((pin, index, arr) => pin.length === 6 && arr.indexOf(pin) === index);

    onCreateLocality(newLocName, cleanSub, newLocDesc || 'Dynamic regional yellow pages listings catalog.', defaultImg);
    mappedPins.forEach((pin) => onAddPincodeMapping?.(pin, newLocalityId));
    notify(`Successfully spun up locality: ${newLocName}`);
    setNewLocName('');
    setNewLocSubdomain('');
    setNewLocDesc('');
    setNewLocImg('');
    setNewLocPincodes('');
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Localities</h2>
        <p className="mt-0.5 text-xs text-slate-500">Create and manage Hyper Local business pages and their public routes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950 mb-1 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#1E3A8A]" />
          Create Hyper Local Business Page
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Provision a page, public route, and optional pincode group for a municipality or neighbourhood cluster.
        </p>

        {notification && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-100 text-xs">
            <Check className="w-4 h-4" /> {notification}
          </div>
        )}

        <form onSubmit={handleLocalitySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / City Name</label>
            <input
              type="text"
              required
              value={newLocName}
              onChange={(event) => {
                setNewLocName(event.target.value);
                if (!newLocSubdomain) {
                  setNewLocSubdomain(`${event.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}.yellowpages.io`);
                }
              }}
              placeholder="e.g. San Francisco"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Public Route / legacy domain mapping</label>
            <input
              type="text"
              required
              value={newLocSubdomain}
              onChange={(event) => setNewLocSubdomain(event.target.value)}
              placeholder="e.g. locality.localisy.in or legacy route"
              className="w-full text-xs px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-slate-700"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              This legacy route record maps to the public page; mapped pincodes below decide which visitors are routed here after location detection or pincode selection.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Short Regional Description</label>
            <textarea
              value={newLocDesc}
              onChange={(event) => setNewLocDesc(event.target.value)}
              rows={2}
              placeholder="Help local searchers understand what they will find here..."
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City Image (Unsplash URL - optional)</label>
            <input
              type="url"
              value={newLocImg}
              onChange={(event) => setNewLocImg(event.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mapped Pincodes</label>
            <input
              type="text"
              value={newLocPincodes}
              onChange={(event) => setNewLocPincodes(event.target.value)}
              placeholder="e.g. 400001, 560001"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-slate-700 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Users entering any mapped pincode will open this Hyper Local page. Separate multiple pincodes with commas or spaces.
            </span>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0D1B2A] hover:bg-[#0D1B2A]/90 text-white font-mono text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" /> Provision Network Domain
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
          Localities Databases ({localities.length})
        </h4>
        <div className="space-y-2.5">
          {localities.map((loc) => {
            const locCount = businesses.filter((b) => b.localityId === loc.id && b.status === 'approved').length;
            return (
              <div key={loc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="truncate pr-2">
                  <span className="block text-xs font-bold text-slate-800 truncate">{loc.name}</span>
                  <span className="block text-[10px] text-slate-400 font-mono truncate">{getPublicLocalityUrl(loc)}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
                    {locCount} approved
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteLocality(loc.id)}
                    disabled={localities.length <= 1}
                    title="Decommission locality database"
                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
