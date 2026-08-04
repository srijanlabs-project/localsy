# Operations Workspace Field Guide

This guide is for the operations executive managing the `Operations Workspace` in the admin console.

## Important First Note: Why hero banner can show when snapshots = 0

`0 snapshots` does not always mean the homepage has no content.

There are 2 layers:

1. `Published snapshots`
   These are saved records created only when someone runs a publish action.

2. `Live resolver`
   This builds the homepage live from scalable CMS data, campaign data, and legacy-seeded homepage configuration.

Because of this, a locality page can still show a hero banner even when snapshot count is `0`, if the page is being served by the live resolver instead of a published snapshot.

In simple words:

- `0 snapshots` = nothing has been published into the snapshot table yet
- Banner still visible = the live CMS/resolver still has active hero content for that locality

## Shared Filters At Top

These filters affect what the executive sees in multiple operation sections.

### All localities

- Purpose: restrict the screen to one locality or show all.
- Use when: working only on Roadpali, Kalamboli, Kharghar, etc.
- Tip: set this first before creating or reviewing locality-specific content.

### All categories

- Purpose: restrict results to one master category.
- Use when: reviewing ads, URLs, or listings for a business category.

### All subcategories

- Purpose: narrow further within the selected category.
- Note: becomes meaningful only after a category is selected.

### Search name, phone, title...

- Purpose: quick text search across visible operational data.
- Use when: searching a listing name, ad title, or phone reference.

### Pincode

- Purpose: filter records by pincode.
- Use when: checking routing, ads, or offers for a specific service area.

### All statuses

- Purpose: filter by approval or activity state.
- Typical values: `approved`, `pending`, `rejected`, `active`, `inactive`.

## Geography & Routing

### 1. Localities > Create Hyper Local Business Page

Use this when a new locality page has to go live.

#### Locality / City Name

- What it means: public locality name.
- Example: `Roadpali`, `Kalamboli`, `Panvel`.
- Best practice: keep it short and exactly how users search for it.

#### Public Route / legacy domain mapping

- What it means: the public route or mapped locality URL slug/domain.
- Example: `roadpali.localisy.in` or the route used internally for that locality page.
- Best practice: do not change existing live routes casually because public links may break.

#### Short Regional Description

- What it means: small locality summary used for locality context.
- Example: "Fast-growing residential node with clinics, tutors, daily services, and food businesses."
- Best practice: keep it clear and local-search focused.

#### City Image (Unsplash URL - optional)

- What it means: background or city image for the locality page.
- Use when: a locality needs a specific visual identity.

#### Mapped Pincodes

- What it means: pincodes that should open this locality page.
- Format: comma-separated or space-separated list.
- Example: `410218, 410210`.
- Best practice: confirm routing before saving because wrong mapping sends users to the wrong page.

### 2. Routing > Pincode Routing Engine

Use this to control which locality opens for a pincode.

#### Default Fallback Page

- What it means: the default locality page shown when no exact pincode mapping is found.
- Use when: user skips location, enters unsupported pincode, or lands on general routing flow.
- Best practice: keep the fallback page as the most useful default locality.

#### Active Mappings

- What it means: current pincode-to-locality bindings.
- Use when: auditing which pincode opens which page.
- Ops task: delete wrong mappings before creating replacement mappings.

#### Add Custom Entry > Pincode

- What it means: the 6-digit service pincode.
- Rule: must be a valid 6-digit number.

#### Add Custom Entry > Open Page

- What it means: the locality page that should open for that pincode.

### 3. Category URLs > Locality + Category URL Mapper

Use this to create SEO/public landing pages for a locality-category or locality-subcategory combination.

#### Locality

- What it means: which locality page the category landing belongs to.

#### Category

- What it means: parent business category.
- Example: `Food & Restaurants`, `Health`, `Education`.

#### Subcategory

- What it means: optional deeper service type under the selected category.
- If blank: the URL is created for the full category, not a single subcategory.

## Homepage CMS

This is for homepage structure, hero content, campaigns, and publish flow.

### 0. Homepage Layout Manager

This is the screen in your screenshot. It controls the order, visibility, scheduling, targeting, and behavior of homepage sections for a locality.

Think of it as the page-structure builder.

#### Locality selector at top

- What it means: the locality whose homepage layout you are currently editing.
- Effect: the section list below belongs to this locality context.
- Best practice: always confirm the locality before editing, because the same section title can exist in multiple localities.

#### Sections count chip

- Example: `36 sections`
- What it means: number of homepage sections currently available in that filtered layout set.

### Create New Homepage Section Form

This is the block where a new section is created before it appears in the list.

