---
id: LOCALISY-DOC-901
title: Localisy Module Delivery Checklist
document: 01-module-delivery-checklist.md
version: 2.0
status: Draft
---

# 1. Purpose

This checklist is the master execution tracker for Localisy modules, sub-modules, and sub-sub-modules.

This version is designed to be used as a delivery control document, not just a maturity snapshot.

# 2. Status Model

## 2.1 Current Codebase Maturity

Use these values for current-state assessment:

- `Present`
- `Partial`
- `Not Present`

Meaning:

- `Present`: there is clear implementation evidence in the current codebase
- `Partial`: the capability exists in some form, but is incomplete, simulated, or not hardened
- `Not Present`: the capability is planned or only lightly implied

## 2.2 Delivery Stage

Use these values for execution tracking:

- `To Do`
- `In Progress`
- `Blocked`
- `Done`

## 2.3 Stage Columns

- `UX Mockup`: UX flow, wireframe, or interaction design is complete
- `UI`: frontend screen or interaction implementation is complete
- `Development`: backend, logic, integration, and data implementation is complete
- `Testing`: QA, UAT, regression, and acceptance validation is complete

# 3. Assessment Basis

This prefill is an inferred assessment current as of `July 30, 2026`.

Primary evidence sources:

- [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md)
- [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md)
- [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md)
- [src/App.tsx](/D:/localsy/src/App.tsx)
- [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx)
- [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx)
- [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx)
- [server.js](/D:/localsy/server.js)
- smoke scripts under [scripts](/D:/localsy/scripts)

# 4. Master Checklist

## 4.1 Tenant and Geography

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Tenant Management | locality setup | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/App.tsx](/D:/localsy/src/App.tsx) | locality model exists |
| Tenant Management | city mapping | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/App.tsx](/D:/localsy/src/App.tsx) | city linkage exists |
| Tenant Management | national aggregation | P0 | Partial | To Do | To Do | To Do | To Do | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | not fully implemented as a real surface |
| Tenant Management | tenant status | P0 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | locality status exists, formal tenant lifecycle does not |
| Geography Master | country | P0 | Partial | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | present in hierarchy model |
| Geography Master | state | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/GeographyConfigManager.tsx](/D:/localsy/src/components/GeographyConfigManager.tsx) | |
| Geography Master | city | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/GeographyConfigManager.tsx](/D:/localsy/src/components/GeographyConfigManager.tsx) | |
| Geography Master | locality | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/GeographyConfigManager.tsx](/D:/localsy/src/components/GeographyConfigManager.tsx) | |
| Geography Master | area | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/GeographyConfigManager.tsx](/D:/localsy/src/components/GeographyConfigManager.tsx) | |
| Geography Master | pincode | P0 | Present | In Progress | Done | Done | Done | In Progress | [shared/localityRoutingSeed.js](/D:/localsy/shared/localityRoutingSeed.js) | |
| Geography Master | geo-boundary | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [02-tenant-and-geography.md](/D:/localsy/docs/03-module-specifications/02-tenant-and-geography.md) | |
| Routing and Resolution | pincode mapping | P0 | Present | In Progress | Done | Done | Done | In Progress | [shared/localityRoutingSeed.js](/D:/localsy/shared/localityRoutingSeed.js) | |
| Routing and Resolution | subdomain mapping | P0 | Present | In Progress | Done | Done | Done | In Progress | [shared/localityRoutingSeed.js](/D:/localsy/shared/localityRoutingSeed.js) | |
| Routing and Resolution | reverse geocoding | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [src/App.tsx](/D:/localsy/src/App.tsx) | GPS-based handling exists; full reverse geocoding strategy is partial |
| Routing and Resolution | fallback scope | P0 | Present | In Progress | Done | Done | Done | To Do | [src/App.tsx](/D:/localsy/src/App.tsx) | |

