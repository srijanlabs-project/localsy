---
id: LOCALISY-DOC-611
title: Error Handling Standard
document: 11-error-handling-standard.md
version: 1.0
status: Draft
---

# 1. Purpose

This standard defines how Localisy should model and expose errors consistently across UI, APIs, ops tools, and channels.

# 2. Principles

- errors should be structured and machine-readable
- user messages should be simple and safe
- internal details should remain diagnosable through logs and correlation ids
- retryability should be explicit

# 3. Required Error Shape

- error reference
- stable code
- category
- severity
- user-safe message
- retryable flag
- correlation id

# 4. UX Rules

- do not expose raw stack traces
- preserve user context where possible
- offer next-step guidance for recoverable failures
- route policy or permission failures into supportable states
