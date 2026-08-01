---
id: LOCALISY-DOC-105
title: Business Directory Core Module Specification
document: 05-business-directory-core.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines the canonical business listing model that powers discovery, SEO, trust, lead capture, and merchant operations.

# 2. Business Objective

The module must provide a clean, locality-scoped, trusted representation of every business listing on the platform.

# 3. Actors and Personas

- buyer
- seller
- operator
- moderator
- admin

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Listing Master | business profile, slug, description, tags, status, verification | maintain the core listing record |
| Classification | category, subcategory, business type, service type | organize businesses for search and browse |
| Contact and Address | phone, WhatsApp, email, website, map pin, service area | expose public contact and location detail |
| Media and Assets | logo, cover, gallery, brochure, video | enrich the listing visually |
| Operational Info | business hours, holiday hours, languages spoken, payment methods | support buyer decision making |
| Trust Layer | verified badge, KYC, response time, satisfaction score, repeat score | improve trust and ranking |

# 5. Functional Requirements

## 5.1 Listing Master

- the system shall maintain one canonical listing record for each approved business representation
- the system shall support listing status such as pending, approved, and rejected
- the system shall maintain human-readable slugs for listing routes

## 5.2 Classification

- the system shall require a valid category and subcategory mapping
- the system shall support standardized taxonomy governance
- the system shall allow service/business-type classification for ranking and filtering

## 5.3 Contact and Address

- the system shall store primary phone, optional WhatsApp, email, website, and full address
- the system shall support public versus restricted contact visibility
- the system shall support service-area coverage beyond the primary area

## 5.4 Media and Assets

- the system shall support logos and core image assets
- the system shall allow richer promotional or proof assets where relevant

## 5.5 Operational Info

- the system shall support operating hours, holiday variations, languages, and payment methods
- the system shall expose buyer-facing practical details in listing views

## 5.6 Trust Layer

- the system shall support verified, KYC, and trust indicators
- the system shall support response-time and quality signals where available

# 6. UX Surfaces

- listing detail page
- listing cards
- merchant listing editor
- moderation and listing-edit forms

# 7. Data and Entities

- business
- business alias
- category
- subcategory
- contact
- trust attributes
- service area references

# 8. APIs and Services

- listing list API
- listing detail API
- create and update listing API
- taxonomy validation service
- listing slug generation service

# 9. Workflows and States

- listing creation -> pending -> approved or rejected
- listing correction and enrichment
- merchant-owned listing update -> review where required
- listing suspension or deactivation

# 10. Security, Permissions, and Audit

- merchant edits shall be scoped to owned listings
- listing status changes shall require authorized internal roles
- all moderation-sensitive edits shall be auditable

# 11. Notifications, Reports, and Dashboards

- pending listing report
- listing completeness dashboard
- verification coverage dashboard
- rejected listing reason report

# 12. Dependencies

- Merchant Management
- Duplicate and Data Quality
- Discovery and Search
- SEO and Organic Growth

# 13. Non-Functional Requirements

- listing retrieval must be fast for public browse and SEO routes
- listing data must remain consistent across UI, API, and SEO render layers

# 14. Open Questions and Next Deep Specs

- minimum required fields by category
- public vs restricted contact design depth
- next deep specs: Listing Master and Trust Layer
