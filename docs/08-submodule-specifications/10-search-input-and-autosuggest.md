---
id: LOCALISY-DOC-810
title: Search Input and Autosuggest Deep Specification
document: 10-search-input-and-autosuggest.md
version: 1.0
status: Draft
---

# 1. Purpose

Define the target search-box experience for Localisy public discovery across web, mobile web, and future WhatsApp-assisted search journeys.

# 2. Objectives

The search input must:

- feel as simple as a single-input Google-like search
- reduce typing effort through smart autosuggest and autocomplete
- understand locality, service, business, and public-service intent
- stay fast, clean, and low-friction on mobile

# 3. Core UX Principle

The primary discovery interaction should be one dominant input.

Users should not need to understand Localisy taxonomy before starting a search.

The system should progressively guide them through:

- free-text query entry
- autosuggest
- intent clarification where needed
- ranked results

# 4. Supported Query Types

The input should support:

- business name queries
- category queries
- subcategory queries
- service-intent queries
- locality-qualified queries
- public-service and emergency queries
- home-business queries

Examples:

- `dentist near me`
- `cake shop in roadpali`
- `home baker in kharghar`
- `blood bank panvel`
- `police station near kalamboli`

# 5. Suggestion Types

Autosuggest should support mixed suggestion rows:

- business suggestions
- category suggestions
- subcategory suggestions
- locality suggestions
- intent shortcuts
- recent search suggestions

Examples of intent shortcuts:

- `Open now`
- `Verified only`
- `Near Roadpali`
- `Home bakers`

# 6. Suggestion Ranking

Suggestion ranking should combine:

- prefix match
- exact match
- popularity
- locality relevance
- trust signals
- recent demand
- user recency where available

Rules:

- exact and prefix matches should dominate weak popularity
- same-locality suggestions should outrank distant suggestions
- verified and trusted listings should be preferred when business names are similar

# 7. Suggestion Row Design

Each suggestion row should be compact and scannable.

The row may include:

- primary label
- secondary context such as category or locality
- suggestion type label
- trust indicator where relevant
- icon for public-service, business, or category context

# 8. Input Behaviors

The input should support:

- debounce while typing
- keyboard navigation
- enter-to-search
- mouse and touch selection
- clear input action
- graceful empty state

Behavior rules:

- autosuggest should appear after meaningful input
- suggestion selection should preserve locality context
- enter should run the best current interpretation even without suggestion selection

# 9. Autocomplete and Query Assistance

The platform should support:

- completing common category phrases
- correcting obvious spelling issues
- recognizing synonyms
- translating known intent terms across supported languages over time

Examples:

- `dr` -> doctor-related suggestions
- `bak` -> bakery and baker suggestions
- `ngo` -> NGO, trust, foundation, charity suggestions

# 10. Locality Awareness

Search must remain locality-aware by default.

The suggestion system should:

- prefer the current locality
- show nearby locality fallback when local coverage is weak
- keep city fallback available without making the user restart the search

# 11. Public-Service and Emergency Handling

Queries for hospitals, police stations, blood banks, ambulances, banks, and similar services should support:

- priority intent classification
- trust-first suggestion ordering
- clearer labels
- quick handoff to phone, directions, or listing page

# 12. Home-Based Business Handling

Search should support special discovery patterns for:

- home bakers
- tiffin services
- home tutors
- women-led home businesses
- small creator-led home enterprises

The input should recognize intent terms such as:

- `home baker`
- `homemade`
- `from home`
- `tiffin`
- `housewife business`

# 13. Mobile Experience

On mobile:

- the input should remain the dominant above-the-fold action
- autosuggest should feel thumb-friendly
- suggestion rows should remain tap-safe
- transitions to results should not feel jumpy or modal-heavy

# 14. Zero-Result Recovery

When the query is weak or no results are found, the system should:

- suggest nearby localities
- suggest related categories
- suggest public-service alternatives for civic queries
- suggest home-business alternatives for handmade or home-service intent

# 15. Analytics Events

The experience should emit at minimum:

- search_query_entered
- autosuggest_viewed
- autosuggest_selected
- search_submitted
- zero_result_returned
- result_clicked

# 16. Dependencies

- Discovery and Search
- Tenant and Geography
- Business Directory Core
- Analytics and Reporting
- Web Experience
