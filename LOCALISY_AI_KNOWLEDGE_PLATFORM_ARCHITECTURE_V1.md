# Localisy - Multi-Tenant Hyperlocal Business Directory Platform Architecture (v1)

## 1. Vision

Localisy should be positioned as a multi-tenant hyperlocal business and services directory platform for locality-level, city-level, and national-level discovery, not as a single PDF search tool.

The product goal is to let users discover trusted local businesses, services, and offers through structured listings, documents, and AI-assisted search, then receive grounded answers across Web, WhatsApp, and Mobile.

The CAN-related PDF should be treated as the first knowledge source, not the product itself.

## 2. Core Product Framing

Localisy is an AI-assisted hyperlocal directory and merchant discovery layer that combines:

- Structured business listings
- Documents
- Geolocation
- Categories and metadata
- Multilingual retrieval
- RAG-based answer generation
- Multi-channel delivery

This allows Localisy to answer many types of user queries, not just keyword search.

## 3. Confirmed Business Decisions

Based on the current discussion, the following decisions are now considered the v1 baseline:

- Tenant model: Locality
- Public experience: national page plus city pages plus locality-scoped knowledge
- Storage model: shared database with tenant scoping
- Query model: users ask many types of natural-language questions
- Listing uniqueness: the same business or directory listing should not be created twice
- Duplicate uploads: duplicate source data may arrive, but the system should detect likely existing listings before creating new records
- Data change frequency: low; typically once every 1-2 months or less
- Entity coverage: broad; all relevant categories should be supported
- Language support: multilingual from the start
- Channels in scope: Web, WhatsApp, and Mobile
- WhatsApp flow: ask a question, get top results, ask follow-ups, and receive listing URLs, contact cards, and supporting links that answer the query
- Feedback loop: hold for later phase
- Security priority: PII handling matters
- Success metrics:
  - answer accuracy
  - response time
  - multilingual quality
  - WhatsApp resolution rate

## 4. Recommended Tenancy Model

### 4.1 Locality as the tenant

Each locality should act as the primary tenant boundary.

Examples:

- Roadpali
- Kalamboli
- Kharghar
- Vashi

### 4.2 City and national pages as aggregate layers

Neither the city page nor the national page should behave like a normal locality tenant.

Recommended hierarchy:

- Locality page: primary tenant-scoped knowledge surface
- City page: aggregate discovery layer across localities in one city
- National page: aggregate discovery layer across all cities and localities

Recommended behavior:

- Locality page: answers scoped to one locality tenant by default
- City page: answers may search across all localities within the selected city
- National page: answers may search across all cities and localities
- Tenant-aware ranking should prefer in-locality results first, then same-city results, then national results when context is known

### 4.3 Shared database model

Use one PostgreSQL database with tenant-aware tables and row-level scoping via `locality_id` or `tenant_id`.

Benefits:

- simpler operations
- easier cross-locality and cross-city reporting
- easier national aggregation
- lower cost than isolated databases for each locality

## 5. Knowledge Sources

Localisy should ingest both structured and unstructured data.

### 5.1 Phase 1 knowledge sources

Recommended v1 sources:

- PDF
- Excel
- CSV
- Manual admin entry

### 5.2 Later phase sources

Recommended phase 2 or later:

- Website crawling
- API ingestion
- Scheduled sync connectors

### 5.3 Source-of-truth approach

The same real-world business or directory listing may appear in multiple source files. The system should not create separate listings for each source record.

Recommended model:

- One canonical listing
- Many source records linked to that listing
- One ingestion review path for likely duplicates

## 6. Knowledge Model

Localisy should model knowledge in two parallel layers:

1. Structured knowledge
2. Document knowledge

### 6.1 Structured listings

All domain objects should be stored as directory listings with flexible classification.

Suggested v1 listing types:

- Salon and beauty
- Restaurants and food
- Grocery and retail
- Clinics and pharmacies
- Electricians and plumbers
- Home services
- Repair services
- Fitness and gyms
- Education and coaching
- Professional services
- Local shops and merchants

### 6.2 Shared listing fields

Each listing should support:

- `id`
- `tenant_id` or `locality_id`
- `listing_type`
- `name`
- `description`
- `category_id`
- `subcategory_id`
- `status`
- `language`
- `address`
- `latitude`
- `longitude`
- `contact_phone`
- `contact_email`
- `website`
- `working_hours`
- `source_confidence`
- `verification_status`
- `last_verified_at`
- `created_at`
- `updated_at`

