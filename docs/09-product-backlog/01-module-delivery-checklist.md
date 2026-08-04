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
| Geography Master | geo-boundary | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Derived locality boundaries are exposed via `/api/admin/geography/boundaries` |
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
| Authentication | token refresh | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Authenticated refresh is exposed via `/api/auth/refresh` |
| Authorization | RBAC | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | server-side enforcement still incomplete |
| Authorization | admin roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Authorization | moderator roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Authorization | operator roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Authorization | merchant roles | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Security Controls | device log | P1 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [audit-events.jsonl](/D:/localsy/audit-events.jsonl) | |
| Security Controls | suspicious access review | P1 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [VAPT_CHECKLIST.md](/D:/localsy/VAPT_CHECKLIST.md) | |
| Security Controls | token policy | P1 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [03-identity-and-access.md](/D:/localsy/docs/03-module-specifications/03-identity-and-access.md) | |
| Security Controls | password policy | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Password policy is enforced for privileged registration and exposed via `/api/auth/password-policy` |

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
| Internal User Profile | support user | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | `support_user` is a first-class platform user type and can authenticate through platform OTP flow |

## 4.4 Business Directory Core

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Listing Master | business profile | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Listing Master | slug | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | Canonical business slugs are normalized and reused across public listing routes |
| Listing Master | description | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Listing Master | tags | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Listing Master | status | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Listing Master | verification | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | Verification tags are normalized for listing detail and seller showcase surfaces |
| Classification | category | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Classification | subcategory | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Classification | business type | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | Business types are normalized onto the business profile model and surfaced in web experiences |
| Classification | service type | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | Service types are normalized onto the business profile model and surfaced in web experiences |
| Contact and Address | phone | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Contact and Address | WhatsApp | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Direct WhatsApp open and listing share-to-WhatsApp actions exist |
| Contact and Address | email | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Contact and Address | website | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Contact and Address | map pin | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Detail views now use GPS-backed map and directions actions from listing data |
| Contact and Address | service area | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | |
| Media and Assets | logo | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | Logo URLs are normalized into the business model and reused by public presentation helpers |
| Media and Assets | cover | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | Cover assets are normalized into the business model and reused by public presentation helpers |
| Media and Assets | gallery | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Listing detail now renders a normalized asset gallery for approved businesses |
| Media and Assets | brochure | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | Business listing payloads now support brochure URLs |
| Media and Assets | video | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | Business listing payloads now support business-level video URLs |
| Operational Info | business hours | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Operational Info | holiday hours | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [src/types.ts](/D:/localsy/src/types.ts) | Business listing payloads now support holiday-hours overrides |
| Operational Info | languages spoken | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Operational Info | payment methods | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | verified badge | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | KYC | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/services/app/runtimeState.ts](/D:/localsy/src/services/app/runtimeState.ts) | KYC and related trust checks are folded into verification tags for public trust display |
| Trust Layer | response time | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | satisfaction score | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Trust Layer | repeat score | P1 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |

## 4.5 Merchant Management

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Merchant Onboarding | apply for listing | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Duplicate guard, validation, and pending-review submission flow exist |
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
| Merchant Insights | conversions | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Merchant conversion rollups are exposed via `/api/admin/merchant-insights` |
| Merchant Insights | campaign stats | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [13-offers-ads-and-promotion.md](/D:/localsy/docs/03-module-specifications/13-offers-ads-and-promotion.md) | |

## 4.6 Discovery and Search

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Search Input | keyword input | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Search Input | multilingual parsing | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/services/webportal/businessDiscovery.ts](/D:/localsy/src/services/webportal/businessDiscovery.ts) | Search normalization already handles multilingual and transliterated query variants heuristically |
| Search Input | autosuggest | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Autosuggest dropdown and suggestion selection flow exist |
| Search Input | voice-ready input | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Voice search mode and transcript-driven filtering are already wired |
| Structured Search | category filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Structured Search | locality filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Structured Search | city filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Results filters now support explicit city scope selection |
| Structured Search | pincode filter | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Ranking Engine | locality-first ranking | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/services/webportal/businessDiscovery.ts](/D:/localsy/src/services/webportal/businessDiscovery.ts) | Recommended scoring prioritizes same-locality and nearby-locality businesses |
| Ranking Engine | popularity boost | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/services/webportal/businessDiscovery.ts](/D:/localsy/src/services/webportal/businessDiscovery.ts) | Review volume and recency contribute to ranking |
| Ranking Engine | trust boost | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/services/webportal/businessDiscovery.ts](/D:/localsy/src/services/webportal/businessDiscovery.ts) | Verified, KYC, satisfaction, and response signals affect ranking |
| Ranking Engine | sponsored boost | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [src/services/webportal/businessDiscovery.ts](/D:/localsy/src/services/webportal/businessDiscovery.ts) | Sponsored, premium, and CPC-budget signals now contribute directly to ranking |
| Results Experience | list view | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Results Experience | map view | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Results page supports grid/map toggle with interactive result map view |
| Results Experience | sorting | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Results Experience | quick filters | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Results Experience | pagination | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |

