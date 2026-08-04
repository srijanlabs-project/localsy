---
id: LOCALISY-DOC-612
title: Event and Telemetry Standard
document: 12-event-and-telemetry-standard.md
version: 1.0
status: Draft
---

# 1. Purpose

This standard defines how product, operational, and analytics events should be emitted across Localisy.

# 2. Event Principles

- use stable event names
- keep actor, subject, and context explicit
- capture channel and locality context
- distinguish business events from low-level debug logs

# 3. Minimum Event Fields

- event name
- timestamp
- actor id or session id where available
- entity id
- locality id
- channel
- source surface
- outcome

# 4. Event Categories

- discovery and search
- listing and trust
- merchant and advertiser actions
- ops and moderation
- AI and WhatsApp
- compliance and policy