## 4.2 Identity and Access

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Authentication | login | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Authentication | OTP | P0 | Present | In Progress | Done | Done | Done | In Progress | [server.js](/D:/localsy/server.js) | |
| Authentication | session management | P0 | Partial | In Progress | Done | Done | Done | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Authentication | token refresh | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [03-identity-and-access.md](/D:/localsy/docs/03-module-specifications/03-identity-and-access.md) | |
| Authorization | RBAC | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | server-side enforcement still incomplete |
| Authorization | admin roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Authorization | moderator roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Authorization | operator roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Authorization | merchant roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Security Controls | device log | P1 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [audit-events.jsonl](/D:/localsy/audit-events.jsonl) | |
| Security Controls | suspicious access review | P1 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [VAPT_CHECKLIST.md](/D:/localsy/VAPT_CHECKLIST.md) | |
| Security Controls | token policy | P1 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [03-identity-and-access.md](/D:/localsy/docs/03-module-specifications/03-identity-and-access.md) | |
| Security Controls | password policy | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [03-identity-and-access.md](/D:/localsy/docs/03-module-specifications/03-identity-and-access.md) | |

## 4.3 User and Persona Management

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Buyer Profile | saved listings | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Buyer Profile | contact unlock history | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Buyer Profile | reviews | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Buyer Profile | recent activity | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Merchant Profile | owned listings | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Merchant Profile | subscriptions | P1 | Partial | In Progress | Done | Done | To Do | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Merchant Profile | KYC status | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Merchant Profile | lead stats | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Internal User Profile | admin user | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Internal User Profile | moderator user | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Internal User Profile | operator user | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Internal User Profile | support user | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [04-user-and-persona-management.md](/D:/localsy/docs/03-module-specifications/04-user-and-persona-management.md) | |

## 4.4 Business Directory Core

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Listing Master | business profile | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Listing Master | slug | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Master | description | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Listing Master | tags | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Listing Master | status | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Listing Master | verification | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Classification | category | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Classification | subcategory | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Classification | business type | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [05-business-directory-core.md](/D:/localsy/docs/03-module-specifications/05-business-directory-core.md) | |
| Classification | service type | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [05-business-directory-core.md](/D:/localsy/docs/03-module-specifications/05-business-directory-core.md) | |
| Contact and Address | phone | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Contact and Address | WhatsApp | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [05-business-directory-core.md](/D:/localsy/docs/03-module-specifications/05-business-directory-core.md) | |
| Contact and Address | email | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Contact and Address | website | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Contact and Address | map pin | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | gps coordinates exist |
| Contact and Address | service area | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Media and Assets | logo | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Media and Assets | cover | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Media and Assets | gallery | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Media and Assets | brochure | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [05-business-directory-core.md](/D:/localsy/docs/03-module-specifications/05-business-directory-core.md) | |
| Media and Assets | video | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [05-business-directory-core.md](/D:/localsy/docs/03-module-specifications/05-business-directory-core.md) | |
| Operational Info | business hours | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Operational Info | holiday hours | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [05-business-directory-core.md](/D:/localsy/docs/03-module-specifications/05-business-directory-core.md) | |
| Operational Info | languages spoken | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Operational Info | payment methods | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | verified badge | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | KYC | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | response time | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | satisfaction score | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | repeat score | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |

## 4.5 Merchant Management

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Merchant Onboarding | apply for listing | P1 | Present | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Merchant Onboarding | claim listing | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [06-merchant-management.md](/D:/localsy/docs/03-module-specifications/06-merchant-management.md) | |
| Merchant Onboarding | KYC submission | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [06-merchant-management.md](/D:/localsy/docs/03-module-specifications/06-merchant-management.md) | |
| Merchant Onboarding | approval workflow | P1 | Present | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Merchant Workspace | edit listing | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Workspace | update hours | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Workspace | upload assets | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [06-merchant-management.md](/D:/localsy/docs/03-module-specifications/06-merchant-management.md) | |
| Merchant Workspace | manage offers | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Subscription | plan mapping | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Merchant Subscription | entitlements | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Merchant Subscription | visibility tiers | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Subscription | renewal state | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Merchant Insights | impressions | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Insights | clicks | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Insights | leads | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant Insights | conversions | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [06-merchant-management.md](/D:/localsy/docs/03-module-specifications/06-merchant-management.md) | |
| Merchant Insights | campaign stats | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [13-offers-ads-and-promotion.md](/D:/localsy/docs/03-module-specifications/13-offers-ads-and-promotion.md) | |

