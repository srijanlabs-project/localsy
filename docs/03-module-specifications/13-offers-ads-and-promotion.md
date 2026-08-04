---
id: LOCALISY-DOC-113
title: Offers, Ads, and Promotion Module Specification
document: 13-offers-ads-and-promotion.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines merchant promotions, sponsored visibility, ad inventory, and campaign performance.

# 2. Business Objective

The module must let merchants pay for more visibility and run local promotions without damaging trust in the directory experience.

# 3. Actors and Personas

- seller
- growth operator
- admin
- buyer

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Offers and Coupons | coupon creation, locality targeting, category targeting, CTA handling | merchant-driven promotions |
| Sponsored Listings | paid boost, CPC budget, sponsor labels, position control | monetized discovery placement |
| Ad Inventory | banner ads, listing ads, lead-form ads, placement slots | run ad placements across surfaces |
| Campaign Analytics | clicks, leads, conversion, ROI | measure commercial performance |

# 5. Functional Requirements

## 5.1 Offers and Coupons

- the system shall allow merchants or admins to create offers and coupons
- offers shall support locality and category targeting
- offers shall respect active dates and expiry rules

## 5.2 Sponsored Listings

- the system shall support paid listing boosts
- sponsored placements shall remain visibly labeled
- ranking placement rules shall remain configurable and auditable

## 5.3 Ad Inventory

- the system shall support banner, card, and lead-form ad types
- the system shall support placement keys, locality targeting, and device targeting

## 5.4 Campaign Analytics

- the system shall track ad clicks, leads, and campaign outcomes
- the system should support ROI-oriented visibility for admin and merchant views

# 6. UX Surfaces

- merchant offer creation surfaces
- public sponsored cards and ad slots
- admin campaign and placement management
- merchant performance view

# 7. Data and Entities

- marketing coupon
- sponsored listing attributes
- listing ad
- ad lead
- campaign stats

# 8. APIs and Services

- offer CRUD API
- sponsored listing placement service
- ad inventory API
- campaign reporting service

# 9. Workflows and States

- offer draft -> active -> expired
- campaign created -> targeted -> live -> archived
- lead-form interaction -> lead captured -> merchant notified

# 10. Security, Permissions, and Audit

- paid promotion changes shall be auditable
- merchants shall only manage their own campaigns unless authorized otherwise
- sponsor labeling shall not be removable from eligible public surfaces

# 11. Notifications, Reports, and Dashboards

- active campaign dashboard
- expired offer report
- sponsor performance report
- ad lead capture summary

# 12. Dependencies

- Merchant Management
- Homepage and CMS
- Lead and CRM
- Billing and Commercial

# 13. Non-Functional Requirements

- promotion logic must not break public page performance
- targeting logic should remain explainable and testable

# 14. Open Questions and Next Deep Specs

- CPC vs flat-fee monetization depth
- billing coupling for ad delivery
- next deep spec: Sponsored Listings
