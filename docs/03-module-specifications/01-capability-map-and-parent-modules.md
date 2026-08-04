---
id: LOCALISY-DOC-100
title: Localisy Capability Map and Parent Modules
document: 01-capability-map-and-parent-modules.md
version: 1.0
status: Draft
---

# 1. Purpose

This document defines the top-level capability map for Localisy and establishes the parent module boundaries that the rest of the documentation library will expand.

# 2. Capability Map

## 2.1 Foundation

- Tenant and Geography
- Identity and Access
- Platform Governance
- DevOps and Reliability
- Integrations

## 2.2 Directory Core

- Business Directory Core
- Merchant Management
- Reviews and Reputation
- Duplicate and Data Quality
- Documents and Knowledge Sources

## 2.3 Discovery and Growth

- Discovery and Search
- AI and RAG
- SEO and Organic Growth
- Homepage and CMS
- Offers, Ads, and Promotion

## 2.4 User and Channel Experience

- User and Persona Management
- Web Experience
- WhatsApp Channel
- Mobile and API Channels
- Notifications and Communication

## 2.5 Operations and Commercial

- Lead and CRM
- Admin Operations
- Analytics and Reporting
- Billing and Commercial
- Compliance and Legal

# 3. Parent Module Inventory

| Module | Primary objective | Core personas | Priority |
|---|---|---|---|
| Tenant and Geography | run locality-scoped discovery with city and national aggregation | admin, operator, buyer | P0 |
| Identity and Access | secure platform and role access | buyer, seller, admin, moderator, operator | P0 |
| User and Persona Management | maintain buyer, merchant, and internal user profiles | buyer, seller, admin | P1 |
| Business Directory Core | manage the canonical listing graph | buyer, seller, operator, admin | P0 |
| Merchant Management | onboard merchants and let them manage presence | seller, admin | P1 |
| Discovery and Search | help users find relevant businesses fast | buyer, seller | P0 |
| AI and RAG | answer natural-language queries with grounded results | buyer, operator, support | P1 |
| SEO and Organic Growth | acquire search traffic through locality, category, and listing routes | growth, operator, merchant, admin | P0 |
| Documents and Knowledge Sources | ingest documents and structured files for search and AI grounding | operator, admin | P1 |
| Duplicate and Data Quality | keep listing data clean, canonical, and trustworthy | operator, moderator, admin | P0 |
| Reviews and Reputation | capture and govern trust signals | buyer, seller, moderator | P1 |
| Offers, Ads, and Promotion | monetize visibility and promotions | seller, admin | P1 |
| Homepage and CMS | configure locality landing experiences and campaign placements | operator, growth, admin | P1 |
| Lead and CRM | convert discovery into merchant-owned leads | seller, admin | P1 |
| Web Experience | deliver the primary public-facing product | buyer, seller | P0 |
| WhatsApp Channel | deliver directory discovery through WhatsApp | buyer, support, operator | P1 |
| Mobile and API Channels | support app and external client usage | buyer, partner, developer | P2 |
| Admin Operations | control moderation, governance, and platform operations | admin, moderator, operator | P0 |
| Analytics and Reporting | measure growth, trust, performance, and quality | admin, growth, operator, merchant | P1 |
| Billing and Commercial | monetize plans, visibility, and promotions | seller, admin, finance | P2 |
| Notifications and Communication | send transactional and promotional messages | buyer, seller, admin | P1 |
| Compliance and Legal | satisfy legal, privacy, and policy obligations | admin, legal, support | P0 |
| Platform Governance | maintain auditability, privacy, and risk controls | admin, compliance, security | P0 |
| Integrations | connect maps, communications, AI, and external data | engineering, admin | P1 |
| DevOps and Reliability | run the platform safely at scale | engineering, support | P0 |

# 4. Immediate Parent Module Expansion Sequence

Priority modules to deepen first:

1. Tenant and Geography
2. Business Directory Core
3. Discovery and Search
4. SEO and Organic Growth
5. Duplicate and Data Quality
6. Admin Operations
7. Compliance and Legal
8. WhatsApp Channel

# 5. Notes

- SEO is intentionally elevated to a parent module because Localisy already has route-level, metadata-level, and admin-managed SEO configuration in the product.
- AI and RAG should augment discovery, not replace structured search and browse.
- Merchant monetization modules should stay aligned to locality and listing visibility mechanics.

# 6. Module Specification Index

Use the parent specification index for direct navigation:

- [00-module-spec-index.md](/D:/localsy/docs/03-module-specifications/00-module-spec-index.md)
