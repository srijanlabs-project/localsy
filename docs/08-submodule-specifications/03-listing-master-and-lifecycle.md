---
id: LOCALISY-DOC-803
title: Listing Master and Lifecycle Deep Specification
document: 03-listing-master-and-lifecycle.md
version: 1.0
status: Draft
---

# 1. Purpose

Define the business rules for the canonical listing record and its lifecycle transitions.

# 2. Required Fields

- name
- locality
- category
- subcategory
- address
- primary contact
- status

# 3. Lifecycle States

- draft
- pending
- approved
- rejected
- suspended
- inactive

# 4. Rules

- a listing cannot become approved without valid geography and taxonomy mappings
- rejected listings require a reason
- merchant edits to sensitive fields may move an approved listing back to pending review
- one approved canonical listing should represent one real-world business record inside a locality scope

# 5. Audit Focus

- approval changes
- ownership changes
- restricted field edits
