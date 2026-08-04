---
id: LOCALISY-DOC-117
title: WhatsApp Channel Module Specification
document: 17-whatsapp-channel.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines directory discovery and conversational response flows delivered through WhatsApp.

# 2. Business Objective

The module must let users ask for local businesses in chat form and receive the most useful listing URL, contact card, and follow-up guidance directly in WhatsApp.

# 3. Actors and Personas

- buyer
- support
- operator
- admin

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Inbound Handling | webhook receive, normalize query, phone-session mapping | accept incoming WhatsApp requests |
| Response Orchestration | single best listing URL, top 3 listing URLs, contact cards, follow-up prompts | deliver useful answers |
| Compliance Messaging | opt-in tracking, template handling, unsubscribe handling, session windows | keep WhatsApp usage compliant |
| Channel Analytics | resolution rate, fallback rate, response time, drop-off | measure channel quality |

# 5. Functional Requirements

## 5.1 Inbound Handling

- the system shall accept WhatsApp inbound messages through approved integration paths
- the system shall map incoming messages to conversation/session context where possible

## 5.2 Response Orchestration

- if one listing clearly answers the query, the system shall return one best-match listing URL
- if several listings are relevant, the system shall return a short ranked set of listing URLs
- the system shall support contact cards and follow-up prompts
- low-confidence cases should trigger clarification instead of weak matching

## 5.3 Compliance Messaging

- the system shall respect WhatsApp session and template rules
- the system shall track opt-in and unsubscribe states if promotional use is introduced

## 5.4 Channel Analytics

- the system shall track response quality and resolution outcomes for WhatsApp interactions

# 6. UX Surfaces

- WhatsApp inbound conversation
- admin channel monitoring
- support review surface

# 7. Data and Entities

- WhatsApp session
- inbound message
- outbound response
- opt-in state
- channel metrics

# 8. APIs and Services

- webhook receiver
- response formatting service
- channel session service
- message-delivery integration service

# 9. Workflows and States

- inbound query -> query normalized -> results selected -> outbound listing URLs sent
- follow-up question -> prior context reused -> refined response returned
- template-required case -> approved template response path used

# 10. Security, Permissions, and Audit

- private or restricted merchant data shall not be sent through WhatsApp without policy support
- outbound channel actions shall be logged for audit and support review

# 11. Notifications, Reports, and Dashboards

- WhatsApp resolution dashboard
- fallback query report
- compliance exception report
- channel latency report

# 12. Dependencies

- Discovery and Search
- AI and RAG
- Integrations
- Compliance and Legal

# 13. Non-Functional Requirements

- WhatsApp responses should be concise and quick
- channel outages should degrade gracefully
- formatting should remain readable on low-end mobile devices

# 14. Open Questions and Next Deep Specs

- direct search-only vs AI-assisted orchestration for v1
- exact opt-in and marketing messaging boundaries
- next deep specs: Response Orchestration and Compliance Messaging
