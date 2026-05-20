import React, { useState } from 'react';
import { MapPin, Target, Check, Sparkles, Navigation } from 'lucide-react';

interface GoogleLocationPickerProps {
  onLocationGrabbed: (address: string, coords: { lat: number; lng: number }) => void;
  cityName: string;
}

export default function GoogleLocationPicker({ onLocationGrabbed, cityName }: GoogleLocationPickerProps) {
  const [pinpointing, setPinpointing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'searching' | 'done'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const simulateLocationGrab = () => {
    setPinpointing(true);
    setStatus('searching');

    // Simulate coordinates based on selected city name context
    setTimeout(() => {
      let lat = 19.0596;
      let lng = 72.8295; // Bandra Mumbai as default
      let mockAddress = '';

      if (cityName.toLowerCase().includes('bengaluru')) {
        lat = 12.9345;
        lng = 77.6256; // Koramangala
        mockAddress = 'No. 45, Ground Floor, 100 Feet Rd, Koramangala, Bengaluru, Karnataka 560034';
      } else if (cityName.toLowerCase().includes('delhi')) {
        lat = 28.6304;
        lng = 77.2177; // CP
        mockAddress = 'N-12, Radial Road 3, Inner Circle, Connaught Place, New Delhi, Delhi 110001';
      } else {
        mockAddress = 'Sea Breeze Residence, Carter Rd, Bandra West, Mumbai, Maharashtra 400050';
      }

      const point = {
        lat: Number((lat + (Math.random() - 0.5) * 0.005).toFixed(5)),
        lng: Number((lng + (Math.random() - 0.5) * 0.005).toFixed(5))
      };

      setCoords(point);
      setPinpointing(false);
      setStatus('done');
      onLocationGrabbed(mockAddress, point);
    }, 1200);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg border border-blue-200">
            <Navigation className={`w-3.5 h-3.5 ${status === 'searching' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Location assist:</span>
            <span className="text-[11px] font-semibold text-slate-700">Google Maps Geolocator Shield</span>
          </div>
        </div>

        {status === 'done' && (
          <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-200 animate-pulse">
            GPS Locked
          </span>
        )}
      </div>

      <p className="text-[10px] text-slate-500 leading-normal">
        Save time! Click below to simulate grabbing exact GPS parameters and physical address strings from the Google Maps interface.
      </p>

      {status === 'searching' ? (
        <div className="py-2.5 flex items-center justify-center gap-2 bg-indigo-50 border border-dashed border-indigo-200 rounded-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></div>
          <span className="font-mono text-[10px] font-bold text-indigo-800 tracking-tight animate-pulse">
            Querying coordinates for {cityName || 'Active Region Port'}...
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={simulateLocationGrab}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition"
          >
            <Target className="w-3.5 h-3.5" />
            {status === 'done' ? 'Recalibrate GPS Pin' : '📡 Align Coordinates via Google Maps'}
          </button>
          
          {status === 'done' && coords && (
            <div className="bg-slate-900 text-[9px] font-mono p-1.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between flex-1 truncate text-slate-300">
              <span className="truncate">Lat: {coords.lat} | Lng: {coords.lng}</span>
              <Check className="w-3 h-3 text-emerald-400 ml-1.5 flex-shrink-0" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