## 4.6 Discovery and Search

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Search Input | keyword input | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Search Input | multilingual parsing | P0 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [07-discovery-and-search.md](/D:/localsy/docs/03-module-specifications/07-discovery-and-search.md) | |
| Search Input | autosuggest | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [07-discovery-and-search.md](/D:/localsy/docs/03-module-specifications/07-discovery-and-search.md) | |
| Search Input | voice-ready input | P0 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | deferred simulation category |
| Structured Search | category filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Structured Search | locality filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Structured Search | city filter | P0 | Partial | In Progress | Done | Done | Done | To Do | [07-discovery-and-search.md](/D:/localsy/docs/03-module-specifications/07-discovery-and-search.md) | |
| Structured Search | pincode filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Ranking Engine | locality-first ranking | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [04-structured-search-and-ranking.md](/D:/localsy/docs/08-submodule-specifications/04-structured-search-and-ranking.md) | |
| Ranking Engine | popularity boost | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [04-structured-search-and-ranking.md](/D:/localsy/docs/08-submodule-specifications/04-structured-search-and-ranking.md) | |
| Ranking Engine | trust boost | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [04-structured-search-and-ranking.md](/D:/localsy/docs/08-submodule-specifications/04-structured-search-and-ranking.md) | |
| Ranking Engine | sponsored boost | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Results Experience | list view | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Results Experience | map view | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [07-discovery-and-search.md](/D:/localsy/docs/03-module-specifications/07-discovery-and-search.md) | |
| Results Experience | sorting | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Results Experience | quick filters | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Results Experience | pagination | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |

## 4.7 AI and RAG

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Query Understanding | language detection | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Query Understanding | intent detection | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Query Understanding | scope detection | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Query Understanding | extraction | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Retrieval | SQL retrieval | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Retrieval | vector retrieval | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Retrieval | hybrid retrieval | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Retrieval | reranking | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Grounding | listing grounding | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Grounding | document grounding | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Grounding | citations | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Grounding | confidence | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Response Generation | direct answer | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | AI search is deferred/simulated |
| Response Generation | follow-up prompts | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Response Generation | listing cards | P1 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | concept only |
| Response Generation | multilingual formatting | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Session Memory | short-term context | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Session Memory | follow-up handling | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Session Memory | recent results memory | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |

## 4.8 SEO and Organic Growth

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Route Architecture | locality route | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Route Architecture | intent route | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Route Architecture | listing route | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Route Architecture | legacy redirects | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Metadata Engine | title | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Metadata Engine | description | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Metadata Engine | canonical | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Metadata Engine | OG | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Metadata Engine | Twitter | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Metadata Engine | robots directives | P0 | Present | Done | Done | Done | Done | Done | [server.js](/D:/localsy/server.js) | |
| Structured Data | local business schema | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Structured Data | breadcrumbs | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Structured Data | item list schema | P0 | Present | Done | Done | Done | Done | Done | [server.js](/D:/localsy/server.js) | |
| Structured Data | web page schema | P0 | Present | Done | Done | Done | Done | Done | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Programmatic Pages | locality pages | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Programmatic Pages | category-intent pages | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Programmatic Pages | listing pages | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Programmatic Pages | internal link blocks | P0 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Content Templates | locality intro | P1 | Present | In Progress | Done | Done | Done | In Progress | [shared/seoDiscoverySeed.js](/D:/localsy/shared/seoDiscoverySeed.js) | |
| Content Templates | category copy | P1 | Partial | In Progress | Done | Done | Done | In Progress | [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx) | |
| Content Templates | top listing groups | P1 | Present | In Progress | Done | Done | Done | In Progress | [shared/seoDiscoverySeed.js](/D:/localsy/shared/seoDiscoverySeed.js) | |
| Content Templates | fallback text | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Indexing Operations | sitemap | P1 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Indexing Operations | robots | P1 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Indexing Operations | search console submission | P1 | Present | Done | Done | Done | Done | Done | [scripts/submit-search-console-sitemaps.mjs](/D:/localsy/scripts/submit-search-console-sitemaps.mjs) | |
| Indexing Operations | crawl monitoring | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | weekly checklist exists, no dashboard |
| SEO Analytics | impressions | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [09-seo-and-organic-growth.md](/D:/localsy/docs/03-module-specifications/09-seo-and-organic-growth.md) | |
| SEO Analytics | clicks | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [09-seo-and-organic-growth.md](/D:/localsy/docs/03-module-specifications/09-seo-and-organic-growth.md) | |
| SEO Analytics | landing pages | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [09-seo-and-organic-growth.md](/D:/localsy/docs/03-module-specifications/09-seo-and-organic-growth.md) | |
| SEO Analytics | route coverage | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| SEO Analytics | indexed pages | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [09-seo-and-organic-growth.md](/D:/localsy/docs/03-module-specifications/09-seo-and-organic-growth.md) | |
| Merchant SEO Entitlements | premium route features | P2 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | UI copy only |
| Merchant SEO Entitlements | enhanced profile fields | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Merchant SEO Entitlements | domain mapping tags | P2 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | UI copy only |
| Merchant SEO Entitlements | featured snippets prep | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [09-seo-and-organic-growth.md](/D:/localsy/docs/03-module-specifications/09-seo-and-organic-growth.md) | |