## 4.7 AI and RAG

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Query Understanding | language detection | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile chat endpoint detects English vs Hindi script heuristically |
| Query Understanding | intent detection | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile chat and WhatsApp orchestration classify search intent heuristically |
| Query Understanding | scope detection | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Chat response includes locality/general scope detection |
| Query Understanding | extraction | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Chat response returns normalized query tokens and extracted scope/category signals |
| Retrieval | SQL retrieval | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | `/api/knowledge/query` and grounded chat flows combine listing retrieval with locality/category filters |
| Retrieval | vector retrieval | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Hashed embeddings plus cosine similarity now score chunk-level vector matches |
| Retrieval | hybrid retrieval | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Retrieval blends vector, lexical, and keyword scoring into hybrid results |
| Retrieval | reranking | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Hybrid retrieval results are reranked by weighted hybrid score before response grounding |
| Grounding | listing grounding | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Grounded responses include listing citations and listing-card evidence from directory results |
| Grounding | document grounding | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Grounded responses include document citations and source-backed snippets from ingested knowledge |
| Grounding | citations | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile chat, WhatsApp, and `/api/knowledge/query` now emit listing and document citations |
| Grounding | confidence | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Confidence is derived from listing depth and hybrid knowledge hit strength |
| Response Generation | direct answer | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile chat endpoint now returns direct answer text from heuristic orchestration |
| Response Generation | follow-up prompts | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile chat and WhatsApp responses include follow-up prompts |
| Response Generation | listing cards | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Grounded chat and knowledge query responses now return listing cards directly from retrieval output |
| Response Generation | multilingual formatting | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Grounded answer formatting now supports English and Hindi response copy paths |
| Session Memory | short-term context | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Knowledge sessions persist last query, effective query, and channel context |
| Session Memory | follow-up handling | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Follow-up expansion now carries prior session context into short continuation queries |
| Session Memory | recent results memory | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Sessions retain recent grounded citations for follow-up continuity |

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
| Content Templates | category copy | P1 | Present | In Progress | Done | Done | Done | In Progress | [shared/seoGrowth.js](/D:/localsy/shared/seoGrowth.js) | SEO category copy snapshots are generated for locality-category routes |
| Content Templates | top listing groups | P1 | Present | In Progress | Done | Done | Done | In Progress | [shared/seoDiscoverySeed.js](/D:/localsy/shared/seoDiscoverySeed.js) | |
| Content Templates | fallback text | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/App.tsx](/D:/localsy/src/App.tsx) | |
| Indexing Operations | sitemap | P1 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Indexing Operations | robots | P1 | Present | Done | Done | Done | Done | Done | [SEO_PHASE_EXECUTION.md](/D:/localsy/SEO_PHASE_EXECUTION.md) | |
| Indexing Operations | search console submission | P1 | Present | Done | Done | Done | Done | Done | [scripts/submit-search-console-sitemaps.mjs](/D:/localsy/scripts/submit-search-console-sitemaps.mjs) | |
| Indexing Operations | crawl monitoring | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Admin SEO crawl monitoring snapshot is exposed via `/api/admin/seo/crawl-monitoring` |
| SEO Analytics | impressions | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Admin SEO analytics snapshot includes aggregate impression metrics |
| SEO Analytics | clicks | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Admin SEO analytics snapshot includes aggregate click metrics |
| SEO Analytics | landing pages | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | SEO analytics now report landing-page coverage and route counts |
| SEO Analytics | route coverage | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Route coverage snapshot is exposed via `/api/admin/seo/route-coverage` |
| SEO Analytics | indexed pages | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | SEO analytics now report indexed page estimates alongside landing-page coverage |
| Merchant SEO Entitlements | premium route features | P2 | Present | In Progress | In Progress | In Progress | Done | In Progress | [shared/seoGrowth.js](/D:/localsy/shared/seoGrowth.js) | Merchant SEO entitlement snapshots now flag premium route visibility support |
| Merchant SEO Entitlements | enhanced profile fields | P2 | Present | In Progress | In Progress | In Progress | Done | In Progress | [shared/seoGrowth.js](/D:/localsy/shared/seoGrowth.js) | Enhanced profile-field readiness is derived from gallery, logo, cover, and snippet metadata |
| Merchant SEO Entitlements | domain mapping tags | P2 | Present | In Progress | In Progress | In Progress | Done | In Progress | [shared/seoGrowth.js](/D:/localsy/shared/seoGrowth.js) | Domain mapping tags are persisted, normalized, and exposed in SEO entitlement snapshots |
| Merchant SEO Entitlements | featured snippets prep | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/seoGrowth.js](/D:/localsy/shared/seoGrowth.js) | Featured-snippet preparation text is generated from business SEO metadata |

