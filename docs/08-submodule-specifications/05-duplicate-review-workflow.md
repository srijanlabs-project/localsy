---
id: LOCALISY-DOC-805
title: Duplicate Review Workflow Deep Specification
document: 05-duplicate-review-workflow.md
version: 1.0
status: Draft
---

# 1. Purpose

Define how probable duplicate listings are reviewed and resolved.

# 2. Candidate Inputs

- name similarity
- address similarity
- phone similarity
- locality match
- category compatibility

# 3. Resolution Actions

- merge into existing canonical listing
- keep separate
- create new listing

# 4. Required Rules

- operator or moderator must see why a candidate was flagged
- merge actions must preserve source lineage
- risky merges should be reversible where possible
- repeated false-positive patterns should be reviewable for rule tuning

# 5. Audit Focus

- candidate reviewed by
- action chosen
- target canonical listing
- rationale