## 4.9 Documents and Knowledge Sources

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Source Intake | PDF upload | P1 | Not Present | To Do | Done | Done | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Source Intake | Excel upload | P1 | Not Present | To Do | Done | Done | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Source Intake | CSV upload | P1 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Source Intake | manual entry | P1 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Source Intake | API import | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Processing Pipeline | parsing | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Processing Pipeline | OCR | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Processing Pipeline | chunking | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Processing Pipeline | metadata extraction | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Processing Pipeline | normalization | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Embeddings | embedding generation | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| Embeddings | re-embedding | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Embeddings | model versioning | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Knowledge Linking | listing-to-document links | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Knowledge Linking | locality-to-document links | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Knowledge Linking | category-to-document links | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |

## 4.10 Duplicate and Data Quality

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Duplicate Detection | name match | P0 | Present | In Progress | Done | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Duplicate Detection | phone match | P0 | Present | In Progress | Done | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Duplicate Detection | address match | P0 | Present | In Progress | Done | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Duplicate Detection | fuzzy similarity | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [11-duplicate-and-data-quality.md](/D:/localsy/docs/03-module-specifications/11-duplicate-and-data-quality.md) | |
| Review Workflow | duplicate queue | P0 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [05-duplicate-review-workflow.md](/D:/localsy/docs/08-submodule-specifications/05-duplicate-review-workflow.md) | |
| Review Workflow | merge | P0 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [05-duplicate-review-workflow.md](/D:/localsy/docs/08-submodule-specifications/05-duplicate-review-workflow.md) | |
| Review Workflow | keep separate | P0 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [05-duplicate-review-workflow.md](/D:/localsy/docs/08-submodule-specifications/05-duplicate-review-workflow.md) | |
| Review Workflow | create new listing | P0 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [05-duplicate-review-workflow.md](/D:/localsy/docs/08-submodule-specifications/05-duplicate-review-workflow.md) | |
| Canonicalization | alias handling | P0 | Not Present | To Do | To Do | To Do | In Progress | To Do | [11-duplicate-and-data-quality.md](/D:/localsy/docs/03-module-specifications/11-duplicate-and-data-quality.md) | |
| Canonicalization | normalization | P0 | Partial | In Progress | To Do | To Do | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Canonicalization | source lineage | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [11-duplicate-and-data-quality.md](/D:/localsy/docs/03-module-specifications/11-duplicate-and-data-quality.md) | |
| Canonicalization | canonical listing | P0 | Not Present | To Do | To Do | To Do | In Progress | To Do | [03-listing-master-and-lifecycle.md](/D:/localsy/docs/08-submodule-specifications/03-listing-master-and-lifecycle.md) | |
| Validation Rules | required fields | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Validation Rules | geo validation | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Validation Rules | taxonomy validation | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Validation Rules | format rules | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |

## 4.11 Reviews and Reputation

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Review Collection | rating capture | P1 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Review Collection | comment capture | P1 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Review Collection | OTP verification | P1 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Review Collection | merchant reply | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [12-reviews-and-reputation.md](/D:/localsy/docs/03-module-specifications/12-reviews-and-reputation.md) | |
| Moderation | spam review detection | P1 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [12-reviews-and-reputation.md](/D:/localsy/docs/03-module-specifications/12-reviews-and-reputation.md) | |
| Moderation | abuse flags | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [12-reviews-and-reputation.md](/D:/localsy/docs/03-module-specifications/12-reviews-and-reputation.md) | |
| Moderation | profanity control | P1 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [12-reviews-and-reputation.md](/D:/localsy/docs/03-module-specifications/12-reviews-and-reputation.md) | |
| Moderation | report queue | P1 | Not Present | To Do | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Reputation Signals | review count | P1 | Present | In Progress | Done | Done | Done | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Reputation Signals | average rating | P1 | Present | In Progress | Done | Done | Done | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Reputation Signals | helpful votes | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Reputation Signals | trending score | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [12-reviews-and-reputation.md](/D:/localsy/docs/03-module-specifications/12-reviews-and-reputation.md) | |

