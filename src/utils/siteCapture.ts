// When the full-screen arrival banner may be shown again.
//
// The cap is SITE-WIDE, not per banner: one takeover per visitor per eight
// hours, whichever banner it happens to be. Keying it per banner meant three
// booked advertisers could produce three separate full-screen takeovers in one
// day for the same person — each one individually "once per 8 hours", together
// an ambush.
//
// Kept out of the component so the rule is testable without a DOM. An
// interstitial that reopens is the fastest way to make a directory feel hostile,
// and "it seemed fine when I clicked around" is not evidence that a cooldown
// works.

export const SITE_CAPTURE_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours

/** One key for the whole site, so every banner shares the same window. */
export const SITE_CAPTURE_STORAGE_KEY = 'localisy:site-capture';

export type SiteCaptureRecord = {
  /** Epoch ms of the last takeover. */
  at: number;
  /** Which banner it was — diagnostic only; it does not affect the cooldown. */
  adId?: string;
};

/**
 * Reads the last takeover.
 *
 * Storage can throw outright — Safari private mode, a browser set to block site
 * data — so every access is guarded. A failure reads as "never shown", which
 * shows the banner: better an extra impression than a crash on first paint.
 */
export const readSiteCapture = (): SiteCaptureRecord => {
  try {
    const raw = window.localStorage.getItem(SITE_CAPTURE_STORAGE_KEY);
    if (!raw) return { at: 0 };
    // Tolerates a bare timestamp as well as the record, so a value written by an
    // older build is honoured rather than being treated as "never shown" and
    // re-opening the banner on everyone who had already dismissed it.
    if (/^\d+$/.test(raw.trim())) return { at: Number(raw) };
    const parsed = JSON.parse(raw) as SiteCaptureRecord;
    const at = Number(parsed?.at);
    return { at: Number.isFinite(at) && at > 0 ? at : 0, adId: parsed?.adId };
  } catch {
    return { at: 0 };
  }
};

/** Records a takeover, starting the site-wide cooldown. */
export const markSiteCaptureSeen = (adId: string, now = Date.now()): void => {
  try {
    window.localStorage.setItem(SITE_CAPTURE_STORAGE_KEY, JSON.stringify({ at: now, adId }));
  } catch {
    // No storage means no cooldown. The banner shows again next visit; that is
    // the acceptable failure, not a thrown error on the public homepage.
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

/** The whole check, for callers that just want a yes or no. */
export const isSiteCaptureDueNow = (now = Date.now()): boolean => (
  isSiteCaptureDue(readSiteCapture().at, now)
);

/**
 * Development override: `?siteCapture=always` reopens the banner on every load.
 *
 * A query parameter rather than a build flag, deliberately. A `VITE_` env var
 * needs a rebuild to toggle, cannot be used to check the live site, and — the
 * real risk — can be left switched on in a production build, where every
 * visitor then gets a takeover on every page load. A parameter is opt-in per
 * URL, works against production, and is inert the moment it is dropped.
 *
 * `?siteCapture=reset` clears the stored window instead, for testing the normal
 * first-visit path without digging into devtools.
 *
 * Pure in its input so it can be tested without a browser.
 */
export const readSiteCaptureOverride = (search: string): 'always' | 'reset' | '' => {
  try {
    const value = new URLSearchParams(search || '').get('siteCapture');
    if (value === 'always') return 'always';
    if (value === 'reset') return 'reset';
    return '';
  } catch {
    return '';
  }
};

export const clearSiteCapture = (): void => {
  try {
    window.localStorage.removeItem(SITE_CAPTURE_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
};

/**
 * Whether the banner should open, taking the override into account.
 *
 * Only the COOLDOWN is bypassed. A banner still has to be booked, targeted and
 * in date — an override that conjured a banner out of nothing would be testing
 * the override rather than the feature.
 */
export const isSiteCaptureDueWithOverride = (
  search: string,
  now = Date.now(),
): boolean => {
  const override = readSiteCaptureOverride(search);
  if (override === 'always') return true;
  if (override === 'reset') clearSiteCapture();
  return isSiteCaptureDueNow(now);
};
