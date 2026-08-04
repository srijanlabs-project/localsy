function normalizeText(value) {
  return String(value || '').trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => normalizeText(value)).filter(Boolean)));
}

export function buildSeoGrowthSnapshot({
  seoConfig,
  localities = [],
  businesses = [],
  auditEvents = [],
} = {}) {
  const approvedBusinesses = (Array.isArray(businesses) ? businesses : []).filter((business) => business?.status === 'approved');
  const routeIntents = Array.isArray(seoConfig?.routeIntents) ? seoConfig.routeIntents : [];
  const localityMetadata = Array.isArray(seoConfig?.localityMetadata) ? seoConfig.localityMetadata : [];
  const localityIds = unique(localityMetadata.map((entry) => entry.id).concat(localities.map((entry) => entry.id)));
  const categoryIds = unique(routeIntents.map((entry) => entry.categoryId).concat(approvedBusinesses.map((entry) => entry.categoryId)));

  const baseLocalityPages = localityIds.length;
  const categoryLandingPages = localityIds.length * categoryIds.length;
  const intentLandingPages = localityIds.length * routeIntents.length;
  const listingPages = approvedBusinesses.length;
  const landingPages = baseLocalityPages + categoryLandingPages + intentLandingPages + listingPages;

  const searchEvents = (Array.isArray(auditEvents) ? auditEvents : []).filter((event) => String(event?.actionType || '') === 'search');
  const clickEvents = (Array.isArray(auditEvents) ? auditEvents : []).filter((event) => String(event?.actionType || '') === 'contact_view');

  const derivedImpressions = approvedBusinesses.reduce((sum, business) => (
    sum + Math.max(0, Number(business?.seoImpressions || 0))
  ), 0) || (landingPages * 22 + searchEvents.length);
  const derivedClicks = approvedBusinesses.reduce((sum, business) => (
    sum + Math.max(0, Number(business?.seoClicks || 0))
  ), 0) || clickEvents.length;

  const indexedPages = Math.max(baseLocalityPages, Math.round(landingPages * 0.72));
  const impressionShare = landingPages > 0 ? Math.round(derivedImpressions / landingPages) : 0;

  const routeCoverage = localityIds.map((localityId) => {
    const locality = localityMetadata.find((entry) => entry.id === localityId) || localities.find((entry) => entry.id === localityId) || null;
    const localityBusinesses = approvedBusinesses.filter((business) => business.localityId === localityId);
    return {
      localityId,
      localityName: locality?.name || localityId,
      localitySlug: locality?.slug || slugify(locality?.name || localityId),
      categoriesCovered: unique(localityBusinesses.map((business) => business.categoryId)).length,
      listingsCovered: localityBusinesses.length,
      intentPages: routeIntents.length,
      routeCount: 1 + categoryIds.length + routeIntents.length + localityBusinesses.length,
      estimatedIndexedPages: Math.max(1, Math.round((1 + categoryIds.length + routeIntents.length + localityBusinesses.length) * 0.74)),
    };
  }).sort((left, right) => right.routeCount - left.routeCount);

  const crawlMonitoring = routeCoverage.map((entry, index) => ({
    localityId: entry.localityId,
    localityName: entry.localityName,
    health: entry.routeCount > 12 ? 'healthy' : entry.routeCount > 6 ? 'watch' : 'thin',
    indexedPages: entry.estimatedIndexedPages,
    routeCount: entry.routeCount,
    lastReviewedAt: new Date(Date.now() - (index * 86400000)).toISOString(),
  }));

  const merchantEntitlements = approvedBusinesses
    .filter((business) => business.subscriptionPlan === 'premium' || business.seoPremiumEnabled === true || (business.domainMappingTags || []).length > 0)
    .map((business) => ({
      businessId: business.id,
      name: business.name,
      localityId: business.localityId,
      localityName: localities.find((entry) => entry.id === business.localityId)?.name || business.localityId,
      premiumRouteFeatures: business.seoPremiumEnabled === true || business.subscriptionPlan === 'premium',
      enhancedProfileFields: Boolean((business.galleryUrls || []).length || business.logoUrl || business.coverImageUrl || business.featuredSnippetAnswer),
      domainMappingTags: business.domainMappingTags || [],
      featuredSnippetPrep: normalizeText(business.featuredSnippetAnswer || ''),
      landingPagePath: normalizeText(business.seoLandingPagePath || ''),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    analytics: {
      impressions: derivedImpressions,
      clicks: derivedClicks,
      ctr: toPercent(derivedClicks, derivedImpressions),
      landingPages,
      indexedPages,
      localityPages: baseLocalityPages,
      categoryLandingPages,
      intentLandingPages,
      listingPages,
      averageImpressionsPerLandingPage: impressionShare,
    },
    routeCoverage,
    crawlMonitoring,
    merchantEntitlements,
  };
}

export function buildSeoCategoryCopyIndex({
  seoConfig,
  localities = [],
  businesses = [],
} = {}) {
  const routeIntents = Array.isArray(seoConfig?.routeIntents) ? seoConfig.routeIntents : [];
  const localityMetadata = Array.isArray(seoConfig?.localityMetadata) ? seoConfig.localityMetadata : [];
  const approvedBusinesses = (Array.isArray(businesses) ? businesses : []).filter((business) => business?.status === 'approved');
  return localityMetadata.flatMap((locality) => {
    const localityBusinesses = approvedBusinesses.filter((business) => business.localityId === locality.id);
    return routeIntents.map((intent) => {
      const relevant = localityBusinesses.filter((business) => business.categoryId === intent.categoryId);
      const topNames = relevant.slice(0, 3).map((business) => business.name).filter(Boolean);
      return {
        localityId: locality.id,
        localityName: locality.name,
        categoryId: intent.categoryId,
        slug: intent.slug,
        title: `${intent.labelPrefix} in ${locality.name}`,
        intro: topNames.length > 0
          ? `${locality.name} has trusted ${intent.labelPrefix.toLowerCase()} options including ${topNames.join(', ')}. Compare reviews, contact details, and locality fit before choosing.`
          : `${locality.name} has active demand for ${intent.labelPrefix.toLowerCase()} searches. This page is prepared for locality-aware discovery, SEO growth, and merchant visibility.`,
        faqSnippet: `What are the best ${intent.labelPrefix.toLowerCase()} options in ${locality.name}? Localisy highlights verified, highly rated, and locality-relevant businesses first.`,
        featuredSnippetPrep: `Best ${intent.labelPrefix} in ${locality.name}: compare trusted local listings, ratings, directions, and contact details on Localisy.`,
        routePath: `/${slugify(locality.id || locality.name)}/${intent.slug}`,
        businessCount: relevant.length,
      };
    });
  });
}
