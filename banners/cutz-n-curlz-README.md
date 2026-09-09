# Cutz N Curlz — banner set (blush / Garamond, reference-matched)

Two complete sets, every slot Localisy serves, at 1x and @2x.

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

## Design

Follows the salon-poster reference: blush diagonal wash with a top-left glow, an
inset rounded card holding the type, line-art botanical branches reaching in from
the edges, EB Garamond display serif with letter-spacing, a quoted italic
tagline, a stacked offer, and a solid brown small-caps CTA.

The type stack is measured and then SCALED to fit each card, so the CTA and the
address survive on a 290x220 rail card as well as on a 1000x360 hero. Rows are
only dropped once the type would be too small to read — the quoted tagline goes
first, below 9px, because an illegible line is worse than none.

## The two sets

- **`cutz-n-curlz/`** — brand, tagline, services, Book Now. No price claim. Safe
  to activate as-is.
- **`cutz-n-curlz-with-offer/`** — the same set carrying **FLAT 20% OFF, on your
  first visit**. That number is a SAMPLE. Confirm it with the salon before
  activating: a discount on a live banner is an offer a customer can turn up and
  ask for.

## Re-rendering

    python3 scripts/make_banner_set.py \
      --out banners/cutz-n-curlz \
      --brand "CUTZ N CURLZ" \
      --tagline "Where Style Meets You" \
      --offer "FLAT 25% OFF" \
      --sub "on your first visit" \
      --cta "Book Now" \
      --footer "Roadpali, Navi Mumbai"

`--lead` sets the small line above the offer ("Up To"). It is suppressed
automatically when the offer already qualifies itself — "Up To FLAT 20% OFF"
reads as a mistake.

Sizes come from `BANNER_SLOTS` in `src/services/admin/bannerStudio.ts`, which
comes from the render CSS, so nothing here needs cropping.

## The one thing that is not matched

No photograph. There is no image-generation model in the tooling that produced
these, so the model portrait in the reference has no equivalent here — the
botanicals and the type carry the composition instead. Send 2-3 photos with clear
space on one side and they can be composited into all eleven sizes.
