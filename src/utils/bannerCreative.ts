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
};

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
  if (device === 'mobile') {
    if (target === 'mobile') return ad.mobileImageUrl || ad.imageUrl || '';
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
