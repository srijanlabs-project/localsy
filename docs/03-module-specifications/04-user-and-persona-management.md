---
id: LOCALISY-DOC-104
title: User and Persona Management Module Specification
document: 04-user-and-persona-management.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines buyer, merchant, and internal-user profile management.

# 2. Business Objective

The module must give each persona the right identity context, history, and account tools without overcomplicating the discovery experience.

# 3. Actors and Personas

- buyer
- seller
- moderator
- operator
- admin
- support

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Buyer Profile | saved listings, contact unlock history, reviews, recent activity | maintain buyer engagement history |
| Merchant Profile | owned listings, subscriptions, KYC status, lead stats | maintain merchant account identity |
| Internal User Profile | admin user, moderator user, operator user, support user | maintain internal workforce identity |

# 5. Functional Requirements

## 5.1 Buyer Profile

- the system shall store saved listings and recent buyer actions
- the system shall show OTP-based contact unlock history where applicable
- the system shall show buyer review activity

## 5.2 Merchant Profile

- the system shall maintain seller identity linked to one or more owned listings
- the system shall track merchant plan or visibility tier where commercialized
- the system shall support KYC or verification status tracking

## 5.3 Internal User Profile

- the system shall maintain role, locality scope, and operational identity for internal users
- the system shall support role-aware profile display and accountability

# 6. UX Surfaces

- buyer dashboard
- merchant dashboard
- internal account profile or control surfaces

# 7. Data and Entities

- buyer activity event
- seller profile
- seller-to-business mapping
- internal user profile
- review ownership references

# 8. APIs and Services

- profile fetch and update services
- buyer activity history API
- seller linkage service
- internal user management service

# 9. Workflows and States

- buyer signup and first activity capture
- seller linkage to listing
- internal user role assignment and updates

# 10. Security, Permissions, and Audit

- users shall only view their own activity unless authorized otherwise
- seller profile changes shall be audited where they affect ownership or permissions
- internal profile changes shall be traceable

# 11. Notifications, Reports, and Dashboards

- buyer activity summary
- merchant profile completeness summary
- internal user role audit report

# 12. Dependencies

- Identity and Access
- Lead and CRM
- Reviews and Reputation
- Billing and Commercial

# 13. Non-Functional Requirements

- dashboards should remain lightweight and mobile-usable
- profile history should remain consistent across sessions

# 14. Open Questions and Next Deep Specs

- whether one merchant can own multiple businesses across localities in v1
- next deep spec: Merchant Profile if multi-business ownership becomes core
