---
id: LOCALISY-DOC-801
title: SEO and Organic Growth Deep Specification
document: 01-seo-discovery-and-growth.md
version: 1.0
status: Draft
---

# 1. Purpose

This document defines the build-ready specification for Localisy SEO and Organic Growth.

SEO is a product capability in Localisy because locality pages, category-intent pages, and listing pages are core discovery surfaces that feed traffic, merchant visibility, and lead generation.

# 2. Business Objective

The SEO capability should:

- generate high-intent organic traffic for locality and category combinations
- increase discovery of approved listings
- improve buyer-to-contact and buyer-to-lead conversion
- create merchant upsell opportunities through visibility features
- strengthen trust signals through structured data and clean route architecture

# 3. Personas

- buyer searching on Google or another search engine
- merchant seeking more visibility for a listing
- growth operator managing organic traffic
- locality operator managing SEO content and route coverage
- admin monitoring platform-wide organic performance

# 4. Scope

## 4.1 In Scope

- locality route architecture
- category-intent route architecture
- listing route architecture
- canonical and redirect behavior
- title and description generation
- OG and Twitter metadata
- breadcrumb and listing schema
- sitemap and robots generation
- internal linking strategy
- SEO discovery configuration in admin
- Search Console submission and indexing operations
- SEO reporting and route coverage monitoring

## 4.2 Out of Scope

- off-platform backlink outreach execution
- editorial blog publishing engine
- marketplace checkout SEO

# 5. Sub-Modules

| Sub-module | Purpose | Priority |
|---|---|---|
| Route Architecture | define crawlable, stable URL patterns | P0 |
| Metadata Engine | generate page metadata consistently | P0 |
| Structured Data | expose schema for better SERP understanding | P0 |
| Programmatic Pages | produce locality, intent, and listing pages at scale | P0 |
| Content Templates | fill SEO pages with scalable locality-aware copy | P1 |
| Indexing Operations | manage sitemap, robots, and Search Console workflows | P1 |
| SEO Analytics | measure route and landing performance | P1 |
| Merchant SEO Entitlements | support commercial SEO upgrades | P2 |

# 6. Functional Specification

## 6.1 Route Architecture

Supported route families:

- `/{locality}`
- `/{locality}/{intent}`
- `/{locality}/{intent}/{listing-slug}-{listingId}`

Rules:

- each locality route must resolve to one active locality
- each intent route must map to a category or discovery intent
- each listing route must resolve to one approved listing
- legacy query-string routes should redirect to canonical route forms
- routes for inactive localities or removed listings should return correct fallback or status behavior

## 6.2 Metadata Engine

Metadata must be generated dynamically from:

- locality name
- category or intent name
- search context
- top listing group and directory context

Required metadata fields:

- page title
- meta description
- canonical URL
- robots directives
- Open Graph title, description, image
- Twitter title, description, image

## 6.3 Structured Data

Structured data should support:

- WebPage schema
- BreadcrumbList schema
- ItemList schema for listing collections
- LocalBusiness schema for listing pages where data quality is sufficient

Rules:

- schema output must match visible page data
- no fake ratings or fabricated fields
- schema should degrade safely when required business data is missing

## 6.4 Programmatic Pages

The platform should support scalable page generation for:

- locality home pages
- locality + category or intent pages
- approved listing detail pages

Each programmatic page should include:

- route-aware heading
- locality-aware introductory copy
- listing cards or listing detail
- internal links to related categories and nearby discovery surfaces
- crawlable HTML content in the initial response

## 6.5 Content Templates

Configurable SEO content inputs should include:

- route intents
- locality metadata
- category labels
- top listing groups
- default listing name groups

Admin users should be able to manage this data without code deployment where supported by the product configuration layer.

## 6.6 Indexing Operations

The platform should provide:

- sitemap generation
- robots directives
- Search Console sitemap submission support
- route coverage monitoring
- failed route or duplicate canonical detection

## 6.7 SEO Analytics

Track at least:

- impressions
- clicks
- CTR
- average position where available
- top landing pages
- top localities
- top intent routes
- indexed vs expected route coverage

## 6.8 Merchant SEO Entitlements

Possible premium capabilities:

- richer listing content fields
- additional gallery and trust fields
- premium route placement blocks
- enhanced internal linking exposure
- locality-specific premium visibility badges

# 7. UX and Admin Surfaces

## 7.1 Public UX

- locality landing pages
- locality + intent pages
- crawlable listing pages
- footer and related-route internal links

## 7.2 Admin UX

- SEO Discovery Configuration manager
- locality metadata editor
- route intent editor
- category label editor
- top listing and fallback listing group editor
- indexing status and submission controls

# 8. Data Model

Primary SEO configuration entities:

- `SeoRouteIntent`
- `SeoLocalityMetadata`
- `SeoCategoryLabel`
- `SeoTopListingGroup`
- `SeoDefaultListingGroup`

Supporting operational entities:

- locality
- category
- business listing
- published homepage or route snapshot where applicable

# 9. API and Processing Expectations

Expected API and processing responsibilities:

- SEO discovery configuration read endpoint
- SEO discovery configuration save endpoint
- sitemap endpoint
- robots endpoint
- server-rendered route response generation
- Search Console submission automation job

# 10. Business Rules

1. only approved listings should be eligible for public SEO listing routes
2. inactive localities should not continue exposing growth routes as active discovery surfaces
3. route titles and descriptions must avoid keyword stuffing
4. canonical tags must always point to the preferred route form
5. one listing should map to one canonical detail URL at a time
6. premium SEO features must not break fairness or trust labeling

# 11. Security and Compliance

- public SEO pages must never expose restricted PII
- structured data must reflect visible public data only
- merchant premium SEO controls must remain permission-gated
- admin SEO configuration writes must be audited

# 12. Reports and Dashboards

Required visibility:

- locality SEO dashboard
- intent route performance dashboard
- top landing page dashboard
- indexing health dashboard
- premium merchant SEO uplift dashboard

# 13. Edge Cases

- locality exists but has too few approved listings
- intent route exists but category coverage is weak
- listing is deleted or rejected after being indexed
- duplicate listing routes compete for the same business
- route template exists but locality metadata is incomplete

# 14. Dependencies

- Tenant and Geography
- Business Directory Core
- Discovery and Search
- Homepage and CMS
- Analytics and Reporting
- Admin Operations
- Integrations

# 15. Test Scenarios

- canonical route resolution works for locality, intent, and listing routes
- legacy route redirects resolve correctly
- metadata updates when locality or intent changes
- structured data matches visible page content
- sitemap includes only eligible routes
- removed listings no longer surface as active listing URLs
- admin SEO config changes persist and are auditable

# 16. Current Codebase Alignment

This module is already reflected in the current product through:

- SEO route intents and locality metadata configuration
- metadata generation in the app
- structured data generation
- sitemap and robots support
- admin SEO discovery management

Reference files:

- [src/App.tsx](/D:/localsy/src/App.tsx)
- [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx)
- [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx)
- [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md)

# 17. Next Expansion

The next deep specs that should be written after this one are:

1. Routing and Resolution
2. Listing Master
3. Duplicate Detection and Review Workflow
4. WhatsApp Response Orchestration
5. Data and Consent Compliance
