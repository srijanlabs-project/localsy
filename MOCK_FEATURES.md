# Mock Features Inventory

These features are currently simulated/mock and should be treated as non-production logic until replaced.

## Authentication and Verification
- Static OTP value (`1212`) in [`src/components/OtpVerificationModal.tsx`](/D:/localsy/src/components/OtpVerificationModal.tsx).
- Simulated captcha slider gate (client-only).

## Search Intelligence
- Voice search is simulated text injection (no real speech engine).
- Image search is simulated tag selection (no real image model).
- AI recommendation text is hardcoded logic (no live LLM call).

## Geolocation
- Google location picker returns simulated coordinates in [`src/components/GoogleLocationPicker.tsx`](/D:/localsy/src/components/GoogleLocationPicker.tsx).

## Mobile Experience
- Android simulator is a UI simulation only, not a real native client integration.
- Device intent logs are local mock logs.

## Audit and Security Metadata
- IP/device signature values are synthetic/randomized in client logic.
- Audit logs are currently localStorage-backed, not immutable server-side records.

## Infrastructure/Topology UI
- Subdomain and DNS mapping display is informational simulation.
- Locality provisioning in admin is currently frontend-state based.
