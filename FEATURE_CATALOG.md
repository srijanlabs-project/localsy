# Feature Catalog (Current + Deferred)

## A. Live Now (Production-facing)
- Role-based authentication (Sign In / Register)
- User types: platform_admin, developer, buyer, seller, resource
- OTP-gated contact reveal (static OTP retained as requested)
- Locality and pincode-based browsing
- Business listing browse + detail + reviews
- Admin moderation queue (approve/reject/update listing)
- Audit logging (frontend + backend persistence path)
- Bulk CSV upload for business units in Admin

## B. Deferred / Simulator (Kept for later work)
- SME Merchant Workspace full backend workflows
- Citizens Bulletin full backend workflows
- Voice/Image/AI search simulation modules
- Android simulator experience
- Proposal/spec presentation module

## C. Requested “Do Later” Note
- Convert SME Merchant Workspace and Citizens Bulletin from simulator/local-state to full API + database-backed workflows.
- Enforce server-side permission checks for each workflow action.

## D. CSV Upload Support (Business Units)
- Accepted columns:
  - Business Name, Address, Area, City, State, PIN, Mobile, Rating, Reviews, Services, Latitude, Longitude
- Current importer behavior:
  - Deduplicates by `name + address + phone`
  - Converts placeholders (`—`) to safe defaults
  - Infers category from Services
  - Maps locality/area heuristically
  - Inserts imported rows as `pending` for moderation

## E. How to create ads between listings
Use one of these approaches:
1. Data-driven ad cards (recommended)
   - Add a list of promoted items in data/backend with fields: `title`, `imageUrl`, `cta`, `targetUrl`, `localityId`, `active`.
   - During listing render, inject an ad card after every N listings (for example every 4 items).
2. Sponsored business approach
   - Use existing business fields `isSponsored` + `cpcBudget`.
   - Sort sponsored listings at controlled positions and mark as “Sponsored”.

## F. How to activate hero banner
Hero reads from locality carousel images.
1. Open locality data source:
   - [`src/data.ts`](/D:/localsy/src/data.ts)
2. Update each locality’s `carouselImages` array with approved banner URLs.
3. Keep at least 2-3 images per locality for smooth rotation.
4. Optional: add `isHeroActive` flag in locality schema for toggling on/off without deleting images.