#### Section type

- What it means: the visual/content block to add on the homepage.
- Available types:
  - `Hero Banner`
  - `Search & Discovery`
  - `Emergency Services`
  - `Promo Banner`
  - `Featured Businesses`
  - `Business Shelf`
  - `Compact Service Strip`
  - `Offers & Deals`
  - `Locality Updates`
  - `Category Grid`
  - `Verified Businesses`
  - `Trust Strip`
- Best practice: choose the type first, because the rest of the form changes based on it.

#### Max items

- What it means: maximum number of items the section is allowed to render.
- Used mainly for: business lists, offers, updates, categories.
- Example:
  - `6` means show up to 6 businesses/offers/categories
  - verified grid usually uses a larger number than standard shelves
- Important: frontend still applies some type-based caps for business sections, so this is a content cap, not an infinite load count.

#### Target localities

- What it means: locality IDs for which this section is allowed to appear.
- In the new section form, locality targeting is expected to be explicit.
- Use when: one section should appear in Roadpali and Kalamboli, but not everywhere.
- If removed completely later: the section can become unrestricted depending on where it is used.

#### Visible slots

- What it means: how many cards/items are visible in the section viewport before users scroll or rotate.
- Use when: you want 6 total items but only 3 visible at one time.
- Best practice: keep this lower than or equal to `Max items`.

#### Rotate seconds

- What it means: timing interval for auto-rotation behavior.
- Example: `3` means rotate every 3 seconds.
- Applies mainly where rotating/scrolling card behavior is used.

#### Desktop cards

- What it means: how many cards should be shown in one desktop row/view.
- Applies to:
  - `Featured Businesses`
  - `Business Shelf`
  - `Compact Service Strip`
  - `Verified Businesses`

#### Mobile cards

- What it means: how many cards should be visible per mobile swipe/view.
- Applies to the same business section types.

#### Mobile display mode

- Values:
  - `Mobile Carousel`
  - `Mobile Stack`
- What it means:
  - `Carousel`: horizontally swipeable cards
  - `Stack`: vertical stacked cards
- Best practice:
  - use `Stack` when readability is more important
  - use `Carousel` when visual browsing is more important

#### Section title

- What it means: the visible heading shown on the homepage for that section.
- Example: `Top Clinics in Roadpali`, `Popular Food Services`, `Verified Professionals`.

#### Section subtitle

- What it means: optional helper text under the title.
- Use when: the section needs context, such as "Curated businesses frequently used in this locality."

#### Category

- Applies only to:
  - `Business Shelf`
  - `Compact Service Strip`
- What it means: parent business category used to fetch or scope listings.

#### Subcategory

- Applies only to:
  - `Business Shelf`
  - `Compact Service Strip`
- What it means: narrower listing scope under the selected category.
- If blank: section can work at category level.

#### Category selection and order

- Applies only to:
  - `Category Grid`
  - `Emergency Services`
- What it means: choose exactly which categories appear, and in what order.
- Important: order matters because the frontend uses that stored order.

#### Listing source mode

- Applies only to:
  - `Featured Businesses`
  - `Business Shelf`
  - `Compact Service Strip`
  - `Verified Businesses`
- Values:
  - `Auto listings`
  - `Manual pinned listings`
- What it means:
  - `Auto`: system picks listings based on section rules
  - `Manual`: ops chooses exact businesses and their order

#### Auto rotate overflow

- Applies mainly to business sections.
- What it means: when more items exist than visible space, the section can rotate through them automatically.

#### Pinned listings

- Visible only when `Listing source mode = Manual pinned listings`.
- What it means: exact businesses pinned into the section.
- Important: selected order is the render order.
- Best practice: use manual mode for curated or paid sections.

#### Placement key

- Applies only to:
  - `Promo Banner`
- What it means: the layout slot name that connects this homepage section to an ad/banner placement.
- Example meaning: this section will render the ad whose placement key matches this value.
- Important: if the placement key does not match any active ad, the promo section may show nothing.

#### Start date

- What it means: the date from which the section becomes eligible to show.

#### End date

- What it means: the date after which the section should stop appearing.

#### CTA type

- Values:
  - `No CTA`
  - `Landing Page`
  - `Landing Listing`
  - `Lead Form`
  - `Search Category`
- What it means: what happens when the section CTA is clicked.

#### CTA label

- What it means: visible button text for the section CTA.
- Example: `View All`, `Book Now`, `Explore Category`.

#### CTA target

