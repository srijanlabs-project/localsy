# Localisy - Hyperlocal Business Directory API Design (v1)

This document defines the recommended API shape for Localisy as a multi-tenant hyperlocal business directory platform supporting search, chat, ingestion, merchant operations, and admin workflows.

## API Principles

- REST-first design for operational simplicity
- tenant context resolved through `localitySlug`, `localityId`, or channel context
- same knowledge services power Web, WhatsApp, and Mobile
- search and chat should be grounded in both business listings and documents
- ingestion must preserve source lineage and duplicate review state

## Base URL

```text
/api/v1
```

## Core Domains

- `auth`
- `cities`
- `localities`
- `categories`
- `businesses`
- `documents`
- `ingestion`
- `search`
- `chat`
- `channels`
- `merchant`
- `moderation`
- `admin`
- `analytics`

## 1. Auth APIs

### POST `/api/v1/auth/login`

Authenticate admin or operator users.

Request:

```json
{
  "email": "admin@localisy.in",
  "password": "secret"
}
```

Response:

```json
{
  "ok": true,
  "token": "jwt-token",
  "user": {
    "id": "usr_123",
    "name": "Locality Admin",
    "role": "locality_admin",
    "localityIds": ["loc_roadpali"]
  }
}
```

### GET `/api/v1/auth/me`

Returns authenticated profile and tenant scope.

## 2. City APIs

### GET `/api/v1/cities`

List active cities.

Query params:

- `status`
- `countryCode`

### GET `/api/v1/cities/:citySlug`

Return city metadata for public page load.

Response:

```json
{
  "ok": true,
  "city": {
    "id": "city_navi_mumbai",
    "slug": "navi-mumbai",
    "name": "Navi Mumbai",
    "stateName": "Maharashtra",
    "countryCode": "IN"
  }
}
```

### GET `/api/v1/national/summary`

Aggregate metadata for the national page.

### GET `/api/v1/localities`

List active localities.

Query params:

- `cityId`
- `status`

### GET `/api/v1/localities/:localitySlug`

Return locality metadata for public page load.

## 3. Category APIs

### GET `/api/v1/categories`

Return business taxonomy for filters, cards, and channel prompts.

## 4. Business APIs

### GET `/api/v1/businesses`

List canonical business listings using structured filters.

Query params:

- `localityId`
- `cityId`
- `scope=national|city|locality`
- `listingType`
- `categoryId`
- `subcategoryId`
- `q`
- `language`
- `lat`
- `lng`
- `radiusKm`
- `page`
- `pageSize`

Response:

```json
{
  "ok": true,
  "items": [
    {
      "id": "biz_101",
      "localityId": "loc_roadpali",
      "listingType": "service_business",
      "name": "Spark Electric Works",
      "description": "Local electrician service for home and shop repair",
      "categoryId": "home-services",
      "subcategoryId": "electricians",
      "listingUrl": "/roadpali/home-services/spark-electric-works-biz_101",
      "contacts": [
        {
          "type": "phone",
          "label": "Main business phone",
          "value": "+91 9876543210"
        }
      ],
      "location": {
        "address": "Sector 12, Navi Mumbai",
        "latitude": 19.033,
        "longitude": 73.029
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 124
  }
}
```

### GET `/api/v1/businesses/:businessId`

Return full listing detail, business contacts, reviews, locality context, and linked documents.

### POST `/api/v1/businesses`

Create business listing manually from admin.

### PATCH `/api/v1/businesses/:businessId`

Update listing fields.

### POST `/api/v1/businesses/:businessId/relationships`

Add relationship to another listing or source document.

## 5. Document APIs

### GET `/api/v1/documents`

List documents for a locality.

Query params:

- `localityId`
- `cityId`
- `documentType`
- `sourceType`
- `status`

### GET `/api/v1/documents/:documentId`

Return document metadata, ingest status, and linked listings.

### GET `/api/v1/documents/:documentId/chunks`

Admin-only inspection endpoint for chunked content.

## 6. Search APIs

### POST `/api/v1/search/query`

Main hybrid search endpoint for Web and Mobile.

Request:

```json
{
  "scope": "locality",
  "localityId": "loc_roadpali",
  "query": "Find electricians in Roadpali",
  "language": "en",
  "channel": "web",
  "filters": {
    "categoryIds": ["home-services"],
    "subcategoryIds": ["electricians"],
    "radiusKm": 10
  }
}
```

Response:

```json
{
  "ok": true,
  "queryAnalysis": {
    "detectedLanguage": "en",
    "intent": "location_search",
    "scopeResolved": "locality"
  },
  "results": {
    "businesses": [
      {
        "id": "biz_12",
        "name": "Shree Sai Electric Services",
        "listingType": "service_business",
        "categoryId": "home-services",
        "subcategoryId": "electricians",
        "localityId": "loc_roadpali",
        "listingUrl": "/roadpali/home-services/shree-sai-electric-services-biz_12",
        "score": 0.94
      }
    ],
    "documents": [
      {
        "id": "doc_55",
        "title": "Emergency Resource Guide",
        "score": 0.72
      }
    ]
  },
  "latencyMs": 410
}
```

### POST `/api/v1/search/suggest`

Return typeahead suggestions based on businesses, aliases, services, and categories.

### POST `/api/v1/search/reverse-geocode`

Optional helper for resolving locality or city scope from coordinates.

## 7. Chat APIs

### POST `/api/v1/chat/session`

