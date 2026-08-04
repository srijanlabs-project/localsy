function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeKey(value) {
  return normalizeLower(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toTimestamp(value) {
  const time = new Date(String(value || '')).getTime();
  return Number.isFinite(time) ? time : 0;
}

function toPercentage(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function parseAuditDetails(details) {
  const raw = normalizeText(details);
  if (!raw) return {};
  return raw
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, segment) => {
      const separatorIndex = segment.indexOf(':');
      if (separatorIndex === -1) return acc;
      const key = normalizeKey(segment.slice(0, separatorIndex));
      const rawValue = segment.slice(separatorIndex + 1).trim();
      if (!key) return acc;
      acc[key] = rawValue.replace(/^"(.*)"$/, '$1').trim();
      return acc;
    }, {});
}

function getDetailValue(details, ...keys) {
  for (const key of keys) {
    const value = details[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function readBooleanDetail(value) {
  const normalized = normalizeLower(value);
  if (!normalized) return null;
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  return null;
}

function inferAuditChannel(event, parsedDetails = {}) {
  const explicitChannel = normalizeLower(getDetailValue(parsedDetails, 'channel'));
  if (explicitChannel.includes('whatsapp')) return 'whatsapp';
  if (explicitChannel.includes('mobile')) return 'mobile';

  const description = normalizeLower(event?.description);
  if (description.includes('whatsapp')) return 'whatsapp';
  if (description.includes('mobile')) return 'mobile';

  const deviceCode = normalizeLower(event?.deviceCode);
  if (deviceCode.includes('android') || deviceCode.includes('iphone') || deviceCode.includes('mobile')) {
    return 'mobile';
  }

  return 'web';
}

function buildActorFingerprint(event, channel, parsedDetails = {}) {
  const sessionId = normalizeText(getDetailValue(parsedDetails, 'sessionid', 'session_id'));
  if (sessionId) {
    return `${channel}:session:${sessionId}`;
  }
  const phone = normalizeText(getDetailValue(parsedDetails, 'phone'));
  if (phone) {
    return `${channel}:phone:${phone}`;
  }
  const userName = normalizeLower(event?.userName || 'anonymous');
  const ipAddress = normalizeLower(event?.ipAddress || 'unknown');
  const deviceCode = normalizeLower(event?.deviceCode || 'unknown');
  return `${channel}:user:${userName}|ip:${ipAddress}|device:${deviceCode}`;
}

function extractSearchEvent(event) {
  if (normalizeLower(event?.actionType) !== 'search') return null;
  const parsedDetails = parseAuditDetails(event?.details);
  const channel = inferAuditChannel(event, parsedDetails);
  const query = normalizeText(getDetailValue(
    parsedDetails,
    'query',
    'voice query',
    'normalized query',
    'directed query',
    'search query',
    'extracted tag',
  ));
  const results = toNumber(getDetailValue(parsedDetails, 'results', 'total'));
  const description = normalizeLower(event?.description);
  const hasExplicitNoResult = description.includes('no-result');
  const fallbackDetail = readBooleanDetail(getDetailValue(parsedDetails, 'fallback'));
  const fallback = fallbackDetail === null ? hasExplicitNoResult : fallbackDetail;
  const hasResults = results === null ? !hasExplicitNoResult : results > 0;
  return {
    id: normalizeText(event?.id),
    timestamp: normalizeText(event?.timestamp),
    timestampMs: toTimestamp(event?.timestamp),
    channel,
    query: query || 'unknown query',
    localityId: normalizeText(getDetailValue(parsedDetails, 'zone', 'locality', 'localityid')),
    categoryId: normalizeText(getDetailValue(parsedDetails, 'category', 'categoryid')),
    results: results ?? (hasResults ? 1 : 0),
    hasResults,
    fallback,
    durationMs: toNumber(getDetailValue(parsedDetails, 'durationms', 'responsems', 'latencyms')) || 0,
    actorFingerprint: buildActorFingerprint(event, channel, parsedDetails),
    parsedDetails,
  };
}

function isLeadLikeEvent(event) {
  const actionType = normalizeLower(event?.actionType);
  if (actionType === 'contact_view') return true;
  const description = normalizeLower(event?.description);
  return description.includes('captured ad lead')
    || description.includes('lead captured')
    || description.includes('contact unlock');
}

function isEngagementEvent(event) {
  if (isLeadLikeEvent(event)) return true;
  const description = normalizeLower(event?.description);
  return description.includes('submitted review')
    || description.includes('viewed mobile listing')
    || description.includes('viewed listing details');
}

function buildFollowUpIndex(auditEvents) {
  return (Array.isArray(auditEvents) ? auditEvents : [])
    .map((event) => {
      const parsedDetails = parseAuditDetails(event?.details);
      const channel = inferAuditChannel(event, parsedDetails);
      return {
        event,
        timestampMs: toTimestamp(event?.timestamp),
        actorFingerprint: buildActorFingerprint(event, channel, parsedDetails),
        channel,
      };
    })
    .sort((left, right) => left.timestampMs - right.timestampMs);
}

export function buildSearchAnalytics({ auditEvents = [] } = {}) {
  const searchEvents = (Array.isArray(auditEvents) ? auditEvents : [])
    .map(extractSearchEvent)
    .filter(Boolean)
    .sort((left, right) => left.timestampMs - right.timestampMs);
  const followUpEvents = buildFollowUpIndex(auditEvents);
  const conversionWindowMs = 2 * 60 * 60 * 1000;
  const engagementWindowMs = 30 * 60 * 1000;

  let clickedSearches = 0;
  let convertedSearches = 0;

  const popularQueriesMap = new Map();
  for (const searchEvent of searchEvents) {
    const grouped = popularQueriesMap.get(searchEvent.query) || {
      query: searchEvent.query,
      searches: 0,
      noResultSearches: 0,
      resultfulSearches: 0,
      totalResults: 0,
      channels: new Set(),
      clicks: 0,
      conversions: 0,
    };
    grouped.searches += 1;
    grouped.totalResults += Math.max(0, Number(searchEvent.results || 0));
    grouped.channels.add(searchEvent.channel);
    if (searchEvent.hasResults) {
      grouped.resultfulSearches += 1;
    } else {
      grouped.noResultSearches += 1;
    }

    const followUps = followUpEvents.filter((candidate) => (
      candidate.timestampMs >= searchEvent.timestampMs &&
      candidate.timestampMs <= searchEvent.timestampMs + conversionWindowMs &&
      candidate.actorFingerprint === searchEvent.actorFingerprint &&
      candidate.event?.id !== searchEvent.id
    ));

    const hadClick = followUps.some((candidate) => isEngagementEvent(candidate.event));
    const hadConversion = followUps.some((candidate) => isLeadLikeEvent(candidate.event));
    if (hadClick) {
      clickedSearches += 1;
      grouped.clicks += 1;
    }
    if (hadConversion) {
      convertedSearches += 1;
      grouped.conversions += 1;
    }

    popularQueriesMap.set(searchEvent.query, grouped);
  }

  const popularQueries = Array.from(popularQueriesMap.values())
    .map((entry) => ({
      query: entry.query,
      searches: entry.searches,
      noResultSearches: entry.noResultSearches,
      averageResults: Number((entry.totalResults / Math.max(entry.searches, 1)).toFixed(1)),
      channels: Array.from(entry.channels).sort(),
      ctr: toPercentage(entry.clicks, entry.searches),
      queryToLeadConversion: toPercentage(entry.conversions, entry.searches),
    }))
    .sort((left, right) => (
      right.searches - left.searches
      || right.ctr - left.ctr
      || left.query.localeCompare(right.query)
    ))
    .slice(0, 25);

  const droppedSearches = searchEvents.filter((searchEvent) => {
    const followUp = followUpEvents.some((candidate) => (
      candidate.timestampMs >= searchEvent.timestampMs &&
      candidate.timestampMs <= searchEvent.timestampMs + engagementWindowMs &&
      candidate.actorFingerprint === searchEvent.actorFingerprint &&
      candidate.event?.id !== searchEvent.id &&
      isEngagementEvent(candidate.event)
    ));
    return !followUp;
  }).length;

  return {
    totalSearches: searchEvents.length,
    successfulSearches: searchEvents.filter((event) => event.hasResults).length,
    noResultSearches: searchEvents.filter((event) => !event.hasResults).length,
    ctr: toPercentage(clickedSearches, searchEvents.length),
    queryToLeadConversion: toPercentage(convertedSearches, searchEvents.length),
    dropOffRate: toPercentage(droppedSearches, searchEvents.length),
    popularQueries,
  };
}

export function buildChannelAnalytics({ auditEvents = [] } = {}) {
  const searchEvents = (Array.isArray(auditEvents) ? auditEvents : [])
    .map(extractSearchEvent)
    .filter(Boolean);
  const followUpEvents = buildFollowUpIndex(auditEvents);
  const channelSummaries = ['web', 'mobile', 'whatsapp'].map((channel) => {
    const channelSearches = searchEvents.filter((event) => event.channel === channel);
    const responseTimes = channelSearches.map((event) => event.durationMs).filter((value) => value > 0);
    const sessionFingerprints = new Set(channelSearches.map((event) => event.actorFingerprint));
    const resolvedSearches = channelSearches.filter((event) => event.hasResults).length;
    const fallbackSearches = channelSearches.filter((event) => event.fallback).length;
    const droppedSessions = channelSearches.filter((searchEvent) => {
      const followUp = followUpEvents.some((candidate) => (
        candidate.channel === channel &&
        candidate.actorFingerprint === searchEvent.actorFingerprint &&
        candidate.timestampMs >= searchEvent.timestampMs &&
        candidate.timestampMs <= searchEvent.timestampMs + (30 * 60 * 1000) &&
        candidate.event?.id !== searchEvent.id &&
        isEngagementEvent(candidate.event)
      ));
      return !followUp;
    }).length;
    return {
      channel,
      totalQueries: channelSearches.length,
      sessionCount: sessionFingerprints.size,
      averageResponseTimeMs: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
        : 0,
      resolutionRate: toPercentage(resolvedSearches, channelSearches.length),
      fallbackRate: toPercentage(fallbackSearches, channelSearches.length),
      dropOffRate: toPercentage(droppedSessions, channelSearches.length),
    };
  });

  return {
    channels: channelSummaries,
  };
}

export function buildCampaignComparison({ listingAds = [], adLeads = [] } = {}) {
  const leadsByAdId = new Map();
  for (const lead of Array.isArray(adLeads) ? adLeads : []) {
    const adId = normalizeText(lead?.adId);
    if (!adId) continue;
    leadsByAdId.set(adId, (leadsByAdId.get(adId) || 0) + 1);
  }

  return (Array.isArray(listingAds) ? listingAds : [])
    .map((ad) => {
      const adId = normalizeText(ad?.id);
      const derivedLeadCount = leadsByAdId.get(adId) || 0;
      const impressions = Math.max(0, Number(ad?.impressions || 0));
      const clicks = Math.max(0, Number(ad?.clicks || 0));
      const leadCount = Math.max(derivedLeadCount, Number(ad?.leadCount || 0));
      const spentBudget = Math.max(0, Number(ad?.spentBudget || 0));
      return {
        adId,
        title: normalizeText(ad?.title || 'Untitled ad'),
        workflowStatus: normalizeText(ad?.workflowStatus || (ad?.isActive === false ? 'paused' : 'live')),
        billingModel: normalizeText(ad?.billingModel || 'fixed'),
        placementKey: normalizeText(ad?.placementKey),
        sellerBusinessId: normalizeText(ad?.sellerBusinessId),
        impressions,
        clicks,
        leads: leadCount,
        ctr: toPercentage(clicks, impressions),
        conversionRate: toPercentage(leadCount, clicks || impressions),
        spentBudget,
        costPerLead: leadCount > 0 ? Number((spentBudget / leadCount).toFixed(2)) : 0,
        costPerClick: clicks > 0 ? Number((spentBudget / clicks).toFixed(2)) : 0,
      };
    })
    .sort((left, right) => (
      right.leads - left.leads
      || right.clicks - left.clicks
      || right.impressions - left.impressions
      || left.title.localeCompare(right.title)
    ));
}

export function buildMerchantConversionInsights({ listingAds = [], adLeads = [], businesses = [] } = {}) {
  const businessNameById = new Map(
    (Array.isArray(businesses) ? businesses : [])
      .filter((business) => business && business.id)
      .map((business) => [String(business.id), String(business.name || business.id)]),
  );
  const merchantMap = new Map();

  for (const ad of Array.isArray(listingAds) ? listingAds : []) {
    const sellerBusinessId = normalizeText(ad?.sellerBusinessId || ad?.targetBusinessId);
    if (!sellerBusinessId) continue;
    const current = merchantMap.get(sellerBusinessId) || {
      sellerBusinessId,
      merchantName: businessNameById.get(sellerBusinessId) || sellerBusinessId,
      activeAds: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      spentBudget: 0,
    };
    current.activeAds += 1;
    current.impressions += Math.max(0, Number(ad?.impressions || 0));
    current.clicks += Math.max(0, Number(ad?.clicks || 0));
    current.leads += Math.max(0, Number(ad?.leadCount || 0));
    current.spentBudget += Math.max(0, Number(ad?.spentBudget || 0));
    merchantMap.set(sellerBusinessId, current);
  }

  for (const lead of Array.isArray(adLeads) ? adLeads : []) {
    const sellerBusinessId = normalizeText(lead?.sellerBusinessId);
    if (!sellerBusinessId || !merchantMap.has(sellerBusinessId)) continue;
    const current = merchantMap.get(sellerBusinessId);
    current.leads = Math.max(current.leads, 0) + 1;
  }

  return Array.from(merchantMap.values())
    .map((entry) => ({
      ...entry,
      ctr: toPercentage(entry.clicks, entry.impressions),
      conversionRate: toPercentage(entry.leads, entry.clicks || entry.impressions),
      costPerLead: entry.leads > 0 ? Number((entry.spentBudget / entry.leads).toFixed(2)) : 0,
    }))
    .sort((left, right) => (
      right.leads - left.leads
      || right.clicks - left.clicks
      || left.merchantName.localeCompare(right.merchantName)
    ));
}

function classifyCrmSegment(contact, nowMs) {
  const totalSpent = Math.max(0, Number(contact?.totalSpent || 0));
  const ordersCount = Math.max(0, Number(contact?.ordersCount || 0));
  const loyaltyPoints = Math.max(0, Number(contact?.loyaltyPoints || 0));
  const interactionAgeDays = Math.floor((nowMs - toTimestamp(contact?.lastInteraction)) / (24 * 60 * 60 * 1000));

  if (totalSpent >= 10000 || loyaltyPoints >= 250) return 'high_value';
  if (ordersCount >= 3) return 'repeat_customer';
  if (interactionAgeDays <= 7) return 'new_lead';
  if (interactionAgeDays >= 60) return 'at_risk';
  return 'nurture';
}

export function buildCrmSegmentation({ crmContacts = [], businesses = [] } = {}) {
  const nowMs = Date.now();
  const businessNameById = new Map(
    (Array.isArray(businesses) ? businesses : [])
      .filter((business) => business && business.id)
      .map((business) => [String(business.id), String(business.name || business.id)]),
  );
  const segments = new Map();

  for (const contact of Array.isArray(crmContacts) ? crmContacts : []) {
    const segment = classifyCrmSegment(contact, nowMs);
    const current = segments.get(segment) || {
      segment,
      count: 0,
      contacts: [],
    };
    current.count += 1;
    if (current.contacts.length < 8) {
      current.contacts.push({
        id: normalizeText(contact?.id),
        businessId: normalizeText(contact?.businessId),
        businessName: businessNameById.get(String(contact?.businessId || '')) || normalizeText(contact?.businessId),
        name: normalizeText(contact?.name),
        phone: normalizeText(contact?.phone),
        lastInteraction: normalizeText(contact?.lastInteraction),
      });
    }
    segments.set(segment, current);
  }

  return {
    totalContacts: Array.isArray(crmContacts) ? crmContacts.length : 0,
    segments: Array.from(segments.values()).sort((left, right) => right.count - left.count || left.segment.localeCompare(right.segment)),
  };
}

export function buildLeadRoutingSnapshot({ adLeads = [], crmContacts = [], businesses = [] } = {}) {
  const nowMs = Date.now();
  const businessNameById = new Map(
    (Array.isArray(businesses) ? businesses : [])
      .filter((business) => business && business.id)
      .map((business) => [String(business.id), String(business.name || business.id)]),
  );
  const latestContactByBusinessId = new Map(
    (Array.isArray(crmContacts) ? crmContacts : [])
      .filter((contact) => contact && contact.businessId)
      .map((contact) => [String(contact.businessId), toTimestamp(contact.lastInteraction)]),
  );

  const queues = new Map();
  for (const lead of Array.isArray(adLeads) ? adLeads : []) {
    const businessId = normalizeText(lead?.sellerBusinessId || 'platform');
    const createdAtMs = toTimestamp(lead?.createdAt);
    const current = queues.get(businessId) || {
      sellerBusinessId: businessId,
      businessName: businessNameById.get(businessId) || businessId || 'platform',
      pendingLeadCount: 0,
      recentLeadCount: 0,
      staleLeadCount: 0,
      lastLeadAt: '',
      queue: 'standard',
      escalation: null,
    };
    current.pendingLeadCount += 1;
    if (createdAtMs > nowMs - (7 * 24 * 60 * 60 * 1000)) {
      current.recentLeadCount += 1;
    }
    const lastInteractionMs = latestContactByBusinessId.get(businessId) || 0;
    if (createdAtMs > 0 && createdAtMs < nowMs - (48 * 60 * 60 * 1000) && lastInteractionMs < createdAtMs) {
      current.staleLeadCount += 1;
    }
    if (!current.lastLeadAt || createdAtMs > toTimestamp(current.lastLeadAt)) {
      current.lastLeadAt = normalizeText(lead?.createdAt);
    }
    queues.set(businessId, current);
  }

  const operatorQueues = Array.from(queues.values())
    .map((entry) => {
      let queue = 'standard';
      let escalation = null;
      if (entry.staleLeadCount >= 3) {
        queue = 'escalated';
        escalation = 'stale_follow_up';
      } else if (entry.pendingLeadCount >= 5) {
        queue = 'priority';
        escalation = 'lead_volume';
      } else if (entry.recentLeadCount >= 2) {
        queue = 'active_follow_up';
      }
      return {
        ...entry,
        queue,
        escalation,
      };
    })
    .sort((left, right) => (
      right.pendingLeadCount - left.pendingLeadCount
      || right.staleLeadCount - left.staleLeadCount
      || left.businessName.localeCompare(right.businessName)
    ));

  return {
    operatorQueues,
    escalationRules: operatorQueues
      .filter((entry) => entry.escalation)
      .map((entry) => ({
        sellerBusinessId: entry.sellerBusinessId,
        businessName: entry.businessName,
        rule: entry.escalation,
        queue: entry.queue,
        pendingLeadCount: entry.pendingLeadCount,
        staleLeadCount: entry.staleLeadCount,
      })),
  };
}

export function buildInternalNotifications({ auditEvents = [], businesses = [], listingAds = [] } = {}) {
  const notifications = [];
  const pendingBusinesses = (Array.isArray(businesses) ? businesses : []).filter((business) => normalizeLower(business?.status) === 'pending');
  if (pendingBusinesses.length > 0) {
    notifications.push({
      type: 'moderation_alert',
      severity: pendingBusinesses.length >= 10 ? 'high' : 'medium',
      title: 'Pending business approvals',
      message: `${pendingBusinesses.length} business listings are waiting for review.`,
      count: pendingBusinesses.length,
    });
  }

  const pendingAds = (Array.isArray(listingAds) ? listingAds : []).filter((ad) => ['submitted', 'under_review'].includes(normalizeLower(ad?.workflowStatus)));
  if (pendingAds.length > 0) {
    notifications.push({
      type: 'moderation_alert',
      severity: pendingAds.length >= 10 ? 'high' : 'medium',
      title: 'Pending advertiser approvals',
      message: `${pendingAds.length} ads are waiting in the review queue.`,
      count: pendingAds.length,
    });
  }

  const importFailureEvents = (Array.isArray(auditEvents) ? auditEvents : []).filter((event) => {
    const description = normalizeLower(event?.description);
    if (!description.includes('csv import')) return false;
    const parsedDetails = parseAuditDetails(event?.details);
    const skipped = toNumber(getDetailValue(parsedDetails, 'skipped'));
    return Number.isFinite(skipped) && skipped > 0;
  });
  if (importFailureEvents.length > 0) {
    notifications.push({
      type: 'ingestion_failure',
      severity: importFailureEvents.length >= 3 ? 'high' : 'medium',
      title: 'Import rows skipped',
      message: `${importFailureEvents.length} recent imports skipped one or more rows and need data cleanup.`,
      count: importFailureEvents.length,
    });
  }

  const suspiciousBuckets = new Map();
  for (const event of Array.isArray(auditEvents) ? auditEvents : []) {
    if (!['search', 'contact_view'].includes(normalizeLower(event?.actionType))) continue;
    const parsedDetails = parseAuditDetails(event?.details);
    const channel = inferAuditChannel(event, parsedDetails);
    const fingerprint = buildActorFingerprint(event, channel, parsedDetails);
    suspiciousBuckets.set(fingerprint, (suspiciousBuckets.get(fingerprint) || 0) + 1);
  }
  const suspiciousActors = Array.from(suspiciousBuckets.entries()).filter(([, count]) => count >= 20);
  if (suspiciousActors.length > 0) {
    notifications.push({
      type: 'suspicious_activity',
      severity: 'high',
      title: 'Suspicious directory activity',
      message: `${suspiciousActors.length} device fingerprints crossed the activity threshold and should be reviewed.`,
      count: suspiciousActors.length,
    });
  }

  const noResultSearches = (Array.isArray(auditEvents) ? auditEvents : [])
    .map(extractSearchEvent)
    .filter(Boolean)
    .filter((event) => !event.hasResults);
  if (noResultSearches.length >= 10) {
    notifications.push({
      type: 'system_warning',
      severity: 'medium',
      title: 'High no-result volume',
      message: `${noResultSearches.length} recent searches returned no results and may need taxonomy or data coverage fixes.`,
      count: noResultSearches.length,
    });
  }

  return notifications.sort((left, right) => String(right.severity).localeCompare(String(left.severity)) || right.count - left.count);
}

function flattenBusiness(business) {
  return {
    id: normalizeText(business?.id),
    name: normalizeText(business?.name),
    status: normalizeText(business?.status),
    localityId: normalizeText(business?.localityId),
    cityId: normalizeText(business?.cityId),
    areaId: normalizeText(business?.areaId),
    categoryId: normalizeText(business?.categoryId),
    subcategoryId: normalizeText(business?.subcategoryId),
    pincode: normalizeText(business?.pincode),
    phone: normalizeText(business?.phone),
    ownerName: normalizeText(business?.ownerName),
    isHomeBased: business?.isHomeBased === true ? 'yes' : 'no',
    isWomenLed: business?.isWomenLed === true ? 'yes' : 'no',
    verifiedBadge: business?.verifiedBadge === true ? 'yes' : 'no',
    createdAt: normalizeText(business?.createdAt),
  };
}

function flattenAuditEvent(event) {
  const parsedDetails = parseAuditDetails(event?.details);
  return {
    id: normalizeText(event?.id),
    timestamp: normalizeText(event?.timestamp),
    actionType: normalizeText(event?.actionType),
    channel: inferAuditChannel(event, parsedDetails),
    userName: normalizeText(event?.userName),
    ipAddress: normalizeText(event?.ipAddress),
    description: normalizeText(event?.description),
    query: getDetailValue(parsedDetails, 'query', 'voice query', 'normalized query'),
    localityId: getDetailValue(parsedDetails, 'zone', 'locality', 'localityid'),
    categoryId: getDetailValue(parsedDetails, 'category', 'categoryid'),
    results: getDetailValue(parsedDetails, 'results', 'total'),
    details: normalizeText(event?.details),
  };
}

export function buildAdminExportRows(entity, datasets) {
  switch (normalizeLower(entity)) {
    case 'businesses':
      return (datasets.businesses || []).map(flattenBusiness);
    case 'crm_contacts':
    case 'crm-contacts':
      return (datasets.crmContacts || []).map((contact) => ({
        id: normalizeText(contact?.id),
        businessId: normalizeText(contact?.businessId),
        name: normalizeText(contact?.name),
        phone: normalizeText(contact?.phone),
        email: normalizeText(contact?.email),
        lastInteraction: normalizeText(contact?.lastInteraction),
        totalSpent: Number(contact?.totalSpent || 0),
        ordersCount: Number(contact?.ordersCount || 0),
        loyaltyPoints: Number(contact?.loyaltyPoints || 0),
        followUpNotes: normalizeText(contact?.followUpNotes),
      }));
    case 'ad_leads':
    case 'ad-leads':
      return (datasets.adLeads || []).map((lead) => ({
        id: normalizeText(lead?.id),
        adId: normalizeText(lead?.adId),
        sellerBusinessId: normalizeText(lead?.sellerBusinessId),
        localityId: normalizeText(lead?.localityId),
        name: normalizeText(lead?.name),
        mobile: normalizeText(lead?.mobile),
        pincode: normalizeText(lead?.pincode),
        createdAt: normalizeText(lead?.createdAt),
      }));
    case 'audit_events':
    case 'audit-events':
      return (datasets.auditEvents || []).map(flattenAuditEvent);
    case 'search_analytics':
    case 'search-analytics':
      return (datasets.searchAnalytics?.popularQueries || []).map((query) => ({
        query: normalizeText(query?.query),
        searches: Number(query?.searches || 0),
        noResultSearches: Number(query?.noResultSearches || 0),
        averageResults: Number(query?.averageResults || 0),
        ctr: Number(query?.ctr || 0),
        queryToLeadConversion: Number(query?.queryToLeadConversion || 0),
        channels: Array.isArray(query?.channels) ? query.channels.join(', ') : '',
      }));
    case 'channel_analytics':
    case 'channel-analytics':
      return (datasets.channelAnalytics?.channels || []).map((channel) => ({
        channel: normalizeText(channel?.channel),
        totalQueries: Number(channel?.totalQueries || 0),
        sessionCount: Number(channel?.sessionCount || 0),
        averageResponseTimeMs: Number(channel?.averageResponseTimeMs || 0),
        resolutionRate: Number(channel?.resolutionRate || 0),
        fallbackRate: Number(channel?.fallbackRate || 0),
        dropOffRate: Number(channel?.dropOffRate || 0),
      }));
    default:
      return [];
  }
}

function escapeCsvCell(value) {
  const normalized = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function stringifyCsv(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) return 'no_data\n';
  const columns = Array.from(safeRows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const header = columns.map(escapeCsvCell).join(',');
  const lines = safeRows.map((row) => columns.map((column) => escapeCsvCell(row?.[column])).join(','));
  return [header, ...lines].join('\n');
}
