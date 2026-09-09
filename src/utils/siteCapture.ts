// When the full-screen arrival banner may be shown again.
//
// Kept out of the component so the rule is testable without a DOM: an
// interstitial that reopens on every page view is the single fastest way to make
// a directory feel hostile, and "it seemed fine when I clicked around" is not
// evidence that the cooldown works.

export const SITE_CAPTURE_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours

const storageKey = (adId: string) => `localisy:site-capture:${adId}`;

/**
 * Reads the last-shown time for one banner.
 *
 * Storage can throw outright — Safari private mode, a browser set to block site
 * data — so every access is guarded. A failure returns 0, which shows the
 * banner: better an extra impression than a crash on first paint.
 */
export const readSiteCaptureSeenAt = (adId: string): number => {
  if (!adId) return 0;
  try {
    const raw = window.localStorage.getItem(storageKey(adId));
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

/** Records that the visitor has now seen it, starting the cooldown. */
export const markSiteCaptureSeen = (adId: string, now = Date.now()): void => {
  if (!adId) return;
  try {
    window.localStorage.setItem(storageKey(adId), String(now));
  } catch {
    // No storage means no cooldown. The banner will show again next visit; that
    // is the acceptable failure, not a thrown error on the public homepage.
  }
};

/** True when the cooldown has elapsed (or never started). */
export const isSiteCaptureDue = (
  seenAt: number,
  now = Date.now(),
  cooldownMs = SITE_CAPTURE_COOLDOWN_MS,
): boolean => {
  if (!seenAt) return true;
  // A clock that has moved backwards (timezone change, manual set) would
  // otherwise lock the banner out for up to eight hours from a future stamp.
  if (seenAt > now) return true;
  return now - seenAt >= cooldownMs;
};

export const isSiteCaptureDueFor = (adId: string, now = Date.now()): boolean => (
  isSiteCaptureDue(readSiteCaptureSeenAt(adId), now)
);
