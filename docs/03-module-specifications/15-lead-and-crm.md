---
id: LOCALISY-DOC-115
title: Lead and CRM Module Specification
document: 15-lead-and-crm.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines how Localisy captures buyer intent and exposes merchant-manageable lead workflows.

# 2. Business Objective

The module must turn discovery traffic into actionable merchant leads while preserving consent and traceability.

# 3. Actors and Personas

- buyer
- seller
- admin
- support

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Lead Capture | contact unlocks, inquiry forms, ad lead forms, WhatsApp click intent | capture buyer intent |
| CRM Database | contacts, notes, follow-up history, segmentation | store merchant lead data |
| Lead Routing | merchant routing, operator routing, escalation rules, owner mapping | send leads to the correct owner |
| Lead Lifecycle | new, contacted, qualified, converted, closed | track lead progress |

# 5. Functional Requirements

## 5.1 Lead Capture

- the system shall capture lead events from multiple public actions
- the system shall support attribution back to listing, locality, and campaign context

## 5.2 CRM Database

- the system shall store merchant-visible contact and follow-up records
- the system shall support merchant notes and contact history

## 5.3 Lead Routing

- the system shall map leads to the correct merchant or internal owner
- escalation rules should exist for orphaned or unassigned leads

## 5.4 Lead Lifecycle

- the system should support lead stage transitions from new through closed
- the system should expose lead status summaries to merchants and admins

# 6. UX Surfaces

- lead capture forms
- buyer contact unlock paths
- merchant CRM workspace
- admin lead oversight panels

# 7. Data and Entities

- CRM contact
- ad lead
- lead event
- lead stage
- follow-up note

# 8. APIs and Services

- lead capture API
- merchant CRM API
- lead routing service
- lead stage update API

# 9. Workflows and States

- buyer action -> lead captured -> routed -> merchant follow-up
- merchant note added -> stage updated -> conversion tracked
- orphaned lead -> admin review -> reassignment

# 10. Security, Permissions, and Audit

- merchants shall only access their own lead records
- personal contact data shall follow privacy rules
- lead access and edits shall be auditable

# 11. Notifications, Reports, and Dashboards

- new lead alerts
- merchant lead summary
- lead conversion dashboard
- uncontacted lead aging report

# 12. Dependencies

- Web Experience
- Merchant Management
- Notifications and Communication
- Compliance and Legal

# 13. Non-Functional Requirements

- lead capture should not block the public UX
- lead routing should be reliable and reversible in case of incorrect ownership

# 14. Open Questions and Next Deep Specs

- lead attribution depth across channels
- CRM segmentation and export rules
- next deep spec: Lead Capture
