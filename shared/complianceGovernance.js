function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeStringList(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => normalizeText(value)).filter(Boolean)));
}

function toIso(value, fallback = new Date().toISOString()) {
  const date = new Date(String(value || fallback));
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export const DEFAULT_POLICY_DOCUMENTS = [
  {
    id: 'tnc',
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    category: 'legal_content',
    summary: 'Platform usage terms for all Localisy visitors, businesses, and contributors.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Localisy provides a hyperlocal directory and discovery platform.',
      'Users must provide accurate information while searching, reviewing, or listing businesses.',
      'Business owners are responsible for listing accuracy, operating permissions, and customer-facing commitments.',
      'Localisy may moderate, suspend, or remove content that violates platform policy or legal requirements.',
    ],
  },
  {
    id: 'privacy-policy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    category: 'legal_content',
    summary: 'How Localisy collects, uses, stores, and protects personal and operational data.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Localisy collects profile, contact, consent, and directory interaction data required to deliver platform services.',
      'PII access is role-restricted and purpose-limited.',
      'Consent and audit trails are retained according to policy and regulatory requirements.',
      'Users may request export or deletion subject to fraud, safety, and statutory obligations.',
    ],
  },
  {
    id: 'cookie-policy',
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    category: 'legal_content',
    summary: 'How Localisy uses browser storage, session cookies, and analytics storage.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Localisy uses essential storage for authentication, locality routing, and buyer-state continuity.',
      'Non-essential analytics and marketing signals should honor user consent preferences.',
      'Users can revoke optional consent without losing core directory access.',
    ],
  },
  {
    id: 'disclaimer',
    slug: 'disclaimer',
    title: 'Platform Disclaimer',
    category: 'legal_content',
    summary: 'Platform-level disclaimers for listing accuracy, availability, and third-party actions.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Listing information may change and should be independently verified for critical or urgent decisions.',
      'Emergency and public-service information is curated in good faith but may depend on third-party operators.',
      'Localisy does not guarantee advertiser performance or transaction outcomes unless explicitly contracted.',
    ],
  },
  {
    id: 'refund-policy',
    slug: 'refund-policy',
    title: 'Refund Policy',
    category: 'commercial_policy',
    summary: 'Refund handling for subscriptions, ads, and managed services.',
    audience: 'seller',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Refunds depend on service type, campaign start status, and documented delivery gaps.',
      'Unused prepaid advertiser balances may be eligible for review-based credit or refund.',
      'Fraud, policy violations, and manual override abuse are not refundable.',
    ],
  },
  {
    id: 'cancellation-policy',
    slug: 'cancellation-policy',
    title: 'Cancellation Policy',
    category: 'commercial_policy',
    summary: 'Rules for cancelling plans, ads, or managed campaign services.',
    audience: 'seller',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Sellers can cancel upcoming plans and campaigns before activation windows close.',
      'In-flight campaign cancellation may preserve spend already consumed and stop future delivery.',
      'Platform-managed campaigns require operator confirmation before final cancellation.',
    ],
  },
  {
    id: 'fulfilment-policy',
    slug: 'fulfilment-policy',
    title: 'Fulfilment Policy',
    category: 'commercial_policy',
    summary: 'Operational fulfilment expectations for ad delivery and managed merchant services.',
    audience: 'seller',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Localisy fulfils advertiser commitments through approved placements, scheduled campaigns, and analytics access.',
      'Merchant support timelines vary by service level, campaign type, and moderation dependencies.',
      'Delays caused by missing approvals, policy blocks, or incorrect inputs may pause fulfilment clocks.',
    ],
  },
  {
    id: 'seller-agreement',
    slug: 'seller-agreement',
    title: 'Seller Agreement',
    category: 'commercial_policy',
    summary: 'Operating agreement for merchants, advertisers, and listing claimants.',
    audience: 'seller',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Sellers must maintain truthful business information and hold rights for uploaded content.',
      'Advertisers must comply with content, targeting, and category restrictions.',
      'Listing misuse, deceptive offers, or prohibited-category promotion may trigger suspension.',
    ],
  },
  {
    id: 'community-guidelines',
    slug: 'community-guidelines',
    title: 'Community Guidelines',
    category: 'platform_policy',
    summary: 'Rules for recommendations, reviews, local updates, and community participation.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Users should contribute authentic, respectful, and locality-relevant content.',
      'Spam, impersonation, harassment, and coordinated misinformation are prohibited.',
      'Sensitive public-service content may be operator-curated or escalated.',
    ],
  },
  {
    id: 'merchant-listing-policy',
    slug: 'merchant-listing-policy',
    title: 'Merchant Listing Policy',
    category: 'platform_policy',
    summary: 'Rules for creating, claiming, editing, and promoting directory listings.',
    audience: 'seller',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Each listing must represent a real, supportable business or public-service entity.',
      'Duplicate, misleading, or location-spam listings are subject to merge or removal.',
      'Special handling applies for home-based, women-led, and public-service listings to improve discoverability without misclassification.',
    ],
  },
  {
    id: 'review-policy',
    slug: 'review-policy',
    title: 'Review Policy',
    category: 'platform_policy',
    summary: 'Rules for collecting, moderating, and resolving business reviews.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Reviews must reflect first-hand experience and should avoid abuse, defamation, or spam promotion.',
      'OTP verification, report handling, and moderation review may be used to protect integrity.',
      'Repeated policy violations may lead to content removal or account restrictions.',
    ],
  },
  {
    id: 'moderation-policy',
    slug: 'moderation-policy',
    title: 'Moderation Policy',
    category: 'platform_policy',
    summary: 'How Localisy reviews listings, ads, reviews, and user-submitted content.',
    audience: 'all',
    version: '1.0.0',
    effectiveFrom: '2026-08-02T00:00:00.000Z',
    status: 'published',
    content: [
      'Localisy uses manual and rules-based moderation for listings, ads, and reviews.',
      'Moderation outcomes include approve, reject, merge, keep separate, flag, or escalate.',
      'High-risk cases may be retained longer for dispute, fraud, or regulatory review.',
    ],
  },
];

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    id: 'tmpl_whatsapp_search_followup',
    channel: 'whatsapp',
    name: 'Search Follow-up',
    category: 'utility',
    status: 'active',
    locale: 'en',
    requiresOptIn: true,
    sessionWindowHours: 24,
    body: 'Here are the best matching Localisy listings for your request.',
  },
  {
    id: 'tmpl_whatsapp_marketing_digest',
    channel: 'whatsapp',
    name: 'Marketing Digest',
    category: 'marketing',
    status: 'paused',
    locale: 'en',
    requiresOptIn: true,
    sessionWindowHours: 0,
    body: 'Discover new offers, trusted local businesses, and seasonal highlights.',
  },
  {
    id: 'tmpl_sms_otp',
    channel: 'sms',
    name: 'OTP Verification',
    category: 'utility',
    status: 'active',
    locale: 'en',
    requiresOptIn: false,
    sessionWindowHours: 0,
    body: 'Your Localisy verification code is {{otp}}.',
  },
];