- What it means: the target destination or identifier used by the CTA.
- Expected usage depends on CTA type:
  - `Landing Page`: URL or route
  - `Landing Listing`: listing/business ID or mapped target
  - `Lead Form`: form-linked target context
  - `Search Category`: category/search context

#### Target pincodes

- What it means: restrict the section to specific service pincodes.
- If blank: the section is not pincode-restricted.
- Use when: one locality has multiple micro-zones with different content priorities.

#### Show View All

- What it means: whether the section should show a `View All` style action on frontend.
- Typical effect:
  - business sections open broader result pages
  - category/emergency sections can open expanded selection
  - offers/updates can open modal/list expansions

#### Background

- What it means: section-level background color.
- Most useful for:
  - `Promo Banner`
  - sections where visual separation is important
- Important: some section types use richer frontend styles, so this field may be more visually important in some types than others.

#### Add Homepage Section

- What it means: saves the new section into the homepage layout.

#### Add To Active Template

- What it means: adds this section to the currently selected scalable template instead of only the direct locality layout.
- Use when: building reusable, template-driven homepage structures.

### Existing Section Cards In Layout Manager

After a section is created, it appears as an editable card.

#### Move up / Move down

- What it means: changes section order on the homepage.
- Important: homepage flow is heavily affected by order, especially hero, search, categories, offers, and promoted content.

#### Duplicate

- What it means: makes a copy of the section.
- Use when: creating a similar section with small variations.

#### Delete

- What it means: removes the section from the layout/template.
- Use carefully, especially on live localities.

#### Status

- Values:
  - `Active`
  - `Inactive`
- What it means: whether the section is operationally active.

#### Visible / Hidden

- What it means:
  - `Visible`: can render on frontend if other conditions match
  - `Hidden`: stays in config but does not show
- Best practice: use `Hidden` instead of deleting when you may reuse later.

#### Pincodes

- Same meaning as target pincodes in create form.
- In edit mode, this is stored as a pincode list and can be changed anytime.

#### Auto rotate

- What it means: live toggle for rotating eligible section items.

### Section Type Definitions And Usage

This is the most important part for operations.

#### Hero Banner

- Purpose: top visual block of the homepage.
- Frontend behavior: uses hero banner campaign/content plus search bar and quick category shortcuts.
- Use when: locality needs a strong branded first screen.

#### Search & Discovery

- Purpose: standalone search module.
- Frontend behavior: shows search box, category filter, subcategory filter, and quick category chips.
- Important: if a hero section already exists, this standalone search block may not render separately.

#### Emergency Services

- Purpose: quick access to urgent categories.
- Frontend behavior: category shortcut tiles such as ambulance, clinics, essential emergency-related services.
- Use when: locality needs a fast emergency lane.

#### Promo Banner

- Purpose: render an ad-style promotional strip/banner inside homepage flow.
- Frontend behavior: looks up an active ad by matching `Placement key`.
- Critical dependency: correct placement key + active ad banner data.

#### Featured Businesses

- Purpose: curated spotlight businesses.
- Frontend behavior: business cards with stronger emphasis and image-heavy presentation.
- Best for: premium picks, sponsored highlights, locality champions.

#### Business Shelf

- Purpose: standard business listing carousel/grid for a category or subcategory.
- Frontend behavior: common browse block for local listings.
- Best for: service discovery by category.

#### Compact Service Strip

- Purpose: lighter-weight business strip using compact cards.
- Frontend behavior: less heavy than business shelf, useful for dense sections.
- Best for: fast browsing of many service types.

#### Offers & Deals

- Purpose: show active offers/coupons.
- Frontend behavior: pulls active locality offers and can open fuller offer lists if `Show View All` is enabled.

#### Locality Updates

- Purpose: show news, updates, announcements, events, and locality content.
- Frontend behavior: pulls locality community/update items.

#### Category Grid

- Purpose: visual browse-by-category section.
- Frontend behavior: shows category tiles in the configured order.
- Best for: letting users jump into common search intents quickly.

#### Verified Businesses

- Purpose: show trusted/verified businesses in a stronger results-style section.
- Frontend behavior: business grid with filter/sort oriented presentation and optional `View More Businesses`.
- Best for: trust-led browsing and UAT/demo showcases.

#### Trust Strip

- Purpose: static confidence-building block.
- Frontend behavior: trust badges such as verified businesses, support, safe platform indicators.
- Best for: reinforcing credibility lower on the page.

### Which Fields Matter For Which Section Types

#### Business-oriented sections

- Includes:
  - `Featured Businesses`
  - `Business Shelf`
  - `Compact Service Strip`
  - `Verified Businesses`
