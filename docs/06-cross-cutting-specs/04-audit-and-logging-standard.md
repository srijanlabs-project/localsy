---
id: LOCALISY-DOC-604
title: Audit and Logging Standard
document: 04-audit-and-logging-standard.md
version: 1.0
status: Draft
---

# 1. What Must Be Audited

- auth and access-sensitive actions
- listing moderation actions
- policy and configuration changes
- contact reveal and other trust-sensitive actions
- merchant ownership and claim changes

# 2. Minimum Audit Payload

- actor
- role
- action type
- target entity
- timestamp
- outcome
- relevant scope such as locality
