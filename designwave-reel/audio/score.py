"""Original instrumental score for the reel, synthesised from scratch.

Quietly optimistic ambient piece in D major at 100 BPM: a warm pad, sparse
felt piano, a soft plucked pulse from 0:03 that fills out from 0:13, and a
resolve on the end card at 0:27. Writes build/music.wav (48 kHz stereo).
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILD = os.path.join(HERE, "build")
SR = 48000
LENGTH = 30.0
N = int(SR * LENGTH)
RNG = np.random.default_rng(7)

TL = json.load(open(os.path.join(ROOT, "comp", "timeline.json")))
BPM = TL["music"]["bpm"]
BEAT = 60.0 / BPM

# voicings (MIDI): pad notes and a bass note per chord
CHORDS = {
    "Dmaj9": ([50, 57, 61, 64, 66], 38),
    "Bm11": ([47, 54, 57, 62, 64], 35),
    "Gmaj9": ([43, 50, 54, 57, 59], 31),
    "D/F#": ([42, 50, 57, 61, 64], 30),
    "Em9": ([40, 47, 50, 54, 55], 28),
    "Asus4": ([45, 50, 52, 57, 62], 33),
}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, r, total):
    """Linear-in-dB-ish envelope: attack a s, hold, release r s, over total s."""
    t = np.arange(n) / SR
    e = np.ones(n)
    e = np.minimum(e, t / max(a, 1e-3))
    e = np.minimum(e, np.clip((total - t) / max(r, 1e-3), 0, 1))
    return np.sin(e * np.pi / 2) ** 2  # smooth S-curves


def lowpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), "low", output="sos")
    return sosfilt(sos, x, axis=-1)


def highpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), "high", output="sos")
    return sosfilt(sos, x, axis=-1)


def bandpass(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x, axis=-1)


def place(buf, x, t):
    i = int(round(t * SR))
    if i >= buf.shape[-1]:
        return
    j = min(buf.shape[-1], i + x.shape[-1])
    buf[..., i:j] += x[..., : j - i]


# ------------------------------------------------------------------ voices

def pad_voice(m, dur, bright=1.0):
    """Additive soft saw, three detuned copies, gentle spectral tilt."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = hz(m)
    out = np.zeros((2, n))
    for k, cents in enumerate((-7.0, 0.0, 6.0)):
        f = f0 * 2 ** (cents / 1200)
        phase = RNG.uniform(0, 2 * np.pi)
        sig = np.zeros(n)
        nmax = int(min(3200 / f, 24))
        for h in range(1, nmax + 1):
            amp = (1.0 / h) * np.exp(-h / (3.2 * bright))
            sig += amp * np.sin(2 * np.pi * f * h * t + phase * h)
        pan = (-0.55, 0.0, 0.55)[k]
        out[0] += sig * np.sqrt(0.5 * (1 - pan))
        out[1] += sig * np.sqrt(0.5 * (1 + pan))
    # slow breathing
    lfo = 1.0 + 0.12 * np.sin(2 * np.pi * 0.17 * t + RNG.uniform(0, 6.28))
    return out * lfo / 3.0


def sub_voice(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m + 12)
    sig = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)
    return np.vstack([sig, sig]) * 0.5


def felt_piano(m, vel=0.5, dur=4.5):
    """Felt piano: inharmonic partials, two detuned strings, soft hammer."""
    f = hz(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    B = 0.00035
    tau1 = 2.6 * (261.6 / f) ** 0.35
    sig = np.zeros(n)
    for h in range(1, 14):
        fh = h * f * np.sqrt(1 + B * h * h)
        if fh > 9000:
            break
        amp = (1.0 / h ** 1.35) * np.exp(-(h - 1) * (0.55 - 0.25 * vel))
        tau = tau1 / (1 + 0.42 * (h - 1))
        decay = 0.72 * np.exp(-t / tau) + 0.28 * np.exp(-t / (tau * 3.2))
        for detune in (-0.6, 0.7):
            sig += 0.5 * amp * decay * np.sin(2 * np.pi * fh * 2 ** (detune / 1200) * t
                                               + RNG.uniform(0, 6.28))
    attack = np.clip(t / 0.004, 0, 1)
    sig *= attack
    thump = lowpass(RNG.normal(0, 1, int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / (0.006 * SR)), 900)
    sig[: len(thump)] += 0.25 * thump
    sig = lowpass(sig, 1800 + 1600 * vel)
    tail = np.clip((dur - t) / 0.4, 0, 1)
    return sig * tail * vel


def pluck(m, vel=0.5, dur=0.9):
    """Soft muted pluck for the pulse."""
    f = hz(m)
    n = int(dur * SR)
    t = np.arange(n) / SR
    decay = np.exp(-t / 0.22)
    sig = (np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.08)
           + 0.08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.05))
    sig *= decay * np.clip(t / 0.005, 0, 1)
    return lowpass(sig, 2400) * vel


# --------------------------------------------------------------- reverb

