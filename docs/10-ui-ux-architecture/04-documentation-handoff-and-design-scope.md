---
id: LOCALISY-DOC-1004
title: Localisy Documentation Handoff and Design Scope
document: 04-documentation-handoff-and-design-scope.md
version: 1.0
status: Ready for UX Phase
---

# 1. Purpose

This document closes the current documentation phase for Localisy and establishes the approved starting scope for UX mockups and UI screen design.

The objective is not to claim that every future detail is frozen.

The objective is to confirm that the platform definition is now complete enough for design execution to begin without waiting for more requirement writing.

# 2. Documentation Closure Decision

The following documentation foundation is considered sufficient for the next phase:

- platform vision and operating model are defined
- module and sub-module structure is defined
- parent module specifications are available across the platform
- priority deep specifications are available for SEO, routing, listings, search, duplicates, WhatsApp orchestration, and consent
- backlog and execution checklist structure is available
- information architecture, screen inventory, and journey mapping are available

For the current program phase, documentation is now considered `functionally complete for UX and UI initiation`.

Further documentation can continue in parallel only when it supports active design or development and should not block screen work.

# 3. What Is Locked for Design

The following product decisions should now be treated as design inputs:

- Localisy is a hyperlocal business directory and discovery platform, not a narrow NGO or medical-only product
- tenant scope is `locality`, not city
- the platform supports national, city, and locality discovery layers
- the database model is shared, with tenant context handled through locality and geography scoping
- the core object model should remain entity-led, with businesses and related records managed as entities
- duplicate creation should be prevented or reviewed rather than freely multiplying the same real-world entity
- data changes are relatively low frequency and operational workflows matter more than real-time editing
- WhatsApp is a delivery and discovery channel, not just a notification channel
- AI, search, SEO, and structured listing discovery are all core platform capabilities

# 4. First Design Slice

The first active UX and UI slice should align to the highest-priority implementation stream already identified in the master checklist:

1. Tenant and Geography
2. Identity and Access
3. Business Directory Core
4. Discovery and Search
5. SEO and Organic Growth
6. Duplicate and Data Quality
7. Web Experience
8. Admin Operations
9. Compliance and Legal

# 5. Priority Screens for Mockups

## 5.1 Wave 1 Public Experience

- national landing page
- city landing page
- locality landing page
- category results page
- search results page
- listing detail page
- OTP and contact unlock modal
- review submission flow

## 5.2 Wave 1 Merchant Experience

- claim business entry
- add business onboarding
- merchant dashboard
- listing editor
- lead inbox summary

## 5.3 Wave 1 Internal Operations

- admin login
- admin dashboard
- geography manager
- business moderation queue
- duplicate review queue
- homepage and SEO configuration

## 5.4 Wave 1 Compliance Surfaces

- consent capture in OTP/contact unlock flow
- privacy policy page
- terms and conditions page
- listing disclaimer or reporting surface

# 6. Screens That Can Wait for Later Waves

The following should not block Wave 1 design:

- advanced merchant billing screens
- sponsored campaign management
- deep analytics dashboards
- API consumer portals
- mobile-native app screens
- full WhatsApp operations console
- AI training and feedback console

# 7. UX Handoff Rules

From this point onward:

- mockups should trace back to the master checklist and the screen inventory
- if a new screen is proposed, it should be mapped to a module and sub-module before design starts
- if a requirement gap is discovered, add only the missing point needed for the active screen instead of reopening broad documentation work
- design should prioritize user journeys, decision points, and trust signals before visual polish
- UI should preserve locality context consistently across public discovery surfaces

# 8. Ready State for the Team

The documentation phase is sufficiently closed for:

- low-fidelity UX flows
- wireframes
- screen-by-screen mockups
- component inventory creation
- UI design system definition
- frontend implementation planning

The next recommended execution sequence is:

1. finalize Wave 1 screen list
2. create low-fidelity user flows
3. create UX mockups
4. convert approved mockups into UI screens
5. map screens to engineering tickets

# 9. Source Set for Designers

Design should start from these source documents:

- [01-product-vision-and-scope.md](/D:/localsy/docs/01-platform-overview/01-product-vision-and-scope.md)
- [01-module-submodule-catalog.md](/D:/localsy/docs/04-submodule-catalog/01-module-submodule-catalog.md)
- [01-module-delivery-checklist.md](/D:/localsy/docs/09-product-backlog/01-module-delivery-checklist.md)
- [01-information-architecture.md](/D:/localsy/docs/10-ui-ux-architecture/01-information-architecture.md)
- [02-screen-inventory.md](/D:/localsy/docs/10-ui-ux-architecture/02-screen-inventory.md)
- [03-journey-to-screen-map.md](/D:/localsy/docs/10-ui-ux-architecture/03-journey-to-screen-map.md)
