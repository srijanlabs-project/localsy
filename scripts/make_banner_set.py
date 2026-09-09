#!/usr/bin/env python3
"""Render one advertiser's creative in every banner slot Localisy serves.

Every size here comes from BANNER_SLOTS in src/services/admin/bannerStudio.ts,
which in turn comes from the render CSS — so a file produced here drops into the
Banners screen without being cropped into nonsense.

The offer line is a PARAMETER, deliberately. A discount printed on a real
business's banner is a commercial claim that a customer can act on, so it is not
something to invent: pass --offer with whatever the advertiser has agreed.

    python3 scripts/make_banner_set.py --out banners/cutz-n-curlz \
        --brand "CUTZ N CURLZ" --tagline "Unisex Salon & Academy" \
        --offer "FLAT 20% OFF" --sub "on your first visit" --cta "BOOK NOW" \
        --footer "Roadpali, Navi Mumbai"
"""
import argparse
import math
import os
from PIL import Image, ImageDraw, ImageFont

SERIF_BOLD = '/usr/share/fonts/truetype/crosextra/Caladea-Bold.ttf'
SERIF_ITALIC = '/usr/share/fonts/truetype/crosextra/Caladea-Italic.ttf'
SANS_BOLD = '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'
SANS = '/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf'

# Bright, not dark: a blush/cream ground like the reference, with plum type and
# marigold + rose accents doing the shouting.
BLUSH_TOP = (255, 236, 224)
BLUSH_BOTTOM = (250, 214, 199)
PLUM = (74, 25, 66)
MARIGOLD = (243, 156, 18)
MARIGOLD_DEEP = (214, 122, 12)
ROSE = (229, 50, 107)
CREAM = (255, 249, 242)
LEAF = (168, 96, 60)

# name, width, height  — mirrors BANNER_SLOTS
SLOTS = [
    ('hero-desktop', 1000, 360),
    ('hero-mobile', 358, 198),
    ('hero-secondary', 263, 360),
    ('hero-junior', 256, 400),
    ('strip-desktop', 1000, 200),
    ('strip-mobile', 358, 72),
    ('mobile-inline', 358, 120),
    ('mobile-promo', 358, 180),
    ('search-rail', 290, 220),
    ('results-desktop', 1000, 240),
    ('results-mobile', 358, 86),
]


def font(path, size):
    return ImageFont.truetype(path, max(6, int(size)))


def text_w(draw, s, f):
    return draw.textbbox((0, 0), s, font=f)[2]


def fit_font(draw, s, path, start, max_w, floor=7):
    """Largest size at which `s` fits `max_w`. Banner type that overflows its box
    is worse than banner type that is a point smaller."""
    size = start
    while size > floor and text_w(draw, s, font(path, size)) > max_w:
        size -= 1
    return font(path, size)


def gradient(size, top, bottom, horizontal=False):
    w, h = size
    img = Image.new('RGB', (1, max(h, 2)) if not horizontal else (max(w, 2), 1))
    px = img.load()
    n = (h if not horizontal else w)
    for i in range(n):
        t = i / max(1, n - 1)
        px[(0, i) if not horizontal else (i, 0)] = (
            int(top[0] + (bottom[0] - top[0]) * t),
            int(top[1] + (bottom[1] - top[1]) * t),
            int(top[2] + (bottom[2] - top[2]) * t),
        )
    return img.resize((w, h), Image.BILINEAR)


def bloom(base, cx, cy, r, petal_rgb, petals=8, alpha=90, ring=True):
    """A filled-petal flower, drawn on its own layer so petals can overlap softly.

    The first version drew each petal as an open sine curve; at 2px and low alpha
    that renders as scratches, not botany. Filled, rotated ellipses read as a
    bloom at every size down to the 290px rail card.
    """
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer, 'RGBA')
    petal_w, petal_h = r * 0.52, r * 1.5
    for p in range(petals):
        petal = Image.new('RGBA', (int(petal_w * 2), int(petal_h * 2)), (0, 0, 0, 0))
        pd = ImageDraw.Draw(petal)
        pd.ellipse([petal_w * 0.5, 0, petal_w * 1.5, petal_h * 2],
                   fill=(petal_rgb[0], petal_rgb[1], petal_rgb[2], alpha))
        rot = petal.rotate(p * (360 / petals), resample=Image.BICUBIC, expand=True)
        layer.alpha_composite(rot, (int(cx - rot.width / 2), int(cy - rot.height / 2)))
    if ring:
        ld.ellipse([cx - r * 0.16, cy - r * 0.16, cx + r * 0.16, cy + r * 0.16],
                   fill=(petal_rgb[0], petal_rgb[1], petal_rgb[2], min(255, alpha + 70)))
    base.alpha_composite(layer)


