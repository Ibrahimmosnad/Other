"""Voice-over for the Designwave reel, synthesised locally with Kokoro-82M.

Each sentence of the approved script is rendered on its own so the pauses
between sentences can be set by hand in mix.py. Writes one 24 kHz WAV per
line plus vo_lines.json with the durations.

Model files (not in the repo, see README):
  /root/models/kokoro/model.onnx   Kokoro-82M v1.0 fp32 ONNX
  /root/models/kokoro/voices.npz   voice styles packed from kokoro-js
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "build", "vo")
MODEL = "/root/models/kokoro/model.onnx"
VOICES = "/root/models/kokoro/voices.npz"

# The approved script, word for word. Sentence two is split at its commas
# only for timing analysis; it is synthesised as one utterance.
LINES = [
    ("l1", "A business is more than its logo."),
    ("l2", "It's how its products are presented, how it communicates, "
           "and the experience people have when they interact with it."),
    ("l3", "That's why good design shouldn't happen in isolation."),
    ("l4", "At Designwave, we start by understanding the business, then build "
           "a creative direction that connects its identity, digital presence, "
           "and visual communication."),
    ("l5", "Because every detail contributes to the bigger picture."),
]


def gaps(audio, sr, min_gap=0.07, floor_db=-42.0):
    """Silent stretches inside a line: where the clause breaks fall."""
    hop = int(sr * 0.005)
    frames = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (rms.max() + 1e-12))
    quiet = db < floor_db
    out, start = [], None
    for i, q in enumerate(np.append(quiet, False)):
        if q and start is None:
            start = i
        elif not q and start is not None:
            a, b = start * hop / sr, i * hop / sr
            if b - a >= min_gap and a > 0.05 and b < len(audio) / sr - 0.05:
                out.append([round(a, 3), round(b, 3)])
            start = None
    return out


def main():
    voice = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
    speed = float(sys.argv[2]) if len(sys.argv) > 2 else 0.94
    os.makedirs(OUT, exist_ok=True)
    kokoro = Kokoro(MODEL, VOICES)
    meta = {"voice": voice, "speed": speed, "lines": []}
    for key, text in LINES:
        phonemes = kokoro.tokenizer.phonemize(text, "en-us")
        audio, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        audio = np.asarray(audio, dtype=np.float32)
        path = os.path.join(OUT, f"{key}.wav")
        sf.write(path, audio, sr)
        meta["lines"].append({"key": key, "text": text, "phonemes": phonemes,
                              "seconds": round(len(audio) / sr, 3), "sr": sr,
                              "gaps": gaps(audio, sr)})
        print(f"{key} {len(audio) / sr:6.2f}s  gaps {meta['lines'][-1]['gaps']}")
    with open(os.path.join(OUT, "vo_lines.json"), "w") as fp:
        json.dump(meta, fp, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
