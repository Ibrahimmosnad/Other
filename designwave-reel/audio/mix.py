"""Sound effects and final mix.

Narration is the lead; the score sits about 16 dB under it and ducks a
further few dB while a line is spoken, then opens up for the end card.
Four quiet effects mark the moments that earn one. Loudness is normalised
afterwards with ffmpeg (tools/finish.sh) to -14 LUFS, -1.5 dBTP.
Writes build/sfx.wav and build/mix_pre.wav (48 kHz stereo).
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILD = os.path.join(HERE, "build")
SR = 48000
N = int(SR * 30.0)
RNG = np.random.default_rng(11)
TL = json.load(open(os.path.join(ROOT, "comp", "timeline.json")))


def filt(x, kind, f, order=2):
    wn = np.array(f) / (SR / 2)
    return sosfilt(butter(order, wn, kind, output="sos"), x, axis=-1)


def db(x):
    return 10 ** (x / 20)


def place(buf, x, t):
    i = int(round(t * SR))
    j = min(buf.shape[-1], i + x.shape[-1])
    buf[..., i:j] += x[..., : j - i]


def small_room(x, length=1.2, rt=0.7):
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.vstack([RNG.normal(0, 1, n), RNG.normal(0, 1, n)]) * np.exp(-6.9 * t / rt)
    ir = filt(ir, "low", 5000) / 40
    return np.vstack([fftconvolve(x, ir[c])[: len(x) + n] for c in range(2)])


def paper():
    """A sheet slid across a table: crinkly band-limited noise, 0.45 s."""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    grains = np.abs(RNG.normal(0, 1, n)) ** 3
    grains = filt(grains, "low", 60)
    noise = filt(RNG.normal(0, 1, n), "band", [1400, 7000]) * (0.4 + grains / grains.max())
    env = np.sin(np.pi * np.clip(t / 0.45, 0, 1)) ** 1.5
    x = noise * env
    return small_room(x / np.abs(x).max() * db(-22))


def tap():
    """Soft interface tap: a short pitched 'tock' with a tiny click."""
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 1150 * np.exp(-t / 0.05) + 760
    phase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(phase) * np.exp(-t / 0.018)
    click = filt(RNG.normal(0, 1, n), "high", 3000) * np.exp(-t / 0.002) * 0.25
    x = (x + click) * db(-24)
    return small_room(x)


def chime():
    """Quiet tonal accent when the pieces line up: two soft FM bell partials."""
    out = np.zeros(int(2.6 * SR))
    t = np.arange(len(out)) / SR
    for f, delay, amp in ((1174.66, 0.0, 1.0), (1760.0, 0.07, 0.55)):
        tt = np.clip(t - delay, 0, None)
        index = 1.6 * np.exp(-tt / 0.25)
        x = np.sin(2 * np.pi * f * tt + index * np.sin(2 * np.pi * f * 3.5 * tt))
        x *= np.exp(-tt / 0.75) * (t >= delay) * np.clip(tt / 0.003, 0, 1)
        out += amp * x
    out = filt(out, "low", 6000) * db(-27)
    return small_room(out, 2.2, 1.6)


def swell():
    """Restrained air rising into the end card, no impact."""
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    noise = RNG.normal(0, 1, n)
    out = np.zeros(n)
    # sweep a band upward in short blocks
    block = 2048
    for i in range(0, n, block):
        frac = i / n
        lo = 300 + 2200 * frac
        seg = filt(noise[max(0, i - 4096):i + block], "band", [lo, lo * 2.2])[-min(block, n - i):]
        out[i:i + len(seg)] = seg
    env = (t / 1.1) ** 2 * np.clip((1.1 - t) / 0.18, 0, 1)
    return small_room(out * env * db(-30), 1.6, 1.2)


def compress(x, threshold_db=-30.0, ratio=3.5, attack=0.003, release=0.12, makeup_db=8.0):
    """Feed-forward RMS compressor with a soft knee, for the narration."""
    rms = np.sqrt(np.maximum(filt(x ** 2, "low", 1 / (2 * np.pi * 0.01)), 0) + 1e-12)
    level = 20 * np.log10(rms)
    over = level - threshold_db
    knee = 6.0
    gr = np.where(over <= -knee / 2, 0.0,
                  np.where(over >= knee / 2, over * (1 - 1 / ratio),
                           (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    # smooth the gain reduction: a fast one-pole on the way in, then a slower
    # one so it lets go gently (both run forward, no lookahead)
    a, r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    fast = lfilter([1 - a], [1, -a], gr)
    out = np.maximum(fast, lfilter([1 - r], [1, -r], fast))
    return x * db(makeup_db - out)


def limit(x, ceiling_db=-2.1, lookahead=0.005, release=0.08):
    """Lookahead peak limiter (stereo-linked)."""
    from scipy.ndimage import minimum_filter1d
    ceiling = db(ceiling_db)
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = int(lookahead * SR)
    need = minimum_filter1d(need, 2 * la + 1)          # reach the peak in time
    r = np.exp(-1 / (release * SR))
    # release smoothing towards 1 while never exceeding the required gain
    smooth = 1 - lfilter([1 - r], [1, -r], 1 - need)
    g = np.minimum(need, np.maximum(smooth, need))
    g = minimum_filter1d(g, la)
    return x * g


def main():
    ev = TL["events"]
    sfx = np.zeros((2, N))
    place(sfx, paper(), ev["paper"] - 0.12)
    place(sfx, tap(), ev["tap"])
    place(sfx, chime(), ev["align"])
    place(sfx, swell(), ev["reveal"] - 1.0)
    sf.write(os.path.join(BUILD, "sfx.wav"), sfx.T.astype(np.float32), SR, subtype="PCM_24")

    vo, _ = sf.read(os.path.join(BUILD, "vo.wav"))
    vo = compress(filt(vo, "high", 70))
    vo *= 0.89 / np.abs(vo).max()
    music, _ = sf.read(os.path.join(BUILD, "music.wav"))
    music = music.T

    # duck the score under speech: hold 120 ms, smooth attack/release
    level = maximum_filter1d(np.abs(vo), int(0.12 * SR))
    active = (level > 0.03).astype(float)
    k = int(0.25 * SR)
    win = np.hanning(2 * k)
    win /= win.sum()
    active = np.clip(fftconvolve(active, win, mode="same"), 0, 1)
    t = np.arange(N) / SR
    base = np.interp(t, [0, 26.6, 27.2, 30], [-11.0, -11.0, -6.5, -6.5])
    gain = db(base - 4.5 * active)

    mix = np.vstack([vo, vo]) * db(-1.0) + music * gain + sfx
    sf.write(os.path.join(BUILD, "mix_pre.wav"), (mix * 0.7 / np.abs(mix).max()).T.astype(np.float32),
             SR, subtype="PCM_24")

    # loudness: -14 LUFS integrated, peaks held under -2.1 dBFS (about -1.5 dBTP)
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    for _ in range(3):
        lufs = meter.integrated_loudness(mix.T)
        mix = limit(mix * db(-14.0 - lufs))
    lufs = meter.integrated_loudness(mix.T)
    sf.write(os.path.join(BUILD, "mix.wav"), mix.T.astype(np.float32), SR, subtype="PCM_24")
    print(f"wrote mix.wav: {lufs:.2f} LUFS, sample peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS")


if __name__ == "__main__":
    main()
