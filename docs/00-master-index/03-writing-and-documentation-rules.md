---
id: LOCALISY-DOC-003
title: Writing and Documentation Rules
document: 03-writing-and-documentation-rules.md
version: 1.0
status: Draft
---

# 1. Purpose

This document defines the authoring rules for the Localisy documentation library.

# 2. Writing Rules

- write one source of truth per topic
- prefer references over duplication
- write for both business and technical readers
- keep product intent visible before technical detail
- state assumptions explicitly
- use tables for inventories and structured comparisons
- use numbered sections for stable referencing

# 3. Specification Rules

- every parent module spec should follow the shared template
- every deep specification should include business rules, states, dependencies, and test scenarios
- every sensitive workflow should cover permissions, security, and audit treatment
- every externally visible feature should define analytics events and operational visibility

# 4. Change Control

- update indexes whenever a new document is added
- link related documents instead of repeating the same logic
- preserve document ids once published
- prefer additive revisions over rewriting history without traceability
