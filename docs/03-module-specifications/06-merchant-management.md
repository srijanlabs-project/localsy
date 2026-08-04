---
id: LOCALISY-DOC-106
title: Merchant Management Module Specification
document: 06-merchant-management.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines merchant onboarding, merchant workspace capabilities, subscriptions, and performance visibility.

# 2. Business Objective

The module must convert businesses into active platform participants who can manage presence, receive leads, and buy visibility.

# 3. Actors and Personas

- seller
- admin
- moderator
- support

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Merchant Onboarding | apply for listing, claim listing, KYC submission, approval workflow | acquire and verify merchants |
| Merchant Workspace | edit listing, update hours, upload assets, manage offers | merchant self-service control |
| Merchant Subscription | plan mapping, entitlements, visibility tiers, renewal state | commercialize merchant access |
| Merchant Insights | impressions, clicks, leads, conversions, campaign stats | show performance and value |

# 5. Functional Requirements

## 5.1 Merchant Onboarding

- the system shall support new merchant listing submissions
- the system shall support claim-existing-listing workflows
- the system shall support merchant verification status tracking

## 5.2 Merchant Workspace

- merchants shall be able to edit approved listing content within permission limits
- merchants shall manage offers, assets, and selected public listing fields
- merchant edits may require moderation based on field sensitivity

## 5.3 Merchant Subscription

- the system shall support plan or tier assignment
- the system shall support visibility entitlements and feature limits
- the system shall support renewal or expiry handling if paid plans are introduced

## 5.4 Merchant Insights

- the system shall show listing engagement and lead metrics
- the system shall expose campaign-level value signals where available

# 6. UX Surfaces

- merchant signup and claim flow
- merchant dashboard
- merchant listing editor
- merchant performance widgets

# 7. Data and Entities

- seller profile
- seller-to-listing mapping
- KYC status
- subscription or plan record
- merchant insights metrics

# 8. APIs and Services

- merchant onboarding API
- claim listing API
- merchant-owned listing update API
- merchant performance service
- plan and entitlement service

# 9. Workflows and States

- merchant application -> pending review -> approved or rejected
- claim request -> verified -> ownership mapped
- merchant update -> moderation review when needed
- plan active -> expiring -> renewed or downgraded

# 10. Security, Permissions, and Audit

- merchants shall access only owned listings and associated leads
- claim and ownership decisions shall be auditable
- paid entitlement changes shall be traceable

# 11. Notifications, Reports, and Dashboards

- merchant approval notifications
- claim request review report
- merchant performance dashboard
- expiring plan or visibility alert

# 12. Dependencies

- Identity and Access
- Business Directory Core
- Lead and CRM
- Billing and Commercial

# 13. Non-Functional Requirements

- merchant workspace should be simple enough for low-tech SMB users
- partial drafts and safe edits should not corrupt public listings

# 14. Open Questions and Next Deep Specs

- exact moderation rules for merchant-edited fields
- multi-listing and agency-style merchant ownership
- next deep spec: Merchant Onboarding
