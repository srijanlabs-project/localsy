# Localisy - Phased Implementation Roadmap

This roadmap converts the approved architecture direction into a practical delivery plan.

## Planning Assumptions

- Current date context for planning: July 2026
- v1 target: locality-based multi-tenant hyperlocal business directory platform
- channels in scope: Web, WhatsApp, Mobile
- primary storage: PostgreSQL + pgvector
- backend: Go
- frontend: React
- data refresh frequency: low, usually every 1-2 months

## Delivery Goals

The first production version should achieve:

- grounded answers from structured listings and documents
- locality-scoped, city-scoped, and national-scoped discovery
- multilingual search and chat
- canonical listing model with duplicate detection
- admin ingestion from PDF, Excel, CSV, and manual entry
- merchant submission and moderation workflows

## Phase 0 - Foundation Alignment

### Target window

August 2026

### Objectives

- finalize product scope
- confirm v1 listing taxonomy
- confirm tenant and national page behavior
- confirm public vs restricted data rules

### Deliverables

- architecture note approved
- ER diagram approved
- API contract draft approved
- v1 use-case list approved
- pilot locality and city list approved

### Exit criteria

- engineering can start without major model ambiguity

## Phase 1 - Core Platform Skeleton

### Target window

August to September 2026

### Objectives

- establish base project structure
- implement shared tenancy and locality scope
- define canonical listing tables and document tables

### Engineering scope

- Go backend project skeleton
- React public and admin shell
- PostgreSQL schema setup
- pgvector setup
- Redis setup
- authentication and role model
- city, locality, and category master APIs

### Deliverables

- working dev environments
- locality pages, city pages, and national page shell
- basic admin authentication
- database migrations

### Exit criteria

- locality and category scoped CRUD flows are operational

## Phase 2 - Structured Listing Layer

### Target window

September to October 2026

### Objectives

- implement canonical listing model
- support manual entry and structured search
- establish relationships, contacts, reviews, and offers

### Engineering scope

- business listing CRUD APIs
- category and subcategory model
- contacts model
- listing relationships
- list and detail pages
- admin moderation and verification flags
- reviews and ratings model
- merchant submission flow

### Deliverables

- searchable business directory
- locality-level and city-level filters
- public listing detail pages
- admin create/edit listing forms
- merchant listing intake flow

### Exit criteria

- platform can run without document RAG and still serve structured business discovery

## Phase 3 - Document Ingestion and RAG Base

### Target window

October to November 2026

### Objectives

- ingest PDF, Excel, CSV
- chunk and embed document content
- connect documents to listings

### Engineering scope

- ingestion jobs
- document storage
- OCR or extraction pipeline where needed
- chunking service
- embedding pipeline
- document inspection UI
- document-to-listing linking

### Deliverables

- upload and process PDF/Excel/CSV
- store documents and chunks
- show ingestion status and failures

### Exit criteria

- approved documents are searchable at chunk level

## Phase 4 - Deduplication and Canonical Merge Workflow

### Target window

November 2026

### Objectives

- stop duplicate listing creation
- build source lineage and merge review flow

### Engineering scope

- normalization rules
- fuzzy match pipeline
- duplicate candidate scoring
- review queue
- merge or keep-separate admin decisions

### Deliverables

- duplicate review dashboard
- source record visibility
- canonical listing merge actions

### Exit criteria

- uploads can be safely reviewed before polluting the listing graph

## Phase 5 - Hybrid Search

### Target window

November to December 2026

### Objectives

- combine SQL search and vector retrieval
- return high-quality ranked search results

### Engineering scope

- language detection
- intent classification
- structured SQL search
- vector search over chunks
- reranking
- search logging

### Deliverables

- public hybrid search endpoint
- search results page with listings and document-backed insights
- multilingual search support

### Exit criteria

- users can find relevant businesses and services beyond exact keyword matches

## Phase 6 - AI Chat and RAG Answers

### Target window

December 2026 to January 2027

### Objectives

- add grounded conversational answers
- support follow-up questions

### Engineering scope

- session model
- Redis conversation context
- RAG prompt orchestration
- answer generation
- citation tracking
- answer cards and linked results

### Deliverables

- web AI chat
- mobile-ready chat API
- grounded answer format

### Exit criteria

- users can ask natural-language questions and receive grounded, useful answers

## Phase 7 - WhatsApp Channel

### Target window

January 2027

### Objectives

- expose the same discovery and chat service over WhatsApp

### Engineering scope

- WhatsApp webhook integration
- phone-session mapping
- reply formatting
- fallback templates
- contact card delivery
- listing URL delivery
- result ranking for single-best and top-three answer patterns

### Deliverables

- operational WhatsApp query flow
- follow-up questions over WhatsApp
- listing URLs sent for matching businesses
- channel analytics

### Exit criteria

- complete ask -> answer -> listing URL -> follow-up flow works on WhatsApp

## Phase 8 - Quality, Security, and Observability

### Target window

January to February 2027

### Objectives

- improve accuracy, privacy, and operational stability

### Engineering scope

- audit logs
- PII handling rules
- prompt redaction policies
- latency dashboards
- search and chat QA reviews
- answer regression testing

### Deliverables

- monitoring and alerting
- quality dashboard
- tenant-safe admin roles

### Exit criteria

- platform is stable enough for broader rollout

## Phase 9 - Pilot Launch

### Target window

February 2027

### Objectives

- launch with one or more pilot localities and cities
- validate accuracy and resolution metrics

### Deliverables

- production pilot deployment
- trained admin workflow
- pilot success dashboard

### Success metrics

- answer accuracy
- response time
- multilingual quality
- WhatsApp resolution rate

## Suggested Team Streams

### Stream A - Platform and Data

- PostgreSQL
- schema
- ingestion
- dedupe
- indexing

### Stream B - AI and Retrieval

- chunking
- embeddings
- retrieval
- RAG orchestration
- evaluation

### Stream C - Product and Channels

- web search
- admin portal
- merchant workflows
- chat UI
- WhatsApp integration
- mobile API readiness

## Risks to Watch

- poor canonical listing design causing duplicate sprawl
- weak multilingual retrieval quality
- low explainability in AI answers
- slow ingestion review workflow
- WhatsApp session handling complexity
- accidental exposure of sensitive contact details

## Recommended Sequencing Rule

Do not start with chatbot polish first.

The right order is:

1. data model
2. ingestion
3. dedupe
4. hybrid retrieval
5. chat and channels

That will produce a much more reliable product.