def arc_fan(base, cx, cy, r, rgb, count=5, alpha=70, width_ratio=0.055):
    """Concentric arcs — the visual weight the reference got from a portrait."""
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    for i in range(count):
        rr = r * (1 - i * 0.16)
        ld.arc([cx - rr, cy - rr, cx + rr, cy + rr], start=200, end=340,
               fill=(rgb[0], rgb[1], rgb[2], alpha), width=max(1, int(r * width_ratio)))
    base.alpha_composite(layer)


def render(name, w, h, scale, args, out_dir):
    W, H = w * scale, h * scale
    s = scale
    tiny = h < 100            # 358x72 / 358x86: one line, nothing else fits
    compact = 100 <= h < 150  # 358x120: brand, one detail line, CTA
    narrow = (w / h) < 1.05   # portrait rails and the near-square rail card

    img = gradient((W, H), BLUSH_TOP, BLUSH_BOTTOM).convert('RGBA')

    # The focal composition, where the reference put a portrait. Arcs give the
    # weight, blooms the warmth, and both survive being cropped.
    if not tiny:
        fx, fy = (W * 0.80, H * 0.52) if not narrow else (W * 0.58, H * 0.78)
        fr = min(W, H) * (0.62 if not narrow else 0.80)
        arc_fan(img, fx, fy, fr * 1.05, MARIGOLD, count=5, alpha=78)
        bloom(img, fx + fr * 0.16, fy - fr * 0.26, fr * 0.50, MARIGOLD, petals=8, alpha=108)
        bloom(img, fx - fr * 0.36, fy + fr * 0.40, fr * 0.33, ROSE, petals=7, alpha=84)
        bloom(img, W * 0.03, H * 0.05, min(W, H) * 0.18, ROSE, petals=6, alpha=46)

    d = ImageDraw.Draw(img, 'RGBA')
    # A compact banner needs its padding back to keep the CTA: at 358x120 the
    # button was being dropped by ~4px.
    pad = int((10 if tiny else 12 if compact else 18) * s)

    if tiny:
        line = f"{args.brand}  ·  {args.offer}" if args.offer else f"{args.brand}  ·  {args.sub or args.cta}"
        f = fit_font(d, line, SERIF_BOLD, int(H * 0.44), int(W - pad * 2))
        tw = text_w(d, line, f)
        d.text(((W - tw) / 2, (H - f.size * 1.3) / 2), line, font=f, fill=PLUM)
        d.rectangle([0, 0, W - 1, H - 1], outline=(*MARIGOLD, 190), width=max(1, int(s)))
        img.convert('RGB').save(os.path.join(out_dir, f'{name}{"@2x" if s == 2 else ""}.png'))
        return

    # Column width: the type never crosses into the ornament on a wide banner,
    # and takes the full width on a portrait one where the art sits below.
    col_w = int(W - pad * 2) if narrow else int(W * 0.58 - pad)

    # MEASURE, then draw.
    #
    # The first version drew at running offsets with a clamp on the button, which
    # is how the 358x120 ended up with the tagline, the button and the footer all
    # on top of each other, and how the 263x360 rail got a full-height card with
    # three lines at the top of it. Everything below is laid out from real
    # measured heights, and each size only asks for the lines it can fit.
    blocks = []  # (text, font, fill, gap_after, kind)

    # With an offer to show, the brand and the offer share the space rather than
    # both running at their solo size — otherwise the stack overflows and the
    # CTA, the thing the banner exists for, is the first line dropped.
    has_offer = bool(args.offer)
    brand_ratio = (0.14 if has_offer else 0.17) if not (narrow or compact) else (0.10 if narrow else 0.20)
    brand_f = fit_font(d, args.brand, SERIF_BOLD, int(H * brand_ratio), col_w)
    blocks.append((args.brand, brand_f, PLUM, int(brand_f.size * 0.16), 'text'))

    if args.tagline and not compact:
        tag_f = fit_font(d, args.tagline, SERIF_ITALIC, int(brand_f.size * 0.42), col_w)
        blocks.append((args.tagline, tag_f, MARIGOLD_DEEP, int(tag_f.size * 0.55), 'text'))

    if args.offer:
        offer_f = fit_font(d, args.offer, SERIF_BOLD,
                           int(H * (0.165 if not (narrow or compact) else 0.125)), col_w)
        blocks.append((args.offer, offer_f, ROSE, int(offer_f.size * 0.10), 'text'))

    # At 358x120 with an offer to show, the CTA beats the detail line: a banner
    # that says what the deal is and how to take it beats one that lists services.
    if args.sub and not (compact and has_offer):
        sub_f = fit_font(d, args.sub, SANS,
                         int(H * (0.072 if not (narrow or compact) else 0.055 if narrow else 0.10)), col_w)
        blocks.append((args.sub, sub_f, (90, 60, 80, 255), int(sub_f.size * 0.7), 'text'))

    if args.cta:
        cta_f = font(SANS_BOLD, max(9, int(H * (0.072 if not compact else 0.105))))
        blocks.append((args.cta, cta_f, CREAM, int(cta_f.size * 0.5), 'cta'))

    if args.footer and not compact:
        foot_f = font(SANS, max(8, int(H * 0.046)))
        blocks.append((args.footer, foot_f, (120, 80, 100, 235), 0, 'text'))

    def block_h(entry):
        _, f, _, gap, kind = entry
        return int(f.size * (1.95 if kind == 'cta' else 1.22)) + gap

    # Drop trailing blocks until the stack fits. Better a banner with fewer lines
    # than one with lines sitting on top of each other.
    while len(blocks) > 2 and sum(block_h(b) for b in blocks) > H - pad * 2:
        blocks.pop()

    content_h = sum(block_h(b) for b in blocks)
    card_h = content_h + int(20 * s)
    card_top = int(pad - 8 * s) if not narrow else int((H - card_h) * 0.10)
    card_top = max(int(6 * s), card_top)

    card = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle(
        [pad - int(10 * s), card_top, pad + col_w + int(12 * s), card_top + card_h],
        radius=int(14 * s), fill=(255, 249, 242, 210))
    img.alpha_composite(card)
    d = ImageDraw.Draw(img, 'RGBA')

    y = card_top + int(10 * s)
    for text, f, fill, gap, kind in blocks:
        if kind == 'cta':
            tw, th = text_w(d, text, f), f.size
            d.rounded_rectangle([pad, y, pad + tw + int(26 * s), y + int(th * 1.85)],
                                radius=int(7 * s), fill=PLUM)
            d.text((pad + int(13 * s), y + int(th * 0.38)), text, font=f, fill=CREAM)
            y += int(th * 1.95) + gap
        else:
            d.text((pad, y), text, font=f, fill=fill)
            y += int(f.size * 1.22) + gap

    d.rectangle([0, 0, W - 1, H - 1], outline=(*MARIGOLD, 150), width=max(1, int(s)))
    img.convert('RGB').save(os.path.join(out_dir, f'{name}{"@2x" if s == 2 else ""}.png'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--brand', required=True)
    ap.add_argument('--tagline', default='')
    ap.add_argument('--offer', default='')
    ap.add_argument('--sub', default='')
    ap.add_argument('--cta', default='BOOK NOW')
    ap.add_argument('--footer', default='')
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    for name, w, h in SLOTS:
        for scale in (1, 2):
            render(name, w, h, scale, args, args.out)
    print(f'{len(SLOTS) * 2} files in {args.out}')


if __name__ == '__main__':
    main()
