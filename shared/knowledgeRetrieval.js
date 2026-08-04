function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeQueryText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0900-\u097f\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeQueryText(value)
    .split(/[\s/-]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 256);
}

function uniqueStrings(values) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  ));
}

function toIso(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
}

function buildId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function flattenRecord(value, prefix = '') {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenRecord(entry, prefix ? `${prefix}[${index}]` : `[${index}]`));
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => flattenRecord(entry, prefix ? `${prefix}.${key}` : key));
  }
  const label = prefix ? `${prefix}: ` : '';
  return [`${label}${String(value).trim()}`];
}

function stringifyStructuredRows(rows = []) {
  return rows
    .map((row, index) => {
      const flattened = flattenRecord(row).filter(Boolean);
      return flattened.length > 0 ? `Row ${index + 1}\n${flattened.join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function stringifySheet(sheet, index) {
  const title = normalizeText(sheet?.name || `Sheet ${index + 1}`) || `Sheet ${index + 1}`;
  const rows = Array.isArray(sheet?.rows) ? sheet.rows : [];
  return `${title}\n${stringifyStructuredRows(rows)}`.trim();
}

function stringifyPdfPages(pages = []) {
  return pages
    .map((page, index) => {
      const chunks = [];
      const pageNumber = Number(page?.pageNumber || index + 1);
      if (page?.text) chunks.push(normalizeText(page.text));
      if (page?.ocrText) chunks.push(normalizeText(page.ocrText));
      return chunks.length > 0 ? `Page ${pageNumber}\n${chunks.join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function buildEmbedding(text, dimensions = 24) {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = ((hash << 5) - hash) + token.charCodeAt(index);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % dimensions;
    vector[bucket] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0));
  if (!magnitude) return vector;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function cosineSimilarity(left = [], right = []) {
  const length = Math.min(left.length, right.length);
  if (!length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < length; index += 1) {
    const leftValue = Number(left[index] || 0);
    const rightValue = Number(right[index] || 0);
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function topKeywords(text, limit = 12) {
  const counts = new Map();
  for (const token of tokenize(text)) {
    if (token.length <= 2) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function chunkText(text, chunkSize = 520, overlap = 80) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const sentences = normalized
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (sentences.length === 0) return [normalized];

  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }
    if (current) {
      chunks.push(current.trim());
    }
    if (sentence.length <= chunkSize) {
      current = sentence;
      continue;
    }
    let cursor = 0;
    while (cursor < sentence.length) {
      const slice = sentence.slice(cursor, cursor + chunkSize).trim();
      if (slice) chunks.push(slice);
      cursor += Math.max(1, chunkSize - overlap);
    }
    current = '';
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function sanitizeKnowledgeSource(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: String(source.id || '').trim() || buildId('src'),
    sourceType: ['pdf', 'excel', 'api', 'manual'].includes(String(source.sourceType || '')) ? String(source.sourceType) : 'manual',
    title: normalizeText(source.title || 'Knowledge source'),
    sourceUrl: normalizeText(source.sourceUrl || ''),
    localityIds: uniqueStrings(source.localityIds),
    categoryIds: uniqueStrings(source.categoryIds),
    language: String(source.language || 'en').trim() || 'en',
    status: String(source.status || 'active').trim() || 'active',
    uploadedBy: normalizeText(source.uploadedBy || ''),
    createdAt: toIso(source.createdAt),
    updatedAt: toIso(source.updatedAt),
    documentIds: uniqueStrings(source.documentIds),
    recordCount: Math.max(0, Number(source.recordCount || 0)),
    keywords: uniqueStrings(source.keywords),
    metadata: source.metadata && typeof source.metadata === 'object' ? source.metadata : {},
  };
}

function sanitizeKnowledgeDocument(value) {
  const document = value && typeof value === 'object' ? value : {};
  return {
    id: String(document.id || '').trim() || buildId('doc'),
    sourceId: String(document.sourceId || '').trim(),
    title: normalizeText(document.title || 'Knowledge document'),
    sourceType: ['pdf', 'excel', 'api', 'manual'].includes(String(document.sourceType || '')) ? String(document.sourceType) : 'manual',
    language: String(document.language || 'en').trim() || 'en',
    localityIds: uniqueStrings(document.localityIds),
    categoryIds: uniqueStrings(document.categoryIds),
    content: normalizeText(document.content || ''),
    chunkIds: uniqueStrings(document.chunkIds),
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
    metadata: document.metadata && typeof document.metadata === 'object' ? document.metadata : {},
  };
}

function sanitizeKnowledgeChunk(value, settings) {
  const chunk = value && typeof value === 'object' ? value : {};
  const text = normalizeText(chunk.text || '');
  return {
    id: String(chunk.id || '').trim() || buildId('chunk'),
    sourceId: String(chunk.sourceId || '').trim(),
    documentId: String(chunk.documentId || '').trim(),
    language: String(chunk.language || 'en').trim() || 'en',
    localityIds: uniqueStrings(chunk.localityIds),
    categoryIds: uniqueStrings(chunk.categoryIds),
    text,
    keywords: uniqueStrings(chunk.keywords && chunk.keywords.length > 0 ? chunk.keywords : topKeywords(text)),
    embedding: Array.isArray(chunk.embedding) && chunk.embedding.length > 0
      ? chunk.embedding.map((entry) => Number(entry || 0))
      : buildEmbedding(text, Number(settings?.embeddingDimensions || 24)),
    embeddingModelVersion: normalizeText(chunk.embeddingModelVersion || settings?.embeddingModelVersion || 'local-hash-v1'),
    tokenCount: tokenize(text).length,
    createdAt: toIso(chunk.createdAt),
    updatedAt: toIso(chunk.updatedAt),
    metadata: chunk.metadata && typeof chunk.metadata === 'object' ? chunk.metadata : {},
  };
}

function sanitizeKnowledgeSession(value) {
  const session = value && typeof value === 'object' ? value : {};
  return {
    id: String(session.id || '').trim() || buildId('session'),
    channel: normalizeText(session.channel || 'web') || 'web',
    lastQuery: normalizeText(session.lastQuery || ''),
    effectiveQuery: normalizeText(session.effectiveQuery || ''),
    language: String(session.language || 'en').trim() || 'en',
    intent: normalizeText(session.intent || ''),
    localityId: normalizeText(session.localityId || ''),
    categoryId: normalizeText(session.categoryId || ''),
    recentResults: Array.isArray(session.recentResults)
      ? session.recentResults
        .map((entry) => (
          entry && typeof entry === 'object'
            ? {
              type: normalizeText(entry.type || 'citation') || 'citation',
              id: normalizeText(entry.id || ''),
              label: normalizeText(entry.label || ''),
              url: normalizeText(entry.url || ''),
              score: Number(entry.score || 0),
            }
            : null
        ))
        .filter(Boolean)
        .slice(0, 8)
      : [],
    history: Array.isArray(session.history)
      ? session.history
        .map((entry) => (
          entry && typeof entry === 'object'
            ? {
              query: normalizeText(entry.query || ''),
              effectiveQuery: normalizeText(entry.effectiveQuery || ''),
              at: toIso(entry.at),
            }
            : null
        ))
        .filter(Boolean)
        .slice(-8)
      : [],
    updatedAt: toIso(session.updatedAt),
  };
}

export function sanitizeKnowledgeRetrievalState(value) {
  const source = value && typeof value === 'object' ? value : {};
  const settings = {
    chunkSize: Math.max(240, Number(source.settings?.chunkSize || 520)),
    chunkOverlap: Math.max(20, Number(source.settings?.chunkOverlap || 80)),
    embeddingDimensions: Math.max(12, Number(source.settings?.embeddingDimensions || 24)),
    embeddingModelVersion: normalizeText(source.settings?.embeddingModelVersion || 'local-hash-v1') || 'local-hash-v1',
    sessionRetentionDays: Math.max(1, Number(source.settings?.sessionRetentionDays || 7)),
  };
  const sources = Array.isArray(source.sources) ? source.sources.map(sanitizeKnowledgeSource).filter((entry) => entry.title) : [];
  const documents = Array.isArray(source.documents) ? source.documents.map(sanitizeKnowledgeDocument).filter((entry) => entry.sourceId) : [];
  const chunks = Array.isArray(source.chunks) ? source.chunks.map((entry) => sanitizeKnowledgeChunk(entry, settings)).filter((entry) => entry.documentId && entry.text) : [];
  const sessions = Array.isArray(source.sessions) ? source.sessions.map(sanitizeKnowledgeSession).filter((entry) => entry.id) : [];
  return {
    sources,
    documents,
    chunks,
    sessions,
    settings,
    metadata: {
      updatedAt: toIso(source.metadata?.updatedAt),
      seededFromCode: source.metadata?.seededFromCode !== false,
    },
  };
}

function buildDocumentContent(sourceType, payload = {}) {
  if (sourceType === 'pdf') {
    const body = [
      normalizeText(payload.text || ''),
      stringifyPdfPages(Array.isArray(payload.pages) ? payload.pages : []),
      normalizeText(payload.ocrText || ''),
    ].filter(Boolean).join('\n\n');
    return body;
  }
  if (sourceType === 'excel') {
    const sheets = Array.isArray(payload.sheets) ? payload.sheets : [];
    const body = sheets.length > 0
      ? sheets.map((sheet, index) => stringifySheet(sheet, index)).join('\n\n')
      : stringifyStructuredRows(Array.isArray(payload.rows) ? payload.rows : []);
    return normalizeText([normalizeText(payload.text || ''), body].filter(Boolean).join('\n\n'));
  }
  if (sourceType === 'api') {
    return normalizeText([
      normalizeText(payload.text || ''),
      stringifyStructuredRows(Array.isArray(payload.records) ? payload.records : []),
    ].filter(Boolean).join('\n\n'));
  }
  return normalizeText(payload.text || stringifyStructuredRows(Array.isArray(payload.records) ? payload.records : []));
}

export function ingestKnowledgeSource(state, payload = {}) {
  const sanitizedState = sanitizeKnowledgeRetrievalState(state);
  const sourceType = ['pdf', 'excel', 'api', 'manual'].includes(String(payload.sourceType || '')) ? String(payload.sourceType) : 'manual';
  const content = buildDocumentContent(sourceType, payload);
  if (!content) {
    throw new Error('Knowledge source content is required');
  }

  const createdAt = nowIso();
  const sourceId = String(payload.sourceId || '').trim() || buildId('src');
  const documentId = String(payload.documentId || '').trim() || buildId('doc');
  const title = normalizeText(payload.title || payload.fileName || `${sourceType.toUpperCase()} knowledge source`) || `${sourceType.toUpperCase()} knowledge source`;
  const localityIds = uniqueStrings(payload.localityIds || [payload.localityId]);
  const categoryIds = uniqueStrings(payload.categoryIds || [payload.categoryId]);
  const keywords = topKeywords(content);
  const chunks = chunkText(content, sanitizedState.settings.chunkSize, sanitizedState.settings.chunkOverlap)
    .map((text, index) => sanitizeKnowledgeChunk({
      id: buildId('chunk'),
      sourceId,
      documentId,
      language: payload.language || 'en',
      localityIds,
      categoryIds,
      text,
      keywords: topKeywords(text, 8),
      embeddingModelVersion: sanitizedState.settings.embeddingModelVersion,
      metadata: {
        chunkIndex: index,
      },
      createdAt,
      updatedAt: createdAt,
    }, sanitizedState.settings));

  const document = sanitizeKnowledgeDocument({
    id: documentId,
    sourceId,
    title,
    sourceType,
    language: payload.language || 'en',
    localityIds,
    categoryIds,
    content,
    chunkIds: chunks.map((chunk) => chunk.id),
    createdAt,
    updatedAt: createdAt,
    metadata: {
      pageCount: Array.isArray(payload.pages) ? payload.pages.length : undefined,
      sheetCount: Array.isArray(payload.sheets) ? payload.sheets.length : undefined,
      recordCount: Array.isArray(payload.records) ? payload.records.length : undefined,
      ocrApplied: Boolean(payload.ocrText || (Array.isArray(payload.pages) && payload.pages.some((page) => page?.ocrText))),
      keywords,
    },
  });

  const source = sanitizeKnowledgeSource({
    id: sourceId,
    sourceType,
    title,
    sourceUrl: payload.sourceUrl || payload.endpoint || '',
    localityIds,
    categoryIds,
    language: payload.language || 'en',
    status: 'active',
    uploadedBy: payload.uploadedBy || '',
    createdAt,
    updatedAt: createdAt,
    documentIds: [document.id],
    recordCount: Array.isArray(payload.records) ? payload.records.length : chunks.length,
    keywords,
    metadata: {
      ingestionMode: payload.ingestionMode || 'manual',
      endpoint: payload.endpoint || undefined,
    },
  });

  return sanitizeKnowledgeRetrievalState({
    ...sanitizedState,
    sources: [source, ...sanitizedState.sources.filter((entry) => entry.id !== source.id)],
    documents: [document, ...sanitizedState.documents.filter((entry) => entry.id !== document.id)],
    chunks: [...chunks, ...sanitizedState.chunks.filter((entry) => entry.documentId !== document.id)],
    metadata: {
      ...sanitizedState.metadata,
      updatedAt: createdAt,
    },
  });
}

export function reembedKnowledgeState(state, options = {}) {
  const sanitizedState = sanitizeKnowledgeRetrievalState(state);
  const nextVersion = normalizeText(options.modelVersion || options.embeddingModelVersion || `${sanitizedState.settings.embeddingModelVersion}-r2`) || `${sanitizedState.settings.embeddingModelVersion}-r2`;
  return sanitizeKnowledgeRetrievalState({
    ...sanitizedState,
    chunks: sanitizedState.chunks.map((chunk) => ({
      ...chunk,
      embedding: buildEmbedding(chunk.text, sanitizedState.settings.embeddingDimensions),
      embeddingModelVersion: nextVersion,
      updatedAt: nowIso(),
    })),
    settings: {
      ...sanitizedState.settings,
      embeddingModelVersion: nextVersion,
    },
    metadata: {
      ...sanitizedState.metadata,
      updatedAt: nowIso(),
    },
  });
}

function overlapsAllFilters(candidateValues, requestedValues) {
  if (!requestedValues || requestedValues.length === 0) return true;
  if (!candidateValues || candidateValues.length === 0) return true;
  const candidateSet = new Set(candidateValues);
  return requestedValues.some((value) => candidateSet.has(value));
}

export function retrieveKnowledgeMatches(state, {
  query = '',
  localityId = '',
  categoryId = '',
  limit = 5,
} = {}) {
  const sanitizedState = sanitizeKnowledgeRetrievalState(state);
  const normalizedQuery = normalizeQueryText(query);
  const queryTokens = tokenize(normalizedQuery);
  const queryEmbedding = buildEmbedding(normalizedQuery, sanitizedState.settings.embeddingDimensions);
  const requestedLocalityIds = uniqueStrings([localityId]);
  const requestedCategoryIds = uniqueStrings([categoryId]);
  const documentMap = new Map(sanitizedState.documents.map((document) => [document.id, document]));
  const sourceMap = new Map(sanitizedState.sources.map((source) => [source.id, source]));

  const scoredChunks = sanitizedState.chunks
    .filter((chunk) => overlapsAllFilters(chunk.localityIds, requestedLocalityIds))
    .filter((chunk) => overlapsAllFilters(chunk.categoryIds, requestedCategoryIds))
    .map((chunk) => {
      const lexicalHits = queryTokens.filter((token) => chunk.text.toLowerCase().includes(token)).length;
      const keywordHits = queryTokens.filter((token) => chunk.keywords.includes(token)).length;
      const lexicalScore = queryTokens.length > 0 ? lexicalHits / queryTokens.length : 0;
      const keywordScore = queryTokens.length > 0 ? keywordHits / queryTokens.length : 0;
      const vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      const hybridScore = (vectorScore * 0.55) + (lexicalScore * 0.3) + (keywordScore * 0.15);
      const document = documentMap.get(chunk.documentId) || null;
      const source = sourceMap.get(chunk.sourceId) || null;
      return {
        id: chunk.id,
        chunkId: chunk.id,
        documentId: chunk.documentId,
        sourceId: chunk.sourceId,
        title: document?.title || source?.title || 'Knowledge snippet',
        sourceType: document?.sourceType || source?.sourceType || 'manual',
        text: chunk.text,
        snippet: chunk.text.slice(0, 280),
        keywords: chunk.keywords,
        vectorScore: Number(vectorScore.toFixed(4)),
        lexicalScore: Number(lexicalScore.toFixed(4)),
        keywordScore: Number(keywordScore.toFixed(4)),
        hybridScore: Number(hybridScore.toFixed(4)),
        sourceUrl: source?.sourceUrl || '',
        localityIds: chunk.localityIds,
        categoryIds: chunk.categoryIds,
      };
    })
    .filter((entry) => entry.hybridScore > 0 || normalizedQuery.length === 0);

  const maxResults = Math.max(1, Math.min(Number(limit) || 5, 8));
  const vectorResults = [...scoredChunks]
    .sort((left, right) => right.vectorScore - left.vectorScore || right.hybridScore - left.hybridScore)
    .slice(0, maxResults);
  const keywordResults = [...scoredChunks]
    .sort((left, right) => right.lexicalScore - left.lexicalScore || right.keywordScore - left.keywordScore || right.hybridScore - left.hybridScore)
    .slice(0, maxResults);
  const hybridResults = [...scoredChunks]
    .sort((left, right) => right.hybridScore - left.hybridScore || right.vectorScore - left.vectorScore)
    .slice(0, maxResults);

  return {
    normalizedQuery,
    sqlRetrievalReady: true,
    vectorResults,
    keywordResults,
    hybridResults,
    citations: hybridResults.slice(0, 3).map((entry) => ({
      type: 'document',
      id: entry.chunkId,
      label: entry.title,
      snippet: entry.snippet,
      url: entry.sourceUrl || null,
      score: entry.hybridScore,
    })),
  };
}

export function readKnowledgeSession(state, sessionId) {
  if (!sessionId) return null;
  const sanitizedState = sanitizeKnowledgeRetrievalState(state);
  return sanitizedState.sessions.find((entry) => entry.id === String(sessionId || '').trim()) || null;
}

export function resolveKnowledgeFollowUpQuery(query, session) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return '';
  if (!session?.effectiveQuery) return normalizedQuery;
  if (normalizedQuery.length > 60) return normalizedQuery;
  if (/^(show|only|what about|and|also|nearby|top|best|verified|open now|share)/i.test(normalizedQuery)) {
    return `${session.effectiveQuery}. ${normalizedQuery}`.trim();
  }
  return normalizedQuery;
}

export function upsertKnowledgeSession(state, payload = {}) {
  const sanitizedState = sanitizeKnowledgeRetrievalState(state);
  const sessionId = String(payload.sessionId || payload.id || '').trim();
  if (!sessionId) return sanitizedState;
  const existing = sanitizedState.sessions.find((entry) => entry.id === sessionId) || null;
  const nextSession = sanitizeKnowledgeSession({
    id: sessionId,
    channel: payload.channel || existing?.channel || 'web',
    lastQuery: payload.lastQuery || '',
    effectiveQuery: payload.effectiveQuery || payload.lastQuery || '',
    language: payload.language || existing?.language || 'en',
    intent: payload.intent || existing?.intent || '',
    localityId: payload.localityId || existing?.localityId || '',
    categoryId: payload.categoryId || existing?.categoryId || '',
    recentResults: Array.isArray(payload.recentResults) && payload.recentResults.length > 0
      ? payload.recentResults
      : existing?.recentResults || [],
    history: [
      ...(existing?.history || []),
      {
        query: payload.lastQuery || '',
        effectiveQuery: payload.effectiveQuery || payload.lastQuery || '',
        at: nowIso(),
      },
    ].filter((entry) => entry.query).slice(-8),
    updatedAt: nowIso(),
  });
  const cutoffMs = Date.now() - (sanitizedState.settings.sessionRetentionDays * 24 * 60 * 60 * 1000);
  const sessions = [
    nextSession,
    ...sanitizedState.sessions.filter((entry) => entry.id !== sessionId),
  ].filter((entry) => {
    const updatedAtMs = new Date(entry.updatedAt).getTime();
    return Number.isFinite(updatedAtMs) ? updatedAtMs >= cutoffMs : true;
  }).slice(0, 200);
  return sanitizeKnowledgeRetrievalState({
    ...sanitizedState,
    sessions,
    metadata: {
      ...sanitizedState.metadata,
      updatedAt: nowIso(),
    },
  });
}

export function buildKnowledgeOverview(state) {
  const sanitizedState = sanitizeKnowledgeRetrievalState(state);
  const sourcesByType = sanitizedState.sources.reduce((accumulator, source) => {
    accumulator[source.sourceType] = (accumulator[source.sourceType] || 0) + 1;
    return accumulator;
  }, {});
  const chunksByLanguage = sanitizedState.chunks.reduce((accumulator, chunk) => {
    accumulator[chunk.language] = (accumulator[chunk.language] || 0) + 1;
    return accumulator;
  }, {});
  return {
    totalSources: sanitizedState.sources.length,
    totalDocuments: sanitizedState.documents.length,
    totalChunks: sanitizedState.chunks.length,
    totalSessions: sanitizedState.sessions.length,
    embeddingModelVersion: sanitizedState.settings.embeddingModelVersion,
    sourcesByType,
    chunksByLanguage,
    topKeywords: Array.from(new Set(sanitizedState.sources.flatMap((source) => source.keywords))).slice(0, 16),
  };
}

export function formatGroundedResponse({
  language = 'en',
  localityId = '',
  listings = [],
  knowledgeCitations = [],
  effectiveQuery = '',
} = {}) {
  const hasListings = Array.isArray(listings) && listings.length > 0;
  const hasKnowledge = Array.isArray(knowledgeCitations) && knowledgeCitations.length > 0;
  if (language === 'hi') {
    if (hasListings && hasKnowledge) {
      return `मुझे "${effectiveQuery}" के लिए ${listings.length} प्रासंगिक लिस्टिंग मिलीं${localityId ? ` (${localityId})` : ''}। साथ में ज्ञान स्रोतों से अतिरिक्त संदर्भ भी मिला है।`;
    }
    if (hasListings) {
      return `मुझे "${effectiveQuery}" के लिए ${listings.length} प्रासंगिक लिस्टिंग मिलीं${localityId ? ` (${localityId})` : ''}।`;
    }
    if (hasKnowledge) {
      return `सटीक लिस्टिंग कम मिली, लेकिन ज्ञान स्रोतों से उपयोगी संदर्भ मिला है।`;
    }
    return `अभी सटीक परिणाम नहीं मिला। आप locality, category, या verified filter के साथ फिर से पूछ सकते हैं।`;
  }
  if (hasListings && hasKnowledge) {
    return `I found ${listings.length} relevant listings${localityId ? ` in ${localityId}` : ''} and added supporting context from knowledge sources for "${effectiveQuery}".`;
  }
  if (hasListings) {
    return `I found ${listings.length} relevant listings${localityId ? ` in ${localityId}` : ''} for "${effectiveQuery}".`;
  }
  if (hasKnowledge) {
    return `I could not find a strong listing match, but I did find supporting information from knowledge sources for "${effectiveQuery}".`;
  }
  return `I could not find a strong match for "${effectiveQuery}". Try a broader category, another locality, or a verified-only search.`;
}
