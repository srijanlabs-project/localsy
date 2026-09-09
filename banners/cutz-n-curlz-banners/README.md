# Cutz N Curlz — banner set

Two full sets, every slot Localisy serves, at 1x and @2x.

| File | Size | Where it goes |
| --- | --- | --- |
| `hero-desktop` | 1000 x 360 | Homepage hero — main (desktop), and the hero carousel |
| `hero-mobile` | 358 x 198 | Homepage hero — main (mobile creative) |
| `hero-secondary` | 263 x 360 | Homepage hero — side rail (desktop) |
| `hero-junior` | 256 x 400 | Homepage hero — junior rail (desktop, >=768px) |
| `strip-desktop` | 1000 x 200 | Homepage strip, between categories and listings |
| `strip-mobile` | 358 x 72 | Same strip, mobile creative |
| `mobile-inline` | 358 x 120 | Mobile, between result cards |
| `mobile-promo` | 358 x 180 | Mobile "Promoted this week" |
| `search-rail` | 290 x 220 | Search results — right rail |
| `results-desktop` | 1000 x 240 | Search results — inline |
| `results-mobile` | 358 x 86 | Same, mobile creative |

Upload the `-desktop` file to the Image field and the matching `-mobile` file to
the mobile field. A banner targeting both devices with only a desktop creative
runs on desktop only — it is not cropped onto phones.

## The two sets

- **`cutz-n-curlz/`** — brand, services, Book Now. No price claim. Safe to
  activate as-is.
- **`cutz-n-curlz-with-offer/`** — the same set carrying **FLAT 20% OFF, on your
  first visit**. That number is a SAMPLE. Confirm it with the salon before
  activating: a discount on a live banner is an offer a customer can turn up and
  ask for.

## Re-rendering with different copy

    python3 scripts/make_banner_set.py \
      --out banners/cutz-n-curlz \
      --brand "CUTZ N CURLZ" \
      --tagline "Unisex Salon & Academy" \
      --offer "FLAT 25% OFF" \
      --sub "on your first visit" \
      --cta "BOOK NOW" \
      --footer "Roadpali, Navi Mumbai"

Sizes come from `BANNER_SLOTS` in `src/services/admin/bannerStudio.ts`, which
comes from the render CSS — so anything produced here fits its slot without
being cropped.

## What these are not

No photographs. There is no image-generation model in the tooling that produced
them, so the artwork is typographic: blush ground, marigold and rose blooms,
plum type. If you want the reference look with a portrait, send photos and they
can be composited into every size.
