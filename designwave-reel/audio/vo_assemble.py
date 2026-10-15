"""Place the voice-over lines on the 30 s timeline.

Cuts lines two and four at their comma pauses, sets every pause by hand and
writes:
  build/vo.wav             48 kHz mono narration, 30.0 s
  build/vo_timeline.json   absolute start/end of every phrase, read by the
                           composition so each cut lands on the narration
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SR = 48000
LENGTH = 30.0
FIRST_WORD = 0.25        # the narration starts almost at once
SENTENCE_PAUSE = 0.45    # between sentences

# Phrases per line: (key, index of the gap that ends it or None, pause after).
# Pause after = None keeps the natural pause inside the line.
PLAN = {
    "l1": [("l1", None, None)],
    "l2": [("l2a", 0, 0.62), ("l2b", 1, 0.60), ("l2c", None, None)],
    "l3": [("l3", None, None)],
    "l4": [("l4a", 0, None), ("l4b", 1, None), ("l4c", 2, 0.48),
           ("l4d", 3, 0.45), ("l4e", None, None)],
    "l5": [("l5", None, None)],
}


def fade(x, ms=6):
    n = min(len(x) // 2, int(SR * ms / 1000))
    if n:
        ramp = np.linspace(0.0, 1.0, n, dtype=np.float32)
        x[:n] *= ramp
        x[-n:] *= ramp[::-1]
    return x


def merged_gaps(gaps):
    """Join gaps separated by a blip shorter than 20 ms."""
    out = []
    for a, b in gaps:
        if out and a - out[-1][1] < 0.02:
            out[-1][1] = b
        else:
            out.append([a, b])
    return out


def main():
    meta = json.load(open(os.path.join(BUILD, "vo", "vo_lines.json")))
    track = np.zeros(int(SR * LENGTH), dtype=np.float32)
    phrases = {}
    t = FIRST_WORD
    for line in meta["lines"]:
        audio, sr = sf.read(os.path.join(BUILD, "vo", f"{line['key']}.wav"), dtype="float32")
        audio = resample_poly(audio, SR, sr).astype(np.float32)
        gaps = merged_gaps(line["gaps"])
        cursor = 0.0
        for key, gap_index, pause in PLAN[line["key"]]:
            if gap_index is None:
                seg_end = len(audio) / SR
                natural = 0.0
            else:
                g0, g1 = gaps[gap_index]
                seg_end, natural = g0, g1 - g0
            seg = fade(audio[int(cursor * SR):int(seg_end * SR)].copy())
            start = int(round(t * SR))
            track[start:start + len(seg)] += seg
            phrases[key] = [round(t, 3), round(t + len(seg) / SR, 3)]
            t += len(seg) / SR
            if gap_index is not None:
                t += natural if pause is None else pause
                cursor = gaps[gap_index][1]
        t += SENTENCE_PAUSE

    end = max(v[1] for v in phrases.values())
    assert end < 27.0, f"narration runs to {end:.2f}s, the end card needs 27-30 s"
    peak = float(np.abs(track).max())
    track *= 0.89 / peak  # about -1 dBFS before the mix sets loudness
    sf.write(os.path.join(BUILD, "vo.wav"), track, SR, subtype="PCM_24")
    out = {"voice": meta["voice"], "speed": meta["speed"], "phrases": phrases,
           "narration_end": round(end, 3)}
    json.dump(out, open(os.path.join(BUILD, "vo_timeline.json"), "w"), indent=2)
    for k, (a, b) in phrases.items():
        print(f"{k:4s} {a:6.2f} → {b:6.2f}")
    print("narration ends", round(end, 2))


if __name__ == "__main__":
    main()
