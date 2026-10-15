# Designwave — brand introduction reel

A 30-second Instagram Reel (1080 × 1920, 30 fps, H.264 + AAC) that introduces
Designwave through one idea: *a business is more than its logo*. A fictional
furniture workshop, **FORM & OAK**, is the demonstration project. Its logo
opens the film and grows into a product card, a table of printed pieces, a
website, an identity system and a closing case-study board. Then the
Designwave logo closes on "Design with intention."

**Master file:** [`out/designwave-reel.mp4`](out/designwave-reel.mp4)

Nothing in the film is stock or AI-generated imagery. The furniture, flat-lay
and devices are modelled and rendered in Blender (Cycles). Every FORM & OAK
touchpoint is a real HTML/CSS layout. The motion is a deterministic HTML
composition captured frame by frame. Narration and music are synthesised
locally.

## Story and timing

Cuts follow the recorded narration (`audio/build/vo_timeline.json`). Scene
boundaries live in `comp/timeline.json` and are read by the film, the score
and the sound effects.

| Time | Scene | On screen | Narration |
|---|---|---|---|
| 0.0–2.6 | Hook | FORM & OAK mark alone, then *A business is more than its logo.* | "A business is more than its logo." |
| 2.6–4.8 | Product | Camera pulls back: the logo was printed on a product tag beside the Arc Chair. Label *Product experience* | "It's how its products are presented," |
| 4.8–6.55 | Communication | The tag lands on a table of FORM & OAK pieces: poster, care-kit sleeve, product tag, the brand's feed. *Every interaction communicates.* | "how it communicates," |
| 6.55–9.95 | Digital | Push into the phone; the post grows into the website hero; the button is tapped; scroll to the collection. Label *Digital experience* | "and the experience people have when they interact with it." |
| 9.95–13.25 | Isolation | Identity, website and product+packaging arrive as separate pieces, snap to one grid, and blue lines join their three logos. *Good design doesn't happen in isolation.* | "That's why good design shouldn't happen in isolation." |
| 13.25–20.4 | Identity | The mark is constructed on a grid, then the identity sheet builds: wordmark, Jost, palette, ring device. Label *Brand identity* | "At Designwave, we start by understanding the business, then build a creative direction that connects its identity," |
| 20.4–21.8 | Digital | Laptop and phone showing the site. Label *Digital presence* | "digital presence," |
| 21.8–23.75 | Communication | Social posts over the printed pieces. Label *Visual communication* | "and visual communication." |
| 23.75–26.9 | Bigger picture | Pull back from the chair to the full case-study board. *Every detail contributes to the bigger picture.* | "Because every detail contributes to the bigger picture." |
| 26.9–30.0 | Reveal | Designwave logo, *Design with intention.* | Music resolves |

## Brand sources

- **Designwave**: the logo (blue `#3B4BFF` circle with a white wave, plus the
  "Designwave" wordmark set in Inter Tight SemiBold), the cream/ink palette, the
  Instrument Serif italic accent word and the two easing curves all come from
  the studio site, as recorded in the earlier *Designwave Promo Film* and
  *Design Wave v2 Storyboard* plans. The logo SVG is in `comp/brand/brand.js`
  (`dwMark`). **If you have the master logo file, replace `dwMark()` and
  re-render. The rest of the film does not depend on it.**
- **Tagline**: "Design with intention." is the line suggested in the brief, not
  an established slogan. Change it in `comp/film.js` (`tagline`).
- **FORM & OAK** (fictional): a square holding oak growth rings (form + oak)
  with deliberately uneven ring spacing, the wordmark in spaced Jost capitals,
  and the palette Paper `#F5F2EC`, Stone `#D8D0C4`, Oak `#B48A5E`,
  Charcoal `#252525` and Ash `#858585`. Every touchpoint is generated from
  `comp/brand/brand.js`, so the brand cannot drift between shots.

## Rebuild

Requirements: Node 22, Playwright with Chromium, ffmpeg with libx264, and a
Python 3.13 venv with `bpy==5.2.2 numpy scipy soundfile pillow onnxruntime
kokoro-onnx pyloudnorm`.

```bash
npm install                          # fonts and kokoro-js voices
# 1. imagery (Blender, CPU; about 1.5 h in total)
tools/render_assets.sh               # product shots -> textures -> flat-lay, phone, desk
/root/venvs/reel/bin/python tools/prep_images.py
# 2. sound
python audio/tts.py af_heart 0.94    # narration, one file per sentence
python audio/vo_assemble.py          # pauses + vo_timeline.json
python audio/score.py                # original score
python audio/mix.py                  # effects, ducking, -14 LUFS / -1.5 dBTP
# 3. picture and master
node tools/render-frames.mjs 3       # 900 PNG frames
tools/encode.sh                      # out/designwave-reel.mp4
tools/qc.sh                          # spec check, loudness, contact sheet
```

Delivered master: 1080 × 1920, 30 fps, 900 frames (30.000 s), H.264 High
yuv420p BT.709, AAC stereo 48 kHz 256 kbps, −13.8 LUFS integrated, −1.6 dBTP.

Review single moments with `node tools/frames.mjs <dir> 1.2 8.2 25.9 [--safe]`.
`--safe` overlays Instagram's interface zones.

### Voice

The narration is the approved script, word for word, synthesised with
**Kokoro-82M** (Apache-2.0), voice `af_heart` at 0.94× speed. Clause pauses are
set by hand in `audio/vo_assemble.py`. The model weights are not in the repo;
`audio/tts.py` documents where they go. To use a human recording instead,
replace `audio/build/vo.wav` (keeping the phrase times in `vo_timeline.json`,
or updating them) and re-run `mix.py` and `encode.sh`.

### Music and sound

`audio/score.py` writes an original piece in D major at 100 BPM. Chord changes
fall on beats that line up with the scene changes, and the final D major chord
lands on the end card. It uses a warm additive pad, sparse felt piano, a soft
plucked pulse from 0:03 that fills out from 0:13, and a convolution reverb.
The effects are four quiet moments: paper as the tag lands, a tap on the
website button, a soft chime as the pieces align, and air rising into the
reveal.

## Licences

Fonts: Inter Tight, Instrument Serif and Jost, all SIL Open Font Licence, via
`@fontsource`. Voice model: Kokoro-82M, Apache-2.0. Score, sound effects, 3D
models and all designs were made for this project.
