import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Locality } from '../types';

interface PincodeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPincode: string | null;
  onSavePincode: (pincode: string | null, matchedLocalityId: string) => void;
  pincodeMappings: Array<{ pincode: string; localityId: string }>;
  localities: Locality[];
  defaultLocalityId: string;
}

type PincodeOption = {
  pincode: string;
  localityIds: string[];
  // Every locality this pincode covers, joined — a shared pincode reads as
  // "Seawoods & Nerul" on one row rather than appearing twice.
  localityLabel: string;
};

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
  const [highlightIndex, setHighlightIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const defaultLocality = localities.find((locality) => locality.id === defaultLocalityId) || localities[0] || null;

  // One entry per pincode, carrying every locality it routes to, so the
  // suggestion list can be searched by digits or by place name.
  const pincodeOptions = useMemo<PincodeOption[]>(() => {
    const byPincode = new Map<string, string[]>();
    pincodeMappings.forEach((mapping) => {
      const pincode = String(mapping.pincode || '').trim();
      if (!pincode) return;
      const existing = byPincode.get(pincode);
      if (existing) existing.push(mapping.localityId);
      else byPincode.set(pincode, [mapping.localityId]);
    });
    return [...byPincode.entries()]
      .map(([pincode, localityIds]) => ({
        pincode,
        localityIds,
        localityLabel: localityIds
          .map((id) => localities.find((locality) => locality.id === id)?.name.split(',')[0]?.trim() || id)
          .filter(Boolean)
          .join(' & '),
      }))
      .sort((left, right) => left.localityLabel.localeCompare(right.localityLabel) || left.pincode.localeCompare(right.pincode));
  }, [localities, pincodeMappings]);

  // Digits match the pincode, letters match the place name.
  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return pincodeOptions.slice(0, 60);
    return pincodeOptions
      .filter((option) => (
        option.pincode.startsWith(query)
        || option.localityLabel.toLowerCase().includes(query)
      ))
      .slice(0, 60);
  }, [inputValue, pincodeOptions]);

  useEffect(() => {
    if (!isOpen) return;
    setInputValue(savedPincode || '');
    setErrorStatus(null);
    setHighlightIndex(0);
  }, [isOpen, savedPincode]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [inputValue]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && savedPincode) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, savedPincode]);

  if (!isOpen) return null;

  const applyOption = (option: PincodeOption) => {
    onSavePincode(option.pincode, option.localityIds.join(','));
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = inputValue.trim();

    // Enter with the list open takes the highlighted row.
    if (suggestions[highlightIndex] && !/^\d{6}$/.test(trimmed)) {
      applyOption(suggestions[highlightIndex]);
      return;
    }

    if (!/^\d{6}$/.test(trimmed)) {
      setErrorStatus('Enter a 6-digit pincode or pick an area from the list.');
      return;
    }

    const exact = pincodeOptions.find((option) => option.pincode === trimmed);
    if (exact) {
      applyOption(exact);
      return;
    }

    // Valid format but not mapped: still let them in, on the default area.
    onSavePincode(trimmed, defaultLocality?.id || defaultLocalityId || localities[0]?.id || '');
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setHighlightIndex((current) => {
      if (suggestions.length === 0) return 0;
      const next = event.key === 'ArrowDown' ? current + 1 : current - 1;
      const bounded = (next + suggestions.length) % suggestions.length;
      listRef.current?.querySelectorAll('[data-option]')[bounded]?.scrollIntoView({ block: 'nearest' });
      return bounded;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/55 p-4 pt-[12vh] backdrop-blur-[2px]">
      <div className="flex max-h-[70vh] w-full max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-indigo-600" />
            <h2 className="truncate text-[14px] font-bold text-slate-900">Select your area</h2>
          </div>
          {savedPincode ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="border-b border-slate-100 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                setErrorStatus(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Pincode or area name"
              autoFocus
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13px] font-semibold text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          {errorStatus ? (
            <p className="mt-2 text-[11.5px] font-medium text-rose-600">{errorStatus}</p>
          ) : null}
        </form>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {suggestions.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-slate-500">
              No area matches that. Enter a 6-digit pincode to continue anyway.
            </p>
          ) : (
            suggestions.map((option, index) => {
              const isActive = index === highlightIndex;
              const isCurrent = savedPincode === option.pincode;
              return (
                <button
                  key={option.pincode}
                  data-option
                  type="button"
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => applyOption(option)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isActive ? 'bg-indigo-50' : 'bg-transparent'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">
                      {option.localityLabel}
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500">{option.pincode}</span>
                  </span>
                  {isCurrent ? (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      Current
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              onSavePincode(null, defaultLocality?.id || defaultLocalityId || localities[0]?.id || '');
              onClose();
            }}
            className="text-[12px] font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
