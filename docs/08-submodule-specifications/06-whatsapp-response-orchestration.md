---
id: LOCALISY-DOC-806
title: WhatsApp Response Orchestration Deep Specification
document: 06-whatsapp-response-orchestration.md
version: 1.0
status: Draft
---

# 1. Purpose

Define the logic that turns an inbound WhatsApp query into a useful listing-oriented response.

# 2. Target Response Patterns

- one strong listing URL when there is a clear best match
- top 3 listing URLs when several listings are relevant
- clarification question when confidence is low
- optional contact card after listing match

# 3. Required Rules

- answer should be concise
- response should preserve locality context
- weak-confidence guesses should not be presented as facts
- promotional and operational messaging must respect channel policy

# 4. Follow-Up Handling

- recent context should be reused for a short conversation window
- follow-up intent should refine, not restart, the prior query where possible

# 5. Channel Metrics

- resolution rate
- fallback rate
- response time
- unresolved query count