## 4.9 Documents and Knowledge Sources

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Source Intake | PDF upload | P1 | Present | In Progress | Done | Done | Done | In Progress | [server.js](/D:/localsy/server.js) | Privileged PDF knowledge ingestion is exposed via `/api/admin/knowledge/ingest/pdf` |
| Source Intake | Excel upload | P1 | Present | In Progress | Done | Done | Done | In Progress | [server.js](/D:/localsy/server.js) | Privileged Excel knowledge ingestion is exposed via `/api/admin/knowledge/ingest/excel` |
| Source Intake | CSV upload | P1 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Source Intake | manual entry | P1 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Source Intake | API import | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Privileged API knowledge ingestion is exposed via `/api/admin/knowledge/ingest/api` |
| Processing Pipeline | parsing | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Processing Pipeline | OCR | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | PDF ingestion accepts OCR text inputs and records OCR-applied metadata on knowledge documents |
| Processing Pipeline | chunking | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Document content is chunked into retrieval-ready segments during ingestion |
| Processing Pipeline | metadata extraction | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Processing Pipeline | normalization | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Embeddings | embedding generation | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Chunk embeddings are generated during ingestion using the local hashed embedding model |
| Embeddings | re-embedding | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Re-embedding is exposed via `/api/admin/knowledge/reembed` |
| Embeddings | model versioning | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/knowledgeRetrieval.js](/D:/localsy/shared/knowledgeRetrieval.js) | Knowledge settings persist the active embedding model version across re-embedding runs |
| Knowledge Linking | listing-to-document links | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Knowledge Linking | locality-to-document links | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |
| Knowledge Linking | category-to-document links | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [10-documents-and-knowledge-sources.md](/D:/localsy/docs/03-module-specifications/10-documents-and-knowledge-sources.md) | |

## 4.10 Duplicate and Data Quality

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Duplicate Detection | name match | P0 | Present | In Progress | Done | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Duplicate Detection | phone match | P0 | Present | In Progress | Done | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Duplicate Detection | address match | P0 | Present | In Progress | Done | In Progress | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Duplicate Detection | fuzzy similarity | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Fuzzy duplicate scoring powers `/api/admin/directory-quality/duplicates` |
| Review Workflow | duplicate queue | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Duplicate queue is exposed via `/api/admin/directory-quality/duplicates` |
| Review Workflow | merge | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Duplicate merge is exposed via `/api/admin/directory-quality/merge` |
| Review Workflow | keep separate | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Keep-separate action is exposed via `/api/admin/directory-quality/keep-separate` |
| Review Workflow | create new listing | P0 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Canonical listing creation is exposed via `/api/admin/directory-quality/create-canonical` |
| Canonicalization | alias handling | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Alias sets are preserved and folded into duplicate merge plus search matching |
| Canonicalization | normalization | P0 | Partial | In Progress | To Do | To Do | In Progress | To Do | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Canonicalization | source lineage | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Source lineage is maintained during merge, keep-separate, and canonical creation flows |
| Canonicalization | canonical listing | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Canonical listing creation and canonical path suggestions are available through the directory quality APIs |
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
| Moderation | spam review detection | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Review moderation queue classifies spam-like signals and exposes them via `/api/admin/reviews/moderation-queue` |
| Moderation | abuse flags | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [12-reviews-and-reputation.md](/D:/localsy/docs/03-module-specifications/12-reviews-and-reputation.md) | |
| Moderation | profanity control | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Review moderation queue classifies profanity-like signals and exposes them via `/api/admin/reviews/moderation-queue` |
| Moderation | report queue | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Review report queue and moderation actions are exposed via `/api/admin/reviews/moderation-queue` and `/api/admin/reviews/:reviewId/moderate` |
| Reputation Signals | review count | P1 | Present | In Progress | Done | Done | Done | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Reputation Signals | average rating | P1 | Present | In Progress | Done | Done | Done | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Reputation Signals | helpful votes | P1 | Partial | In Progress | Done | Done | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Reputation Signals | trending score | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/directoryQuality.js](/D:/localsy/shared/directoryQuality.js) | Trending reputation scores are exposed via `/api/admin/reputation/trending` |

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
| Community Content | recommendations | P2 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Recommendation board and manual request submission flow exist |
| Community Content | local updates | P2 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |

## 4.14 Lead and CRM

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Lead Capture | contact unlocks | P1 | Present | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Lead Capture | inquiry forms | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Recommendation request modal captures structured inbound help requests |
| Lead Capture | ad lead forms | P1 | Present | In Progress | Done | Done | In Progress | To Do | [server.js](/D:/localsy/server.js) | |
| Lead Capture | WhatsApp click intent | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | WhatsApp intent opens are logged as contact-view events |
| CRM Database | contacts | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| CRM Database | notes | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| CRM Database | follow-up history | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| CRM Database | segmentation | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | CRM contact segments are exposed via `/api/admin/crm-segments` |
| Lead Routing | merchant routing | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [server.js](/D:/localsy/server.js) | |
| Lead Routing | operator routing | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Operator queues are exposed via `/api/admin/lead-routing` |
| Lead Routing | escalation rules | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Escalation rules are derived from stale and high-volume lead queues |
| Lead Routing | owner mapping | P1 | Partial | In Progress | To Do | To Do | In Progress | To Do | [src/types.ts](/D:/localsy/src/types.ts) | |
| Lead Lifecycle | new | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | contacted | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | qualified | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | converted | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |
| Lead Lifecycle | closed | P2 | Not Present | To Do | To Do | To Do | To Do | To Do | [15-lead-and-crm.md](/D:/localsy/docs/03-module-specifications/15-lead-and-crm.md) | |

## 4.15 Web Experience

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Public Pages | national page | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/webportal/NationalDirectoryPage.tsx](/D:/localsy/src/components/webportal/NationalDirectoryPage.tsx) | Live national directory experience is routed through the public web surface |
| Public Pages | city page | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/ux/CityDirectoryUiV1.tsx](/D:/localsy/src/components/ux/CityDirectoryUiV1.tsx) | Live city route experience is routed through the public web surface |
| Public Pages | locality page | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Public Pages | category page | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Pages | detail page | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Listing Pages | gallery | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Listing detail experiences now surface a normalized business gallery |
| Listing Pages | reviews | P0 | Present | In Progress | Done | Done | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Listing Pages | contact actions | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Listing Pages | related listings | P0 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Detail modal now surfaces locality-aware related listing suggestions |
| Buyer Tools | save listing | P1 | Present | In Progress | Done | Done | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Buyer Tools | compare | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | Buyer compare queue and side-by-side shortlist table are live |
| Buyer Tools | unlock contact | P1 | Present | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Buyer Tools | submit review | P1 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Merchant CTA Surface | claim listing | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/webportal/SellerShowcasePage.tsx](/D:/localsy/src/components/webportal/SellerShowcasePage.tsx) | Seller-facing public pages now include dedicated claim-listing CTAs |
| Merchant CTA Surface | advertise | P1 | Present | In Progress | Done | Done | Done | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Merchant CTA Surface | submit business | P1 | Present | In Progress | Done | Done | Done | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Merchant CTA Surface | contact sales | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/webportal/SellerShowcasePage.tsx](/D:/localsy/src/components/webportal/SellerShowcasePage.tsx) | Seller-facing public pages now include premium contact-sales CTAs |