## 4.12 Offers, Ads, and Promotion

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Offers and Coupons | coupon creation | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Offers and Coupons | locality targeting | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Offers and Coupons | category targeting | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Offers and Coupons | CTA handling | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [13-offers-ads-and-promotion.md](/D:/localsy/docs/03-module-specifications/13-offers-ads-and-promotion.md) | |
| Sponsored Listings | paid boost | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Sponsored Listings | CPC budget | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Sponsored Listings | sponsor labels | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Sponsored Listings | position control | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [13-offers-ads-and-promotion.md](/D:/localsy/docs/03-module-specifications/13-offers-ads-and-promotion.md) | |
| Ad Inventory | banner ads | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [homepage-config.json](/D:/localsy/homepage-config.json) | |
| Ad Inventory | listing ads | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [homepage-config.json](/D:/localsy/homepage-config.json) | |
| Ad Inventory | lead-form ads | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Ad Inventory | placement slots | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [14-homepage-and-cms.md](/D:/localsy/docs/03-module-specifications/14-homepage-and-cms.md) | |
| Campaign Analytics | clicks | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Campaign Analytics | leads | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Campaign Analytics | conversion | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [13-offers-ads-and-promotion.md](/D:/localsy/docs/03-module-specifications/13-offers-ads-and-promotion.md) | |
| Campaign Analytics | ROI | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [13-offers-ads-and-promotion.md](/D:/localsy/docs/03-module-specifications/13-offers-ads-and-promotion.md) | |

## 4.13 Homepage and CMS

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Locality Homepage | hero banners | P1 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Locality Homepage | featured sections | P1 | Present | In Progress | Done | Done | Done | In Progress | [homepage-config.json](/D:/localsy/homepage-config.json) | |
| Locality Homepage | shortcuts | P1 | Present | In Progress | Done | Done | Done | In Progress | [homepage-defaults-config.json](/D:/localsy/homepage-defaults-config.json) | |
| Locality Homepage | locality copy | P1 | Present | In Progress | Done | Done | Done | In Progress | [shared/seoDiscoverySeed.js](/D:/localsy/shared/seoDiscoverySeed.js) | |
| Scalable Homepage Engine | templates | P1 | Present | Done | Done | Done | Done | Done | [scripts/workflow-publish-smoke.mjs](/D:/localsy/scripts/workflow-publish-smoke.mjs) | |
| Scalable Homepage Engine | assignments | P1 | Present | Done | Done | Done | Done | Done | [scripts/workflow-publish-smoke.mjs](/D:/localsy/scripts/workflow-publish-smoke.mjs) | |
| Scalable Homepage Engine | campaign targeting | P1 | Present | Done | Done | Done | Done | Done | [scripts/workflow-publish-smoke.mjs](/D:/localsy/scripts/workflow-publish-smoke.mjs) | |
| Scalable Homepage Engine | snapshots | P1 | Present | Done | Done | Done | Done | Done | [scripts/resolved-homepage-runtime-smoke.mjs](/D:/localsy/scripts/resolved-homepage-runtime-smoke.mjs) | |
| SEO Discovery Config | route intents | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx) | |
| SEO Discovery Config | SEO labels | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx) | |
| SEO Discovery Config | top listings | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx) | |
| SEO Discovery Config | locality metadata | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/SeoDiscoveryManager.tsx](/D:/localsy/src/components/SeoDiscoveryManager.tsx) | |
| Community Content | posts | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Community Content | events | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Community Content | recommendations | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Community Content | local updates | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |

## 4.14 Lead and CRM

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Lead Capture | contact unlocks | P1 | Present | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Lead Capture | inquiry forms | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Capture | ad lead forms | P1 | Present | In Progress | Done | Done | In Progress | To Do | [server.js](/D:/localsy/server.js) | |
| Lead Capture | WhatsApp click intent | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| CRM Database | contacts | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| CRM Database | notes | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| CRM Database | follow-up history | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| CRM Database | segmentation | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Routing | merchant routing | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [server.js](/D:/localsy/server.js) | |
| Lead Routing | operator routing | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Routing | escalation rules | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Routing | owner mapping | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Lead Lifecycle | new | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | contacted | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | qualified | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | converted | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | closed | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |

