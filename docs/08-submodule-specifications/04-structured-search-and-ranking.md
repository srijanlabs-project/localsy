---
id: LOCALISY-DOC-804
title: Structured Search and Ranking Deep Specification
document: 04-structured-search-and-ranking.md
version: 2.0
status: Draft
---

# 1. Purpose

Define structured retrieval and result ordering for Localisy public discovery.

# 2. Objectives

The ranking system must:

- feel simple and trustworthy to customers
- keep local relevance stronger than generic popularity
- protect emergency and public-service discovery quality
- preserve room for paid visibility without damaging trust
- support special recognition for home-based businesses where relevant

# 3. Ranking Inputs

- locality match
- category and subcategory match
- text relevance
- trust signals
- review strength
- business freshness where relevant
- sponsored placement flags
- profile completeness
- response speed
- contact validity
- special entity recognition

# 4. Intent Classes

The search layer should treat these as distinct intent patterns:

- commercial local service
- emergency service
- civic/public-service discovery
- social-sector discovery
- food and retail discovery
- home-business discovery
- brand/business lookup
- exploratory browsing

Examples:

- `blood bank near me` should not behave like `salon near me`
- `police station in roadpali` should use public-service logic
- `home baker in kharghar` should boost relevant home-based listings

# 5. Core Ranking Formula

Default search ordering should combine:

- `relevance score`
- `locality fit score`
- `trust score`
- `quality score`
- `engagement score`
- `freshness score`
- `commercial boost`

Conceptual formula:

`rank_score = relevance + locality_fit + trust + quality + engagement + freshness + capped_commercial_boost`

Rules:

- `capped_commercial_boost` must never outweigh a materially better trusted result
- duplicate or weak records must not outrank canonical trusted records
- emergency and civic intent may override ordinary commercial boosts

# 6. Relevance Rules

Relevance should evaluate:

- exact business-name match
- prefix match
- token match
- category match
- subcategory match
- tag match
- description match
- known synonym match

Examples:

- `doctor` should also understand clinic-related listings
- `cake`, `baker`, and `home baker` should connect where valid
- `ngo`, `foundation`, `trust`, and `charity` may require synonym support

# 7. Locality and Geography Rules

- same-locality results should outrank nearby localities by default
- nearby localities may appear when exact-locality coverage is weak
- city-level fallback should activate when locality-level results are low confidence
- pincode and mapped service-area evidence should improve locality confidence

# 8. Trust and Quality Rules

Trust should consider:

- verified badge
- KYC status
- OTP-verified reviews
- response-time indicator
- valid contact completeness
- recent operational updates

Quality should consider:

- profile completeness
- duplicate risk
- invalid or stale contact signals
- outdated hours
- low-information listings

# 9. Sponsored and Paid Ranking Rules

- sponsored listings must be visibly labeled
- sponsored boost must remain configurable and auditable
- sponsored placement must not outrank clearly more relevant trusted results by unlimited weight
- the system should allow different sponsored weights by page type and placement

# 10. Special Recognition Rules

## 10.1 Home-Based Businesses

Home bakers and other home-based businesses should support:

- recognition tags
- discoverability through intent terms such as `home baker`, `homemade cake`, `tiffin`, `made at home`
- optional dedicated badges such as `Home Business` or `Women-led Home Business`
- trust-first exposure rather than spam-like over-promotion

## 10.2 Public and Social Sector Entities

Hospitals, police stations, blood banks, NGOs, and similar entities should support:

- emergency-aware relevance rules
- trust and data-validity emphasis
- special handling when the user intent is urgent or civic

# 11. Sort Modes

- default relevance
- top rated
- nearest
- recently approved
- verified first
- emergency first where relevant

# 12. Zero-Result Handling

- suggest nearby or city-level fallbacks
- suggest related categories
- preserve the user's query context
- suggest special entities when the query is civic or emergency
- suggest home-business alternatives where intent indicates handmade or home service

# 13. Explainability

The ranking layer should remain explainable for ops and debugging.

At minimum, the system should be able to explain why a listing ranked highly:

- exact query match
- verified listing
- same locality
- high review strength
- sponsored placement
- emergency boost
- home-business relevance

# 14. Metrics

Key measures:

- result CTR
- query-to-contact unlock
- query-to-lead
- zero-result rate
- bounce rate on result pages
- trust-weighted click share
- sponsored vs organic quality comparison

# 15. Dependencies

- Business Directory Core
- Duplicate and Data Quality
- Reviews and Reputation
- Offers, Ads, and Promotion
- Analytics and Reporting