- Most relevant fields:
  - Max items
  - Visible slots
  - Desktop cards
  - Mobile cards
  - Mobile display mode
  - Listing source mode
  - Pinned listings
  - CTA fields
  - Show View All
  - Auto rotate
  - Rotate seconds

#### Category-oriented sections

- Includes:
  - `Category Grid`
  - `Emergency Services`
- Most relevant fields:
  - Category selection and order
  - Max items
  - Show View All

#### Promotion-oriented sections

- Includes:
  - `Promo Banner`
  - `Hero Banner`
- Most relevant fields:
  - CTA fields
  - Background
  - Placement key for promo banner
  - Date range
  - Pincode targeting

#### Content-oriented sections

- Includes:
  - `Offers & Deals`
  - `Locality Updates`
  - `Trust Strip`
- Most relevant fields:
  - Max items
  - Title/subtitle
  - Show View All
  - Scheduling

### 1. Hero Banner Manager

Use this to create the top hero banner shown on the homepage.

#### Locality

- What it means: which locality homepage the hero belongs to.

#### Hero title

- What it means: main headline of the hero.
- Best practice: locality-focused, short, high trust.

#### Hero subtitle

- What it means: supporting line below the hero title.
- Best practice: explain what users will find in that locality.

#### Hero image URL

- What it means: direct hosted image URL.
- Optional if image is uploaded instead.

#### Upload hero image

- What it means: upload a local image file for the hero.
- Use this when the ops team has a final approved creative asset.

#### Start date

- What it means: date from which the hero becomes valid.

#### End date

- What it means: date after which the hero should stop showing.

#### CTA label

- What it means: button text shown on the hero.
- Example: `Explore Businesses`, `Book Now`, `Search Clinics`.

#### CTA type

- Values:
  - `Landing Page`: button opens a URL/page
  - `Landing Listing`: button opens one listing/business detail
  - `Lead Form`: button opens enquiry/lead capture
  - `Search Category`: button opens category search/result flow

#### CTA target

- What it means: depends on CTA type.
- For `Landing Page`: use destination URL or route.
- For `Landing Listing`: use target listing/business reference.
- For `Search Category`: use the category or search target reference.

#### Target pincodes

- What it means: optional pincode-specific targeting.
- If blank: hero is locality-wide.

#### Hero stat cards

- What it means: the small metric cards shown in the hero area.
- Each card has:
  - `Visible/Hidden`: controls if card shows
  - `Value`: numeric or short metric value
  - `Label`: short description
  - `Locality IDs`: optional narrower locality targeting
  - `Pincodes`: optional pincode targeting

### 2. Publish / Snapshots / Preview

This area controls persistent published homepage output.

#### Safe Reseed From Legacy

- What it means: rebuild scalable CMS entities from legacy homepage data without force-overwriting detached scalable items.
- Use carefully.

#### Force Legacy Reseed

- What it means: force overwrite scalable state from legacy data.
- Use only with technical approval.

#### Publish Selected Locality

- What it means: creates published snapshot records for the currently selected locality.
- Result: snapshot count should increase if publish succeeds.

#### Publish All Localities

- What it means: creates published snapshots for all localities in scope.
- Use only when content has been reviewed.

#### Bulk Publish Scope

Use when publishing a large structured set of contexts.

##### Publish localities

- Select one or more localities to publish.

##### Publish categories

- Optional category-level publish scope.

##### Publish subcategories

- Optional subcategory-level publish scope.

##### Publish pincodes

- Optional pincode-specific publish scope.

##### Publish placements

- Optional placement-specific publish scope.

##### Publish devices

- Controls whether publish is for `all`, `desktop`, or `mobile`.

##### Publish page types

- Controls whether publish is for `homepage` or `listing_results`.

#### Published Snapshots

- What it means: recent published homepage payloads saved by publish flow.
- If this is empty, nothing has been published yet for snapshot serving.

#### Resolved Homepage Preview

Use this to test what the system will actually serve.

##### Locality

- Select the locality to preview.

##### Device

- Preview `all`, `desktop`, or `mobile`.

##### Page type

- Preview `homepage` or `listing_results`.

##### Date

- Preview time-bound content for a specific date.

##### Category / Subcategory

- Test category-scoped or subcategory-scoped output.

##### Pincode

- Test pincode-targeted content resolution.

##### Placement key

- Test placement-aware resolution.

##### Use published snapshots

- When enabled: preview tries to read the published snapshot layer.
- When disabled: preview reads the live resolver layer.

##### Load Resolved Preview

- Use to inspect what will be served right now.

##### Publish This Preview Context

- Use when the preview is correct and should be saved as a published context.

## Ads & Offers

