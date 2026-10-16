"""Place the voice-over phrases on the 30 s timeline.

Each phrase starts on its cue: the moment the picture cuts to the scene it
belongs to, so the words land on the cuts. Phrases without a cue follow the
one before after a short breath. Writes:
  build/vo.wav             48 kHz mono narration, 30.0 s
  build/vo_timeline.json   absolute start/end of every phrase
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
BREATH = 0.14  # between phrases that run on

# Start time of each phrase (s); None runs on from the phrase before.
CUES = {
    "l1": 0.25,     # hook
    "l2a": 2.79,    # pull back to the product tag
    "l2b": 5.07,    # the tag lands on the table
    "l2c": 6.83,    # push into the phone
    "l3": 10.15,    # the pieces arrive
    "l4a": 13.40,   # identity board
    "l4b": None,
    "l4c": 16.90,   # with the "Brand identity" label
    "l4d": 20.61,   # laptop and phone
    "l4e": 22.00,   # social posts
    "l5": 23.94,    # pull back to the case-study board
}


def fade(x, ms=6):
    n = min(len(x) // 2, int(SR * ms / 1000))
    if n:
        ramp = np.linspace(0.0, 1.0, n, dtype=np.float32)
        x[:n] *= ramp
        x[-n:] *= ramp[::-1]
    return x


def main():
    meta = json.load(open(os.path.join(BUILD, "vo", "vo_lines.json")))
    track = np.zeros(int(SR * LENGTH), dtype=np.float32)
    phrases = {}
    end = 0.0
    for p in meta["phrases"]:
        audio, sr = sf.read(os.path.join(BUILD, "vo", f"{p['key']}.wav"), dtype="float32")
        audio = fade(resample_poly(audio, SR, sr).astype(np.float32))
        cue = CUES[p["key"]]
        start = end + BREATH if cue is None else cue
        assert start >= end + 0.1, f"{p['key']} starts {start:.2f}s, before the previous phrase ends ({end:.2f}s)"
        i = int(round(start * SR))
        track[i:i + len(audio)] += audio
        end = start + len(audio) / SR
        phrases[p["key"]] = [round(start, 3), round(end, 3)]

    assert end < 26.9, f"narration runs to {end:.2f}s, the end card needs 26.9-30 s"
    peak = float(np.abs(track).max())
    track *= 0.89 / peak  # about -1 dBFS before the mix sets loudness
    sf.write(os.path.join(BUILD, "vo.wav"), track, SR, subtype="PCM_24")
    out = {"voice": meta["voice"], "speed": meta["speed"], "phrases": phrases,
           "narration_end": round(end, 3)}
    json.dump(out, open(os.path.join(BUILD, "vo_timeline.json"), "w"), indent=2)
    keys = list(phrases)
    for k, nxt in zip(keys, keys[1:] + [None]):
        a, b = phrases[k]
        gap = f"  gap {phrases[nxt][0] - b:4.2f}" if nxt else ""
        print(f"{k:4s} {a:6.2f} → {b:6.2f}{gap}")
    print("narration ends", round(end, 2))


if __name__ == "__main__":
    main()