Create a new session for Web, Mobile, or channel usage.

Request:

```json
{
  "localityId": "loc_roadpali",
  "channel": "web",
  "language": "en",
  "userHandle": "anon-browser-session"
}
```

Response:

```json
{
  "ok": true,
  "session": {
    "id": "chat_sess_1001",
    "localityId": "loc_roadpali",
    "channel": "web",
    "detectedLanguage": "en"
  }
}
```

### POST `/api/v1/chat/message`

Main RAG answer endpoint.

Request:

```json
{
  "sessionId": "chat_sess_1001",
  "message": "Show me good family salons in Roadpali",
  "channel": "web",
  "localityId": "loc_roadpali"
}
```

Response:

```json
{
  "ok": true,
  "answer": {
    "text": "Here are the most relevant family salon options in Roadpali.",
    "language": "en",
    "followUpSuggestions": [
      "Show salons under 3 km",
      "Share phone numbers",
      "Show top rated options"
    ]
  },
  "cards": [
    {
      "type": "business",
      "businessId": "biz_44",
      "title": "Barberry Bliss Family Salon",
      "subtitle": "Family salon and grooming services",
      "contactPhone": "+91 9999999999",
      "listingUrl": "/roadpali/salon/barberry-bliss-family-salon-biz_44"
    }
  ],
  "citations": [
    {
      "type": "document_chunk",
      "documentId": "doc_55",
      "pageNumber": 8,
      "label": "CAN reference guide"
    }
  ],
  "latencyMs": 980
}
```

### GET `/api/v1/chat/session/:sessionId/messages`

Return chat history for the current session.

## 8. WhatsApp Channel APIs

### POST `/api/v1/channels/whatsapp/webhook`

Inbound WhatsApp webhook receiver.

Responsibilities:

- validate webhook
- normalize incoming message
- resolve phone-to-session mapping
- call chat service
- format top listing cards and listing URLs
- return formatted outbound response

WhatsApp business-directory response rules:

- if one listing clearly answers the query, send one listing URL with a short reason
- if multiple listings are relevant, send the top 3 listing URLs in ranked order
- if confidence is low, send a clarifying question before sending weak matches
- when useful, attach contact cards after the listing URLs
- when the answer is grounded in a document, add one short supporting line and optional source link

### POST `/api/v1/channels/whatsapp/send`

Internal endpoint for sending templated, card-based, or listing-link outbound replies.

## 9. Ingestion APIs

### POST `/api/v1/ingestion/jobs`

Create a new ingestion job for PDF, Excel, CSV, or manual batch import.

Multipart fields:

- `localityId`
- `sourceType`
- `file`
- `documentType`
- `language`

Response:

```json
{
  "ok": true,
  "job": {
    "id": "ing_job_2001",
    "status": "queued",
    "localityId": "loc_roadpali",
    "sourceType": "csv"
  }
}
```

### GET `/api/v1/ingestion/jobs/:jobId`

Return ingestion progress and summary counts.

### GET `/api/v1/ingestion/jobs/:jobId/source-records`

Return parsed source rows for admin review.

### POST `/api/v1/ingestion/jobs/:jobId/commit`

Commit reviewed rows into canonical listings and documents.

## 10. Deduplication APIs

### GET `/api/v1/admin/duplicates`

Return probable duplicate candidates.

Query params:

- `localityId`
- `reviewStatus`
- `minConfidence`

### POST `/api/v1/admin/duplicates/:candidateId/resolve`

Resolve duplicate candidate.

Request:

```json
{
  "action": "merge",
  "targetBusinessId": "biz_44"
}
```

Supported actions:

- `merge`
- `keep_separate`
- `create_new_listing`

## 11. Analytics APIs

### GET `/api/v1/analytics/search`

Return search volume, latency, and result metrics.

### GET `/api/v1/analytics/chat`

Return chat response quality and usage metrics.

### GET `/api/v1/analytics/whatsapp`

Return WhatsApp-specific operational metrics.

Useful metrics:

- total conversations
- average resolution time
- fallback rate
- unresolved query rate

## 12. Internal Service Boundaries

The Go backend should likely separate these internal modules:

- `tenant-service`
- `locality-service`
- `business-service`
- `document-service`
- `ingestion-service`
- `dedupe-service`
- `search-service`
- `chat-service`
- `channel-service`
- `analytics-service`

## 13. Search Flow

For `POST /search/query`:

1. Validate tenant scope
2. Detect language
3. Detect intent
4. Build SQL filters
5. Run structured retrieval
6. Run vector retrieval
7. Rerank results
8. Log search event
9. Return merged response

## 14. Chat Flow

For `POST /chat/message`:

1. Resolve session
2. Detect language and intent
3. Read recent session context from Redis
4. Run hybrid retrieval
5. Construct grounded prompt
6. Generate answer
7. Persist message and citations
8. Return answer and cards

## 15. Error Format

Recommended shared error response:

```json
{
  "ok": false,
  "error": {
    "code": "LISTING_NOT_FOUND",
    "message": "Requested listing could not be found.",
    "details": null
  }
}
```

## 16. Non-Functional Targets

- search p95 latency: under 1 second when possible
- chat p95 latency: under 3 seconds when possible
- ingestion: asynchronous
- WhatsApp: idempotent webhook handling

## 17. Recommended Next Step

Translate this API design into:

- OpenAPI spec
- handler package structure in Go
- request and response DTOs
- auth and permission middleware