## 4.15 Web Experience

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Public Pages | national page | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Public Pages | city page | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Public Pages | locality page | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Public Pages | category page | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Pages | detail page | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Listing Pages | gallery | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Listing Pages | reviews | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Listing Pages | contact actions | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Listing Pages | related listings | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Buyer Tools | save listing | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Buyer Tools | compare | P1 | Not Present | To Do | Done | Done | To Do | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Buyer Tools | unlock contact | P1 | Present | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Buyer Tools | submit review | P1 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Merchant CTA Surface | claim listing | P1 | Partial | In Progress | Done | Done | Done | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |
| Merchant CTA Surface | advertise | P1 | Present | In Progress | Done | Done | Done | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant CTA Surface | submit business | P1 | Present | In Progress | Done | Done | Done | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Merchant CTA Surface | contact sales | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [16-web-experience.md](/D:/localsy/docs/03-module-specifications/16-web-experience.md) | |

## 4.16 WhatsApp Channel

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Inbound Handling | webhook receive | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Inbound Handling | normalize query | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Inbound Handling | phone-session mapping | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Response Orchestration | single best listing URL | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [06-whatsapp-response-orchestration.md](/D:/localsy/docs/08-submodule-specifications/06-whatsapp-response-orchestration.md) | |
| Response Orchestration | top 3 listing URLs | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [06-whatsapp-response-orchestration.md](/D:/localsy/docs/08-submodule-specifications/06-whatsapp-response-orchestration.md) | |
| Response Orchestration | contact cards | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [06-whatsapp-response-orchestration.md](/D:/localsy/docs/08-submodule-specifications/06-whatsapp-response-orchestration.md) | |
| Response Orchestration | follow-up prompts | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [06-whatsapp-response-orchestration.md](/D:/localsy/docs/08-submodule-specifications/06-whatsapp-response-orchestration.md) | |
| Compliance Messaging | opt-in tracking | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [07-data-and-consent-compliance.md](/D:/localsy/docs/08-submodule-specifications/07-data-and-consent-compliance.md) | |
| Compliance Messaging | template handling | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Compliance Messaging | unsubscribe handling | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Compliance Messaging | session windows | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Channel Analytics | resolution rate | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Channel Analytics | fallback rate | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Channel Analytics | response time | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Channel Analytics | drop-off | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |

## 4.17 Mobile and API Channels

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Mobile APIs | search API | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [18-mobile-and-api-channels.md](/D:/localsy/docs/03-module-specifications/18-mobile-and-api-channels.md) | |
| Mobile APIs | chat API | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [18-mobile-and-api-channels.md](/D:/localsy/docs/03-module-specifications/18-mobile-and-api-channels.md) | |
| Mobile APIs | listing API | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [18-mobile-and-api-channels.md](/D:/localsy/docs/03-module-specifications/18-mobile-and-api-channels.md) | |
| Mobile APIs | profile API | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [18-mobile-and-api-channels.md](/D:/localsy/docs/03-module-specifications/18-mobile-and-api-channels.md) | |
| Deep Links | listing deep links | P2 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Deep Links | locality links | P2 | Present | In Progress | Done | Done | In Progress | To Do | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Deep Links | campaign links | P2 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Deep Links | shared routes | P2 | Present | In Progress | Done | Done | In Progress | To Do | [server.js](/D:/localsy/server.js) | |

## 4.18 Admin Operations

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Admin Dashboard | platform summary | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx) | |
| Admin Dashboard | locality summary | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx) | |
| Admin Dashboard | moderation summary | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx) | |
| Admin Dashboard | merchant summary | P0 | Partial | In Progress | Done | Done | Done | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Listing Operations | create | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Listing Operations | edit | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Listing Operations | approve | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Listing Operations | reject | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Listing Operations | suspend | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Listing Operations | bulk update | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Merchant Operations | approve merchant | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Merchant Operations | verify claim | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Merchant Operations | manage permissions | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Merchant Operations | review KYC | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Data Operations | bulk upload | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Data Operations | import review | P0 | Partial | In Progress | Done | Done | Done | In Progress | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Data Operations | corrections | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Data Operations | exports | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |
| Moderation and Governance | flagged content | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Moderation and Governance | audit review | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Moderation and Governance | suspicious actions | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [OPERATIONS_WORKSPACE_FIELD_GUIDE.md](/D:/localsy/OPERATIONS_WORKSPACE_FIELD_GUIDE.md) | |
| Moderation and Governance | escalation | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |

