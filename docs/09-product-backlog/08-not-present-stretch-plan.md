---
id: LOCALISY-DOC-908
title: Localisy Not Present Feature Stretch Plan
document: 08-not-present-stretch-plan.md
version: 1.0
status: Draft
---

# 1. Purpose

This document tracks the first four executable stretches that were selected from the original `Not Present` backlog and the remaining queue after those stretches.

This plan is current as of `August 2, 2026`.

# 2. Current Snapshot

- Remaining `Not Present` features: `59`
- Completed from this plan: `80` features across `4` stretches
- Selection rule:
  - prioritize customer trust, ops control, and measurable platform signal first
  - keep each stretch implementation-friendly instead of mixing unrelated deep dependencies randomly

# 3. Stretch Plan

## 3.1 Stretch 1: Ops Signal and Actionability

Focus:

- exportability
- search and channel analytics
- routing and notification basics for ops follow-through

Features (`20`):

1. `Data Operations > exports`
2. `Search Analytics > popular queries`
3. `Search Analytics > CTR`
4. `Search Analytics > query-to-lead conversion`
5. `Channel Analytics > web`
6. `Channel Analytics > mobile`
7. `Channel Analytics > WhatsApp`
8. `Channel Analytics > response time`
9. `Channel Analytics > resolution rate`
10. `Channel Analytics > fallback rate`
11. `Channel Analytics > drop-off`
12. `Channel Analytics > campaign comparison`
13. `Internal Notifications > moderation alert`
14. `Internal Notifications > ingestion failure`
15. `Internal Notifications > suspicious activity`
16. `Internal Notifications > system warnings`
17. `Lead Routing > operator routing`
18. `Lead Routing > escalation rules`
19. `CRM Database > segmentation`
20. `Merchant Insights > conversions`

Status:

- completed in code on `August 2, 2026`
- implemented through `shared/adminOperations.js` and new privileged admin endpoints in `server.js`

## 3.2 Stretch 2: Trust, Duplicate Control, and Moderation

Focus:

- duplicate-safe directory quality
- moderation outcomes
- missing business trust details

Features (`20`):

1. `Duplicate Detection > fuzzy similarity`
2. `Review Workflow > duplicate queue`
3. `Review Workflow > merge`
4. `Review Workflow > keep separate`
5. `Review Workflow > create new listing`
6. `Canonicalization > alias handling`
7. `Canonicalization > canonical listing`
8. `Canonicalization > source lineage`
9. `Moderation > spam review detection`
10. `Moderation > profanity control`
11. `Moderation > report queue`
12. `Reputation Signals > trending score`
13. `Geography Master > geo-boundary`
14. `Operational Info > holiday hours`
15. `Media and Assets > brochure`
16. `Media and Assets > video`
17. `Internal User Profile > support user`
18. `Authentication > token refresh`
19. `Security Controls > password policy`
20. `Maps and Geo > maps provider`

Status:

- completed in code on `August 2, 2026`
- implemented through `shared/directoryQuality.js`, updated auth flows in `server.js`, and aligned shared business/user types in `src/types.ts`

## 3.3 Stretch 3: Compliance and Governance Core

Focus:

- legal publishable surfaces
- consent and privacy controls
- policy and platform governance

Features (`20`):

1. `Legal Content Management > TnC`
2. `Legal Content Management > privacy policy`
3. `Legal Content Management > cookie policy`
4. `Legal Content Management > disclaimer`
5. `Commercial Policies > refund policy`
6. `Commercial Policies > cancellation policy`
7. `Commercial Policies > fulfilment policy`
8. `Commercial Policies > seller agreement`
9. `Platform Policies > community guidelines`
10. `Platform Policies > merchant listing policy`
11. `Platform Policies > review policy`
12. `Platform Policies > moderation policy`
13. `Data and Consent Compliance > WhatsApp consent`
14. `Data and Consent Compliance > marketing consent`
15. `Data and Consent Compliance > retention rules`
16. `Compliance Messaging > opt-in tracking`
17. `Compliance Messaging > template handling`
18. `Compliance Messaging > unsubscribe handling`
19. `Compliance Messaging > session windows`
20. `Privacy Controls > retention enforcement`

Status:

- completed in code on `August 2, 2026`
- implemented through `shared/complianceGovernance.js`, compliance persistence in `server.js`, and new compliance/legal admin and public endpoints

## 3.4 Stretch 4: AI, Knowledge, and Retrieval Foundation

Focus:

- first real retrieval stack
- source ingestion
- session memory and evidence-backed response base

Features (`20`):

1. `Retrieval > SQL retrieval`
2. `Retrieval > vector retrieval`
3. `Retrieval > hybrid retrieval`
4. `Retrieval > reranking`
5. `Grounding > listing grounding`
6. `Grounding > document grounding`
7. `Grounding > citations`
8. `Grounding > confidence`
9. `Response Generation > multilingual formatting`
10. `Session Memory > short-term context`
11. `Session Memory > follow-up handling`
12. `Session Memory > recent results memory`
13. `Source Intake > PDF upload`
14. `Source Intake > Excel upload`
15. `Source Intake > API import`
16. `Processing Pipeline > OCR`
17. `Processing Pipeline > chunking`
18. `Embeddings > embedding generation`
19. `Embeddings > re-embedding`
20. `Embeddings > model versioning`

Status:

- completed in code on `August 2, 2026`
- implemented through `shared/knowledgeRetrieval.js`, new knowledge ingestion and retrieval endpoints in `server.js`, and grounded mobile/WhatsApp chat responses

# 4. Remaining Queue After These 4 Stretches

The remaining `59` `Not Present` features are now concentrated in:

- billing and entitlements deepening
- backup and recovery
- AI quality analytics
- SEO analytics
- provider integrations
- infrastructure and observability hardening
- notification expansion
- advanced merchant SEO entitlements
- rights and grievance workflows

# 5. Execution Rule

These stretches are now complete:

1. `Stretch 1`
2. `Stretch 2`
3. `Stretch 3`
4. `Stretch 4`

The next build selection should now be drawn from the remaining `59` features using the same rule:

- protect customer trust first
- strengthen ops control second
- then deepen monetization, resilience, and analytics

If a feature is discovered to already exist in code during implementation, it should be reclassified in the checklist and replaced with the next highest-value `Not Present` item from the same focus area.