## 4.16 WhatsApp Channel

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Inbound Handling | webhook receive | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp webhook endpoint now accepts inbound query payloads |
| Inbound Handling | normalize query | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp orchestration normalizes incoming query text before retrieval |
| Inbound Handling | phone-session mapping | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Channel session memory now maps phone/session to previous query context |
| Response Orchestration | single best listing URL | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp resolver returns a canonical best listing URL |
| Response Orchestration | top 3 listing URLs | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp resolver returns top 3 listing URLs |
| Response Orchestration | contact cards | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp resolver returns lightweight listing contact cards |
| Response Orchestration | follow-up prompts | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp resolver suggests next follow-up questions |
| Compliance Messaging | opt-in tracking | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Consent records back WhatsApp, SMS, and marketing opt-in tracking |
| Compliance Messaging | template handling | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Compliance message templates are managed via `/api/admin/compliance/message-templates` |
| Compliance Messaging | unsubscribe handling | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Unsubscribe capture is exposed via `/api/compliance/unsubscribe` |
| Compliance Messaging | session windows | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Session-window eligibility is derived in messaging runtime responses |
| Channel Analytics | resolution rate | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Channel resolution, fallback, response-time, and drop-off metrics are exposed via `/api/admin/analytics/channels` |
| Channel Analytics | fallback rate | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Channel resolution, fallback, response-time, and drop-off metrics are exposed via `/api/admin/analytics/channels` |
| Channel Analytics | response time | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile and WhatsApp searches now log duration into the audit stream |
| Channel Analytics | drop-off | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Drop-off is derived from search sessions without follow-up engagement |

## 4.17 Mobile and API Channels

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Mobile APIs | search API | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | `/api/mobile/search` returns ranked listing results |
| Mobile APIs | chat API | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | `/api/mobile/chat` returns understanding, direct answer, citations, and cards |
| Mobile APIs | listing API | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | `/api/mobile/listing/:listingId` returns listing detail and related listings |
| Mobile APIs | profile API | P2 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | `/api/mobile/profile` returns auth user and buyer state snapshot |
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
| Data Operations | exports | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | CSV and JSON exports are available via `/api/admin/exports/:entity` |
| Moderation and Governance | flagged content | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Moderation and Governance | audit review | P0 | Present | In Progress | Done | Done | Done | In Progress | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Moderation and Governance | suspicious actions | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [OPERATIONS_WORKSPACE_FIELD_GUIDE.md](/D:/localsy/OPERATIONS_WORKSPACE_FIELD_GUIDE.md) | |
| Moderation and Governance | escalation | P0 | Partial | In Progress | Done | Done | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |

## 4.19 Analytics and Reporting

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Search Analytics | popular queries | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Popular query aggregation is exposed via `/api/admin/analytics/search` |
| Search Analytics | no-result queries | P1 | Present | In Progress | Done | Done | Done | In Progress | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | No-result searches are logged via audit events for follow-up analysis |
| Search Analytics | CTR | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | CTR is derived from downstream engagement following search activity |
| Search Analytics | query-to-lead conversion | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Query-to-lead conversion is derived from search-to-contact and lead follow-up events |
| Listing Analytics | views | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Analytics | clicks | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [src/components/WebPortal.tsx](/D:/localsy/src/components/WebPortal.tsx) | |
| Listing Analytics | unlocks | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Listing Analytics | reviews | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Listing Analytics | leads | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [20-analytics-and-reporting.md](/D:/localsy/docs/03-module-specifications/20-analytics-and-reporting.md) | |
| Channel Analytics | web | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Web, mobile, and WhatsApp channel summaries are exposed via `/api/admin/analytics/channels` |
| Channel Analytics | WhatsApp | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp query resolution now writes audit events with session and response metadata |
| Channel Analytics | mobile | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Mobile search, chat, and listing detail activity now feed the audit trail |
| Channel Analytics | campaign comparison | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Campaign comparison is exposed via `/api/admin/analytics/campaign-comparison` |
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
| Internal Notifications | moderation alert | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Moderation queues are surfaced via `/api/admin/notifications` |
| Internal Notifications | ingestion failure | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Import skip patterns are surfaced via `/api/admin/notifications` |
| Internal Notifications | suspicious activity | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | Suspicious device activity is surfaced via `/api/admin/notifications` |
| Internal Notifications | system warnings | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/adminOperations.js](/D:/localsy/shared/adminOperations.js) | No-result spikes and other warnings are surfaced via `/api/admin/notifications` |

