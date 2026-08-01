---
id: LOCALISY-DOC-110
title: Documents and Knowledge Sources Module Specification
document: 10-documents-and-knowledge-sources.md
version: 1.0
status: Draft
---

# 1. Purpose

This module defines how Localisy ingests documents and structured files that enrich search and future AI grounding.

# 2. Business Objective

The module must let operators import trustworthy source material without breaking the canonical listing model.

# 3. Actors and Personas

- operator
- admin
- engineering

# 4. Sub-Module Structure

| Sub-module | Sub-sub-module | Purpose |
|---|---|---|
| Source Intake | PDF upload, Excel upload, CSV upload, manual entry, API import | accept source content |
| Processing Pipeline | parsing, OCR, chunking, metadata extraction, normalization | prepare source content |
| Embeddings | embedding generation, re-embedding, model versioning | support vector retrieval |
| Knowledge Linking | listing-to-document links, locality-to-document links, category-to-document links | connect sources to directory data |

# 5. Functional Requirements

## 5.1 Source Intake

- the system shall support CSV and manual structured data ingestion
- the system should support PDF and Excel intake for document-backed use cases
- the system may support API imports for partner data later

## 5.2 Processing Pipeline

- the system shall normalize imported content
- the system shall extract structured fields where possible
- the system should support chunking for document-based retrieval use cases

## 5.3 Embeddings

- the system should support embedding generation for approved knowledge chunks
- the system shall retain model version traceability if embeddings are introduced

## 5.4 Knowledge Linking

- the system shall support linking source content back to listings, localities, and categories
- the system shall preserve lineage between imported sources and platform records

# 6. UX Surfaces

- admin upload surface
- ingestion review surface
- source inspection surface
- source-to-listing review tools

# 7. Data and Entities

- document
- document chunk
- source record
- ingestion job
- knowledge link record

# 8. APIs and Services

- ingestion job API
- source-record review API
- document inspection API
- processing pipeline workers

# 9. Workflows and States

- file uploaded -> parsed -> reviewed -> committed
- processing failure -> operator correction -> retry
- document linked -> searchable or AI-eligible

# 10. Security, Permissions, and Audit

- only authorized internal roles shall upload or approve source content
- all imports shall retain source lineage
- sensitive uploads shall remain restricted

# 11. Notifications, Reports, and Dashboards

- ingestion failure report
- import success summary
- source review dashboard
- orphaned source-link report

# 12. Dependencies

- Admin Operations
- Duplicate and Data Quality
- AI and RAG
- Analytics and Reporting

# 13. Non-Functional Requirements

- ingestion should be asynchronous for larger files
- failures should be explainable enough for non-engineering operators
- source lineage should never be lost after commit

# 14. Open Questions and Next Deep Specs

- exact PDF and OCR priority in v1
- API import sequencing
- next deep specs: Processing Pipeline and Knowledge Linking
