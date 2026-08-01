# Localisy - Presentation Summary for Team Discussion

## What Localisy Should Become

Localisy should be designed as a multi-tenant hyperlocal business directory platform for locality-level, city-level, and national-level discovery.

It should not be positioned as a single PDF product.

The PDF is only the first knowledge source.

## Core Vision

Users should be able to ask questions in natural language and get grounded answers from:

- structured business listing data
- uploaded documents
- multilingual content
- locality-specific listings and offers
- city-level aggregation
- national aggregated discovery

The same platform should serve:

- Web
- WhatsApp
- Mobile

## Why This Matters

Traditional local directories make nearby businesses, services, and offers hard to discover.

Localisy can become the intelligence layer over that content by combining:

- canonical listings
- merchant and admin-managed data
- document ingestion
- hybrid search
- RAG
- multilingual answers

## Multi-Tenant Model

- primary tenant = locality
- each locality has its own scoped listings and knowledge
- city page works as an aggregate layer across localities
- national page works as an aggregate layer across cities and localities
- shared PostgreSQL database with tenant-aware tables

## Knowledge Sources

Phase 1 should support:

- PDF
- Excel
- CSV
- manual admin entry
- merchant listing submission

Later phases can add:

- websites
- APIs
- scheduled external syncs

## Knowledge Model

The platform should manage two kinds of knowledge:

### Structured listing knowledge

- salons and beauty
- restaurants and food
- grocery and retail
- home services
- repair services
- clinics and pharmacies
- fitness and gyms
- education and coaching
- professional services
- offers, promotions, and sponsored listings

### Document knowledge

- PDFs
- catalogues
- menus
- brochures
- circulars
- reference documents
- imported sheets turned into source records

## Critical Product Rule

The same real-world business or listing should not be created twice inside the same locality scope.

Uploads may contain duplicate data, but the system should:

- detect probable matches
- link source data to the canonical listing
- allow admin review before duplicate creation

This is essential to keep Localisy trustworthy.

## AI Layer

The AI stack should handle:

- language detection
- intent detection
- tenant scoping
- hybrid search
- RAG answer generation
- multilingual response formatting

## Search Strategy

Localisy should use hybrid retrieval:

- SQL search for structured listings
- vector search for document chunks
- reranking for final relevance

This is better than using only keyword search or only embeddings.

## Channels

### Web

- search
- chat
- locality pages
- city pages
- national page
- listing detail pages

### WhatsApp

- ask a question
- get the best matching listing or top matching listings
- receive listing URLs that directly answer the query
- receive contact cards
- ask follow-ups
- receive document-backed answers when needed

If one listing clearly satisfies the query, WhatsApp should send one strong listing URL.

If several listings are relevant, WhatsApp should send a short ranked set of listing URLs.

### Mobile

- same backend APIs
- mobile-optimized responses
- future app-ready architecture

## Admin Portal

Admins should be able to:

- upload files
- create and edit listings
- review duplicates
- manage documents
- manage merchant submissions
- manage ads and offers
- track analytics
- review search and chat behavior

## Recommended Stack

- React
- Go
- PostgreSQL
- pgvector
- Redis
- OpenAI
- WhatsApp Cloud API

## Security Priorities

PII handling matters.

The system should include:

- role-based access
- audit logs
- prompt data minimization
- public vs restricted contact visibility

## Success Metrics

The platform should be measured on:

- answer accuracy
- response time
- multilingual quality
- WhatsApp resolution rate

## Recommended Build Order

1. Tenant-aware data model
2. Canonical listings
3. Ingestion pipeline
4. Duplicate detection
5. Hybrid retrieval
6. AI chat
7. WhatsApp channel
8. Analytics and optimization

## Suggested Message for Stakeholders

Localisy is not just a search page and not just a document repository.

It is a locality-based hyperlocal business directory platform that turns listings and supporting documents into multilingual, grounded answers across Web, WhatsApp, and Mobile.

## Immediate Next Deliverables

- ER diagram
- API contract
- implementation roadmap
- pilot locality and city definition
- first ingestion workflow
