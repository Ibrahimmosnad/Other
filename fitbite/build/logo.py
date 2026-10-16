"""Build the FitBite logo set.

The mark is an energy ball (dates, peanuts, oats, sesame) with a bite taken
out of it and three crunch lines. The wordmark is Nunito Black, converted to
outlines so the SVGs render the same everywhere without the font installed.

Usage: python3 build/logo.py   (run from the fitbite/ folder)
Writes SVGs to logo/; tools/rasterize.mjs turns them into PNGs.
"""
import math
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "logo"

INK = "#0E3B2E"      # deep green
ORANGE = "#FF7A1A"   # energy orange
LEAF = "#3DBE6E"     # fresh leaf green
FLECK = "#E5620B"    # oat and peanut flecks
SEED = "#FFE3BF"     # sesame cream
WHITE = "#FFFFFF"

BOLD = TTFont(ROOT / "fonts" / "Nunito-900.ttf")
SEMI = TTFont(ROOT / "fonts" / "Nunito-800.ttf")


def text_path(font, text, x, baseline, size, tracking=0.0):
    """Return (svg path data, advance width) for text set at size px."""
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    pen = SVGPathPen(glyphs)
    cursor = x
    for ch in text:
        name = cmap[ord(ch)]
        tp = TransformPen(pen, (scale, 0, 0, -scale, cursor, baseline))
        glyphs[name].draw(tp)
        cursor += font["hmtx"][name][0] * scale + tracking * size
    return pen.getCommands(), cursor - x - tracking * size


def mark(prefix, crunch=LEAF):
    """The energy-ball mark drawn in a 240 x 240 box. prefix keeps ids unique."""
    cx, cy, r = 108, 136, 96
    # Three overlapping circles on the upper-right edge make the bite.
    bites = []
    for deg, br in ((-18, 25), (-42, 27), (-66, 24)):
        a = math.radians(deg)
        bx = cx + (r + 4) * math.cos(a)
        by = cy + (r + 4) * math.sin(a)
        bites.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="{br}" fill="#000"/>')
    # Crunch lines radiate out of the bite.
    lines = []
    for deg in (-16, -42, -68):
        a = math.radians(deg)
        x1, y1 = cx + (r + 16) * math.cos(a), cy + (r + 16) * math.sin(a)
        x2, y2 = cx + (r + 34) * math.cos(a), cy + (r + 34) * math.sin(a)
        lines.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{crunch}" stroke-width="11" stroke-linecap="round"/>'
        )
    flecks = []
    for fx, fy, fr in ((84, 128, 6), (130, 120, 5), (128, 182, 6),
                       (66, 180, 5), (162, 160, 5), (100, 220, 4), (44, 132, 4)):
        flecks.append(f'<circle cx="{fx}" cy="{fy}" r="{fr}" fill="{FLECK}"/>')
    seeds = []
    for sx, sy, rot in ((70, 102, -30), (112, 92, 20), (52, 158, 15),
                        (102, 152, -45), (150, 132, 70), (88, 196, -10),
                        (150, 198, 40)):
        seeds.append(
            f'<ellipse cx="{sx}" cy="{sy}" rx="8.5" ry="4.8" '
            f'transform="rotate({rot} {sx} {sy})" fill="{SEED}"/>'
        )
    return f"""
  <defs>
    <mask id="{prefix}-bite" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
      <rect width="240" height="240" fill="#fff"/>
      {''.join(bites)}
    </mask>
  </defs>
  <g mask="url(#{prefix}-bite)">
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{ORANGE}"/>
    {''.join(flecks)}
    {''.join(seeds)}
  </g>
  {''.join(lines)}"""


def svg(width, height, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" aria-label="{title}">\n'
        f"  <title>{title}</title>{body}\n</svg>\n"
    )


def lockup(name, fit_color, tag_color, with_tagline=True):
    """Icon on the left, FitBite wordmark and tagline on the right."""
    size = 150
    fit_d, fit_w = text_path(BOLD, "Fit", 0, 0, size, tracking=-0.01)
    bite_d, bite_w = text_path(BOLD, "Bite", 0, 0, size, tracking=-0.01)
    word_x = 268
    baseline = 170 if with_tagline else 186
    gap = 4
    body = f'\n  <g transform="translate(0 20)">{mark(name)}</g>'
    body += (
        f'\n  <path transform="translate({word_x} {baseline})" d="{fit_d}" fill="{fit_color}"/>'
        f'\n  <path transform="translate({word_x + fit_w + gap:.1f} {baseline})" d="{bite_d}" fill="{ORANGE}"/>'
    )
    total_w = word_x + fit_w + gap + bite_w
    if with_tagline:
        tag_d, tag_w = text_path(SEMI, "HEALTHY SNACK", 0, 0, 34, tracking=0.22)
        body += f'\n  <path transform="translate({word_x + 6} {baseline + 62})" d="{tag_d}" fill="{tag_color}"/>'
        total_w = max(total_w, word_x + 6 + tag_w)
    width = math.ceil(total_w + 16)
    return svg(width, 280, body, "FitBite healthy snack logo")


def stacked(name, fit_color, tag_color):
    """Icon above the wordmark, centred; for square spaces."""
    size = 130
    fit_d, fit_w = text_path(BOLD, "Fit", 0, 0, size, tracking=-0.01)
    bite_d, bite_w = text_path(BOLD, "Bite", 0, 0, size, tracking=-0.01)
    tag_d, tag_w = text_path(SEMI, "HEALTHY SNACK", 0, 0, 30, tracking=0.22)
    word_w = fit_w + 4 + bite_w
    width = math.ceil(max(word_w, tag_w, 240) + 80)
    x0 = (width - word_w) / 2
    body = f'\n  <g transform="translate({(width - 240) / 2:.1f} 10)">{mark(name)}</g>'
    body += (
        f'\n  <path transform="translate({x0:.1f} 360)" d="{fit_d}" fill="{fit_color}"/>'
        f'\n  <path transform="translate({x0 + fit_w + 4:.1f} 360)" d="{bite_d}" fill="{ORANGE}"/>'
        f'\n  <path transform="translate({(width - tag_w) / 2:.1f} 416)" d="{tag_d}" fill="{tag_color}"/>'
    )
    return svg(width, 440, body, "FitBite healthy snack logo")


def main():
    OUT.mkdir(exist_ok=True)
    files = {
        "fitbite-logo.svg": lockup("full", INK, INK),
        "fitbite-logo-white.svg": lockup("rev", WHITE, WHITE),
        "fitbite-logo-stacked.svg": stacked("stk", INK, INK),
        "fitbite-logo-stacked-white.svg": stacked("stkrev", WHITE, WHITE),
        "fitbite-icon.svg": svg(240, 240, mark("icon"), "FitBite icon"),
    }
    for fname, content in files.items():
        (OUT / fname).write_text(content)
        print("wrote", OUT / fname)


if __name__ == "__main__":
    main()
