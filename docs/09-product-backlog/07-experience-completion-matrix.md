---
id: LOCALISY-DOC-907
title: Localisy Experience Completion Matrix
document: 07-experience-completion-matrix.md
version: 1.0
status: Draft
---

# 1. Purpose

This document reframes the Localisy backlog around experience quality instead of only around module boundaries.

The goal is to ensure that nothing materially harmful to:

- customer experience
- operations experience
- advertiser experience

is accidentally left incomplete while the platform is being built.

This matrix is current as of `July 30, 2026`.

# 2. Experience Priority Order

The platform should be completed in this order:

1. `Customer Experience Critical`
2. `Ops Experience Critical`
3. `Advertiser Experience Critical`
4. `Deferred / Enhancement`

If a sub-module can materially damage customer trust, reliability, or discoverability, it should be treated as `P0` even if its parent module is otherwise broader.

# 3. Experience Principles

## 3.1 Customer Experience

Customer experience must optimize for:

- fast and accurate discovery
- trustworthy listing quality
- frictionless contact and conversion
- clear locality context
- mobile-friendly interactions
- recovery when no perfect result exists

## 3.2 Ops Experience

Operations experience must optimize for:

- fast moderation
- strong quality control
- geographic correctness
- duplicate control
- safe internal controls
- auditability

## 3.3 Advertiser Experience

Advertiser experience must optimize for:

- easy onboarding
- reliable visibility
- measurable lead value
- controlled promotions
- clear plan entitlements

# 4. Customer Experience Critical Matrix

These items should not be left incomplete if the goal is to deliver the best user-facing discovery experience.

| Experience Area | Key Modules | High-Impact Sub-modules | Why It Matters | Current State |
|---|---|---|---|---|
| Entry and Routing | Tenant and Geography, Web Experience | locality setup, city mapping, locality route handling, fallback scope, pincode mapping | wrong routing breaks the entire experience before search even starts | strong base exists, still not fully hardened |
| Search Input | Discovery and Search | keyword input, autosuggest, multilingual parsing, pincode filter, locality filter | poor query capture reduces relevance immediately | partly built |
| Result Quality | Discovery and Search, Duplicate and Data Quality | locality-first ranking, trust boost, popularity boost, duplicate detection, canonical listing logic | customers lose trust if bad or duplicate listings dominate results | partial |
| Listing Trust | Business Directory Core, Reviews and Reputation | verification, verified badge, KYC, response time, satisfaction score, verified reviews | trust signals influence contact conversion and repeat usage | partial |
| Listing Detail | Business Directory Core, Web Experience | address, phone, WhatsApp, hours, website, tags, map context, trust panels | detail page is the conversion surface | partial, actively being expanded |
| Contact and Conversion | Business Directory Core, Lead and CRM | call, WhatsApp, contact unlock, lead capture, action tracking | customers must be able to act confidently after finding a listing | partial |
| No-Result Recovery | Discovery and Search, AI and RAG, WhatsApp Channel | fallback recommendations, follow-up prompts, direct answer, best listing URL | prevents abandonment when exact matching is weak | largely pending |
| Mobile Usability | Web Experience, WhatsApp Channel | mobile-friendly layouts, concise response rendering, low-friction actions | most discovery will be mobile-first | partial |
| Content Freshness | Business Directory Core, Admin Operations | business hours, stale listing review, corrections, invalid contact cleanup | stale data directly harms customer trust | partial |

## 4.1 Customer No-Compromise Checklist

These should be treated as no-compromise customer gates:

- no broken routing between locality, city, category, and listing surfaces
- no dead or misleading phone or WhatsApp actions
- no duplicate businesses surfacing as separate primary results in the same locality
- no weak or missing trust signal on important listings
- no broken modal, auth, or review flow on customer-facing pages
- no empty or confusing no-result state
- no major mobile interaction breakage

# 5. Ops Experience Critical Matrix

These items are critical because ops quality directly controls customer quality.

| Experience Area | Key Modules | High-Impact Sub-modules | Why It Matters | Current State |
|---|---|---|---|---|
| Moderation Control | Admin Operations | approve, reject, suspend, bulk update, escalation | operations must correct bad listings quickly | strong base, still incomplete |
| Listing Governance | Admin Operations, Business Directory Core | listing lifecycle, review queue, correction flow | poor governance causes customer-facing quality drift | in progress |
| Duplicate Control | Duplicate and Data Quality | duplicate detection, merge review, merge resolution | duplicates reduce trust, create ranking noise, and waste ops time | partial |
| Geography Accuracy | Tenant and Geography | state, city, locality, area, pincode, route bindings | geography errors break relevance and SEO together | strong base, still in progress |
| Taxonomy Quality | Admin Operations, Business Directory Core | category, subcategory, business type, service type | weak classification harms search and ad matching | partial |
| Internal Permissions | Identity and Access, Platform Governance | RBAC, admin roles, moderator roles, operator roles | unsafe permissions create data risk and operational confusion | partial |
| Audit and Review | Platform Governance, Admin Operations | audit logs, suspicious action review, governance cases | operators need a reliable trail for quality and disputes | partial |
| Data Operations | Admin Operations, Documents and Knowledge Sources | bulk import, corrections, exports, source intake review | ops must be able to maintain and scale inventory safely | partial |
| Support Resolution | User and Persona Management, Admin Operations | support user, complaint review, history visibility | support experience affects retention and trust | largely pending |

