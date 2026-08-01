---
id: LOCALISY-DOC-602
title: Workflow and State Patterns
document: 02-workflow-and-state-patterns.md
version: 1.0
status: Draft
---

# 1. Purpose

Define repeatable state and workflow patterns across Localisy.

# 2. Common States

- draft
- pending
- approved
- rejected
- active
- inactive
- archived

# 3. Common Rules

- state changes must be explicit
- reason capture is required for sensitive rejects or suspensions
- ownership and actor identity must be preserved on transitions
