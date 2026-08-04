import type { ListingAd } from '../../types';

export type AdDeliveryContext = {
  contextKey: string;
  homepageRotationTick: number;
  selectedCategory: string;
  selectedSubcategory: string;
  todayIso: string;
};

export const getAdCtr = (ad: ListingAd) => {
  const impressions = Number(ad.impressions || 0);
  const clicks = Number(ad.clicks || 0);
  if (impressions <= 0 || clicks <= 0) return 0;
  return clicks / impressions;
};

const hashDeliverySeed = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getAdDeliveryScore = (ad: ListingAd, context: AdDeliveryContext) => {
  const ctr = getAdCtr(ad);
  const impressions = Number(ad.impressions || 0);
  const clicks = Number(ad.clicks || 0);
  const leads = Number(ad.leadCount || 0);
  const plannedBudget = Number(ad.plannedBudget || 0);
  const spentBudget = Number(ad.spentBudget || 0);
  const budgetRemainingRatio = plannedBudget > 0 ? Math.max(0, (plannedBudget - spentBudget) / plannedBudget) : 1;
  const placementKey = ad.placementKey || '';
  const categoryIds = ad.categoryIds || [];
  const tagText = (ad.tags || []).join(' ').toLowerCase();

  let score = 0;
  if (ad.workflowStatus === 'live') score += 40;
  else if (ad.workflowStatus === 'approved') score += 28;
  else if (ad.workflowStatus === 'scheduled') score += 20;
  else if (ad.workflowStatus === 'paused') score -= 40;

  if (placementKey.includes(context.contextKey)) score += 18;
  else if (context.contextKey.startsWith('homepage') && placementKey.includes('homepage')) score += 10;
  else if (context.contextKey.includes('listing') && placementKey.includes('listing')) score += 10;

  if (context.selectedCategory !== 'all' && categoryIds.includes(context.selectedCategory)) score += 18;
  if (context.selectedSubcategory !== 'all' && tagText.includes(context.selectedSubcategory.replace(/-/g, ' '))) score += 10;

  if (plannedBudget > 0 && spentBudget >= plannedBudget) score -= 140;
  else score += budgetRemainingRatio * 22;

  if (ad.billingModel === 'cpc') score += Number(ad.cpcBid || 0) * 0.9;
  if (ad.billingModel === 'lead') score += leads * 5;

  if ((ad.rotationMode || 'even') === 'weighted') {
    score += ctr * 420;
    score += leads * 9;
    score += Math.max(0, 32 - (impressions / 120));
  } else if ((ad.rotationMode || 'even') === 'random') {
    score += hashDeliverySeed(`${context.homepageRotationTick}:${ad.id}:${context.contextKey}`) % 100;
  } else {
    score += Math.max(0, 40 - (impressions / 80));
    score += Math.max(0, 12 - clicks);
  }

  return score;
};

export const rankAdsForDelivery = (ads: ListingAd[], context: AdDeliveryContext) => (
  ads
    .slice()
    .sort((left, right) => (
      getAdDeliveryScore(right, context) - getAdDeliveryScore(left, context) ||
      Date.parse(right.reviewedAt || right.submittedAt || right.startDate || context.todayIso) - Date.parse(left.reviewedAt || left.submittedAt || left.startDate || context.todayIso) ||
      left.title.localeCompare(right.title)
    ))
);
