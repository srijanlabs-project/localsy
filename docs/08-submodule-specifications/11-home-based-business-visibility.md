---
id: LOCALISY-DOC-811
title: Home-Based Business Visibility Deep Specification
document: 11-home-based-business-visibility.md
version: 1.0
status: Draft
---

# 1. Purpose

Define how Localisy should recognize, protect, and promote home-based businesses such as home bakers and other home entrepreneurs.

# 2. Objectives

The platform must:

- make high-quality home-based businesses discoverable
- avoid exposing unsafe or overly precise residential data
- let operators and customers identify trusted home businesses clearly
- support optional special recognition for women-led home businesses without forcing disclosure

# 3. Target Segments

Examples include:

- home bakers
- tiffin providers
- home chefs
- home tutors
- boutique creators
- beauty or wellness professionals working from home
- women-led home enterprises

# 4. Classification Model

Each listing should support classification signals such as:

- `is_home_based`
- `is_service_area_business`
- `women_led_optional`
- `pickup_available`
- `delivery_available`
- `appointment_only`

These fields may be explicit or inferred during migration, but they should become first-class listing attributes over time.

# 5. Visibility Principles

Home-based businesses should receive recognition without looking like spam.

Rules:

- visibility should come from relevance plus trust
- special recognition should not override poor quality or poor fit
- the label should feel respectful and confidence-building

# 6. Customer-Facing Recognition

Supported recognition patterns:

- `Home Business`
- `Home Baker`
- `Made at Home`
- `Women-led Home Business`

The `Women-led Home Business` badge should be optional and user-controlled.

# 7. Privacy and Safety

Because many listings may be residential, the platform should support:

- area-level display instead of full exact home address by default
- gated phone visibility where configured
- optional pickup-only or delivery-only modes
- policy review for unsafe exposure of personal details

# 8. Ranking and Discovery

The ranking layer should support special boosts for valid home-business intent:

- `home baker`
- `homemade cake`
- `tiffin service`
- `home catering`
- `made at home`

Rules:

- home-business boosts should activate only when intent is relevant
- verified home-based businesses should outrank weak or duplicate listings
- sponsored promotion must remain labeled

# 9. Listing Experience

Home-based listings should be able to show:

- service area
- fulfillment mode
- order lead time
- pickup or delivery availability
- trust markers
- personalization cues such as custom orders

# 10. Ops and Review

Ops should be able to:

- mark a listing as home-based
- approve or remove visibility badges
- hide exact address exposure
- review misuse of women-led or home-business labels

# 11. Commercial and Growth

The platform may support:

- dedicated discovery shelves for home businesses
- seasonal promotion packs for bakers and home creators
- special onboarding tracks for first-time entrepreneurs

# 12. Analytics

Track at minimum:

- home_business_listing_views
- home_business_result_clicks
- home_business_contact_unlocks
- home_business_leads
- badge_ctr

# 13. Dependencies

- Business Directory Core
- Discovery and Search
- Merchant Management
- Compliance and Legal
- Analytics and Reporting