## 4.19 Analytics and Reporting

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Search Analytics | popular queries | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Search Analytics | no-result queries | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Search Analytics | CTR | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Search Analytics | query-to-lead conversion | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Listing Analytics | views | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Analytics | clicks | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Analytics | unlocks | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Listing Analytics | reviews | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Listing Analytics | leads | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Channel Analytics | web | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Channel Analytics | WhatsApp | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Channel Analytics | mobile | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [18-mobile-and-api-channels.md](/D:/localsy/docs/03-module-specifications/18-mobile-and-api-channels.md) | |
| Channel Analytics | campaign comparison | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| AI Quality Analytics | answer accuracy | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| AI Quality Analytics | citation coverage | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| AI Quality Analytics | multilingual quality | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| AI Quality Analytics | latency | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |

## 4.20 Billing and Commercial

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Plan Management | plan catalog | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Plan Management | merchant plans | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Plan Management | ad plans | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Plan Management | visibility plans | P2 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Payments and Invoices | payment state | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Payments and Invoices | invoicing | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Payments and Invoices | renewal tracking | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Payments and Invoices | reconciliation | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Entitlements | feature limits | P2 | Partial | In Progress | To Do | In Progress | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Entitlements | ad limits | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Entitlements | AI limits | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |
| Entitlements | listing caps | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [21-billing-and-commercial.md](/D:/localsy/docs/03-module-specifications/21-billing-and-commercial.md) | |

## 4.21 Notifications and Communication

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| User Notifications | OTP | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [server.js](/D:/localsy/server.js) | |
| User Notifications | inquiry acknowledgement | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| User Notifications | review status | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| User Notifications | reminder | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Merchant Notifications | lead alert | P1 | Partial | In Progress | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Merchant Notifications | review alert | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Merchant Notifications | approval alert | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Merchant Notifications | renewal alert | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Internal Notifications | moderation alert | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Internal Notifications | ingestion failure | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Internal Notifications | suspicious activity | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |
| Internal Notifications | system warnings | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [22-notifications-and-communication.md](/D:/localsy/docs/03-module-specifications/22-notifications-and-communication.md) | |

## 4.22 Compliance and Legal

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Legal Content Management | TnC | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Legal Content Management | privacy policy | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Legal Content Management | cookie policy | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Legal Content Management | disclaimer | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Commercial Policies | refund policy | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Commercial Policies | cancellation policy | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Commercial Policies | fulfilment policy | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Commercial Policies | seller agreement | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Platform Policies | community guidelines | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Platform Policies | merchant listing policy | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Platform Policies | review policy | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Platform Policies | moderation policy | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Data and Consent Compliance | OTP consent | P0 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [server.js](/D:/localsy/server.js) | |
| Data and Consent Compliance | WhatsApp consent | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [07-data-and-consent-compliance.md](/D:/localsy/docs/08-submodule-specifications/07-data-and-consent-compliance.md) | |
| Data and Consent Compliance | marketing consent | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [07-data-and-consent-compliance.md](/D:/localsy/docs/08-submodule-specifications/07-data-and-consent-compliance.md) | |
| Data and Consent Compliance | retention rules | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [07-data-and-consent-compliance.md](/D:/localsy/docs/08-submodule-specifications/07-data-and-consent-compliance.md) | |
| Data and Consent Compliance | PII governance | P0 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx) | |
| Rights and Grievance | grievance intake | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Rights and Grievance | takedown flow | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Rights and Grievance | export request | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Rights and Grievance | deletion request | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Policy Controls | versioning | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Policy Controls | acceptance tracking | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Policy Controls | consent audit log | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Policy Controls | geo-specific policy mapping | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |

