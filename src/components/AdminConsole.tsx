import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Plus, Info, Globe, AlertCircle, 
  Trash2, PlusCircle, Check, Database, Eye, Server, RefreshCw, MapPin
} from 'lucide-react';
import { Locality, Business, SubdomainMapping, UserSession, AuditEvent } from '../types';
import { MASTER_AREAS } from '../data';

interface AdminConsoleProps {
  localities: Locality[];
  businesses: Business[];
  subdomains: SubdomainMapping[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onCreateLocality: (name: string, subdomain: string, description: string, image: string) => void;
  onDeleteLocality: (id: string) => void;
  onUpdateBusiness?: (b: Business) => void;
  userSession?: UserSession;
  auditLogs?: AuditEvent[];
  
  // Customizable Pincode Routing Props
  pincodeMappings?: Array<{ pincode: string; localityId: string }>;
  onAddPincodeMapping?: (pincode: string, localityId: string) => void;
  onDeletePincodeMapping?: (pincode: string) => void;
  defaultLocalityId?: string;
  onChangeDefaultLocalityId?: (localityId: string) => void;
  onBulkImportBusinesses?: (rows: Array<{
    businessName: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pin: string;
    mobile: string;
    rating: string;
    reviews: string;
    services: string;
    latitude: string;
    longitude: string;
  }>) => { imported: number; skipped: number };
}

export default function AdminConsole({
  localities,
  businesses,
  subdomains,
  onApprove,
  onReject,
  onCreateLocality,
  onDeleteLocality,
  onUpdateBusiness,
  userSession,
  auditLogs = [],
  
  pincodeMappings = [],
  onAddPincodeMapping,
  onDeletePincodeMapping,
  defaultLocalityId = 'roadpali',
  onChangeDefaultLocalityId,
  onBulkImportBusinesses
}: AdminConsoleProps) {
  // Internal infrastructure controls are hidden from public-facing admin UI.
  const showInternalTopology = false;
  const [newLocName, setNewLocName] = useState('');
  const [newLocSubdomain, setNewLocSubdomain] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocImg, setNewLocImg] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectionActive, setRejectionActive] = useState<Record<string, boolean>>({});
  const [adminNotification, setAdminNotification] = useState<string | null>(null);
  const [editedHrs, setEditedHrs] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<string>('');

  const parseCsvLine = (line: string) => {
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.trim().replace(/^"|"$/g, ''));
  };

  const handleCsvImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setImportResult('CSV appears empty or missing rows.');
      return;
    }
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const get = (name: string) => {
        const idx = headers.indexOf(name.toLowerCase());
        return idx >= 0 ? (cols[idx] || '') : '';
      };
      return {
        businessName: get('Business Name'),
        address: get('Address'),
        area: get('Area'),
        city: get('City'),
        state: get('State'),
        pin: get('PIN'),
        mobile: get('Mobile'),
        rating: get('Rating'),
        reviews: get('Reviews'),
        services: get('Services'),
        latitude: get('Latitude'),
        longitude: get('Longitude'),
      };
    }).filter((r) => r.businessName.trim());

    if (!onBulkImportBusinesses) {
      setImportResult('Bulk import callback is not configured.');
      return;
    }
    const result = onBulkImportBusinesses(rows);
    setImportResult(`Imported ${result.imported} businesses, skipped ${result.skipped} duplicates/invalid rows.`);
  };

  const pendingBusinesses = businesses.filter(b => b.status === 'pending');
  const activeBusinesses = businesses.filter(b => b.status === 'approved');
  const rejectedBusinesses = businesses.filter(b => b.status === 'rejected');

  const triggerNotification = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => setAdminNotification(null), 3000);
  };

  const handleLocalitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocSubdomain) {
      triggerNotification("Please fill in Name and Subdomain!");
      return;
    }
    
    // Clean subdomain format
    let cleanSub = newLocSubdomain.toLowerCase().trim();
    if (!cleanSub.includes('.')) {
      cleanSub = `${cleanSub}.yellowpages.io`;
    }

    const defaultImg = newLocImg.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80';

    onCreateLocality(newLocName, cleanSub, newLocDesc || 'Dynamic regional yellow pages listings catalog.', defaultImg);
    triggerNotification(`Successfully spun up locality: ${newLocName}`);
    setNewLocName('');
    setNewLocSubdomain('');
    setNewLocDesc('');
    setNewLocImg('');
  };

  return (
    <div id="admin-console-root" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Moderation Module */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Intake Moderation Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted business requests from local proprietors. Real-time verification simulator.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
              {pendingBusinesses.length} Pending Approval
            </span>
          </div>

          {pendingBusinesses.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-700">All applications processed!</p>
              <p className="text-xs text-slate-400 mt-1">No new local businesses waiting in the moderation queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBusinesses.map((biz) => {
                const locality = localities.find(l => l.id === biz.localityId);
                const isRejecting = rejectionActive[biz.id];

                return (
                  <div key={biz.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row tracking-tight gap-4">
                    <img 
                      src={biz.imageUrl} 
                      alt={biz.name}
                      onError={(e)=>{
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80';
                      }}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0 self-start md:self-center"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{biz.name}</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {biz.categoryId.toUpperCase()}
                        </span>
                        {locality && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-medium">
                            📌 Locality target: {locality.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        {biz.description}
                      </p>

                      {/* Display geographical operational areas & coordinates */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {biz.areasOfOperation && biz.areasOfOperation.map(aid => {
                          const area = MASTER_AREAS.find(a => a.id === aid);
                          return (
                            <span key={aid} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              🏠 Area: {area ? area.name : aid}
                            </span>
                          );
                        })}
                        {biz.gpsCoordinates && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100 font-mono">
                            📡 GPS: {biz.gpsCoordinates.lat}, {biz.gpsCoordinates.lng}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono text-slate-500 pt-2 bg-slate-100/40 p-2.5 rounded-lg border border-slate-200/50">
                        <div className="truncate">📞 {biz.phone}</div>
                        <div className="truncate">
                          ✉️ {biz.email ? biz.email : <span className="text-slate-400 italic">No Email Specified</span>}
                        </div>
                        <div className="truncate text-blue-600 font-sans hover:underline">
                          🔗 <a href={biz.website} hrefLang="en" target="_blank" rel="noreferrer">{biz.website}</a>
                        </div>
                        <div className="col-span-full font-sans text-slate-600 mt-1">
                          📍 Address: {biz.address}
                        </div>
                        
                        {/* Interactive edit trigger context */}
                        <div className="col-span-full mt-2.5 flex items-center gap-2">
                          <span className="font-sans text-[11px] text-slate-400">Hours Adjustment:</span>
                          <input
                            type="text"
                            value={editedHrs[biz.id] !== undefined ? editedHrs[biz.id] : biz.hours || '10:00 AM - 08:30 PM'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedHrs(prev => ({ ...prev, [biz.id]: val }));
                              if (onUpdateBusiness) {
                                onUpdateBusiness({ ...biz, hours: val });
                              }
                            }}
                            className="bg-white border border-slate-300 rounded text-[11px] px-2 py-0.5 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                          />
                        </div>

                        {biz.ownerName && (
                          <div className="col-span-full font-sans text-slate-700 italic mt-0.5">
                            👤 Applicant Proprietor: {biz.ownerName}
                          </div>
                        )}
                      </div>

                      {isRejecting && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                          <label className="block text-xs font-semibold text-slate-700">Specify Rejection Reason:</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={rejectionReasons[biz.id] || ''}
                              onChange={(e) => setRejectionReasons({ ...rejectionReasons, [biz.id]: e.target.value })}
                              placeholder="e.g. Missing license documentation, incorrect address or invalid category"
                              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <button
                              onClick={() => {
                                onReject(biz.id, rejectionReasons[biz.id] || 'Rejected after auditing review guidelines.');
                                setRejectionActive({ ...rejectionActive, [biz.id]: false });
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs px-3 py-1.5 rounded-lg font-bold"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              onClick={() => setRejectionActive({ ...rejectionActive, [biz.id]: false })}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-xs px-3 py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!isRejecting && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            onClick={() => onApprove(biz.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Entry
                          </button>
                          <button
                            onClick={() => setRejectionActive({ ...rejectionActive, [biz.id]: true })}
                            className="text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
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

        {/* Audit Log / History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-md font-bold text-slate-950 mb-3 flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-blue-600" />
            Audit Log (Other Listings Status)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                  <th className="py-2">Business</th>
                  <th className="py-2">Subdomain/Region</th>
                  <th className="py-2">Proprietor</th>
                  <th className="py-2">Decision Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBusinesses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-800">{b.name}</td>
                    <td className="py-2.5 font-mono text-slate-600">{(localities.find(l=>l.id===b.localityId))?.subdomain || 'Unknown'}</td>
                    <td className="py-2.5">{b.ownerName || 'Self-Registered'}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Approved
                      </span>
                    </td>
                  </tr>
                ))}
                {rejectedBusinesses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-500 line-through">{b.name}</td>
                    <td className="py-2.5 font-mono text-slate-400">{(localities.find(l=>l.id===b.localityId))?.subdomain || 'Unknown'}</td>
                    <td className="py-2.5">{b.ownerName || 'Unknown'}</td>
                    <td className="py-2.5">
                      <div className="text-red-500 font-semibold flex flex-col">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Rejected
                        </span>
                        <span className="text-[10px] font-sans text-slate-400 max-w-[150px] truncate" title={b.rejectionReason}>
                          {b.rejectionReason}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Audit Logs & Privacy Desk */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                🇮🇳 Compliance &amp; Data Privacy Audit Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Mandatory privacy logs tracking human &amp; AI conversational searches, OTP validated contact unlocks, and listing mutations.
              </p>
            </div>
            <div className="bg-slate-100 text-[10px] font-mono px-3 py-1 rounded-lg text-slate-600 border border-slate-200 uppercase tracking-tight self-start md:self-auto">
              SLA Compliant • GDPR Safeguarded
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No security compliance logs registered in current shard session.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs text-slate-500 border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-550">
                    <th className="p-3">Logged Date/Time</th>
                    <th className="p-3">Actor &amp; Scope</th>
                    <th className="p-3">Audited Action description</th>
                    <th className="p-3">Trace IP Address</th>
                    <th className="p-3">Device Signature Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => {
                    const badgeColor = 
                      log.actionType === 'search' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200/50' 
                        : log.actionType === 'contact_view'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/50';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/35 transition text-[11px] whitespace-nowrap md:whitespace-normal">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block">{log.userName}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border mt-0.5 uppercase tracking-wide font-mono ${badgeColor}`}>
                            {log.actionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <span className="font-bold text-slate-700 block">{log.description}</span>
                          <span className="text-slate-500 text-[10px] leading-relaxed block overflow-hidden text-ellipsis">{log.details}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            {log.ipAddress}
                          </span>
                          <span className="block text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Zone B-West (IN)</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400 max-w-[150px] truncate" title={log.deviceCode}>
                          {log.deviceCode}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CSV Import */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-md font-bold text-slate-950">Bulk Import Businesses (CSV)</h3>
          <p className="text-xs text-slate-500">
            Upload CSV with columns: Business Name, Address, Area, City, State, PIN, Mobile, Rating, Reviews, Services, Latitude, Longitude.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvImport(f);
            }}
            className="w-full text-xs border border-slate-200 rounded-lg p-2"
          />
          {importResult && (
            <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-2">
              {importResult}
            </div>
          )}
        </div>
      </div>

      {/* Domain Mapping Panel and Locality Spinner */}
      <div className="space-y-6">
        {/* Dynamic Mapping and DNS Status */}
        {showInternalTopology && <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              Mapped Subdomains Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify NGINX virtual host headers mapping custom domains to physical PostgreSQL databases.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Active Gateways</span>
              <span className="text-emerald-400 text-[10px] bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 uppercase tracking-wide">
                Nginx Alive
              </span>
            </div>
            {subdomains.map(sub => {
              const loc = localities.find(l => l.id === sub.localityId);
              return (
                <div key={sub.domain} className="space-y-1 py-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      🌐 {sub.domain}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      sub.dnsStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {sub.dnsStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 pl-5 flex items-center justify-between">
                    <span>Database: {loc ? `db_${loc.slug}_yellow` : 'db_unassigned'}</span>
                    <span className="text-indigo-400">SSL Enabled ✔️</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg space-y-1 border border-indigo-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-normal">
              In a full production deploy, these routes dynamically intercept the host header variables inside the <strong>Express Router Request payload</strong> to query records strictly matching the subdomain.
            </p>
          </div>
        </div>}

        {/* Locality Spinner Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950 mb-1 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Create Local Business Region
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Provision database shards and auto-map a subdomain for a new municipality.
          </p>

          {adminNotification && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-2 border border-emerald-100 text-xs transition-all animate-bounce">
              <Check className="w-4 h-4" /> {adminNotification}
            </div>
          )}

          <form onSubmit={handleLocalitySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / City Name</label>
              <input
                type="text"
                required
                value={newLocName}
                onChange={(e) => {
                  setNewLocName(e.target.value);
                  if (!newLocSubdomain) {
                    setNewLocSubdomain(`${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}.yellowpages.io`);
                  }
                }}
                placeholder="e.g. San Francisco"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subdomain Route mapping</label>
              <input
                type="text"
                required
                value={newLocSubdomain}
                onChange={(e) => setNewLocSubdomain(e.target.value)}
                placeholder="e.g. sf.yellowpages.io"
                className="w-full text-xs px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">DNS resolves immediately using mock route handler.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Regional Description</label>
              <textarea
                value={newLocDesc}
                onChange={(e) => setNewLocDesc(e.target.value)}
                rows={2}
                placeholder="Help local searchers understand what they will find here..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City Image (Unsplash URL - optional)</label>
              <input
                type="url"
                value={newLocImg}
                onChange={(e) => setNewLocImg(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Provision Network Domain
            </button>
          </form>
        </div>

        {/* Existing Localities Grid Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
            Localities Databases ({localities.length})
          </h4>
          <div className="space-y-2.5">
            {localities.map(loc => {
              const locCount = businesses.filter(b => b.localityId === loc.id && b.status === "approved").length;
              return (
                <div key={loc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="truncate pr-2">
                    <span className="block text-xs font-bold text-slate-800 truncate">{loc.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono truncate">{loc.subdomain}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
                      {locCount} approved
                    </span>
                    <button
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

        {/* Pincode Routing Master Config Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Pincode Routing Engine
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure 1:1 or many:1 static bindings mapping postal codes to active regional Happy Gifting subdirectories.
            </p>
          </div>

          {/* Form to change current Default fallback locality */}
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70 space-y-1.5">
            <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-tight">Default Fallback Page:</label>
            <select
              value={defaultLocalityId}
              onChange={(e) => onChangeDefaultLocalityId?.(e.target.value)}
              className="w-full bg-white border border-indigo-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer text-indigo-950 font-semibold"
            >
              {localities.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name.split(',')[0]} (Fallback Default)
                </option>
              ))}
            </select>
            <span className="text-[9px] text-indigo-600 block leading-tight">This page opens automatically on first visit when a user enters an unactivated pincode, clicks skip, or views general landing info.</span>
          </div>

          {/* List of current mappings */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Active Mappings ({pincodeMappings.length})</span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {pincodeMappings.map(mapping => {
                const matchedLoc = localities.find(l => l.id === mapping.localityId);
                return (
                  <div key={mapping.pincode} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded-xl font-mono">
                    <span className="font-bold text-slate-800">📪 {mapping.pincode}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[11px] text-slate-600 font-semibold">{matchedLoc?.name.split(',')[0] || mapping.localityId}</span>
                      <button
                        onClick={() => onDeletePincodeMapping?.(mapping.pincode)}
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
                <div className="text-center py-4 text-slate-405 text-xs italic">No postal codes mapped yet.</div>
              )}
            </div>
          </div>

          {/* Form to add a new pairing */}
          <div className="border-t border-slate-200/80 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Custom Entry</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 410210"
                  id="admin-new-pincode"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Open Page</label>
                <select
                  id="admin-new-locality"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-slate-700 cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden"
                >
                  {localities.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name.split(',')[0]}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const pinInput = document.getElementById('admin-new-pincode') as HTMLInputElement;
                const locSelect = document.getElementById('admin-new-locality') as HTMLSelectElement;
                if (!pinInput || !locSelect) return;
                const pin = pinInput.value.replace(/\D/g, '').trim();
                const locId = locSelect.value;
                if (pin.length !== 6) {
                  alert("Please supply a valid 6-digit Indian Pincode code.");
                  return;
                }
                const existing = pincodeMappings.find(m => m.pincode === pin);
                if (existing) {
                  alert(`Pincode ${pin} is already assigned to a directory node. Clear the existing route first!`);
                  return;
                }
                onAddPincodeMapping?.(pin, locId);
                pinInput.value = '';
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-indigo-500/25 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Set Area Binding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
