---
id: LOCALISY-DOC-904
title: Localisy Engineering Checklist
document: 04-engineering-checklist.md
version: 1.0
status: Draft
---

# 1. Purpose

This is the engineering view of the Localisy delivery checklist.

It focuses on implementation status across UI and development layers.

# 2. Checklist

| Module | Sub-module | Sub-sub-module | Priority | UI | Development | Notes |
|---|---|---|---|---|---|---|
| Tenant and Geography | Tenant Management | locality setup, city mapping, national aggregation, tenant status | P0 | In Progress | In Progress | |
| Tenant and Geography | Geography Master | country, state, city, locality, area, pincode, geo-boundary | P0 | Done | Done | |
| Tenant and Geography | Routing and Resolution | pincode mapping, subdomain mapping, reverse geocoding, fallback scope | P0 | Done | Done | |
| Identity and Access | Authentication | login, OTP, session management, token refresh | P0 | Done | Done | |
| Identity and Access | Authorization | RBAC, admin roles, moderator roles, operator roles, merchant roles | P0 | In Progress | In Progress | |
| Identity and Access | Security Controls | device log, suspicious access review, token policy, password policy | P1 | In Progress | In Progress | |
| User and Persona Management | Buyer Profile | saved listings, contact unlock history, reviews, recent activity | P1 | Done | In Progress | |
| User and Persona Management | Merchant Profile | owned listings, subscriptions, KYC status, lead stats | P1 | Done | In Progress | |
| User and Persona Management | Internal User Profile | admin user, moderator user, operator user, support user | P1 | To Do | In Progress | |
| Business Directory Core | Listing Master | business profile, slug, description, tags, status, verification | P0 | Done | Done | |
| Business Directory Core | Classification | category, subcategory, business type, service type | P0 | Done | Done | |
| Business Directory Core | Contact and Address | phone, WhatsApp, email, website, map pin, service area | P0 | Done | Done | |
| Business Directory Core | Media and Assets | logo, cover, gallery, brochure, video | P1 | Done | In Progress | |
| Business Directory Core | Operational Info | business hours, holiday hours, languages spoken, payment methods | P1 | Done | In Progress | |
| Business Directory Core | Trust Layer | verified badge, KYC, response time, satisfaction score, repeat score | P1 | In Progress | In Progress | |
| Merchant Management | Merchant Onboarding | apply for listing, claim listing, KYC submission, approval workflow | P1 | Done | In Progress | |
| Merchant Management | Merchant Workspace | edit listing, update hours, upload assets, manage offers | P1 | Done | In Progress | |
| Merchant Management | Merchant Subscription | plan mapping, entitlements, visibility tiers, renewal state | P2 | In Progress | To Do | |
| Merchant Management | Merchant Insights | impressions, clicks, leads, conversions, campaign stats | P2 | In Progress | In Progress | |
| Discovery and Search | Search Input | keyword input, multilingual parsing, autosuggest, voice-ready input | P0 | Done | Done | |
| Discovery and Search | Structured Search | category filter, locality filter, city filter, pincode filter | P0 | Done | Done | |
| Discovery and Search | Ranking Engine | locality-first ranking, popularity boost, trust boost, sponsored boost | P0 | In Progress | In Progress | |
| Discovery and Search | Results Experience | list view, map view, sorting, quick filters, pagination | P1 | Done | Done | |
| AI and RAG | Query Understanding | language detection, intent detection, scope detection, extraction | P1 | In Progress | To Do | |
| AI and RAG | Retrieval | SQL retrieval, vector retrieval, hybrid retrieval, reranking | P1 | To Do | To Do | |
| AI and RAG | Grounding | listing grounding, document grounding, citations, confidence | P1 | To Do | To Do | |
| AI and RAG | Response Generation | direct answer, follow-up prompts, listing cards, multilingual formatting | P1 | In Progress | To Do | |
| AI and RAG | Session Memory | short-term context, follow-up handling, recent results memory | P1 | To Do | To Do | |
| SEO and Organic Growth | Route Architecture | locality route, intent route, listing route, legacy redirects | P0 | Done | Done | |
| SEO and Organic Growth | Metadata Engine | title, description, canonical, OG, Twitter, robots directives | P0 | Done | Done | |
| SEO and Organic Growth | Structured Data | local business schema, breadcrumbs, item list schema, web page schema | P0 | Done | Done | |
| SEO and Organic Growth | Programmatic Pages | locality pages, category-intent pages, listing pages, internal link blocks | P0 | Done | Done | |
| SEO and Organic Growth | Content Templates | locality intro, category copy, top listing groups, fallback text | P1 | Done | Done | |
| SEO and Organic Growth | Indexing Operations | sitemap, robots, search console submission, crawl monitoring | P1 | Done | Done | |
| SEO and Organic Growth | SEO Analytics | impressions, clicks, landing pages, route coverage, indexed pages | P1 | To Do | In Progress | |
| SEO and Organic Growth | Merchant SEO Entitlements | premium route features, enhanced profile fields, domain mapping tags, featured snippets prep | P2 | In Progress | To Do | |
| Documents and Knowledge Sources | Source Intake | PDF upload, Excel upload, CSV upload, manual entry, API import | P1 | Done | In Progress | |
| Documents and Knowledge Sources | Processing Pipeline | parsing, OCR, chunking, metadata extraction, normalization | P1 | In Progress | In Progress | |
| Documents and Knowledge Sources | Embeddings | embedding generation, re-embedding, model versioning | P2 | To Do | To Do | |
| Documents and Knowledge Sources | Knowledge Linking | listing-to-document links, locality-to-document links, category-to-document links | P1 | To Do | To Do | |
| Duplicate and Data Quality | Duplicate Detection | name match, phone match, address match, fuzzy similarity | P0 | In Progress | In Progress | |
| Duplicate and Data Quality | Review Workflow | duplicate queue, merge, keep separate, create new listing | P0 | In Progress | In Progress | |
| Duplicate and Data Quality | Canonicalization | alias handling, normalization, source lineage, canonical listing | P0 | To Do | In Progress | |
| Duplicate and Data Quality | Validation Rules | required fields, geo validation, taxonomy validation, format rules | P0 | Done | Done | |
| Reviews and Reputation | Review Collection | rating capture, comment capture, OTP verification, merchant reply | P1 | Done | Done | |
| Reviews and Reputation | Moderation | spam review detection, abuse flags, profanity control, report queue | P1 | In Progress | In Progress | |
| Reviews and Reputation | Reputation Signals | review count, average rating, helpful votes, trending score | P1 | Done | Done | |
| Offers, Ads, and Promotion | Offers and Coupons | coupon creation, locality targeting, category targeting, CTA handling | P1 | Done | In Progress | |
| Offers, Ads, and Promotion | Sponsored Listings | paid boost, CPC budget, sponsor labels, position control | P1 | In Progress | In Progress | |
| Offers, Ads, and Promotion | Ad Inventory | banner ads, listing ads, lead-form ads, placement slots | P2 | In Progress | In Progress | |
| Offers, Ads, and Promotion | Campaign Analytics | clicks, leads, conversion, ROI | P2 | In Progress | In Progress | |
| Homepage and CMS | Locality Homepage | hero banners, featured sections, shortcuts, locality copy | P1 | Done | Done | |
| Homepage and CMS | Scalable Homepage Engine | templates, assignments, campaign targeting, snapshots | P1 | Done | Done | |
| Homepage and CMS | SEO Discovery Config | route intents, SEO labels, top listings, locality metadata | P0 | Done | Done | |
| Homepage and CMS | Fallback Ownership Migration | locality routing seeds, homepage defaults seeds, SEO seeds, demo review and CRM fixtures | P1 | In Progress | In Progress | Runtime locality assumptions have been cleaned from `src/App.tsx` and `src/components/WebPortal.tsx`; routing, homepage-defaults, and SEO managed-config reads now auto-backfill missing/partial DB or file state from bootstrap seeds; server bootstrap plus app/portal/admin fallback helpers now boot from `locality-routing-config.json`, `homepage-defaults-config.json`, and `seo-discovery-config.json`; the remaining bundled fallback owners still live in `shared/homepageDefaultsSeed.js`, `shared/seoDiscoverySeed.js`, `src/data.ts`, plus residual bootstrap/support code. |
| Homepage and CMS | Community Content | posts, events, recommendations, local updates | P2 | In Progress | In Progress | |
| Lead and CRM | Lead Capture | contact unlocks, inquiry forms, ad lead forms, WhatsApp click intent | P1 | Done | In Progress | |
| Lead and CRM | CRM Database | contacts, notes, follow-up history, segmentation | P1 | In Progress | In Progress | |
| Lead and CRM | Lead Routing | merchant routing, operator routing, escalation rules, owner mapping | P1 | To Do | In Progress | |
| Lead and CRM | Lead Lifecycle | new, contacted, qualified, converted, closed | P2 | To Do | To Do | |
| Web Experience | Public Pages | national page, city page, locality page, category page | P0 | Done | Done | |
| Web Experience | Listing Pages | detail page, gallery, reviews, contact actions, related listings | P0 | Done | Done | |
| Web Experience | Buyer Tools | save listing, compare, unlock contact, submit review | P1 | Done | In Progress | |
| Web Experience | Merchant CTA Surface | claim listing, advertise, submit business, contact sales | P1 | Done | Done | |
| WhatsApp Channel | Inbound Handling | webhook receive, normalize query, phone-session mapping | P1 | To Do | To Do | |
| WhatsApp Channel | Response Orchestration | single best listing URL, top 3 listing URLs, contact cards, follow-up prompts | P1 | To Do | To Do | |
| WhatsApp Channel | Compliance Messaging | opt-in tracking, template handling, unsubscribe handling, session windows | P0 | To Do | To Do | |
| WhatsApp Channel | Channel Analytics | resolution rate, fallback rate, response time, drop-off | P1 | To Do | To Do | |
| Mobile and API Channels | Mobile APIs | search API, chat API, listing API, profile API | P2 | To Do | To Do | |
| Mobile and API Channels | Deep Links | listing deep links, locality links, campaign links, shared routes | P2 | Done | In Progress | |
| Admin Operations | Admin Dashboard | platform summary, locality summary, moderation summary, merchant summary | P0 | Done | Done | |
| Admin Operations | Listing Operations | create, edit, approve, reject, suspend, bulk update | P0 | Done | Done | |
| Admin Operations | Merchant Operations | approve merchant, verify claim, manage permissions, review KYC | P1 | In Progress | In Progress | |
| Admin Operations | Data Operations | bulk upload, import review, corrections, exports | P0 | Done | Done | |
| Admin Operations | Moderation and Governance | flagged content, audit review, suspicious actions, escalation | P0 | Done | In Progress | |
| Analytics and Reporting | Search Analytics | popular queries, no-result queries, CTR, query-to-lead conversion | P1 | To Do | To Do | |
| Analytics and Reporting | Listing Analytics | views, clicks, unlocks, reviews, leads | P1 | In Progress | In Progress | |
| Analytics and Reporting | Channel Analytics | web, WhatsApp, mobile, campaign comparison | P1 | To Do | To Do | |
| Analytics and Reporting | AI Quality Analytics | answer accuracy, citation coverage, multilingual quality, latency | P1 | To Do | To Do | |
| Billing and Commercial | Plan Management | plan catalog, merchant plans, ad plans, visibility plans | P2 | In Progress | To Do | |
| Billing and Commercial | Payments and Invoices | payment state, invoicing, renewal tracking, reconciliation | P2 | To Do | To Do | |
| Billing and Commercial | Entitlements | feature limits, ad limits, AI limits, listing caps | P2 | In Progress | To Do | |
| Notifications and Communication | User Notifications | OTP, inquiry acknowledgement, review status, reminder | P1 | In Progress | In Progress | |
| Notifications and Communication | Merchant Notifications | lead alert, review alert, approval alert, renewal alert | P1 | In Progress | To Do | |
| Notifications and Communication | Internal Notifications | moderation alert, ingestion failure, suspicious activity, system warnings | P1 | To Do | To Do | |
| Compliance and Legal | Legal Content Management | TnC, privacy policy, cookie policy, disclaimer | P0 | To Do | To Do | |
| Compliance and Legal | Commercial Policies | refund policy, cancellation policy, fulfilment policy, seller agreement | P1 | To Do | To Do | |
| Compliance and Legal | Platform Policies | community guidelines, merchant listing policy, review policy, moderation policy | P0 | To Do | To Do | |
| Compliance and Legal | Data and Consent Compliance | OTP consent, WhatsApp consent, marketing consent, retention rules, PII governance | P0 | In Progress | In Progress | |
| Compliance and Legal | Rights and Grievance | grievance intake, takedown flow, export request, deletion request | P1 | To Do | To Do | |
| Compliance and Legal | Policy Controls | versioning, acceptance tracking, consent audit log, geo-specific policy mapping | P1 | To Do | To Do | |
| Platform Governance | Audit and Compliance Logs | admin logs, merchant logs, consent logs, policy acceptance logs | P0 | In Progress | Done | |
| Platform Governance | Privacy Controls | masked PII, restricted contact visibility, retention enforcement | P0 | In Progress | In Progress | |
| Platform Governance | Risk Controls | abuse flags, suspicious activity detection, escalation workflow | P1 | In Progress | In Progress | |
| Integrations | Maps and Geo | maps provider, geocoding, distance calculation, geo utilities | P1 | In Progress | In Progress | |
| Integrations | Communication APIs | WhatsApp API, SMS API, email API | P1 | To Do | In Progress | |
| Integrations | AI Providers | LLM provider, embeddings provider, reranking/model routing | P1 | To Do | To Do | |
| Integrations | External Data Connectors | websites, partner APIs, scheduled syncs, file connectors | P2 | To Do | To Do | |
| DevOps and Reliability | Infrastructure | environments, deployment, storage, scaling | P0 | To Do | In Progress | |
| DevOps and Reliability | Observability | logs, metrics, tracing, alerting | P0 | To Do | In Progress | |
| DevOps and Reliability | Jobs and Queues | ingestion jobs, embedding jobs, publish jobs, notification jobs | P1 | To Do | In Progress | |
| DevOps and Reliability | Backup and Recovery | DB backup, asset backup, restore drills, recovery playbook | P1 | To Do | To Do | |
