---
id: LOCALISY-DOC-102
title: Tenant and Geography Module Specification
document: 02-tenant-and-geography.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines how Localisy models locality tenancy, city aggregation, national aggregation, and geography-aware routing.

# 2. Business Objective

The module must ensure that every user, listing, page, and operational workflow resolves into the correct locality context while still enabling city-level and national discovery.

# 3. Actors and Personas

- buyer
- seller
- operator
- admin
- growth operator

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Tenant Management | locality setup, city mapping, national aggregation, tenant status | define locality as the operational tenant |
| Geography Master | country, state, city, locality, area, pincode, geo-boundary | maintain geographic hierarchy |
| Routing and Resolution | pincode mapping, subdomain mapping, reverse geocoding, fallback scope | route users and pages to the correct locality |

# 5. Functional Requirements

## 5.1 Tenant Management

- the system shall treat `locality` as the primary operational tenant
- the system shall allow each locality to map to one city
- the system shall support city pages as aggregate views across localities
- the system shall support a national aggregation layer above cities and localities
- the system shall support tenant activation and deactivation states

## 5.2 Geography Master

- the system shall maintain master records for country, state, city, locality, area, and pincode
- the system shall validate hierarchy integrity across these levels
- the system shall prevent duplicate locality names within the same city unless explicitly allowed by business rule
- the system shall support area-level operational mapping for listings

## 5.3 Routing and Resolution

- the system shall resolve locality from pincode when available
- the system shall support subdomain-to-locality mapping
- the system shall support browser GPS-based locality resolution where permitted
- the system shall define fallback behavior when pincode, GPS, and subdomain do not resolve cleanly
- the system shall log routing mismatches and unmapped cases for operator review

# 6. UX Surfaces

- public locality selector
- pincode entry flow
- city and locality landing pages
- admin geography configuration manager
- routing configuration manager

# 7. Data and Entities

- tenant or tenant-equivalent ownership record
- state master
- city master
- locality master
- area master
- pincode routing mapping
- subdomain mapping

# 8. APIs and Services

- city list and detail APIs
- locality list and detail APIs
- locality routing configuration APIs
- reverse-geocode or GPS locality resolution service
- validation service for geography integrity

# 9. Workflows and States

- locality creation -> configuration -> activation
- city mapping update
- pincode mapping creation and correction
- GPS-based detection -> confirmation -> routing
- unmapped user context -> fallback page -> selection

# 10. Security, Permissions, and Audit

- only authorized internal roles shall change geography masters
- all routing changes shall be audited
- subdomain and pincode changes shall require traceable operator identity

# 11. Notifications, Reports, and Dashboards

- unmapped pincode report
- routing conflict report
- locality activation dashboard
- geography integrity validation report

# 12. Dependencies

- Web Experience
- SEO and Organic Growth
- Business Directory Core
- Admin Operations

# 13. Non-Functional Requirements

- locality resolution should complete quickly enough for first-visit routing
- routing rules should be deterministic and debuggable
- hierarchy validation should prevent broken listing references

# 14. Open Questions and Next Deep Specs

- exact fallback order between subdomain, pincode, GPS, and manual selection
- geo-boundary support depth in v1
- next deep spec: Routing and Resolution
