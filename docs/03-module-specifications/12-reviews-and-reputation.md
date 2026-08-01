---
id: LOCALISY-DOC-112
title: Reviews and Reputation Module Specification
document: 12-reviews-and-reputation.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines how Localisy captures, moderates, and uses reviews and trust signals.

# 2. Business Objective

The module must strengthen buyer trust and improve listing quality signals while reducing spam and abuse.

# 3. Actors and Personas

- buyer
- seller
- moderator
- admin

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Review Collection | rating capture, comment capture, OTP verification, merchant reply | collect user trust signals |
| Moderation | spam review detection, abuse flags, profanity control, report queue | maintain review quality |
| Reputation Signals | review count, average rating, helpful votes, trending score | expose trust for ranking and UX |

# 5. Functional Requirements

## 5.1 Review Collection

- the system shall allow buyers to submit ratings and comments
- review submission for verified flows shall support OTP or equivalent verification
- merchants may respond to approved reviews where enabled

## 5.2 Moderation

- the system shall support reporting and moderation review of suspicious content
- the system should support profanity and abuse heuristics
- the system shall support moderation status and resolution notes

## 5.3 Reputation Signals

- the system shall compute review count and average rating
- the system may support helpful-vote and trend signals where useful
- trust signals may be reused by ranking and listing cards

# 6. UX Surfaces

- review submission form
- listing reviews section
- merchant reply surface
- moderator review queue

# 7. Data and Entities

- review
- review moderation state
- merchant reply
- helpful-vote or trust signal record

# 8. APIs and Services

- review submission API
- review moderation API
- merchant reply API
- reputation aggregation service

# 9. Workflows and States

- review drafted -> verified -> approved or flagged
- reported review -> moderator review -> keep, edit-state, or remove
- merchant reply -> published

# 10. Security, Permissions, and Audit

- buyer identity checks shall protect against spam review abuse
- moderation actions shall be auditable
- merchants shall not alter buyer-authored content directly

# 11. Notifications, Reports, and Dashboards

- new review alerts
- flagged review queue
- reputation summary dashboard
- review abuse report

# 12. Dependencies

- Identity and Access
- Business Directory Core
- Discovery and Search

# 13. Non-Functional Requirements

- review submission should remain lightweight on mobile
- reputation aggregates should update consistently
- moderation tools should handle volume without blocking ops

# 14. Open Questions and Next Deep Specs

- exact verified-review policy
- merchant reply rules and moderation depth
- next deep spec: Moderation
