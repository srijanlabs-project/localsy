---
id: LOCALISY-DOC-809
title: Ops Ad Review and Approval Deep Specification
document: 09-ops-ad-review-and-approval.md
version: 1.0
status: Draft
---

# 1. Purpose

Define the operational workflow for reviewing, approving, rejecting, scheduling, and auditing submitted ads and campaign creatives.

# 2. Objectives

The workflow must let ops:

- review ad submissions quickly
- prevent misleading or low-quality ads
- enforce locality, category, and policy correctness
- publish approved ads safely

# 3. Submission Types

Supported submissions:

- listing ads
- banner ads
- lead-form ads
- sponsored listing campaigns
- hero campaign creatives

# 4. Workflow States

- draft
- submitted
- under review
- approved
- scheduled
- live
- paused
- rejected
- archived

# 5. Review Checks

Every submitted ad should support review against:

- creative quality
- misleading claims
- prohibited content
- category mismatch
- locality mismatch
- broken destination
- invalid schedule
- budget inconsistency
- sponsor label correctness

# 6. Ops Surfaces

- submitted ad queue
- creative preview surface
- approve or reject action panel
- schedule and targeting review panel
- audit history surface

# 7. Required Actions

Ops users should be able to:

- approve
- reject
- request revision
- pause live campaign
- edit schedule
- edit placement scope
- inspect performance anomalies

# 8. Required Audit Data

Every review action should log:

- actor
- timestamp
- prior state
- next state
- reason
- notes
- affected campaign or creative

# 9. Reports and Dashboards

- pending ad review queue
- rejected ad reasons report
- live campaign exception report
- policy violation report
- paused-by-ops campaign report

# 10. Dependencies

- Admin Operations
- Offers, Ads, and Promotion
- Platform Governance
- Compliance and Legal
- Notifications and Communication