### 6.3 Documents

Documents should be first-class records, not just file attachments.

Each document should support:

- `id`
- `tenant_id`
- `document_type`
- `title`
- `source_type`
- `file_path` or object storage key
- `language`
- `checksum`
- `version`
- `published_at`
- `ingested_at`
- `embedding_status`

### 6.4 Document chunks

RAG should run on chunked document content, not entire PDFs.

Each chunk should support:

- `document_id`
- `chunk_index`
- `content`
- `language`
- `page_number`
- `section_title`
- `embedding`
- `metadata`

### 6.5 Relationships

Relationships are critical for knowledge quality.

Examples:

- business -> belongs to category
- business -> belongs to locality
- business -> serves multiple nearby areas
- promoted offer -> belongs to business
- contact point -> belongs to listing
- listing -> linked to document or proof source

## 7. Deduplication and Canonical Entity Strategy

This is one of the most important platform behaviors.

### 7.1 Goal

Do not create the same real-world business or listing multiple times.

### 7.2 Allowable duplicate input

Source files may contain overlapping records. That is acceptable.

### 7.3 Recommended dedupe pipeline

When new data is uploaded or edited:

1. Normalize key fields
2. Compare against existing listings in the same locality tenant
3. Compare against same-city or national index if needed
4. Generate likely matches using deterministic and fuzzy rules
5. If confidence is high, attach the source to the existing listing
6. If confidence is medium, send to review queue
7. If confidence is low, create a new listing

### 7.4 Suggested matching keys

- normalized name
- phone number
- email
- address similarity
- geolocation radius
- website/domain
- government registration number if available

### 7.5 Important design rule

Do not merge raw source rows directly into the canonical listing without preserving source lineage.

Always store:

- canonical listing
- source record
- match decision
- confidence score

## 8. Search and AI Layer

Localisy should use hybrid retrieval, not vector search alone.

### 8.1 AI responsibilities

The AI layer should handle:

- language detection
- query classification
- intent detection
- tenant scoping
- hybrid retrieval
- result ranking
- grounded answer generation
- multilingual response formatting

### 8.2 Query classes

Examples of supported query types:

- business lookup
- category search
- locality-based search
- "best nearby" discovery
- service comparison
- offer or sponsored discovery
- follow-up conversational queries

### 8.3 Recommended retrieval pipeline

1. Detect language
2. Detect query intent
3. Resolve tenant scope
4. Extract filters if present
5. Run structured SQL retrieval
6. Run vector retrieval on document chunks
7. Merge and rerank results
8. Generate grounded answer using RAG
9. Return answer plus supporting records and citations where useful

### 8.4 Why hybrid search

Structured facts such as category, city, phone, and geolocation are best served from SQL.

Narrative content such as policy text, PDF guidance, and descriptive notes is best served from vector search.

Using both gives higher accuracy than relying on embeddings alone.

### 8.5 Multilingual handling

The platform should:

- detect incoming language
- retrieve across multilingual content
- respond in the user's language where possible
- preserve source facts in original form when necessary

## 9. RAG Design

### 9.1 Grounding principle

The model should answer from:

- canonical structured listings
- chunked documents
- trusted metadata

### 9.2 Answer style

Responses should prefer:

- direct answer first
- top matching listings second
- listing URLs and contact cards third
- short follow-up suggestions after that

### 9.3 Conversation memory

For WhatsApp and chat flows, maintain short-term conversation context:

- current tenant or city
- recent question
- recent top listings
- selected language
- follow-up references

Use Redis for this session memory layer.

### 9.4 Hallucination control

Recommended rules:

- do not invent contacts
- do not invent availability
- do not claim unsupported facts
- if confidence is low, say so and show the best available options

## 10. Channel Architecture

### 10.1 Web

Web should support:

- search page
- AI chat
- locality landing page
- city landing page
- national landing page
- category pages
- business detail pages
- offer and sponsored listing pages
- document access

### 10.2 WhatsApp

WhatsApp should support:

- natural-language questions
- top result lists
- follow-up prompts
- shareable contact cards
- links to web listing detail pages
- single best-match listing URL when one listing clearly answers the query
- ranked top listing URLs when multiple options are relevant
- document references when relevant

### 10.3 Mobile

The mobile app can initially reuse the same APIs as web.

