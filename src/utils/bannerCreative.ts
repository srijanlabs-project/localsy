// Which of a banner's two creatives to draw, and whether it may run at all.
//
// One booking can render in two very different boxes: `homepage_hero_primary` is
// 1000x360 on desktop and 358x198 on a phone, and the landing page filters that
// same placement key per device. With a single image the phone showed a
// centre-crop of a landscape creative — the left and right thirds gone, usually
// including the logo.
//
// The rule: a banner targeting BOTH devices needs a creative for each. If the
// mobile one is missing it runs on desktop only, rather than running on mobile
// with the wrong artwork. A cropped banner is worse than no banner — it goes out
// under an advertiser's name.

type BannerCreativeSource = {
  imageUrl?: string;
  mobileImageUrl?: string;
  deviceTarget?: 'all' | 'desktop' | 'mobile';
  placementKey?: string;
};

/**
 * Placements where ONE creative genuinely serves both devices.
 *
 * The dual-creative rule exists because most slots have two different boxes — a
 * 1000x360 hero and a 358x198 one — and a single image can only fit one of them.
 * The arrival interstitial is different: it is CONTAINED rather than cropped, so
 * a portrait file is shown whole on a phone and whole on a desktop. Demanding a
 * second upload there would be asking for a file that is never used, and worse,
 * silently withholding the banner from mobile until it arrived.
 */
const SINGLE_CREATIVE_PLACEMENTS = new Set(['site_interstitial']);

/**
 * The creative for this device, or '' when there is none.
 *
 * No cross-device fallback when the banner targets both: returning the desktop
 * image for a phone is exactly the crop this exists to prevent. A MOBILE-ONLY
 * banner is different — its single upload lands in `imageUrl`, because the form
 * only offers the second field when both devices are targeted — so there the
 * desktop field IS the mobile creative.
 */
export const pickBannerCreative = (
  ad: BannerCreativeSource | null | undefined,
  device: 'desktop' | 'mobile',
): string => {
  if (!ad) return '';
  const target = ad.deviceTarget || 'all';
  const singleCreative = SINGLE_CREATIVE_PLACEMENTS.has(String(ad.placementKey || ''));
  if (device === 'mobile') {
    if (target === 'mobile' || singleCreative) return ad.mobileImageUrl || ad.imageUrl || '';
    return ad.mobileImageUrl || '';
  }
  return ad.imageUrl || '';
};

/**
 * Whether this banner may render on this device.
 *
 * Three reasons it may not: the device target excludes it, or it targets both
 * devices and the creative for this one was never uploaded.
 *
 * A banner with NO image at all is drawn from its text — the house ad — and is
 * unaffected.
 */
export const canDeliverOnDevice = (
  ad: BannerCreativeSource | null | undefined,
  device: 'desktop' | 'mobile',
): boolean => {
  if (!ad) return false;
  const target = ad.deviceTarget || 'all';
  if (device === 'mobile' && target === 'desktop') return false;
  if (device === 'desktop' && target === 'mobile') return false;

  const hasAnyCreative = Boolean(ad.imageUrl || ad.mobileImageUrl);
  if (!hasAnyCreative) return true;

  return Boolean(pickBannerCreative(ad, device));
};

/**
 * Whether a card background needs light text on it.
 *
 * Rail cards used to decide this from their POSITION in the list —
 * `isDark = index === 1 || backgroundColor === '#064e3b'` — so any card with a
 * dark background anywhere other than slot two got near-black text on it. The
 * house ad is navy and sits first, which rendered "Add your business" in dark
 * indigo on dark navy: present, clickable, and unreadable.
 *
 * Rec. 709 relative luminance, thresholded where the two text colours cross over
 * in practice. An unparseable or missing colour is treated as light, matching the
 * pale default the cards fall back to.
 */
export const needsLightText = (backgroundColor?: string): boolean => {
  const hex = String(backgroundColor || '').trim().replace('#', '');
  const full = hex.length === 3
    ? hex.split('').map((c) => c + c).join('')
    : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140;
};