def reverb_ir(rt60=3.0, length=3.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    bands = [(80, 500, 1.0), (500, 2000, 0.8), (2000, 6000, 0.55), (6000, 14000, 0.35)]
    for ch in range(2):
        noise = RNG.normal(0, 1, n)
        for lo, hi, k in bands:
            decay = np.exp(-6.91 * t / (rt60 * k))
            ir[ch] += bandpass(noise, lo, hi) * decay
    pre = int(0.018 * SR)
    ir = np.concatenate([np.zeros((2, pre)), ir], axis=1)[:, :n]
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


def apply_reverb(dry, ir, wet):
    out = np.zeros_like(dry)
    for ch in range(2):
        out[ch] = fftconvolve(dry[ch], ir[ch])[: dry.shape[1]]
    return out * wet


# ----------------------------------------------------------------- score

def main():
    os.makedirs(BUILD, exist_ok=True)
    pad = np.zeros((2, N))
    sub = np.zeros((2, N))
    keys = np.zeros((2, N))
    pulse = np.zeros((2, N))

    chords = TL["music"]["chords"]
    end_beat = LENGTH / BEAT
    for i, (beat, name) in enumerate(chords):
        start = beat * BEAT
        stop = (chords[i + 1][0] if i + 1 < len(chords) else end_beat) * BEAT
        notes, bass = CHORDS[name]
        dur = stop - start + 1.4
        first, last = i == 0, i == len(chords) - 1
        bright = 0.8 + 0.5 * min(1.0, beat / 40)
        for m in notes:
            v = pad_voice(m, dur, bright)
            e = env_adsr(v.shape[1], 2.4 if first else 1.1, 1.4 if not last else 2.2, dur)
            place(pad, v * e, max(0.0, start - (0 if first else 0.35)))
        if beat >= 22:
            v = sub_voice(bass, dur)
            place(sub, v * env_adsr(v.shape[1], 0.9, 1.3, dur), start - 0.3)

    # pulse: eighth notes over chord tones from 0:03, fuller from 0:13
    pattern = [0, 2, 4, 3, 1, 3, 2, 4]
    beats8 = np.arange(int(5 * 2), int(44 * 2)) / 2.0
    for b in beats8:
        cur = [c for c in chords if c[0] <= b][-1][1]
        tones = sorted(CHORDS[cur][0])
        k = int(b * 2) % len(pattern)
        m = tones[pattern[k]] + 12
        fade_in = min(1.0, (b - 5) / 3.0)
        fade_out = min(1.0, (44 - b) / 2.0)
        accent = 1.0 if (b * 2) % 4 == 0 else 0.72
        vel = 0.16 * fade_in * fade_out * accent * RNG.uniform(0.88, 1.08)
        if b >= 22:
            vel *= 1.25
        x = pluck(m, vel)
        pan = 0.25 * np.sin(b * 1.7)
        st = np.vstack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])
        place(pulse, st, b * BEAT + RNG.normal(0, 0.004))
        if b >= 22 and (b * 2) % 2 == 1:
            y = pluck(m + 12, vel * 0.45, 0.6)
            place(pulse, np.vstack([y * 0.6, y * 0.8]), b * BEAT + 0.006)

    # felt piano, sparse; a rolled D major chord on the end card
    piano_notes = [
        (0.6, 69, 0.42), (8, 66, 0.40), (12, 73, 0.26), (16, 71, 0.42), (19.5, 73, 0.24),
        (22, 69, 0.40), (22.04, 74, 0.30), (28, 71, 0.40), (31, 74, 0.26), (34, 67, 0.40),
        (37, 71, 0.26), (40, 69, 0.42),
        (45.0, 62, 0.34), (45.06, 66, 0.36), (45.12, 69, 0.38), (45.2, 74, 0.44),
    ]
    for beat, m, vel in piano_notes:
        dur = 6.0 if beat >= 45 else 4.5
        x = felt_piano(m, vel, dur)
        pan = 0.18 * ((m - 66) / 8)
        place(keys, np.vstack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))]),
              beat * BEAT)

    pad = lowpass(highpass(pad, 70), 2600)
    mix_dry = 0.20 * pad + 0.11 * sub + 0.55 * keys + 0.62 * pulse
    ir = reverb_ir()
    wet = (apply_reverb(0.20 * pad, ir, 0.45) + apply_reverb(0.55 * keys, ir, 0.55)
           + apply_reverb(0.62 * pulse, ir, 0.5))
    music = mix_dry + wet

    # arrangement dynamics: a touch fuller in the development, settle under
    # the last line, swell into the end card, clean fade to silence
    t = np.arange(N) / SR
    shape = np.interp(t, [0, 13.0, 16.0, 23.4, 24.6, 26.6, 27.4, 28.6, 29.95, 30.0],
                      [0.85, 0.9, 1.08, 1.12, 0.95, 0.95, 1.12, 1.0, 0.0, 0.0])
    music *= shape
    music = highpass(music, 35)
    music /= np.max(np.abs(music)) / 0.7
    sf.write(os.path.join(BUILD, "music.wav"), music.T.astype(np.float32), SR, subtype="PCM_24")
    print("wrote music.wav", music.shape)


if __name__ == "__main__":
    main()
