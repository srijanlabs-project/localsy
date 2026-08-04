---
id: LOCALISY-DOC-200
title: Localisy Module, Sub-Module, and Sub-Sub-Module Catalog
document: 01-module-submodule-catalog.md
version: 1.0
status: Draft
---

# 1. Purpose

This catalog provides the structured inventory of Localisy modules, sub-modules, and sub-sub-modules.

It is the baseline used to decide:

- what must be documented
- what requires deep L3 specifications
- what should be part of v1
- what should be staged for later phases

# 2. Catalog

| Module | Sub-module | Sub-sub-module | Purpose | Primary users | Priority | Depth |
|---|---|---|---|---|---|---|
| Tenant and Geography | Tenant Management | locality setup, city mapping, national aggregation, tenant status | manage locality as the operational tenant | admin, operator | P0 | L2 |
| Tenant and Geography | Geography Master | country, state, city, locality, area, pincode, geo-boundary | maintain location hierarchy | admin, operator | P0 | L2 |
| Tenant and Geography | Routing and Resolution | pincode mapping, subdomain mapping, reverse geocoding, fallback scope | resolve correct locality context | buyer, admin, operator | P0 | L3 |
| Identity and Access | Authentication | login, OTP, session management, token refresh | secure sign-in and verification | buyer, seller, admin | P0 | L2 |
| Identity and Access | Authorization | RBAC, admin roles, moderator roles, operator roles, merchant roles | role-based permissions control | admin, security | P0 | L3 |
| Identity and Access | Security Controls | device log, suspicious access review, token policy, password policy | access protection and response | admin, support | P1 | L2 |
| User and Persona Management | Buyer Profile | saved listings, contact unlock history, reviews, recent activity | buyer-facing account history | buyer | P1 | L2 |
| User and Persona Management | Merchant Profile | owned listings, subscriptions, KYC status, lead stats | merchant identity and ownership | seller, admin | P1 | L2 |
| User and Persona Management | Internal User Profile | admin user, moderator user, operator user, support user | internal identity control | admin | P1 | L2 |
| Business Directory Core | Listing Master | business profile, slug, description, tags, status, verification | core canonical listing record | buyer, seller, operator | P0 | L3 |
| Business Directory Core | Classification | category, subcategory, business type, service type | organize listing taxonomy | buyer, operator | P0 | L2 |
| Business Directory Core | Contact and Address | phone, WhatsApp, email, website, map pin, service area | store public contact and location data | buyer, seller | P0 | L2 |
| Business Directory Core | Media and Assets | logo, cover, gallery, brochure, video | manage listing media | seller, operator | P1 | L2 |
| Business Directory Core | Operational Info | business hours, holiday hours, languages spoken, payment methods | store practical business facts | buyer, seller | P1 | L2 |
| Business Directory Core | Trust Layer | verified badge, KYC, response time, satisfaction score, repeat score | increase discovery trust | buyer, admin | P1 | L3 |
| Merchant Management | Merchant Onboarding | apply for listing, claim listing, KYC submission, approval workflow | activate merchants on platform | seller, admin | P1 | L3 |
| Merchant Management | Merchant Workspace | edit listing, update hours, upload assets, manage offers | merchant self-service | seller | P1 | L2 |
| Merchant Management | Merchant Subscription | plan mapping, entitlements, visibility tiers, renewal state | monetize merchants | seller, admin | P2 | L2 |
| Merchant Management | Merchant Insights | impressions, clicks, leads, conversions, campaign stats | merchant performance visibility | seller | P2 | L2 |
| Discovery and Search | Search Input | keyword input, multilingual parsing, autosuggest, voice-ready input | accept discovery queries | buyer | P0 | L2 |
| Discovery and Search | Structured Search | category filter, locality filter, city filter, pincode filter | directory retrieval and filtering | buyer | P0 | L3 |
| Discovery and Search | Ranking Engine | locality-first ranking, popularity boost, trust boost, sponsored boost | order results effectively | buyer, growth | P0 | L3 |
| Discovery and Search | Results Experience | list view, map view, sorting, quick filters, pagination | results presentation | buyer | P1 | L2 |
| AI and RAG | Query Understanding | language detection, intent detection, scope detection, extraction | understand natural-language intent | buyer, support | P1 | L3 |
| AI and RAG | Retrieval | SQL retrieval, vector retrieval, hybrid retrieval, reranking | gather candidate evidence | buyer | P1 | L3 |
| AI and RAG | Grounding | listing grounding, document grounding, citations, confidence | keep answers trustworthy | buyer, operator | P1 | L3 |
| AI and RAG | Response Generation | direct answer, follow-up prompts, listing cards, multilingual formatting | generate useful responses | buyer | P1 | L2 |
| AI and RAG | Session Memory | short-term context, follow-up handling, recent results memory | conversational continuity | buyer | P1 | L2 |
| SEO and Organic Growth | Route Architecture | locality route, intent route, listing route, legacy redirects | crawlable and stable URL system | growth, engineering | P0 | L3 |
| SEO and Organic Growth | Metadata Engine | title, description, canonical, OG, Twitter, robots directives | page-level metadata generation | growth, engineering | P0 | L3 |
| SEO and Organic Growth | Structured Data | local business schema, breadcrumbs, item list schema, web page schema | SERP enrichment and trust | growth, engineering | P0 | L3 |
| SEO and Organic Growth | Programmatic Pages | locality pages, category-intent pages, listing pages, internal link blocks | organic acquisition surface | buyer, growth | P0 | L3 |
| SEO and Organic Growth | Content Templates | locality intro, category copy, top listing groups, fallback text | scalable page content generation | growth, operator | P1 | L2 |
| SEO and Organic Growth | Indexing Operations | sitemap, robots, search console submission, crawl monitoring | indexing operations control | growth, support | P1 | L3 |
| SEO and Organic Growth | SEO Analytics | impressions, clicks, landing pages, route coverage, indexed pages | organic performance visibility | growth, admin | P1 | L2 |
| SEO and Organic Growth | Merchant SEO Entitlements | premium route features, enhanced profile fields, domain mapping tags, featured snippets prep | merchant upsell through SEO | seller, admin | P2 | L2 |
| Documents and Knowledge Sources | Source Intake | PDF upload, Excel upload, CSV upload, manual entry, API import | ingest source content | operator, admin | P1 | L2 |
| Documents and Knowledge Sources | Processing Pipeline | parsing, OCR, chunking, metadata extraction, normalization | prepare source data | operator, engineering | P1 | L3 |
| Documents and Knowledge Sources | Embeddings | embedding generation, re-embedding, model versioning | vector search support | engineering | P2 | L2 |
| Documents and Knowledge Sources | Knowledge Linking | listing-to-document links, locality-to-document links, category-to-document links | connect documents to directory data | operator, engineering | P1 | L3 |
| Duplicate and Data Quality | Duplicate Detection | name match, phone match, address match, fuzzy similarity | find probable duplicate listings | operator, moderator | P0 | L3 |
| Duplicate and Data Quality | Review Workflow | duplicate queue, merge, keep separate, create new listing | resolve duplicate outcomes | moderator, admin | P0 | L3 |
| Duplicate and Data Quality | Canonicalization | alias handling, normalization, source lineage, canonical listing | preserve clean master data | operator, admin | P0 | L3 |
| Duplicate and Data Quality | Validation Rules | required fields, geo validation, taxonomy validation, format rules | keep data usable | operator | P0 | L2 |
| Reviews and Reputation | Review Collection | rating capture, comment capture, OTP verification, merchant reply | collect trust signals | buyer, seller | P1 | L2 |
| Reviews and Reputation | Moderation | spam review detection, abuse flags, profanity control, report queue | review quality control | moderator, admin | P1 | L3 |
| Reviews and Reputation | Reputation Signals | review count, average rating, helpful votes, trending score | use trust in ranking and UX | buyer, seller | P1 | L2 |
| Offers, Ads, and Promotion | Offers and Coupons | coupon creation, locality targeting, category targeting, CTA handling | merchant promotion | seller, growth | P1 | L2 |
| Offers, Ads, and Promotion | Sponsored Listings | paid boost, CPC budget, sponsor labels, position control | monetized discovery | seller, admin | P1 | L3 |
| Offers, Ads, and Promotion | Ad Inventory | banner ads, listing ads, lead-form ads, placement slots | ad serving model | admin, growth | P2 | L2 |
| Offers, Ads, and Promotion | Campaign Analytics | clicks, leads, conversion, ROI | monetization performance | admin, seller | P2 | L2 |
| Homepage and CMS | Locality Homepage | hero banners, featured sections, shortcuts, locality copy | locality landing experience | buyer, operator | P1 | L2 |
| Homepage and CMS | Scalable Homepage Engine | templates, assignments, campaign targeting, snapshots | reusable page composition | operator, admin | P1 | L3 |
| Homepage and CMS | SEO Discovery Config | route intents, SEO labels, top listings, locality metadata | admin-managed SEO content control | growth, admin | P0 | L3 |
| Homepage and CMS | Community Content | posts, events, recommendations, local updates | engagement layer | buyer, operator | P2 | L2 |
| Lead and CRM | Lead Capture | contact unlocks, inquiry forms, ad lead forms, WhatsApp click intent | convert discovery to lead | buyer, seller | P1 | L3 |
| Lead and CRM | CRM Database | contacts, notes, follow-up history, segmentation | merchant lead management | seller | P1 | L2 |
| Lead and CRM | Lead Routing | merchant routing, operator routing, escalation rules, owner mapping | deliver lead to right owner | admin, seller | P1 | L2 |
| Lead and CRM | Lead Lifecycle | new, contacted, qualified, converted, closed | conversion state tracking | seller, admin | P2 | L2 |
| Web Experience | Public Pages | national page, city page, locality page, category page | public discovery surface | buyer | P0 | L2 |
| Web Experience | Listing Pages | detail page, gallery, reviews, contact actions, related listings | listing decision surface | buyer, seller | P0 | L3 |
| Web Experience | Buyer Tools | save listing, compare, unlock contact, submit review | engagement and conversion | buyer | P1 | L2 |
| Web Experience | Merchant CTA Surface | claim listing, advertise, submit business, contact sales | business acquisition surface | seller | P1 | L2 |
| WhatsApp Channel | Inbound Handling | webhook receive, normalize query, phone-session mapping | accept WhatsApp requests | buyer, support | P1 | L3 |
| WhatsApp Channel | Response Orchestration | single best listing URL, top 3 listing URLs, contact cards, follow-up prompts | answer on WhatsApp effectively | buyer | P1 | L3 |
| WhatsApp Channel | Compliance Messaging | opt-in tracking, template handling, unsubscribe handling, session windows | compliant messaging operations | admin, support | P0 | L3 |
| WhatsApp Channel | Channel Analytics | resolution rate, fallback rate, response time, drop-off | measure WhatsApp quality | admin, support | P1 | L2 |
| Mobile and API Channels | Mobile APIs | search API, chat API, listing API, profile API | external/mobile access layer | engineering, buyer | P2 | L2 |
| Mobile and API Channels | Deep Links | listing deep links, locality links, campaign links, shared routes | cross-channel navigation | buyer, growth | P2 | L2 |
| Admin Operations | Admin Dashboard | platform summary, locality summary, moderation summary, merchant summary | central ops visibility | admin | P0 | L2 |
| Admin Operations | Listing Operations | create, edit, approve, reject, suspend, bulk update | listing governance | admin, moderator, operator | P0 | L3 |
| Admin Operations | Merchant Operations | approve merchant, verify claim, manage permissions, review KYC | merchant governance | admin | P1 | L2 |
| Admin Operations | Data Operations | bulk upload, import review, corrections, exports | operational data control | operator, admin | P0 | L3 |
| Admin Operations | Moderation and Governance | flagged content, audit review, suspicious actions, escalation | platform trust operations | moderator, admin | P0 | L3 |
| Analytics and Reporting | Search Analytics | popular queries, no-result queries, CTR, query-to-lead conversion | discovery measurement | growth, admin | P1 | L2 |
| Analytics and Reporting | Listing Analytics | views, clicks, unlocks, reviews, leads | listing performance | seller, admin | P1 | L2 |
| Analytics and Reporting | Channel Analytics | web, WhatsApp, mobile, campaign comparison | cross-channel visibility | admin, growth | P1 | L2 |
| Analytics and Reporting | AI Quality Analytics | answer accuracy, citation coverage, multilingual quality, latency | AI governance and tuning | admin, engineering | P1 | L3 |
| Billing and Commercial | Plan Management | plan catalog, merchant plans, ad plans, visibility plans | commercial packaging | admin, finance | P2 | L2 |
| Billing and Commercial | Payments and Invoices | payment state, invoicing, renewal tracking, reconciliation | paid commercial operations | finance, admin | P2 | L2 |
| Billing and Commercial | Entitlements | feature limits, ad limits, AI limits, listing caps | access enforcement | admin, engineering | P2 | L2 |
| Notifications and Communication | User Notifications | OTP, inquiry acknowledgement, review status, reminder | buyer communication | buyer, support | P1 | L2 |
| Notifications and Communication | Merchant Notifications | lead alert, review alert, approval alert, renewal alert | merchant communication | seller, admin | P1 | L2 |
| Notifications and Communication | Internal Notifications | moderation alert, ingestion failure, suspicious activity, system warnings | ops response | admin, support | P1 | L2 |
| Compliance and Legal | Legal Content Management | TnC, privacy policy, cookie policy, disclaimer | publish legal content | admin, legal | P0 | L2 |
| Compliance and Legal | Commercial Policies | refund policy, cancellation policy, fulfilment policy, seller agreement | define commercial rules | admin, legal | P1 | L2 |
| Compliance and Legal | Platform Policies | community guidelines, merchant listing policy, review policy, moderation policy | define allowed behavior | admin, moderator | P0 | L2 |
| Compliance and Legal | Data and Consent Compliance | OTP consent, WhatsApp consent, marketing consent, retention rules, PII governance | legal data handling | admin, legal, support | P0 | L3 |
| Compliance and Legal | Rights and Grievance | grievance intake, takedown flow, export request, deletion request | user and merchant rights handling | admin, support | P1 | L3 |
| Compliance and Legal | Policy Controls | versioning, acceptance tracking, consent audit log, geo-specific policy mapping | track policy enforcement | admin, legal | P1 | L2 |
| Platform Governance | Audit and Compliance Logs | admin logs, merchant logs, consent logs, policy acceptance logs | full traceability | admin, compliance | P0 | L2 |
| Platform Governance | Privacy Controls | masked PII, restricted contact visibility, retention enforcement | privacy-safe operations | admin, compliance | P0 | L3 |
| Platform Governance | Risk Controls | abuse flags, suspicious activity detection, escalation workflow | misuse prevention | admin, support | P1 | L2 |
| Integrations | Maps and Geo | maps provider, geocoding, distance calculation, geo utilities | location enrichment | engineering | P1 | L2 |
| Integrations | Communication APIs | WhatsApp API, SMS API, email API | communication channels | engineering, support | P1 | L2 |
| Integrations | AI Providers | LLM provider, embeddings provider, reranking/model routing | AI backbone integration | engineering | P1 | L2 |
| Integrations | External Data Connectors | websites, partner APIs, scheduled syncs, file connectors | directory expansion | operator, engineering | P2 | L2 |
| DevOps and Reliability | Infrastructure | environments, deployment, storage, scaling | platform runtime | engineering | P0 | L2 |
| DevOps and Reliability | Observability | logs, metrics, tracing, alerting | health monitoring | engineering, support | P0 | L2 |
| DevOps and Reliability | Jobs and Queues | ingestion jobs, embedding jobs, publish jobs, notification jobs | background processing | engineering | P1 | L2 |
| DevOps and Reliability | Backup and Recovery | DB backup, asset backup, restore drills, recovery playbook | resilience | engineering | P1 | L2 |

# 3. Immediate Deep-Spec Candidates

The following sub-modules should receive dedicated L3 build-ready specifications first:

1. Routing and Resolution
2. Listing Master
3. Structured Search
4. Ranking Engine
5. Route Architecture
6. Metadata Engine
7. Structured Data
8. Indexing Operations
9. Duplicate Detection
10. Review Workflow
11. Data and Consent Compliance
12. Response Orchestration for WhatsApp
