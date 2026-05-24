import React, { useState, useEffect } from 'react';
import { MapPin, Search, Check, Sparkles, AlertCircle, X, HelpCircle, ArrowRight } from 'lucide-react';
import { Locality } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PincodeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPincode: string | null;
  onSavePincode: (pincode: string | null, matchedLocalityId: string) => void;
  pincodeMappings: Array<{ pincode: string; localityId: string }>;
  localities: Locality[];
  defaultLocalityId: string;
}

export default function PincodeSelectionModal({
  isOpen,
  onClose,
  savedPincode,
  onSavePincode,
  pincodeMappings,
  localities,
  defaultLocalityId,
}: PincodeSelectionModalProps) {
  const [inputValue, setInputValue] = useState(savedPincode || '');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [matchedLocality, setMatchedLocality] = useState<Locality | null>(null);

  const defaultLocality = localities.find(l => l.id === defaultLocalityId) || localities[0];

  useEffect(() => {
    if (isOpen) {
      setInputValue(savedPincode || '');
      setErrorStatus(null);
    }
  }, [isOpen, savedPincode]);

  // Live matching verification as user types
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length === 6) {
      const match = pincodeMappings.find(m => m.pincode === trimmed);
      if (match) {
        const loc = localities.find(l => l.id === match.localityId);
        if (loc) {
          setMatchedLocality(loc);
          setErrorStatus(null);
          return;
        }
      }
      setMatchedLocality(null);
      setErrorStatus("Pincode correct format but not currently mapped in directory nodes.");
    } else {
      setMatchedLocality(null);
      setErrorStatus(null);
    }
  }, [inputValue, pincodeMappings, localities]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    
    if (!trimmed) {
      setErrorStatus("Please enter a valid pincode.");
      return;
    }

    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setErrorStatus("Indian pincodes must be exactly 6 numeric digits.");
      return;
    }

    const mapping = pincodeMappings.find(m => m.pincode === trimmed);
    if (mapping) {
      onSavePincode(trimmed, mapping.localityId);
      onClose();
    } else {
      // Pincode is valid 6 digits but not mapped
      onSavePincode(trimmed, defaultLocalityId);
      onClose();
    }
  };

  const handleSkip = () => {
    onSavePincode(null, (matchedLocality || defaultLocality).id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Ribbon containing brand aesthetics */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md text-amber-300">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 font-mono">
                Location-Based Yellow Pages Routing
              </span>
              <h2 className="text-xl font-extrabold tracking-tight leading-tight">
                Enter Delivery & Services Pincode
              </h2>
            </div>
          </div>
          {savedPincode && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/15 p-1.5 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal content body */}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto max-h-[75vh]">
          <p className="text-sm text-slate-500 leading-relaxed">
            Welcome to <strong className="text-slate-900 font-semibold">Happy Gifting Yellow Pages Nodes</strong>. Please share your 6-digit residential area pincode to automatically connect with localized shopkeepers, clinics, restaurants, and salons operating in your municipal sector.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                <span>Enter 6-Digit Pincode</span>
                <span className="font-mono text-[10px] text-slate-400 capitalize">Navi Mumbai Regional Node</span>
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 410210"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:ring-0 rounded-2xl py-4 pl-12 pr-4 font-mono text-lg font-bold text-slate-800 placeholder-slate-400 select-all transition-all"
                  autoFocus
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Error notifications */}
            {errorStatus && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 text-rose-700 text-xs text-left animate-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">{errorStatus}</strong>
                  <p className="mt-0.5 text-rose-600 leading-normal">
                    You can still submit to browse the directory, and we will place you on the default hub: <span className="font-bold">{defaultLocality.name.split(',')[0]}</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Success matches */}
            {matchedLocality && (
              <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-4 flex gap-3 text-emerald-800 text-xs text-left animate-in slide-in-from-top-1 duration-150 shadow-xs">
                <div className="bg-emerald-500 text-white p-1 rounded-full shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-emerald-600">
                    Locality Mapped Successfully!
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {matchedLocality.name}
                  </h4>
                  <p className="text-slate-600 mt-1 leading-normal">
                    {matchedLocality.description}
                  </p>
                  <span className="inline-block mt-2 font-mono font-bold bg-white text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Host: {matchedLocality.subdomain}
                  </span>
                </div>
              </div>
            )}

            {/* Master guides list */}
            <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Quick Guide: Supported Pincodes
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { pincode: '410101', label: 'Kalamboli Node' },
                  { pincode: '410218', label: 'Roadpali & Kalamboli' },
                  { pincode: '410210', label: 'Kharghar Node' },
                  { pincode: '410209', label: 'Kamothe Node' },
                  { pincode: '410206', label: 'Panvel (Sector Hub)' },
                  { pincode: '410221', label: 'Panvel (New Sectors)' },
                  { pincode: '410208', label: 'Taloja Phase 1 & 2' },
                ].map(item => (
                  <button
                    key={item.pincode}
                    type="button"
                    onClick={() => {
                      setInputValue(item.pincode);
                      setErrorStatus(null);
                    }}
                    className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      inputValue === item.pincode
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                      : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-700'
                    }`}
                  >
                    <div>
                      <strong className="block font-mono font-bold tracking-tight text-xs leading-none">
                        {item.pincode}
                      </strong>
                      <span className={`text-[9px] mt-0.5 block leading-none ${inputValue === item.pincode ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 opacity-50 ${inputValue === item.pincode ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm py-3 px-5 rounded-2xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                Submit & Open Portal
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 px-5 rounded-2xl cursor-pointer transition"
              >
                Skip ({(matchedLocality || defaultLocality).name.split(',')[0]})
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