export const DEFAULT_RETENTION_RULES = [
  { entity: 'consent_records', retentionDays: 730, action: 'retain', piiFields: ['phone', 'email'] },
  { entity: 'policy_acceptances', retentionDays: 730, action: 'retain', piiFields: ['userId', 'phone', 'email'] },
  { entity: 'unsubscribe_records', retentionDays: 1095, action: 'retain', piiFields: ['phone', 'email'] },
  { entity: 'grievance_requests', retentionDays: 365, action: 'archive', piiFields: ['phone', 'email'] },
  { entity: 'otp_challenges', retentionDays: 30, action: 'delete', piiFields: ['mobile'] },
  { entity: 'channel_sessions', retentionDays: 30, action: 'delete', piiFields: ['phone'] },
];

export function sanitizePolicyDocument(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const doc = value;
  const id = normalizeText(doc.id || `policy_${index + 1}`);
  const title = normalizeText(doc.title);
  const slug = normalizeText(doc.slug || id.toLowerCase());
  if (!id || !title || !slug) return null;
  return {
    id,
    slug,
    title,
    category: ['legal_content', 'commercial_policy', 'platform_policy'].includes(normalizeText(doc.category)) ? normalizeText(doc.category) : 'legal_content',
    summary: normalizeText(doc.summary),
    audience: normalizeText(doc.audience || 'all') || 'all',
    version: normalizeText(doc.version || '1.0.0') || '1.0.0',
    effectiveFrom: toIso(doc.effectiveFrom),
    status: ['draft', 'published', 'archived'].includes(normalizeText(doc.status)) ? normalizeText(doc.status) : 'published',
    localityIds: normalizeStringList(doc.localityIds),
    content: Array.isArray(doc.content)
      ? doc.content.map((entry) => normalizeText(entry)).filter(Boolean)
      : normalizeText(doc.content)
        ? [normalizeText(doc.content)]
        : [],
    updatedAt: toIso(doc.updatedAt || doc.effectiveFrom),
  };
}

