"""Voice-over for the Designwave reel, synthesised locally with Kokoro-82M.

A close, conversational male read rather than a measured narrator: voice
am_fenrir at 1.1x. Every phrase that a cut lands on is rendered as its own
utterance (this voice barely pauses at commas, so a whole sentence cannot be
cut cleanly), trimmed to the first and last sound, and placed on the timeline
by vo_assemble.py. Writes one 24 kHz WAV per phrase plus vo_lines.json.

Model files (not in the repo, see README):
  /root/models/kokoro/model.onnx   Kokoro-82M v1.0 fp32 ONNX
  /root/models/kokoro/voices.npz   voice styles (voices-v1.0.bin)
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

# The approved script, word for word, split where the picture cuts.
PHRASES = [
    ("l1", "A business is more than its logo."),
    ("l2a", "It's how its products are presented,"),
    ("l2b", "how it communicates,"),
    ("l2c", "and the experience people have when they interact with it."),
    ("l3", "That's why good design shouldn't happen in isolation."),
    ("l4a", "At Designwave,"),
    ("l4b", "we start by understanding the business,"),
    ("l4c", "then build a creative direction that connects its identity,"),
    ("l4d", "digital presence,"),
    ("l4e", "and visual communication."),
    ("l5", "Because every detail contributes to the bigger picture."),
]


def trim(audio, sr, floor_db=-45.0, pad=0.02):
    """Cut leading and trailing silence, keeping a few ms either side."""
    hop = int(sr * 0.005)
    frames = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    loud = np.flatnonzero(20 * np.log10(rms / rms.max()) > floor_db)
    a = max(0, loud[0] * hop - int(pad * sr))
    b = min(len(audio), (loud[-1] + 1) * hop + int(pad * sr))
    return audio[a:b]


def main():
    voice = sys.argv[1] if len(sys.argv) > 1 else "am_fenrir"
    speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.1
    os.makedirs(OUT, exist_ok=True)
    kokoro = Kokoro(MODEL, VOICES)
    lang = "en-gb" if voice.startswith("b") else "en-us"
    meta = {"voice": voice, "speed": speed, "phrases": []}
    for key, text in PHRASES:
        audio, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang)
        audio = trim(np.asarray(audio, dtype=np.float32), sr)
        sf.write(os.path.join(OUT, f"{key}.wav"), audio, sr)
        meta["phrases"].append({"key": key, "text": text, "seconds": round(len(audio) / sr, 3), "sr": sr})
        print(f"{key:4s} {len(audio) / sr:5.2f}s  {text}")
    with open(os.path.join(OUT, "vo_lines.json"), "w") as fp:
        json.dump(meta, fp, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
