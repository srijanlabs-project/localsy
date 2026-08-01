# Localisy - ER Diagram (v1)

This document defines the recommended v1 data model for Localisy as a multi-tenant hyperlocal business directory platform.

## Design Principles

- Primary operational tenant boundary is `locality`
- City pages and the national page are aggregate discovery layers
- Canonical business listings are separate from uploaded source rows
- Documents are first-class knowledge objects
- RAG runs on chunked document content
- Duplicate detection is explicit and reviewable
- Search and chat activity are auditable

## Mermaid ER Diagram

```mermaid
erDiagram
    TENANTS ||--o{ CITIES : owns
    CITIES ||--o{ LOCALITIES : contains

    CATEGORIES ||--o{ BUSINESSES : classifies
    LOCALITIES ||--o{ BUSINESSES : scopes
    BUSINESSES ||--o{ BUSINESS_ALIASES : has
    BUSINESSES ||--o{ CONTACTS : has
    BUSINESSES ||--o{ REVIEWS : receives
    BUSINESSES ||--o{ OFFERS : promotes
    BUSINESSES ||--o{ BUSINESS_RELATIONSHIPS : source_business
    BUSINESSES ||--o{ BUSINESS_RELATIONSHIPS : target_business
    BUSINESSES ||--o{ SOURCE_RECORDS : backed_by
    BUSINESSES ||--o{ DOCUMENT_BUSINESS_LINKS : referenced_in

    LOCALITIES ||--o{ DOCUMENTS : scopes
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : split_into
    DOCUMENTS ||--o{ SOURCE_RECORDS : imported_from
    DOCUMENTS ||--o{ DOCUMENT_BUSINESS_LINKS : links

    LOCALITIES ||--o{ INGESTION_JOBS : receives
    INGESTION_JOBS ||--o{ SOURCE_RECORDS : creates
    SOURCE_RECORDS ||--o{ DUPLICATE_CANDIDATES : reviewed_as_left
    BUSINESSES ||--o{ DUPLICATE_CANDIDATES : candidate_match

    LOCALITIES ||--o{ CHAT_SESSIONS : serves
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : contains
    BUSINESSES ||--o{ CHAT_CITATIONS : cited_business
    DOCUMENT_CHUNKS ||--o{ CHAT_CITATIONS : cited_chunk
    CHAT_MESSAGES ||--o{ CHAT_CITATIONS : cites

    LOCALITIES ||--o{ SEARCH_LOGS : records

    TENANTS {
      uuid id PK
      string name
      string slug
      string status
      timestamp created_at
    }

    CITIES {
      uuid id PK
      uuid tenant_id FK
      string name
      string slug
      string state_name
      string country_code
      decimal latitude
      decimal longitude
      boolean is_active
      timestamp created_at
    }

    LOCALITIES {
      uuid id PK
      uuid city_id FK
      string name
      string slug
      string pincode
      decimal latitude
      decimal longitude
      boolean is_active
      timestamp created_at
    }

    CATEGORIES {
      uuid id PK
      uuid parent_id FK
      string name
      string slug
      string category_type
      int sort_order
    }

    BUSINESSES {
      uuid id PK
      uuid locality_id FK
      uuid category_id FK
      string listing_type
      string name
      string slug
      text description
      string language_code
      string verification_status
      string dedupe_fingerprint
      decimal latitude
      decimal longitude
      text address
      string website
      string listing_status
      decimal avg_rating
      timestamp last_verified_at
      timestamp created_at
      timestamp updated_at
    }

    BUSINESS_ALIASES {
      uuid id PK
      uuid business_id FK
      string alias_text
      string language_code
      string alias_type
    }

    CONTACTS {
      uuid id PK
      uuid business_id FK
      string contact_type
      string label
      string value
      boolean is_public
      boolean is_primary
    }

    REVIEWS {
      uuid id PK
      uuid business_id FK
      string reviewer_name
      int rating
      text review_text
      string moderation_status
      timestamp created_at
    }

    OFFERS {
      uuid id PK
      uuid business_id FK
      string title
      text description
      string offer_type
      string status
      timestamp starts_at
      timestamp ends_at
    }

    BUSINESS_RELATIONSHIPS {
      uuid id PK
      uuid source_business_id FK
      uuid target_business_id FK
      string relationship_type
      decimal confidence_score
      text notes
    }

    DOCUMENTS {
      uuid id PK
      uuid locality_id FK
      string document_type
      string title
      string source_type
      string language_code
      string storage_key
      string checksum
      string ingest_status
      int version_no
      timestamp published_at
      timestamp ingested_at
    }

    DOCUMENT_CHUNKS {
      uuid id PK
      uuid document_id FK
      int chunk_index
      int page_number
      string section_title
      text content
      string language_code
      vector embedding
      json metadata
    }

    DOCUMENT_BUSINESS_LINKS {
      uuid id PK
      uuid document_id FK
      uuid business_id FK
      string link_type
      decimal confidence_score
    }

    INGESTION_JOBS {
      uuid id PK
      uuid locality_id FK
      string source_type
      string source_name
      string status
      int total_rows
      int created_count
      int updated_count
      int duplicate_count
      int failed_count
      timestamp started_at
      timestamp completed_at
    }

    SOURCE_RECORDS {
      uuid id PK
      uuid ingestion_job_id FK
      uuid business_id FK
      uuid document_id FK
      string source_row_key
      string source_type
      string match_status
      decimal match_confidence
      json raw_payload
      timestamp created_at
    }

    DUPLICATE_CANDIDATES {
      uuid id PK
      uuid source_record_id FK
      uuid matched_business_id FK
      decimal confidence_score
      string review_status
      text rationale
      timestamp created_at
    }

    CHAT_SESSIONS {
      uuid id PK
      uuid locality_id FK
      string channel
      string user_handle
      string detected_language
      string scope_level
      string session_status
      timestamp started_at
      timestamp last_message_at
    }

    CHAT_MESSAGES {
      uuid id PK
      uuid session_id FK
      string role
      text message_text
      string detected_intent
      string response_status
      int token_count
      timestamp created_at
    }

    CHAT_CITATIONS {
      uuid id PK
      uuid message_id FK
      uuid business_id FK
      uuid document_chunk_id FK
      string citation_type
      text label
    }

    SEARCH_LOGS {
      uuid id PK
      uuid locality_id FK
      string channel
      string query_text
      string language_code
      string detected_intent
      string scope_level
      int result_count
      int latency_ms
      timestamp created_at
    }
```