### 1. Offers & Deals Manager

Use this to create locality-targeted offers for businesses.

#### Select business

- What it means: business that owns the offer.
- Rule: normally choose approved businesses only.

#### Offer title

- What it means: public headline of the offer.
- Example: `20% Off Dental Checkup`.

#### Coupon code

- What it means: redemption or tracking code, if any.

#### Discount label

- What it means: quick visible value label.
- Example: `20% OFF`, `Flat 500 Off`.

#### Offer description

- What it means: short offer explanation, inclusions, conditions.

#### Locality

- What it means: default locality target for the offer.

#### Pincodes

- What it means: optional narrower targeting inside the locality.

#### Start date / End date

- What it means: active window of the offer.

### 2. Ad Banner Manager

Use this to create homepage or listing-related ad creatives.

#### Ad title

- What it means: main ad heading.

#### Ad description

- What it means: supporting ad copy.

#### Badge

- What it means: short visual tag.
- Example: `Sponsored`, `Limited Offer`, `Featured`.

#### CTA text

- What it means: button label for the ad.

#### Start date / End date

- What it means: campaign validity window.

#### Action type

- Values:
  - `Landing Page`
  - `Landing Listing`
  - `Lead Generation Form`

#### Background color

- What it means: banner background color for design styling.

#### Locality

- What it means: locality target of the ad.

#### Placement key

- What it means: exact page slot where ad should appear.
- Example use: homepage inline slot vs another placement slot.
- Best practice: keep a controlled naming convention.

#### Ad category targeting

- What it means: categories where the ad should show.
- If blank: ad can match all categories.

#### Target tags

- What it means: optional keyword/tag matching.
- Example: `pickle`, `food`, `salon`.

#### Banner image URL

- What it means: hosted image URL for the ad creative.

#### Device target

- Values:
  - `Desktop + Mobile`
  - `Desktop Only`
  - `Mobile Only`

#### Upload ad image

- What it means: upload local image file instead of giving a URL.

#### Mobile row position

- What it means: on mobile layouts, after which result row the ad should appear.
- Relevant only when device target includes mobile.

#### Target pincodes

- What it means: optional pincode-specific ad targeting.

#### Landing Page target

- Visible when action type is `Landing Page`.
- Expected value: URL or route to open.

#### Landing Listing target

- Visible when action type is `Landing Listing`.
- Expected value: target listing/business to open.

#### Seller mapping

- What it means: which seller/business owns or is billed for the ad.
- If blank: treated as platform-owned.

### 3. Ad Lead Inbox

Use this to monitor leads coming from ad lead forms.

#### Lead name

- Person who submitted the enquiry.

#### Pincode

- Lead service area.

#### Mobile

- Lead phone number.

#### Seller

- Seller/business mapped to that lead, or platform if not mapped.

#### Created time

- Exact time the lead was submitted.

## Updates & Community

Use this to create locality-specific updates, posts, events, and small content items.

### Type

- Values:
  - `Post`
  - `Event`
  - `Deal`
  - `Recommendation`
  - `Q&A`

### Author

- What it means: display author name.

### Status

- Values:
  - `Published`
  - `Scheduled`
  - `Draft`
  - `Archived`

### Publish date

- What it means: date when content should start appearing.

### Expiry date

- What it means: last valid date for visibility.

### Image

- What it means: uploaded image or image URL for the update card.

### Optional business ID

- What it means: link the update to a business if relevant.
- Use when: update is tied to one listing/business.

### Update title

- What it means: headline of the update.

### Update content

- What it means: body text of the update.

## Daily Operating Sequence Recommended For Ops

1. Select the correct locality in the shared filter.
2. Create or update hero, ads, offers, and locality updates.
3. Use `Resolved Homepage Preview` to verify what the page will serve.
4. If preview is correct, publish the required context.
5. Recheck `Published Snapshots` to confirm snapshot creation.
6. Validate the public page on UAT/live.

## Common Mistakes To Avoid

- Do not assume `0 snapshots` means no homepage content exists.
- Do not change locality route mappings without checking live URLs.
- Do not publish all localities unless all impacted pages are reviewed.
- Do not leave expired banners or offers active.
- Do not use wrong CTA target format for hero or ads.
- Do not mix locality-wide and pincode-specific campaigns without testing preview first.

## Escalate To Admin/Tech Team When

- Snapshot count stays `0` even after successful publish action.
- Public page is showing old content after publish.
- Wrong locality opens for a pincode.
- A hero/ad appears on frontend but cannot be found in the expected manager section.
- A route, category URL, or publish context looks duplicated or broken.
