---
id: LOCALISY-DOC-601
title: Permissions and Role Model
document: 01-permissions-and-role-model.md
version: 1.0
status: Draft
---

# 1. Roles

- buyer
- seller
- moderator
- operator
- admin
- support
- growth operator

# 2. Core Rule

Every sensitive action must be validated server-side by role and, where relevant, by locality or ownership scope.

# 3. Examples

- only merchants can edit owned listings
- only moderators or admins can approve or reject listings
- only admins can alter high-risk configuration

# 4. Audit Requirement

Permission-protected actions must generate audit events with actor, action, target, timestamp, and outcome.