Recommended v1 approach:

- API-first backend
- shared search and chat services
- mobile-optimized responses

## 11. Admin Portal

The admin portal should be the control center for each locality tenant, for city-level operators, and for national operators.

### 11.1 Required admin capabilities

- import PDF, Excel, CSV
- manual create and edit
- dedupe review
- listing approval
- document approval
- source tracking
- analytics dashboard
- multilingual content review
- user query analytics
- ad and sponsored listing management
- merchant moderation

### 11.2 Recommended admin roles

- super admin
- national admin
- city admin
- editor
- reviewer

## 12. Recommended Technology Stack

### 12.1 Frontend

- React for web admin and public UI

### 12.2 Backend

- Go for API, ingestion orchestration, and channel services

### 12.3 Database

- PostgreSQL as primary data store
- `pgvector` for embeddings

### 12.4 Cache and session layer

- Redis for:
  - conversation state
  - rate limits
  - query caching
  - WhatsApp session memory

### 12.5 AI services

- OpenAI for:
  - embeddings
  - classification
  - chat completion
  - multilingual answer generation

### 12.6 Messaging

- WhatsApp Cloud API for conversational delivery

## 13. Suggested Core Tables

At minimum, v1 should include:

- `tenants`
- `cities`
- `localities`
- `categories`
- `businesses`
- `business_aliases`
- `business_relationships`
- `contacts`
- `reviews`
- `listing_ads`
- `ad_leads`
- `crm_contacts`
- `marketing_coupons`
- `documents`
- `document_chunks`
- `source_records`
- `ingestion_jobs`
- `duplicate_candidates`
- `search_logs`
- `chat_sessions`
- `chat_messages`
- `feedback_events`
- `audit_logs`

## 14. API Domains

Recommended API modules:

- `auth`
- `tenants`
- `cities`
- `localities`
- `businesses`
- `documents`
- `ingestion`
- `search`
- `chat`
- `whatsapp`
- `merchant`
- `moderation`
- `admin`
- `analytics`

## 15. Security and PII Handling

PII handling is an explicit requirement.

### 15.1 Recommended controls

- encrypt sensitive fields at rest where required
- restrict admin access by role and tenant
- maintain audit logs for create, update, delete, import, and answer flows
- redact sensitive data from prompts when not needed
- separate public content from operator-only content
- avoid exposing private phone or personal records unless allowed by policy

### 15.2 Prompt safety

Do not send unnecessary PII into the model context.

Only include:

- public listing data
- relevant trusted structured facts
- approved document text

## 16. Performance Expectations

Because success metrics include response time, the system should optimize for:

- pre-chunked documents
- precomputed embeddings
- tenant-scoped indexes
- cached top queries
- efficient SQL filters before vector search

Target experience:

- search responses feel immediate
- chat answers return quickly enough for WhatsApp

## 17. Success Metrics

The platform should be measured primarily on:

- answer accuracy
- response time
- multilingual quality
- WhatsApp resolution rate

Useful supporting metrics:

- duplicate detection precision
- ingestion completion time
- admin correction rate
- source coverage by locality and city
- listing coverage by category and locality

## 18. Recommended Phase Plan

### Phase 1

- locality tenant model
- city aggregate page
- national aggregate page
- PDF/Excel/CSV/manual ingestion
- canonical listings
- dedupe review flow
- PostgreSQL + pgvector
- Web search
- AI chat
- WhatsApp conversational support with listing URL responses

### Phase 2

- mobile-first dedicated app improvements
- website ingestion
- API sync connectors
- feedback and retraining loop
- voice interface

## 19. Open Clarifications

These points should be finalized before detailed implementation:

- whether `national` is a pseudo-tenant or a separate aggregation scope
- exact v1 listing taxonomy
- exact multilingual language list for launch
- public vs restricted data policy for contact details
- whether NMIMS is the first pilot organization or just a sample use case

## 20. Recommended Next Deliverables

The next design artifacts should be:

1. ER diagram for the data model
2. API contract draft for search/chat/ingestion
3. RAG sequence diagram
4. Tenant and permission model
5. Admin portal workflow map
6. Phase 1 implementation roadmap

---

This document defines the recommended v1 architecture direction for Localisy as a multi-tenant hyperlocal business directory platform with shared PostgreSQL storage, hybrid retrieval, multilingual RAG, merchant discovery, and Web/WhatsApp/Mobile delivery.