export function sanitizePolicyDocuments(value) {
  const source = Array.isArray(value) && value.length > 0 ? value : DEFAULT_POLICY_DOCUMENTS;
  return source.map(sanitizePolicyDocument).filter(Boolean);
}

export function sanitizeConsentRecord(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const record = value;
  const channel = normalizeText(record.channel);
  const subjectType = normalizeText(record.subjectType || 'visitor');
  const consentType = normalizeText(record.consentType);
  if (!channel || !consentType) return null;
  return {
    id: normalizeText(record.id || `consent_${Date.now()}_${index + 1}`),
    subjectType,
    channel,
    consentType,
    status: ['granted', 'revoked', 'pending'].includes(normalizeText(record.status)) ? normalizeText(record.status) : 'granted',
    phone: normalizeText(record.phone),
    email: normalizeText(record.email),
    userId: normalizeText(record.userId),
    policyDocumentId: normalizeText(record.policyDocumentId),
    policyVersion: normalizeText(record.policyVersion),
    localityId: normalizeText(record.localityId),
    source: normalizeText(record.source || 'platform'),
    capturedAt: toIso(record.capturedAt),
    metadata: record.metadata && typeof record.metadata === 'object' ? record.metadata : {},
  };
}

export function sanitizeConsentRecords(value) {
  if (!Array.isArray(value)) return [];
  return value.map(sanitizeConsentRecord).filter(Boolean);
}

export function sanitizePolicyAcceptance(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const record = value;
  const documentId = normalizeText(record.documentId);
  const version = normalizeText(record.version);
  if (!documentId || !version) return null;
  return {
    id: normalizeText(record.id || `accept_${Date.now()}_${index + 1}`),
    documentId,
    version,
    userId: normalizeText(record.userId),
    phone: normalizeText(record.phone),
    email: normalizeText(record.email),
    channel: normalizeText(record.channel || 'web') || 'web',
    localityId: normalizeText(record.localityId),
    acceptedAt: toIso(record.acceptedAt),
    metadata: record.metadata && typeof record.metadata === 'object' ? record.metadata : {},
  };
}

export function sanitizePolicyAcceptances(value) {
  if (!Array.isArray(value)) return [];
  return value.map(sanitizePolicyAcceptance).filter(Boolean);
}

export function sanitizeMessageTemplate(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const template = value;
  const id = normalizeText(template.id || `tmpl_${index + 1}`);
  const name = normalizeText(template.name);
  const channel = normalizeText(template.channel);
  if (!id || !name || !channel) return null;
  return {
    id,
    channel,
    name,
    category: ['utility', 'marketing', 'support'].includes(normalizeText(template.category)) ? normalizeText(template.category) : 'utility',
    status: ['active', 'paused', 'archived'].includes(normalizeText(template.status)) ? normalizeText(template.status) : 'active',
    locale: normalizeText(template.locale || 'en') || 'en',
    requiresOptIn: template.requiresOptIn !== false,
    sessionWindowHours: Math.max(0, toNumber(template.sessionWindowHours, 24)),
    body: normalizeText(template.body),
    updatedAt: toIso(template.updatedAt),
  };
}

