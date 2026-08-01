---
id: LOCALISY-DOC-808
title: Ad Intelligence and Rotation Deep Specification
document: 08-ad-intelligence-and-rotation.md
version: 1.0
status: Draft
---

# 1. Purpose

Define how Localisy should optimize ad delivery, creative rotation, and placement decisions without damaging customer trust.

# 2. Objectives

The ad intelligence layer must:

- improve advertiser outcomes
- keep placements relevant to customer intent
- support dynamic rotation and positioning
- remain explainable for ops and finance review

# 3. Optimization Goals

Supported optimization goals:

- click-through rate
- listing visit rate
- contact unlock rate
- WhatsApp click rate
- lead submission rate
- qualified lead rate
- conversion value where available

# 4. Decision Inputs

- locality
- category
- query intent
- page type
- device
- time of day
- day of week
- placement key
- creative performance
- campaign budget state
- frequency and fatigue state

# 5. Delivery Modes

## 5.1 Random Rotation

Use as the starting mode for new campaigns and low-data scenarios.

## 5.2 Weighted Rotation

Shift traffic toward higher-performing creatives using weighted performance scores.

## 5.3 Contextual Optimization

Support locality, category, device, and intent-aware delivery once enough signal exists.

# 6. Dynamic Repositioning

The platform should support:

- moving higher-performing ads into stronger slots
- reducing weak-performing ads in premium placements
- preserving policy caps so weak but highly paid ads do not harm customer experience

Rules:

- paid priority cannot bypass trust safeguards
- customer relevance must remain stronger than pure spend

# 7. Budget and Pacing

The system should support:

- daily pacing
- campaign start and end dates
- burst vs even-delivery modes
- pause on budget exhaustion
- protection from early over-delivery

# 8. Frequency and Fatigue

The system should support:

- frequency caps by session or visitor identity where available
- fatigue detection when CTR declines after repeated exposure
- creative replacement recommendation

# 9. Creative Intelligence

Each ad campaign may contain multiple creatives.

The system should support:

- headline variations
- CTA variations
- image variations
- destination variations

Creative scoring should consider:

- CTR
- lead rate
- qualified lead rate
- bounce after click
- freshness

# 10. Explainability

Ops and advertisers should be able to see why a creative or placement is favored:

- best CTR in locality
- highest lead rate in category
- lower fatigue than alternative creatives
- better mobile performance

# 11. Metrics

- impressions
- clicks
- CTR
- lead count
- qualified lead count
- cost per click
- cost per lead
- placement-wise performance
- creative-wise performance
- locality-wise performance

# 12. Dependencies

- Offers, Ads, and Promotion
- Analytics and Reporting
- Billing and Commercial
- Web Experience
- WhatsApp Channel