## Core Modeling Notes

## 1. Tenant, City, and Locality

- `tenants` can represent the owning account or operator group
- `localities` are the primary public-facing operational tenants
- `cities` group localities for aggregate discovery pages
- most operational data should be scoped by `locality_id`

## 2. Canonical Listing Model

- `businesses` stores the canonical, deduplicated listing
- `business_aliases` supports multilingual or alternate names
- `contacts` stores structured contact cards
- `reviews` and `offers` support richer directory experiences
- `business_relationships` makes the graph useful for RAG and navigation

## 3. Documents and RAG

- `documents` stores the source artifact
- `document_chunks` stores chunked retrieval units with embeddings
- `document_business_links` links document content back to canonical listings

## 4. Ingestion and Deduplication

- `ingestion_jobs` tracks each upload batch
- `source_records` stores raw imported row or source lineage
- `duplicate_candidates` stores probable listing matches for review or auto-resolution

## 5. Search and Chat Observability

- `chat_sessions` and `chat_messages` support Web, Mobile, and WhatsApp flows
- `chat_citations` preserves grounding references
- `search_logs` supports analytics, quality review, and latency measurement

## Recommended Indexes

- `businesses(locality_id, category_id, listing_type, verification_status)`
- `businesses USING GIN(to_tsvector(...))`
- `business_aliases(business_id, alias_text)`
- `documents(locality_id, source_type, ingest_status)`
- `document_chunks(document_id, chunk_index)`
- `document_chunks USING ivfflat (embedding vector_cosine_ops)`
- `source_records(ingestion_job_id, source_row_key)`
- `duplicate_candidates(source_record_id, review_status, confidence_score DESC)`
- `chat_sessions(locality_id, channel, last_message_at DESC)`
- `search_logs(locality_id, created_at DESC)`

## Open Decisions

- whether `tenants` are required in v1 or whether city plus locality is enough initially
- whether some high-volume listing types need dedicated subtype tables in v1
- whether contact privacy should split public vs restricted contact records into separate tables