export function sanitizeMessageTemplates(value) {
  const source = Array.isArray(value) && value.length > 0 ? value : DEFAULT_MESSAGE_TEMPLATES;
  return source.map(sanitizeMessageTemplate).filter(Boolean);
}

export function sanitizeUnsubscribeRecord(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const record = value;
  const channel = normalizeText(record.channel);
  if (!channel) return null;
  return {
    id: normalizeText(record.id || `unsub_${Date.now()}_${index + 1}`),
    channel,
    phone: normalizeText(record.phone),
    email: normalizeText(record.email),
    templateCategory: normalizeText(record.templateCategory || 'marketing') || 'marketing',
    reason: normalizeText(record.reason),
    unsubscribedAt: toIso(record.unsubscribedAt),
    source: normalizeText(record.source || 'user_request') || 'user_request',
  };
}

export function sanitizeUnsubscribeRecords(value) {
  if (!Array.isArray(value)) return [];
  return value.map(sanitizeUnsubscribeRecord).filter(Boolean);
}

export function sanitizeRetentionRule(value, index = 0) {
  if (!value || typeof value !== 'object') return null;
  const rule = value;
  const entity = normalizeText(rule.entity);
  if (!entity) return null;
  return {
    entity,
    retentionDays: Math.max(1, toNumber(rule.retentionDays, 365)),
    action: ['retain', 'archive', 'delete', 'anonymize'].includes(normalizeText(rule.action)) ? normalizeText(rule.action) : 'retain',
    piiFields: normalizeStringList(rule.piiFields),
  };
}

export function sanitizeRetentionRules(value) {
  const source = Array.isArray(value) && value.length > 0 ? value : DEFAULT_RETENTION_RULES;
  return source.map(sanitizeRetentionRule).filter(Boolean);
}

export function sanitizeComplianceGovernanceState(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    documents: sanitizePolicyDocuments(source.documents),
    consents: sanitizeConsentRecords(source.consents),
    policyAcceptances: sanitizePolicyAcceptances(source.policyAcceptances),
    messageTemplates: sanitizeMessageTemplates(source.messageTemplates),
    unsubscribes: sanitizeUnsubscribeRecords(source.unsubscribes),
    retentionRules: sanitizeRetentionRules(source.retentionRules),
    metadata: {
      updatedAt: toIso(source.metadata?.updatedAt),
      seededFromCode: source.metadata?.seededFromCode !== false,
    },
  };
}

export function upsertPolicyDocument(documents = [], incoming) {
  const sanitized = sanitizePolicyDocument(incoming);
  if (!sanitized) throw new Error('Invalid policy document');
  const existingIndex = documents.findIndex((doc) => String(doc.id) === String(sanitized.id));
  if (existingIndex === -1) {
    return [sanitized, ...documents];
  }
  const current = documents[existingIndex];
  const nextVersion = sanitized.version && sanitized.version !== current.version
    ? sanitized.version
    : current.version === sanitized.version
      ? current.version
      : sanitized.version;
  const next = {
    ...current,
    ...sanitized,
    version: nextVersion,
    updatedAt: toIso(new Date().toISOString()),
  };
  return documents.map((doc, index) => (index === existingIndex ? next : doc));
}

