// The full-screen banner shown once on arrival.
//
// Three deliberate departures from the usual interstitial, all agreed up front:
//
//   - The close control is present from the FIRST FRAME. A delay before the X
//     appears is the specific pattern Google's intrusive-interstitial guidance
//     targets on mobile, and this site lives on local search traffic.
//   - It waits for the "Select your area" modal, so a visitor is never handed
//     two dialogs at once, and the creative can be targeted to the locality they
//     just chose.
//   - The creative is CONTAINED, never cropped. One portrait file serves both
//     desktop and phone, and the advertiser's artwork arrives whole.
//
// It auto-dismisses after 15s of no interaction, and every exit — close, click,
// backdrop, Escape, timeout — starts the same 8-hour cooldown.
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ListingAd } from '../../types';
import { getMediaProxyUrl } from '../../utils/mediaUrl';
import { pickBannerCreative } from '../../utils/bannerCreative';

export const SITE_CAPTURE_AUTO_DISMISS_MS = 15_000;

type SiteCaptureModalProps = {
  ad: ListingAd;
  device: 'desktop' | 'mobile';
  /** Fired for every exit; the caller starts the cooldown. */
  onDismiss: (reason: 'close' | 'backdrop' | 'escape' | 'timeout' | 'click') => void;
  /** Fired when the creative itself is clicked, before the dismiss. */
  onActivate: (ad: ListingAd) => void;
};

export default function SiteCaptureModal({ ad, device, onDismiss, onActivate }: SiteCaptureModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  // The handler is read from a ref inside the timer and the key listener so the
  // 15-second countdown is set up ONCE. With onDismiss in the dependency array a
  // new inline callback on every parent render restarted the timer, and the
  // banner would never have closed on its own.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const image = getMediaProxyUrl(pickBannerCreative(ad, device));

  useEffect(() => {
    closeRef.current?.focus();

    const timer = window.setTimeout(() => dismissRef.current('timeout'), SITE_CAPTURE_AUTO_DISMISS_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissRef.current('escape');
    };
    window.addEventListener('keydown', onKey);

    // Hold the page still underneath. Restored on unmount even if the dismiss
    // path throws, or the site is left scroll-locked.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.title?.trim() || 'Advertisement'}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0D1B2A]/80 p-4 backdrop-blur-[2px]"
      onClick={() => onDismiss('backdrop')}
    >
      <div className="relative max-h-full" onClick={(event) => event.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={() => onDismiss('close')}
          /* Top-left, as specified, and outside the artwork so it never covers
             the advertiser's own corner. */
          className="absolute -left-2 -top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0D1B2A] shadow-lg transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => { onActivate(ad); onDismiss('click'); }}
          className="block overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        >
          <img
            src={image}
            alt={ad.title?.trim() || 'Advertisement'}
            className="block max-h-[86vh] max-w-[92vw] object-contain"
          />
        </button>
      </div>
    </div>
  );
}
