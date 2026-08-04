---
id: LOCALISY-DOC-120
title: Analytics and Reporting Module Specification
document: 20-analytics-and-reporting.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines the reporting and insight layer for growth, operations, merchants, and AI quality governance.

# 2. Business Objective

The module must turn platform activity into usable insight for decision-making, quality improvement, and commercial optimization.

# 3. Actors and Personas

- admin
- growth operator
- seller
- operator
- engineering

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Search Analytics | popular queries, no-result queries, CTR, query-to-lead conversion | measure discovery effectiveness |
| Listing Analytics | views, clicks, unlocks, reviews, leads | measure listing performance |
| Channel Analytics | web, WhatsApp, mobile, campaign comparison | compare channels |
| AI Quality Analytics | answer accuracy, citation coverage, multilingual quality, latency | manage AI quality |

# 5. Functional Requirements

## 5.1 Search Analytics

- the system shall report popular searches and failed search patterns
- the system should support locality and category slicing

## 5.2 Listing Analytics

- the system shall report listing engagement, contact unlocks, and lead actions
- sellers should see scoped visibility into their own listing performance

## 5.3 Channel Analytics

- the system shall compare web, WhatsApp, and future mobile channels where applicable
- campaign and traffic-source comparisons should be supported over time

## 5.4 AI Quality Analytics

- the system should track answer quality metrics and operational AI health
- citation and latency visibility should be available for tuning

# 6. UX Surfaces

- admin analytics dashboard
- merchant insights widgets
- growth dashboards
- AI quality review dashboard

# 7. Data and Entities

- search log
- listing interaction log
- lead event
- campaign event
- AI answer quality event

# 8. APIs and Services

- analytics query service
- merchant-scoped analytics service
- AI quality metrics service
- export/report generation service

# 9. Workflows and States

- event captured -> aggregated -> dashboarded
- operator reviews poor-performing locality or query patterns -> corrective action

# 10. Security, Permissions, and Audit

- merchant analytics shall remain scoped to owned assets
- internal dashboards shall protect private or sensitive event data
- exported reports shall be permission-controlled

# 11. Notifications, Reports, and Dashboards

- search health dashboard
- locality performance dashboard
- merchant performance dashboard
- AI quality dashboard

# 12. Dependencies

- Discovery and Search
- Lead and CRM
- SEO and Organic Growth
- AI and RAG

# 13. Non-Functional Requirements

- analytics must support slicing by locality and time range
- event collection should not degrade transaction performance

# 14. Open Questions and Next Deep Specs

- exact event taxonomy and warehouse strategy
- merchant-facing reporting depth in v1
- next deep spec: Search Analytics
