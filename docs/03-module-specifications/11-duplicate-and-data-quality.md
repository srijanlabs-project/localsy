---
id: LOCALISY-DOC-111
title: Duplicate and Data Quality Module Specification
document: 11-duplicate-and-data-quality.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines how Localisy prevents duplicate listings and preserves canonical data quality.

# 2. Business Objective

The module must keep the directory trustworthy by ensuring the same real-world business is not repeatedly created inside the same locality scope.

# 3. Actors and Personas

- operator
- moderator
- admin

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Duplicate Detection | name match, phone match, address match, fuzzy similarity | identify likely duplicate listings |
| Review Workflow | duplicate queue, merge, keep separate, create new listing | resolve duplicate outcomes |
| Canonicalization | alias handling, normalization, source lineage, canonical listing | preserve clean master records |
| Validation Rules | required fields, geo validation, taxonomy validation, format rules | prevent bad data from spreading |

# 5. Functional Requirements

## 5.1 Duplicate Detection

- the system shall evaluate probable duplicates using name, phone, address, and contextual signals
- duplicate scoring should be locality-aware first

## 5.2 Review Workflow

- the system shall expose duplicate candidates for operator or moderator review
- users shall be able to merge, keep separate, or create a new listing where justified

## 5.3 Canonicalization

- the system shall preserve one canonical listing per approved business representation
- the system shall store aliases and source lineage without destroying history

## 5.4 Validation Rules

- the system shall validate taxonomy, geography, format, and mandatory fields before approval
- the system shall flag data anomalies for operator action

# 6. UX Surfaces

- duplicate candidate queue
- merge review surface
- listing validation errors in admin forms
- import review interface

# 7. Data and Entities

- duplicate candidate
- source record
- normalized listing record
- alias record
- validation error state

# 8. APIs and Services

- duplicate candidate service
- merge resolution API
- normalization service
- field validation service

# 9. Workflows and States

- source imported -> duplicate scored -> reviewed -> resolved
- manual listing edit -> validation -> saved or blocked
- canonical record updated with lineage retained

# 10. Security, Permissions, and Audit

- duplicate resolution actions shall be audited
- only authorized roles shall perform merge or keep-separate decisions
- destructive canonical changes shall be traceable

# 11. Notifications, Reports, and Dashboards

- duplicate backlog dashboard
- validation error dashboard
- merge activity audit report
- locality data quality report

# 12. Dependencies

- Business Directory Core
- Documents and Knowledge Sources
- Admin Operations

# 13. Non-Functional Requirements

- duplicate scoring must remain explainable to operators
- merge decisions should be reversible where feasible
- validation must not create excessive false positives

# 14. Open Questions and Next Deep Specs

- exact merge and rollback mechanics
- tolerance levels by category type
- next deep specs: Duplicate Detection and Review Workflow
