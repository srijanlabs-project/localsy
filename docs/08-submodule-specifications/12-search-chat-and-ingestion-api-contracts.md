---
id: LOCALISY-DOC-812
title: Search, Chat, and Ingestion API Contracts
document: 12-search-chat-and-ingestion-api-contracts.md
version: 1.0
status: Draft
---

# 1. Purpose

Define the priority API contract shapes for search, AI chat, and ingestion workflows.

# 2. Search API

Primary endpoint:

- `GET /api/search`

Core request parameters:

- `q`
- `localityId`
- `cityId`
- `categoryId`
- `subcategoryId`
- `pincode`
- `sort`
- `page`
- `pageSize`

Core response blocks:

- query echo
- resolved context
- applied filters
- result items
- pagination
- sponsor summary where relevant

# 3. Autosuggest API

Primary endpoint:

- `GET /api/search/suggest`

Response should support mixed suggestion types:

- business
- category
- subcategory
- intent shortcut
- locality fallback

# 4. Chat API

Primary endpoint:

- `POST /api/chat/query`

Core request blocks:

- session id
- locality context
- user query
- channel
- prior turn summary where available

Core response blocks:

- answer text
- follow-up prompts
- citations
- listing cards
- confidence or fallback status

# 5. Ingestion APIs

Primary endpoints:

- `POST /api/ingestion/sources`
- `POST /api/ingestion/uploads`
- `POST /api/ingestion/jobs`
- `GET /api/ingestion/jobs/:id`

Core workflow:

1. source submitted
2. job created
3. parsing and normalization run
4. duplicate and validation review triggered
5. publish-ready state returned

# 6. Shared Rules

- every endpoint should return a correlation id
- every unsafe mutation should require authenticated operator or admin context
- locality-sensitive responses should remain tenant-safe
- errors should follow the shared error envelope

# 7. Dependencies

- Discovery and Search
- AI and RAG
- Documents and Knowledge Sources
- Admin Operations
- API Design Standard
