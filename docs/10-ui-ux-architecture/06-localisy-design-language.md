---
id: LOCALISY-DOC-1006
title: Localisy Design Language
document: 06-localisy-design-language.md
version: 1.0
status: Active
---

# 1. Purpose

This document defines the visual language that should be followed for all Localisy screens, pages, and product surfaces.

This is the default design contract for:

- public web pages
- locality landing pages
- category and listing pages
- merchant workflows
- admin and operator tools
- mobile-responsive layouts

# 2. Brand Direction

Localisy should feel:

- local and human
- credible and structured
- warm but not playful
- modern but not overly futuristic
- fast and approachable

The design should balance trust and discovery.

It should feel like a serious local platform, not a generic directory template.

# 3. Core Palette

Use these as the primary brand tokens:

| Token | Role | Value |
|---|---|---|
| `Localisy Navy` | primary background, primary button, navigation | `#0D1B2A` |
| `Localisy Royal Blue` | secondary action, links, active states | `#1E3A8A` |
| `Localisy Sky Blue` | selected UI accents, charts, supportive highlights | `#3B82F6` |
| `Localisy Lemon Yellow` | brand highlight, emphasis, positive CTA contrast | `#FFD54F` |
| `Localisy Soft Cream` | page background tint, warm supporting surfaces | `#FFF5F9` |
| `Localisy Slate Gray` | body copy, neutral borders, icons | `#64748B` |
| `White` | cards, inputs, overlays | `#FFFFFF` |

# 4. Typography

Use `Inter` as the default font family for all product surfaces.

Recommended scale:

| Style | Weight | Size | Line Height |
|---|---|---|---|
| `H1` | `700` | `56px` | `64px` |
| `H2` | `600` | `40px` | `48px` |
| `H3` | `600` | `28px` | `36px` |
| `Body Large` | `500` | `16px` | `24px` |
| `Body` | `400` | `14px` | `20px` |
| `Caption` | `400` | `12px` | `18px` |

Typography rules:

- headings should use tight tracking and strong hierarchy
- body copy should stay clean and readable
- avoid decorative typefaces for production surfaces
- keep labels and captions crisp and compact

# 5. Shape System

Preferred radius scale:

- `4px`
- `8px`
- `12px`
- `16px`
- `20px`
- `24px`

Usage guidance:

- buttons: `10px` to `14px`
- input fields: `10px` to `14px`
- cards: `16px` to `24px`
- feature panels and hero containers: `20px` to `24px`
- pills and chips: fully rounded

# 6. Shadow System

Preferred shadows:

- `Shadow 1`: `0 2px 4px rgba(15,23,42,0.06)`
- `Shadow 2`: `0 8px 24px rgba(15,23,42,0.08)`
- `Shadow 3`: `0 16px 40px rgba(15,23,42,0.12)`

Usage guidance:

- default cards should use subtle shadows
- elevated CTAs and hero panels can use stronger shadows
- avoid muddy or overly diffuse shadows

# 7. Component Rules

## 7.1 Navigation

- navigation bars should feel light, structured, and premium
- logo and location context should be clearly visible
- primary search should be central when discovery is core to the page
- important actions should use brand color contrast instead of random accent colors

## 7.2 Buttons

- primary buttons: Localisy Navy background with white text
- secondary buttons: white or pale background with navy or royal blue border/text
- tertiary buttons: minimal, text-led, low visual weight
- icon buttons: outlined and compact

## 7.3 Cards

- cards should be white or very lightly tinted
- card content should be structured with clear top, body, and action zones
- icons should use soft tinted circular or rounded-square containers
- avoid noisy gradients on ordinary cards

## 7.4 Inputs and Search

- inputs should be white with soft borders
- active focus states should use royal blue or sky blue
- search bars should be generous, central, and uncluttered

## 7.5 Status and Badges

- use calm tinted fills for informational states
- never use saturated red/green blocks unless the state truly needs urgency
- status chips should be compact and readable

# 8. Layout Principles

Every Localisy screen should prefer:

- generous white space
- strong content grouping
- clean sectional rhythm
- simple scanning paths
- localized context near the top of the screen

Avoid:

- dashboard clutter on public pages
- too many competing accent colors
- overly dark full-page layouts for default web surfaces
- instruction-like text blocks disguised as UI

# 9. Locality Page Rules

For locality landing pages specifically:

- keep the location selector and search prominent
- use a strong hero with a local visual or locality summary
- category browsing should be visual, compact, and easy to scan
- featured businesses should feel premium and trustworthy
- supporting panels such as map, highlights, and business CTA should align to the right rail when space allows
- chips, stats, and badges should use Localisy tones and spacing conventions

# 10. Implementation Rule

For all future Localisy screen design and page design work:

1. start from this design language first
2. use Localisy token colors before inventing new colors
3. use `Inter` and the defined hierarchy
4. use the approved radius and shadow scales
5. keep component styling consistent across public, merchant, and admin surfaces

If a new screen intentionally diverges, the divergence should be explicit and justified by context, not accidental styling drift.