## 5.1 Ops No-Compromise Checklist

- operators must be able to correct bad listings without engineering help
- moderators must be able to merge duplicates safely
- locality and pincode mappings must be inspectable and editable
- all high-risk write actions must be auditable
- role restrictions must prevent accidental unsafe admin operations

# 6. Advertiser Experience Critical Matrix

Advertiser experience should be completed after customer and ops reliability are acceptable, but should still be treated as a major product track.

| Experience Area | Key Modules | High-Impact Sub-modules | Why It Matters | Current State |
|---|---|---|---|---|
| Merchant Onboarding | Merchant Management | apply for listing, claim listing, KYC submission, approval workflow | merchants must enter the platform easily and credibly | partial |
| Merchant Workspace | Merchant Management | edit listing, update hours, upload assets, manage offers | advertisers need control over listing quality and freshness | partial |
| Lead Value | Lead and CRM | lead capture, lead stage, contact history, follow-up visibility | advertisers must see measurable business value | largely pending |
| Promotion and Visibility | Offers, Ads, and Promotion | sponsored boost, offers, ad slots, campaign setup | monetization depends on controlled visibility products | partial |
| Insights | Merchant Management, Analytics and Reporting | impressions, clicks, leads, conversions, campaign stats | without feedback loops advertisers distrust spend | largely pending |
| Commercial Clarity | Billing and Commercial | plans, entitlements, visibility tiers, renewal state | unclear plans or entitlements damage monetization and support load | largely pending |

## 6.1 Advertiser No-Compromise Checklist

- no advertiser should pay without understanding what visibility they receive
- claim and KYC flows must be clear and stateful
- lead capture must be trackable and reviewable
- promoted inventory must not visibly damage customer trust

# 7. Deferred / Enhancement Tracks

These are important, but should not be allowed to displace customer and ops foundations.

| Module Group | Why Deferred |
|---|---|
| AI and RAG advanced retrieval | valuable, but weak core search and trust must be solved first |
| multilingual response generation beyond core discovery | important, but should follow stable discovery and content quality |
| advanced billing automation | should follow validated advertiser demand and lead quality |
| advanced reporting suites | should follow baseline operational and merchant metrics |

# 8. Recommended Execution Order

## 8.1 Phase 1: Customer Discovery Core

Complete first:

- routing and locality selection hardening
- city/locality/category/listing flow
- category search and result behavior
- listing detail trust and contact actions
- verified review flow
- duplicate reduction in surfaced results

## 8.2 Phase 2: Ops Quality Core

Complete next:

- moderation queue hardening
- duplicate merge workflow
- geography and taxonomy quality controls
- audit trail and role restrictions
- import/correction tooling

## 8.3 Phase 3: Advertiser Value Core

Complete after customer and ops reliability stabilize:

- merchant claim and KYC flow
- merchant listing workspace
- offers and sponsored visibility
- lead capture and CRM basics
- merchant insight basics

## 8.4 Phase 4: Channel and Intelligence Expansion

Complete after the above:

- WhatsApp listing URL response flow
- AI-assisted retrieval and follow-up flow
- advanced multilingual orchestration
- richer analytics and campaign intelligence

# 9. Experience-Based Build Classification

The remaining backlog should be interpreted through this lens:

| Classification | Meaning | Expected Action |
|---|---|---|
| `Experience Critical` | directly impacts customer trust or usability | build now |
| `Ops Critical` | directly protects customer quality and platform control | build immediately after or in parallel with customer-critical work |
| `Revenue Critical` | required for advertiser success and monetization | build after customer and ops baseline is reliable |
| `Deferred` | useful but not necessary to protect trust or baseline value | schedule later |

# 10. Current Build Focus

As of `July 30, 2026`, the active implementation focus should remain:

- `Customer Experience Critical`
- specifically:
  - public discovery page flow
  - search/result/detail conversion surfaces
  - reviews and trust
  - contact actions

The next major shift should be toward:

- `Ops Experience Critical`
- specifically:
  - duplicate handling
  - moderation hardening
  - geography and taxonomy correctness

# 11. Working Rule

When choosing between two backlog items:

1. prefer the one that protects customer trust
2. if equal, prefer the one that improves ops control
3. only then prefer the one that improves monetization

This rule should guide delivery sequencing until the platform reaches a stable trust-worthy baseline.
