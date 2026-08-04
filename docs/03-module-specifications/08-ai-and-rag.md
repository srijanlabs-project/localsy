---
id: LOCALISY-DOC-108
title: AI and RAG Module Specification
document: 08-ai-and-rag.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines the AI-assisted search and conversational answer layer for Localisy.

# 2. Business Objective

The module must let users ask natural-language questions and receive grounded answers that still drive listing discovery rather than replacing the directory model.

# 3. Actors and Personas

- buyer
- support
- operator
- admin

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Query Understanding | language detection, intent detection, scope detection, extraction | interpret user questions |
| Retrieval | SQL retrieval, vector retrieval, hybrid retrieval, reranking | gather evidence |
| Grounding | listing grounding, document grounding, citations, confidence | keep answers trustworthy |
| Response Generation | direct answer, follow-up prompts, listing cards, multilingual formatting | produce useful responses |
| Session Memory | short-term context, follow-up handling, recent results memory | support conversation continuity |

# 5. Functional Requirements

## 5.1 Query Understanding

- the system shall detect likely intent such as category search, comparison, or follow-up
- the system shall resolve likely locality scope from session or route context
- the system should support multilingual question handling

## 5.2 Retrieval

- the system shall combine structured listing retrieval with document evidence where configured
- the system shall support reranking before answer generation
- the system shall prefer canonical listing data for direct business facts

## 5.3 Grounding

- the system shall cite source listings or documents when material facts are used
- the system shall avoid fabricating business details not present in trusted sources
- the system shall produce confidence-aware fallback behavior when retrieval is weak

## 5.4 Response Generation

- the system shall return direct answers followed by relevant listing actions
- the system shall support follow-up suggestions
- the system should support multilingual output formatting

## 5.5 Session Memory

- the system shall preserve recent context for follow-up questions
- the system shall not over-retain sensitive conversation data beyond defined policy

# 6. UX Surfaces

- web AI chat
- AI answer panel on results pages
- future WhatsApp conversational surfaces

# 7. Data and Entities

- chat session
- chat message
- citations
- retrieval candidates
- model configuration

# 8. APIs and Services

- chat session API
- chat message API
- query understanding service
- retrieval service
- answer orchestration service

# 9. Workflows and States

- session created -> question asked -> retrieval -> grounded answer -> follow-up
- low-confidence retrieval -> clarification or fallback response

# 10. Security, Permissions, and Audit

- the AI layer shall not expose restricted contact or private merchant data
- prompts and outputs shall respect privacy and moderation rules
- conversation logging shall be configurable and audited

# 11. Notifications, Reports, and Dashboards

- answer quality dashboard
- citation coverage dashboard
- unresolved AI query report
- latency and model-cost dashboard

# 12. Dependencies

- Discovery and Search
- Documents and Knowledge Sources
- Business Directory Core
- Compliance and Legal

# 13. Non-Functional Requirements

- answer latency should remain acceptable for web and mobile chat
- grounding reliability must be prioritized over creativity
- the system should degrade gracefully when AI services are unavailable

# 14. Open Questions and Next Deep Specs

- exact provider and model strategy
- retention and review policy for user prompts
- next deep specs: Query Understanding, Retrieval, and Grounding