## 4.22 Compliance and Legal

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Legal Content Management | TnC | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Seeded legal content is available via `/api/legal-content` |
| Legal Content Management | privacy policy | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Seeded legal content is available via `/api/legal-content` |
| Legal Content Management | cookie policy | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Seeded legal content is available via `/api/legal-content` |
| Legal Content Management | disclaimer | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Seeded legal content is available via `/api/legal-content` |
| Commercial Policies | refund policy | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Commercial policies are seeded and exposed through legal content endpoints |
| Commercial Policies | cancellation policy | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Commercial policies are seeded and exposed through legal content endpoints |
| Commercial Policies | fulfilment policy | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Commercial policies are seeded and exposed through legal content endpoints |
| Commercial Policies | seller agreement | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Commercial policies are seeded and exposed through legal content endpoints |
| Platform Policies | community guidelines | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Platform policies are seeded and exposed through legal content endpoints |
| Platform Policies | merchant listing policy | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Platform policies are seeded and exposed through legal content endpoints |
| Platform Policies | review policy | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Platform policies are seeded and exposed through legal content endpoints |
| Platform Policies | moderation policy | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Platform policies are seeded and exposed through legal content endpoints |
| Data and Consent Compliance | OTP consent | P0 | Present | In Progress | To Do | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | OTP request flows now write SMS OTP consent records |
| Data and Consent Compliance | WhatsApp consent | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | WhatsApp consent can be captured explicitly and from inbound opt-in flags |
| Data and Consent Compliance | marketing consent | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Marketing consent is captured through compliance consent records |
| Data and Consent Compliance | retention rules | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Retention rules are stored and managed as compliance state |
| Data and Consent Compliance | PII governance | P0 | Partial | In Progress | To Do | In Progress | In Progress | To Do | [src/components/AdminConsole.tsx](/D:/localsy/src/components/AdminConsole.tsx) | |
| Rights and Grievance | grievance intake | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Rights and Grievance | takedown flow | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Rights and Grievance | export request | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Rights and Grievance | deletion request | P1 | Not Present | To Do | To Do | To Do | To Do | To Do | [23-compliance-and-legal.md](/D:/localsy/docs/03-module-specifications/23-compliance-and-legal.md) | |
| Policy Controls | versioning | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Policy documents include explicit version fields and update workflow |
| Policy Controls | acceptance tracking | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Policy acceptance capture is exposed via `/api/compliance/policy-acceptances` |
| Policy Controls | consent audit log | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Consent capture writes both compliance records and audit events |
| Policy Controls | geo-specific policy mapping | P1 | Present | In Progress | To Do | To Do | Done | In Progress | [shared/complianceGovernance.js](/D:/localsy/shared/complianceGovernance.js) | Policy documents support locality-level applicability via `localityIds` |

## 4.23 Platform Governance

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Audit and Compliance Logs | admin logs | P0 | Present | In Progress | Done | In Progress | Done | In Progress | [FEATURE_CATALOG.md](/D:/localsy/FEATURE_CATALOG.md) | |
| Audit and Compliance Logs | merchant logs | P0 | Partial | In Progress | Done | In Progress | Done | In Progress | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Audit and Compliance Logs | consent logs | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Consent records are queryable through admin compliance endpoints and mirrored into audit logs |
| Audit and Compliance Logs | policy acceptance logs | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Policy acceptance records are queryable through admin compliance endpoints and mirrored into audit logs |
| Privacy Controls | masked PII | P0 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Privacy Controls | restricted contact visibility | P0 | Present | In Progress | In Progress | In Progress | In Progress | To Do | [USER_FLOWS.md](/D:/localsy/USER_FLOWS.md) | |
| Privacy Controls | retention enforcement | P0 | Present | In Progress | To Do | To Do | Done | In Progress | [server.js](/D:/localsy/server.js) | Retention enforcement is exposed via `/api/admin/compliance/retention/enforce` |
| Risk Controls | abuse flags | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [24-platform-governance.md](/D:/localsy/docs/03-module-specifications/24-platform-governance.md) | |
| Risk Controls | suspicious activity detection | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [VAPT_CHECKLIST.md](/D:/localsy/VAPT_CHECKLIST.md) | |
| Risk Controls | escalation workflow | P1 | Partial | In Progress | In Progress | In Progress | In Progress | To Do | [19-admin-operations.md](/D:/localsy/docs/03-module-specifications/19-admin-operations.md) | |

## 4.24 Integrations

| Sub-module | Sub-sub-module | Priority | Current Codebase Maturity | Delivery Stage | UX Mockup | UI | Development | Testing | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Maps and Geo | maps provider | P1 | Present | In Progress | In Progress | In Progress | Done | In Progress | [server.js](/D:/localsy/server.js) | Runtime map provider metadata is exposed via `/api/runtime-config` |
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