## 4.23 Platform Governance

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Audit and Compliance Logs | admin logs | P0 | Present | In Progress | Done | In Progress | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Audit and Compliance Logs | merchant logs | P0 | Partial | In Progress | Done | In Progress | Done | In Progress | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Audit and Compliance Logs | consent logs | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Audit and Compliance Logs | policy acceptance logs | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Privacy Controls | masked PII | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Privacy Controls | restricted contact visibility | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Privacy Controls | retention enforcement | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Risk Controls | abuse flags | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Risk Controls | suspicious activity detection | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [VAPT_CHECKLIST.md](/D:/localsy/VAPT_CHECKLIST.md) | |
| Risk Controls | escalation workflow | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |

## 4.24 Integrations

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Maps and Geo | maps provider | P1 | Not Present | To Do | In Progress | In Progress | To Do | To Do | [25-integrations.md](/D:/localsy/docs/03-module-specifications/25-integrations.md) | |
| Maps and Geo | geocoding | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Maps and Geo | distance calculation | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Maps and Geo | geo utilities | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Communication APIs | WhatsApp API | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [17-whatsapp-channel.md](/D:/localsy/docs/03-module-specifications/17-whatsapp-channel.md) | |
| Communication APIs | SMS API | P1 | Present | In Progress | To Do | To Do | In Progress | To Do | [server.js](/D:/localsy/server.js) | OTP provider integration exists |
| Communication APIs | email API | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [25-integrations.md](/D:/localsy/docs/03-module-specifications/25-integrations.md) | |
| AI Providers | LLM provider | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| AI Providers | embeddings provider | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| AI Providers | reranking/model routing | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [08-ai-and-rag.md](/D:/localsy/docs/03-module-specifications/08-ai-and-rag.md) | |
| External Data Connectors | websites | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [25-integrations.md](/D:/localsy/docs/03-module-specifications/25-integrations.md) | |
| External Data Connectors | partner APIs | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [25-integrations.md](/D:/localsy/docs/03-module-specifications/25-integrations.md) | |
| External Data Connectors | scheduled syncs | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [25-integrations.md](/D:/localsy/docs/03-module-specifications/25-integrations.md) | |
| External Data Connectors | file connectors | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [25-integrations.md](/D:/localsy/docs/03-module-specifications/25-integrations.md) | |

## 4.25 DevOps and Reliability

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Infrastructure | environments | P0 | Partial | In Progress | To Do | To Do | In Progress | In Progress | [LOCAL_DEVELOPMENT.md](/D:/localsy/LOCAL_DEVELOPMENT.md) | |
| Infrastructure | deployment | P0 | Partial | In Progress | To Do | To Do | In Progress | In Progress | [DEPLOYMENT_GUIDE.md](/D:/localsy/DEPLOYMENT_GUIDE.md) | |
| Infrastructure | storage | P0 | Partial | In Progress | To Do | To Do | In Progress | In Progress | [server.js](/D:/localsy/server.js) | |
| Infrastructure | scaling | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Observability | logs | P0 | Partial | In Progress | To Do | To Do | In Progress | To Do | [server.out.log](/D:/localsy/server.out.log) | |
| Observability | metrics | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Observability | tracing | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Observability | alerting | P0 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Jobs and Queues | ingestion jobs | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Jobs and Queues | embedding jobs | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Jobs and Queues | publish jobs | P1 | Partial | In Progress | To Do | To Do | In Progress | In Progress | [scripts/workflow-publish-smoke.mjs](/D:/localsy/scripts/workflow-publish-smoke.mjs) | |
| Jobs and Queues | notification jobs | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Backup and Recovery | DB backup | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Backup and Recovery | asset backup | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Backup and Recovery | restore drills | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |
| Backup and Recovery | recovery playbook | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [26-devops-and-reliability.md](/D:/localsy/docs/03-module-specifications/26-devops-and-reliability.md) | |

# 5. Suggested Working Method

1. Keep `Current Codebase Maturity` as an evidence-based snapshot only.
2. Use `Delivery Stage` and the execution columns for actual team tracking.
3. Mark `UX Mockup` done only when a reviewable artifact exists.
4. Mark `Testing` done only when there is explicit executed QA/UAT evidence.
5. Mark any row `Done` only when delivery stage and all execution columns are complete.

# 6. Recommended First Active Tracking Slice

Start active tracking from these highest-value items:

1. Tenant and Geography
2. Identity and Access
3. Business Directory Core
4. Discovery and Search
5. SEO and Organic Growth
6. Duplicate and Data Quality
7. Web Experience
8. Admin Operations
9. Compliance and Legal