export function recordConsent(state, payload) {
  const nextConsent = sanitizeConsentRecord({
    ...payload,
    capturedAt: payload.capturedAt || new Date().toISOString(),
  });
  if (!nextConsent) throw new Error('Invalid consent payload');
  const consents = [
    nextConsent,
    ...state.consents.filter((entry) => (
      !(entry.channel === nextConsent.channel &&
        entry.consentType === nextConsent.consentType &&
        entry.subjectType === nextConsent.subjectType &&
        normalizeText(entry.phone) === normalizeText(nextConsent.phone) &&
        normalizeText(entry.email) === normalizeText(nextConsent.email) &&
        normalizeText(entry.userId) === normalizeText(nextConsent.userId) &&
        entry.status === nextConsent.status)
    )),
  ];
  return {
    ...state,
    consents,
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function recordPolicyAcceptance(state, payload) {
  const nextAcceptance = sanitizePolicyAcceptance({
    ...payload,
    acceptedAt: payload.acceptedAt || new Date().toISOString(),
  });
  if (!nextAcceptance) throw new Error('Invalid policy acceptance payload');
  const policyAcceptances = [
    nextAcceptance,
    ...state.policyAcceptances.filter((entry) => entry.id !== nextAcceptance.id),
  ];
  return {
    ...state,
    policyAcceptances,
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function recordUnsubscribe(state, payload) {
  const nextUnsubscribe = sanitizeUnsubscribeRecord({
    ...payload,
    unsubscribedAt: payload.unsubscribedAt || new Date().toISOString(),
  });
  if (!nextUnsubscribe) throw new Error('Invalid unsubscribe payload');
  const unsubscribes = [
    nextUnsubscribe,
    ...state.unsubscribes.filter((entry) => entry.id !== nextUnsubscribe.id),
  ];
  return {
    ...state,
    unsubscribes,
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function replaceMessageTemplates(state, templates) {
  return {
    ...state,
    messageTemplates: sanitizeMessageTemplates(templates),
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function replaceRetentionRules(state, rules) {
  return {
    ...state,
    retentionRules: sanitizeRetentionRules(rules),
    metadata: {
      ...state.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

function isUnsubscribed(state, { channel, phone, email, templateCategory }) {
  return state.unsubscribes.some((entry) => (
    normalizeText(entry.channel) === normalizeText(channel) &&
    normalizeText(entry.templateCategory) === normalizeText(templateCategory || 'marketing') &&
    (
      (phone && normalizeText(entry.phone) === normalizeText(phone)) ||
      (email && normalizeText(entry.email) === normalizeText(email))
    )
  ));
}

function hasGrantedConsent(state, { channel, consentType, phone, email, userId }) {
  return state.consents.some((entry) => (
    normalizeText(entry.channel) === normalizeText(channel) &&
    normalizeText(entry.consentType) === normalizeText(consentType) &&
    normalizeText(entry.status) === 'granted' &&
    (
      (phone && normalizeText(entry.phone) === normalizeText(phone)) ||
      (email && normalizeText(entry.email) === normalizeText(email)) ||
      (userId && normalizeText(entry.userId) === normalizeText(userId))
    )
  ));
}

export function buildMessagingComplianceRuntime(state, { channel, phone, email, userId } = {}) {
  const templates = state.messageTemplates
    .filter((template) => normalizeText(template.channel) === normalizeText(channel))
    .map((template) => ({
      ...template,
      allowed: template.status === 'active' &&
        (!template.requiresOptIn || hasGrantedConsent(state, {
          channel,
          consentType: template.category === 'marketing' ? 'marketing_consent' : `${channel}_consent`,
          phone,
          email,
          userId,
        })) &&
        !isUnsubscribed(state, {
          channel,
          phone,
          email,
          templateCategory: template.category,
        }),
    }));
  return {
    channel: normalizeText(channel),
    templates,
    sessionWindowHours: Math.max(...templates.map((template) => toNumber(template.sessionWindowHours, 0)), 0),
    unsubscribed: isUnsubscribed(state, { channel, phone, email, templateCategory: 'marketing' }),
  };
}

export function buildComplianceOverview(state) {
  const publishedDocuments = state.documents.filter((doc) => doc.status === 'published');
  const whatsappConsents = state.consents.filter((entry) => entry.channel === 'whatsapp' && entry.status === 'granted');
  const marketingConsents = state.consents.filter((entry) => entry.consentType === 'marketing_consent' && entry.status === 'granted');
  return {
    documentsByCategory: {
      legalContent: publishedDocuments.filter((doc) => doc.category === 'legal_content').length,
      commercialPolicies: publishedDocuments.filter((doc) => doc.category === 'commercial_policy').length,
      platformPolicies: publishedDocuments.filter((doc) => doc.category === 'platform_policy').length,
    },
    consentCounts: {
      total: state.consents.length,
      whatsappGranted: whatsappConsents.length,
      marketingGranted: marketingConsents.length,
    },
    unsubscribeCount: state.unsubscribes.length,
    policyAcceptanceCount: state.policyAcceptances.length,
    templateCount: state.messageTemplates.length,
    retentionRuleCount: state.retentionRules.length,
  };
}

export function applyRetentionRules(state, { otpChallenges = [], channelSessions = [] } = {}) {
  const now = Date.now();
  const findRule = (entity) => state.retentionRules.find((rule) => rule.entity === entity);
  const buildCutoff = (rule) => now - (Math.max(1, rule.retentionDays) * 24 * 60 * 60 * 1000);

  const next = {
    ...state,
    consents: [...state.consents],
    policyAcceptances: [...state.policyAcceptances],
    unsubscribes: [...state.unsubscribes],
  };
  const summary = {
    consentsRemoved: 0,
    policyAcceptancesRemoved: 0,
    unsubscribesRemoved: 0,
    otpChallengesRemoved: 0,
    channelSessionsRemoved: 0,
  };

  const consentRule = findRule('consent_records');
  if (consentRule && consentRule.action === 'delete') {
    const cutoff = buildCutoff(consentRule);
    const originalCount = next.consents.length;
    next.consents = next.consents.filter((entry) => new Date(entry.capturedAt).getTime() >= cutoff);
    summary.consentsRemoved = originalCount - next.consents.length;
  }

  const acceptanceRule = findRule('policy_acceptances');
  if (acceptanceRule && acceptanceRule.action === 'delete') {
    const cutoff = buildCutoff(acceptanceRule);
    const originalCount = next.policyAcceptances.length;
    next.policyAcceptances = next.policyAcceptances.filter((entry) => new Date(entry.acceptedAt).getTime() >= cutoff);
    summary.policyAcceptancesRemoved = originalCount - next.policyAcceptances.length;
  }

  const unsubscribeRule = findRule('unsubscribe_records');
  if (unsubscribeRule && unsubscribeRule.action === 'delete') {
    const cutoff = buildCutoff(unsubscribeRule);
    const originalCount = next.unsubscribes.length;
    next.unsubscribes = next.unsubscribes.filter((entry) => new Date(entry.unsubscribedAt).getTime() >= cutoff);
    summary.unsubscribesRemoved = originalCount - next.unsubscribes.length;
  }

  const otpRule = findRule('otp_challenges');
  const nextOtpChallenges = Array.isArray(otpChallenges)
    ? otpChallenges.filter((entry) => {
        if (!otpRule || otpRule.action !== 'delete') return true;
        const createdAt = new Date(entry.createdAt || entry.expiresAt || now).getTime();
        const keep = createdAt >= buildCutoff(otpRule);
        if (!keep) summary.otpChallengesRemoved += 1;
        return keep;
      })
    : [];

  const sessionRule = findRule('channel_sessions');
  const nextChannelSessions = Array.isArray(channelSessions)
    ? channelSessions.filter((entry) => {
        if (!sessionRule || sessionRule.action !== 'delete') return true;
        const createdAt = new Date(entry.updatedAt || entry.createdAt || now).getTime();
        const keep = createdAt >= buildCutoff(sessionRule);
        if (!keep) summary.channelSessionsRemoved += 1;
        return keep;
      })
    : [];

  next.metadata = {
    ...next.metadata,
    updatedAt: new Date().toISOString(),
  };

  return {
    state: next,
    summary,
    otpChallenges: nextOtpChallenges,
    channelSessions: nextChannelSessions,
  };
}
