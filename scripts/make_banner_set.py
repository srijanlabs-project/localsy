#!/usr/bin/env python3
"""Render one advertiser's creative in every banner slot Localisy serves.

Sizes come from BANNER_SLOTS in src/services/admin/bannerStudio.ts, which comes
from the render CSS — so a file produced here drops into the Banners screen
without being cropped into nonsense.

The look follows the salon-poster convention the brief asked for: a blush ground,
an inset card, line-art botanicals, a high-contrast Garamond display face,
letter-spaced small caps, and a stacked offer.

The offer line is a PARAMETER, deliberately. A discount printed on a real
business's banner is a claim a customer can act on, so it is not something to
invent: pass --offer with whatever the advertiser has agreed.
"""
import argparse
import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# EB Garamond: old-style figures, real small caps, enough stroke contrast to read
# as a display serif at poster sizes. Installed via fonts-ebgaramond.
DISPLAY = '/usr/share/fonts/truetype/ebgaramond/EBGaramond12-Regular.ttf'
DISPLAY_BOLD = '/usr/share/fonts/truetype/ebgaramond/EBGaramond12-Bold.ttf'
ITALIC = '/usr/share/fonts/truetype/ebgaramond/EBGaramond12-Italic.ttf'
SMALLCAPS = '/usr/share/fonts/opentype/ebgaramond/EBGaramondSC12-Regular.otf'
FALLBACK = '/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf'

BG_LIGHT = (253, 238, 230)
BG_DEEP = (243, 211, 194)
CARD = (252, 230, 218)
INK = (93, 58, 44)
INK_SOFT = (139, 90, 68)
LINE = (238, 199, 178)
CTA_BG = (138, 90, 69)
CTA_INK = (255, 247, 240)

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
    try:
        return ImageFont.truetype(path, max(6, int(size)))
    except Exception:
        return ImageFont.truetype(FALLBACK, max(6, int(size)))


def tracked_width(draw, text, f, tracking):
    """PIL has no letter-spacing, and the reference leans on it heavily."""
    return sum(draw.textlength(c, font=f) for c in text) + tracking * max(0, len(text) - 1)


def draw_tracked(draw, xy, text, f, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + tracking


def fit_tracked(draw, text, path, start, max_w, tracking_ratio=0.06, floor=7):
    size = start
    while size > floor:
        f = font(path, size)
        if tracked_width(draw, text, f, size * tracking_ratio) <= max_w:
            return f
        size -= 1
    return font(path, floor)


def diagonal_wash(size, light, deep):
    """Warmer toward the bottom-right, with a glow at the top-left, as in the
    reference — a flat fill reads as a web page, not a poster."""
    w, h = size
    small = Image.new('RGB', (64, 64))
    px = small.load()
    for yy in range(64):
        for xx in range(64):
            t = min(1.0, (xx / 63 * 0.55 + yy / 63 * 0.65))
            px[xx, yy] = (
                int(light[0] + (deep[0] - light[0]) * t),
                int(light[1] + (deep[1] - light[1]) * t),
                int(light[2] + (deep[2] - light[2]) * t),
            )
    img = small.resize((w, h), Image.BICUBIC)
    glow = Image.new('L', (64, 64), 0)
    ImageDraw.Draw(glow).ellipse([-24, -30, 34, 26], fill=110)
    glow = glow.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(w * 0.02))
    img.paste(Image.new('RGB', (w, h), (255, 250, 246)), (0, 0), glow)
    return img.convert('RGBA')


def leaf(draw, cx, cy, length, angle, colour, width):
    """One outlined almond leaf. Outline only: the reference's botanicals are
    line art, and filled shapes turn the corner ornament into a blob."""
    half = length / 2
    pts = []
    for side in (1, -1):
        for i in range(21):
            t = i / 20
            u = (t * 2 - 1) * half
            v = side * (length * 0.22) * math.cos(t * math.pi - math.pi / 2) ** 0.9
            pts.append((u, v))
    ca, sa = math.cos(angle), math.sin(angle)
    pts = [(cx + u * ca - v * sa, cy + u * sa + v * ca) for u, v in pts]
    draw.line(pts + [pts[0]], fill=colour, width=width, joint='curve')


