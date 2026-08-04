# Homepage Autopilot Tracker

## Goal
Build the scalable homepage CMS + backend operations layer for multi-locality rollout, including configurable section sourcing, backend filters, carousel overflow behavior, and cleaner admin workflows.

## Requested Additions
- [x] Textual business links/list strips should support category-based auto population from approved active listings
- [x] Emergency/category icon sections should be backend-configurable by category selection, order, and repeatable placement
- [x] Hero banner should support images and CTA configuration
- [x] If listings exceed visible slots, section should become a looping carousel rotating every 3 seconds

## Core Build Tracks

### 1. Section Model + Homepage Data Model
- [x] Extend homepage section schema for:
  - [x] text link row / textual business strip
  - [x] configurable category icon grid
  - [x] configurable emergency category row
  - [x] manual vs auto listing source mode
  - [x] pinned listing ids
  - [x] visible slot count
  - [x] carousel enabled / auto overflow
  - [x] carousel interval
  - [x] repeated section support with independent category sets
- [x] Normalize older layouts so missing new fields are backfilled safely

### 2. Homepage Rendering
- [x] Render textual listing rows from active approved category listings
- [x] Render backend-configured category icon sections anywhere in page
- [x] Render backend-configured emergency icon sections anywhere in page
- [x] Add carousel loop behavior for overflowed listing sections
- [x] Keep View All behavior category-aware
- [x] Hide View More Businesses when there are no more businesses left

### 3. Backend API + Config
- [x] Extend homepage config API payload to carry new section settings
- [x] Persist updates feed manager data in the homepage config flow
- [x] Keep API config synced with new managers

### 4. Admin Operations Restructure
- [x] Reorganize backend UI into grouped workspaces:
  - [x] Listings Ops
  - [x] Homepage CMS
  - [x] Campaigns
  - [x] Geography & Routing
  - [x] Content & Community
  - [x] Platform Config
- [x] Reduce stacked right-panel forms by splitting large managers into dedicated blocks

### 5. Shared Admin Filter Pattern
- [x] Add reusable filter bar support with:
  - [x] locality filter
  - [x] category filter
  - [x] subcategory filter
  - [x] pincode filter
  - [x] search
  - [x] status filter
  - [ ] date filters where relevant

### 6. Section-Specific Admin Improvements

#### Listings Ops
- [x] Add locality/category/subcategory/pincode filters
- [x] Add search by name/phone
- [ ] Add status + featured + verified filters
- [ ] Add bulk actions

#### Homepage CMS
- [x] Add locality-aware homepage layout manager
- [x] Add section-type/status/visibility filters
- [x] Add repeatable category blocks
- [x] Add manual vs auto source controls
- [x] Add pinned listings controls
- [x] Add hero manager improvements
- [ ] Add preview-oriented controls

#### Campaigns
- [x] Add filters for offers
- [x] Add filters for ad banners
- [x] Add filters for ad leads

#### Geography & Routing
- [x] Add filters/search for localities
- [x] Add filters/search for pincodes
- [x] Add filters/search for locality-category URL links

#### Content & Community
- [x] Build dedicated Updates Feed Manager
- [ ] Add locality/type/status/date filters
- [ ] Add create/edit/delete/schedule flow

#### Platform Config
- [x] Keep API configuration separate
- [x] Keep audit/logging separate

## Verification
- [x] TypeScript lint passes
- [x] Production build passes
- [x] Homepage sections render from backend config
- [x] New filters operate correctly on large datasets

## Remaining Follow-up
- [ ] Add bulk actions and advanced listing flags in Listings Ops
- [ ] Add date-range filters where campaign or content managers need them
- [ ] Add update edit/schedule workflow in Updates Feed Manager
- [ ] Add preview mode by device/locality/date for Homepage CMS
- [ ] Add role/auth protection to homepage config backend routes before production rollout
