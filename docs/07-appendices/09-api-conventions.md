---
id: LOCALISY-DOC-709
title: API Conventions
document: 09-api-conventions.md
version: 1.0
status: Draft
---

# 1. Purpose

This appendix defines shared API conventions for Localisy.

# 2. Conventions

- resource-oriented endpoint naming
- explicit versioning strategy
- structured pagination
- standard filter and sort patterns
- stable error envelope
- correlation id support
- tenant-safe and locality-safe responses

# 3. Response Principles

- separate transport success from business outcome
- keep public responses safe for anonymous use
- label preview or simulated endpoints clearly
- return structured validation errors for operator workflows