def sprig(base, x0, y0, x1, y1, bend, scale, colour, width, leaves=7):
    """A stem with paired leaves, drawn on its own layer so strokes stay even."""
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    mx, my = (x0 + x1) / 2 + bend[0], (y0 + y1) / 2 + bend[1]
    stem = []
    for i in range(41):
        t = i / 40
        stem.append((
            (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t ** 2 * x1,
            (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t ** 2 * y1,
        ))
    d.line(stem, fill=colour, width=width, joint='curve')
    for i in range(leaves):
        t = 0.12 + (i / max(1, leaves - 1)) * 0.8
        idx = int(t * 40)
        px, py = stem[idx]
        nx, ny = stem[min(40, idx + 1)]
        ang = math.atan2(ny - py, nx - px)
        size = scale * (1.05 - 0.45 * t)
        for side in (1, -1):
            lang = ang + side * 0.72
            leaf(d, px + math.cos(lang) * size * 0.55, py + math.sin(lang) * size * 0.55,
                 size, lang, colour, width)
    base.alpha_composite(layer)


def render(name, w, h, scale, args, out_dir):
    W, H = w * scale, h * scale
    s = scale
    tiny = h < 100
    compact = 100 <= h < 150
    narrow = (w / h) < 1.05

    img = diagonal_wash((W, H), BG_LIGHT, BG_DEEP)
    stroke = max(1, int(1.6 * s))

    # Botanicals: a large branch reaching in from the right (where the reference
    # has its portrait) and a cropped sprig at the lower left.
    if not tiny:
        sprig(img, W * 1.02, H * 0.02, W * (0.62 if not narrow else 0.30), H * 0.62,
              (-W * 0.10, H * 0.30), min(W, H) * (0.30 if not narrow else 0.24),
              LINE, stroke, leaves=7)
        sprig(img, W * 0.99, H * 1.04, W * (0.70 if not narrow else 0.42), H * 0.52,
              (W * 0.06, H * 0.16), min(W, H) * 0.22, LINE, stroke, leaves=5)
        sprig(img, -W * 0.04, H * 1.06, W * 0.16, H * 0.72,
              (W * 0.02, H * 0.02), min(W, H) * 0.16, LINE, stroke, leaves=4)

    d = ImageDraw.Draw(img, 'RGBA')

    if tiny:
        line = f"{args.brand}   {args.offer}" if args.offer else f"{args.brand}   {args.sub or args.cta}"
        f = fit_tracked(d, line, DISPLAY_BOLD, int(H * 0.46), int(W - 24 * s), 0.05)
        tw = tracked_width(d, line, f, f.size * 0.05)
        draw_tracked(d, ((W - tw) / 2, (H - f.size * 1.34) / 2), line, f, INK, f.size * 0.05)
        img.convert('RGB').save(os.path.join(out_dir, f'{name}{"@2x" if s == 2 else ""}.png'))
        return

    # The inset card, as in the reference: a lighter panel floating on the wash,
    # generous radius, holding all of the type.
    inset = int((14 if compact else 20) * s)
    # A portrait card used to span the full width and hide the botanicals it is
    # supposed to float on.
    card_w = int(W * (0.90 if narrow else 0.60))
    card = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle(
        [inset, inset, min(W - inset, inset + card_w), H - inset],
        radius=int(22 * s), fill=(*CARD, 214))
    img.alpha_composite(card)
    d = ImageDraw.Draw(img, 'RGBA')

    pad = inset + int((10 if compact else 20) * s)
    col_w = min(W - inset, inset + card_w) - pad - int(12 * s)

    # Measured stack, then SHRUNK to fit — not truncated.
    #
    # Dropping trailing rows meant the hero lost its CTA and address, which are
    # the two things a banner exists to carry. Everything is laid out at a scale
    # factor instead, stepped down until the stack fits its card. Rows only start
    # disappearing once the type would be too small to read.
    lead = args.lead
    if args.offer and lead:
        first = args.offer.split()[0].upper()
        # "Up To FLAT 20% OFF" reads as a mistake: the offer already qualifies
        # itself, so the lead-in is suppressed rather than stacked on top.
        if first in {'FLAT', 'UP', 'UPTO', 'GET', 'SAVE'}:
            lead = ''

    def build(k):
        rows = []
        brand_ratio = (0.30 if compact else (0.155 if not narrow else 0.10)) * k
        bf = fit_tracked(d, args.brand, DISPLAY_BOLD, int(H * brand_ratio), col_w, 0.055)
        rows.append(('tracked', args.brand, bf, INK, 0.055, int(bf.size * 0.24)))

        if args.tagline and not compact:
            tf = fit_tracked(d, f'"{args.tagline}"', ITALIC,
                             int(max(bf.size * 0.36, H * 0.055)), col_w, 0.02)
            # Below ~9px the quoted tagline is a grey smudge. An absent line is
            # better than an illegible one, so it is dropped rather than shrunk.
            if tf.size >= 9 * s:
                rows.append(('tracked', f'"{args.tagline}"', tf, INK_SOFT, 0.02, int(tf.size * 0.70)))

        if args.offer:
            if lead and not compact:
                lf = font(DISPLAY, max(9, int(bf.size * 0.30)))
                rows.append(('plain', lead, lf, INK_SOFT, 0, int(lf.size * 0.12)))
            of = fit_tracked(d, args.offer, DISPLAY_BOLD,
                             int(H * (0.30 if compact else 0.19 if not narrow else 0.125) * k), col_w, 0.02)
            rows.append(('tracked', args.offer, of, INK, 0.02, int(of.size * 0.26)))

        if args.sub and not (compact and args.offer):
            sf = fit_tracked(d, args.sub, DISPLAY, int(H * (0.072 if not narrow else 0.056) * k), col_w, 0.03)
            rows.append(('tracked', args.sub, sf, INK_SOFT, 0.03, int(sf.size * 0.70)))

        if args.cta:
            cf = font(SMALLCAPS, max(9, int(H * (0.10 if compact else 0.068) * k)))
            rows.append(('cta', args.cta, cf, CTA_INK, 0.14, int(cf.size * 0.42)))

        if args.footer and not compact:
            ff = font(DISPLAY, max(9, int(H * 0.050 * k)))
            rows.append(('plain', args.footer, ff, INK_SOFT, 0, 0))
        return rows

    def row_h(r):
        kind, _, f, _, _, gap = r
        return int(f.size * (2.05 if kind == 'cta' else 1.30)) + gap

    available = H - inset * 2 - int(14 * s)
    k = 1.0
    rows = build(k)
    while sum(row_h(r) for r in rows) > available and k > 0.55:
        k -= 0.04
        rows = build(k)
    while len(rows) > 2 and sum(row_h(r) for r in rows) > available:
        rows.pop()

    total = sum(row_h(r) for r in rows)
    y = inset + max(int(8 * s), (H - inset * 2 - total) // 2)

    for kind, text, f, fill, track, gap in rows:
        if kind == 'cta':
            tw = tracked_width(d, text, f, f.size * track)
            bw, bh = int(tw + 34 * s), int(f.size * 1.95)
            d.rounded_rectangle([pad, y, pad + bw, y + bh], radius=int(5 * s), fill=CTA_BG)
            draw_tracked(d, (pad + int(17 * s), y + int(f.size * 0.36)), text, f, CTA_INK, f.size * track)
            y += int(f.size * 2.05) + gap
        elif kind == 'tracked':
            draw_tracked(d, (pad, y), text, f, fill, f.size * track)
            y += int(f.size * 1.30) + gap
        else:
            d.text((pad, y), text, font=f, fill=fill)
            y += int(f.size * 1.30) + gap

    img.convert('RGB').save(os.path.join(out_dir, f'{name}{"@2x" if s == 2 else ""}.png'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--brand', required=True)
    ap.add_argument('--tagline', default='')
    ap.add_argument('--lead', default='Up To', help='small line above the offer')
    ap.add_argument('--offer', default='')
    ap.add_argument('--sub', default='')
    ap.add_argument('--cta', default='Book Now')
    ap.add_argument('--footer', default='')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    for nm, w, h in SLOTS:
        for sc in (1, 2):
            render(nm, w, h, sc, args, args.out)
    print(f'{len(SLOTS) * 2} files in {args.out}')


if __name__ == '__main__':
    main()
