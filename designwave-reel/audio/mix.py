"""Sound design and final mix: voice and sound effects, no music.

The narration is the lead, processed close and forward (presence lift, firm
compression) rather than as a distant narrator. Every visible move in the
film has its own synthesised effect: whooshes on the camera moves and slides,
pops as elements land, a tap and a swipe on the phone, a snap as the pieces
align, and a riser into a hit on the Designwave logo. The cue times follow
the motion in comp/film.js. Effects dip a few dB while a line is spoken.
Loudness is set to -14 LUFS with peaks under -2.1 dBFS (about -1.5 dBTP).
Writes build/sfx.wav, build/mix_pre.wav and build/mix.wav (48 kHz stereo).
"""
import os

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d
from scipy.signal import butter, fftconvolve, istft, lfilter, sosfilt, stft

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SR = 48000
N = int(SR * 30.0)
RNG = np.random.default_rng(11)


def filt(x, kind, f, order=2):
    wn = np.array(f) / (SR / 2)
    return sosfilt(butter(order, wn, kind, output="sos"), x, axis=-1)


def db(x):
    return 10 ** (x / 20)


def place(buf, x, t):
    i = int(round(t * SR))
    j = min(buf.shape[-1], i + x.shape[-1])
    buf[..., i:j] += x[..., : j - i]


def norm(x, gain_db):
    return x / (np.abs(x).max() + 1e-12) * db(gain_db)


def pan(x, p):
    """Equal-power pan of a mono signal; p in [-1, 1], scalar or per-sample."""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def room(x, length=1.2, rt=0.7, wet=1 / 40, lp=5000):
    """Stereo noise-burst reverb added under the dry signal."""
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.vstack([RNG.normal(0, 1, n), RNG.normal(0, 1, n)]) * np.exp(-6.9 * t / rt)
    ir = filt(ir, "low", lp) * wet
    x = np.atleast_2d(x)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    out = np.zeros((2, x.shape[1] + n))
    out[:, : x.shape[1]] += x
    for c in range(2):
        wet_c = fftconvolve(x[c], ir[c])
        out[c, : len(wet_c)] += wet_c
    return out


def band_noise(dur, fc, bw_oct=1.0):
    """Noise through a band whose centre follows fc(u), u = 0..1 over dur."""
    n = int(dur * SR)
    _, _, Z = stft(RNG.normal(0, 1, n), SR, nperseg=1024, noverlap=768)
    f = np.linspace(0, SR / 2, Z.shape[0])[:, None]
    u = np.linspace(0, 1, Z.shape[1])[None, :]
    centre = fc(u)
    w = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / centre) / (bw_oct / 2)) ** 2)
    _, y = istft(Z * w, SR, nperseg=1024, noverlap=768)
    y = np.pad(y, (0, max(0, n - len(y))))[:n]
    return y / (np.abs(y).max() + 1e-12)


def bump(u, peak, rise=2.0, fall=1.6):
    """0 -> 1 at u = peak -> 0, smooth both sides."""
    a = np.clip(u / peak, 0, 1) ** rise
    b = np.clip((1 - u) / (1 - peak), 0, 1) ** fall
    return np.where(u < peak, a, b)


# ------------------------------------------------------------------ effects

def whoosh(dur, peak=0.55, f=(500, 2200, 700), gain=-20, pans=(-0.35, 0.35), bw=1.2, body=0.35):
    """Air moving past: a band of noise that sweeps f[0] -> f[1] -> f[2],
    loudest at `peak`, with some low-passed weight underneath."""
    def fc(u):
        lo = np.where(u < peak, np.log(f[0]) + (np.log(f[1]) - np.log(f[0])) * (u / peak),
                      np.log(f[1]) + (np.log(f[2]) - np.log(f[1])) * ((u - peak) / (1 - peak)))
        return np.exp(lo)
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = band_noise(dur, fc, bw)
    x = x + body * filt(RNG.normal(0, 1, n), "low", 260) * 4
    x *= bump(u, peak)
    return room(pan(norm(x, gain), np.linspace(*pans, n)), 0.9, 0.6, 1 / 60)


def riser(dur, gain=-18):
    """Rising air into the reveal; stops dead on the hit."""
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = band_noise(dur, lambda v: 250 * (7000 / 250) ** (v ** 1.4), 1.0)
    x *= u ** 2.6 * np.clip((1 - u) / 0.02, 0, 1)
    return pan(norm(x, gain), np.sin(u * 7) * 0.25)


def impact(gain=-9, shimmer=True):
    """The logo hit: a sub drop, a soft thump, a click, a long airy tail."""
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.07)) / SR) * np.exp(-t / 0.55)
    thump = filt(RNG.normal(0, 1, n), "low", 180) * np.exp(-t / 0.06) * 3
    click = filt(RNG.normal(0, 1, n), "high", 2500) * np.exp(-t / 0.004) * 0.5
    x = norm(sub + thump + click, gain)
    out = room(pan(x, 0.0), 2.6, 1.8, 1 / 25, 3500)
    if shimmer:
        sp = band_noise(2.8, lambda v: 7500 + 0 * v, 0.8)
        grains = filt(np.abs(RNG.normal(0, 1, n)) ** 4, "low", 30)
        sp *= grains / grains.max() * np.exp(-t / 0.9) * np.clip(t / 0.02, 0, 1)
        out[:, :n] += room(pan(norm(sp, gain - 15), np.sin(t * 3) * 0.6), 1.5, 1.2, 1 / 40, 9000)[:, :n]
    return out


def thud(gain=-22):
    """A card set down on a surface."""
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.05)
    x += filt(RNG.normal(0, 1, n), "band", [150, 900]) * np.exp(-t / 0.015) * 0.6
    return room(pan(norm(x, gain), 0), 0.6, 0.35, 1 / 50)


def pop(f0=900, gain=-24, p=0.0):
    """A soft bubbly UI pop as an element appears."""
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.7 * np.exp(-t / 0.012))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035) * np.clip(t / 0.002, 0, 1)
    x += filt(RNG.normal(0, 1, n), "high", 4000) * np.exp(-t / 0.002) * 0.15
    return room(pan(norm(x, gain), p), 0.5, 0.3, 1 / 45)


def tap(gain=-17):
    """Finger on glass: a short pitched 'tock' with a tiny click."""
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 1150 * np.exp(-t / 0.05) + 760
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.018)
    x += filt(RNG.normal(0, 1, n), "high", 3000) * np.exp(-t / 0.002) * 0.25
    return room(pan(norm(x, gain), 0.1), 0.5, 0.3, 1 / 40)


def swipe(dur=0.55, gain=-25, pans=(0.2, -0.1)):
    """A finger dragged up a glass screen."""
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = band_noise(dur, lambda v: 3500 + 2500 * v, 1.4) * bump(u, 0.35, 1.5, 1.2)
    return pan(norm(x, gain), np.linspace(*pans, n))


def snap(gain=-16):
    """Pieces locking onto the grid: a tight double click with a little body."""
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    hit = lambda d: filt(RNG.normal(0, 1, n), "band", [1800, 9000]) * np.exp(-np.clip(t - d, 0, None) / 0.003) * (t >= d)
    x = hit(0.0) + 0.6 * hit(0.022)
    x += np.sin(2 * np.pi * 1350 * t) * np.exp(-t / 0.02) * 0.5
    return room(pan(norm(x, gain), 0), 0.7, 0.45, 1 / 35)


def chime(gain=-24):
    """Quiet tonal accent as the three logos connect: two soft bell partials."""
    out = np.zeros(int(2.6 * SR))
    t = np.arange(len(out)) / SR
    for f, delay, amp in ((1174.66, 0.0, 1.0), (1760.0, 0.07, 0.55)):
        tt = np.clip(t - delay, 0, None)
        index = 1.6 * np.exp(-tt / 0.25)
        x = np.sin(2 * np.pi * f * tt + index * np.sin(2 * np.pi * f * 3.5 * tt))
        x *= np.exp(-tt / 0.75) * (t >= delay) * np.clip(tt / 0.003, 0, 1)
        out += amp * x
    return room(pan(norm(filt(out, "low", 6000), gain), 0), 2.2, 1.6, 1 / 40)


def zip_(dur=0.45, gain=-30, pans=(-0.3, 0.3)):
    """A thin line drawing itself: a narrow band sliding upward."""
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    x = band_noise(dur, lambda v: 1500 * (6.0 ** v), 0.5) * bump(u, 0.25, 1.2, 1.0)
    return pan(norm(x, gain), np.linspace(*pans, n))


def pencil(dur=0.7, gain=-32):
    """A pen stroke on paper: grainy high noise."""
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    grains = filt(np.abs(RNG.normal(0, 1, n)) ** 3, "low", 90)
    x = filt(RNG.normal(0, 1, n), "band", [2500, 8000]) * (0.3 + grains / grains.max())
    x *= bump(u, 0.2, 1.0, 0.8)
    return room(pan(norm(x, gain), np.linspace(-0.2, 0.2, n)), 0.5, 0.3, 1 / 60)


def paper(gain=-18):
    """A sheet slid across a table: crinkly band-limited noise, 0.45 s."""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    grains = filt(np.abs(RNG.normal(0, 1, n)) ** 3, "low", 60)
    x = filt(RNG.normal(0, 1, n), "band", [1400, 7000]) * (0.4 + grains / grains.max())
    x *= np.sin(np.pi * np.clip(t / 0.45, 0, 1)) ** 1.5
    return room(pan(norm(x, gain), np.linspace(-0.3, 0.1, n)), 1.2, 0.7)


def text_in(gain=-21):
    """Soft, airy rise under a statement's lines."""
    return whoosh(0.5, 0.6, (2500, 6000, 4000), gain, (0, 0), 0.9, 0.0)


def label_in(gain=-21):
    """The chapter label's dot and word."""
    return pop(1500, gain, -0.3)


def cue_sheet():
    """(time in s, sound). Times follow the motion in comp/film.js."""
    C = []
    add = lambda t, x: C.append((t, x))
    # S1 hook: the FORM & OAK mark wipes in, the statement rises, hints draw
    add(0.00, impact(-18, shimmer=False))
    add(0.28, text_in())
    add(1.22, pencil(0.95, -25))
    # S2 pull back from the tag to the chair (2.45-3.35)
    add(2.38, whoosh(1.05, 0.55, (2600, 900, 260), -14, (0.0, 0.25)))
    add(3.28, label_in())
    # S2 -> S3 the tag travels and lands on the table (4.62-5.30)
    add(4.52, whoosh(0.8, 0.6, (300, 1400, 600), -16, (-0.1, 0.1)))
    add(4.95, paper())
    add(5.27, thud(-17))
    add(5.12, text_in(-23))
    # S3 -> S4 push into the phone (6.28-7.10); the post becomes the site
    add(6.18, whoosh(0.95, 0.68, (350, 2600, 1500), -14, (0.0, 0.0), body=0.5))
    add(7.08, whoosh(0.55, 0.55, (1800, 4500, 3000), -23, (-0.2, 0.2), body=0.0))
    add(7.30, label_in())
    add(7.46, pop(1100, -23, 0.1))
    add(7.58, pop(1250, -24, -0.1))
    # the button is tapped, then the page scrolls (8.98-9.72)
    add(8.81, tap())
    add(8.98, swipe(0.65))
    # S4 -> S5 the phone shrinks to a tile; the other pieces fly in
    add(9.76, whoosh(0.8, 0.5, (2400, 1100, 350), -16, (0.0, 0.1)))
    add(9.95, whoosh(0.55, 0.5, (700, 2400, 1200), -21, (-0.8, -0.2), body=0.2))
    add(10.08, whoosh(0.6, 0.5, (500, 1900, 900), -21, (0.3, 0.1), body=0.2))
    add(10.44, thud(-22))
    add(10.62, thud(-23))
    # the pieces align (11.15-11.85), the grid and the links draw
    add(11.12, whoosh(0.7, 0.75, (400, 1500, 900), -25, (-0.1, 0.1), body=0.1))
    add(11.20, zip_(0.6, -25))
    add(11.82, snap())
    add(11.84, chime())
    for i, f in enumerate((950, 1120, 1300)):
        add(11.86 + i * 0.1, pop(f, -19, (-0.4, 0.4, 0.0)[i]))
    for i in range(3):
        add(11.90 + i * 0.12, zip_(0.45, -24, ((-0.5, 0.4), (0.4, 0.1), (0.1, -0.5))[i]))
    # S5 -> S6a the identity tile fills the frame (13.0-13.6)
    add(12.75, whoosh(0.8, 0.7, (400, 2000, 900), -15, (-0.2, 0.0), body=0.5))
    # the mark is constructed: grid lines, square, rings, dots, fill
    add(13.60, zip_(0.7, -25, (-0.4, 0.4)))
    add(13.80, pencil(0.75, -23))
    for i in range(4):
        add(14.25 + i * 0.2, zip_(0.55, -26, (0.3 - 0.2 * i, -0.3 + 0.2 * i)))
        add(14.55 + i * 0.2, pop(1500 + 120 * i, -25, (-0.3, 0.3)[i % 2]))
    add(15.45, thud(-20))
    # the mark moves into the identity sheet, which builds up
    add(16.62, whoosh(0.8, 0.6, (900, 2400, 1200), -20, (0.2, -0.3), body=0.2))
    add(16.88, label_in())
    add(17.24, whoosh(0.5, 0.5, (2000, 5000, 3500), -25, (-0.4, 0.3), body=0.0))
    add(17.38, pop(880, -20, -0.3))
    add(17.58, pop(990, -21, 0.2))
    for i in range(5):
        add(17.92 + i * 0.09, pop(1050 + 110 * i, -19, -0.5 + 0.25 * i))
    add(18.30, whoosh(0.9, 0.55, (900, 2200, 1500), -29, (0.3, -0.3), body=0.0))
    # S6b, S6c: the boards slide up; the posts flick in from the right
    add(20.24, whoosh(0.7, 0.55, (450, 2200, 800), -15, (0.0, 0.0), body=0.4))
    add(20.72, label_in())
    add(21.62, whoosh(0.7, 0.55, (450, 2200, 800), -15, (0.0, 0.0), body=0.4))
    for i in range(3):
        add(21.96 + i * 0.1, whoosh(0.35, 0.45, (1200, 3800, 2000), -24, (0.6, 0.1), body=0.0))
    add(22.11, label_in())
    # S7 the long pull back to the case-study board (23.62-25.55)
    add(23.50, whoosh(2.1, 0.45, (2200, 700, 220), -14, (0.0, 0.0), bw=1.4, body=0.5))
    add(24.48, text_in(-23))
    # S8 riser into the logo hit, then the tagline
    add(25.62, riser(1.33))
    add(26.95, impact(-12))
    add(27.53, text_in(-24))
    return C


# ------------------------------------------------------------- processing

def biquad(x, kind, f0, gain_db=0.0, q=0.707):
    """RBJ cookbook peaking EQ and shelves."""
    A, w = 10 ** (gain_db / 40), 2 * np.pi * f0 / SR
    al, c = np.sin(w) / (2 * q), np.cos(w)
    if kind == "peak":
        b = [1 + al * A, -2 * c, 1 - al * A]
        a = [1 + al / A, -2 * c, 1 - al / A]
    else:  # "high" shelf
        s = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + s), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - s)]
        a = [(A + 1) - (A - 1) * c + s, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - s]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def compress(x, threshold_db=-28.0, ratio=4.0, attack=0.003, release=0.1, makeup_db=9.0):
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


def voice(vo):
    """Close and present: clean lows, less boxiness, more bite and air."""
    vo = filt(vo, "high", 85)
    vo = biquad(vo, "peak", 300, -2.5, 1.0)
    vo = biquad(vo, "peak", 3200, 3.0, 0.9)
    vo = biquad(vo, "high", 9000, 2.0)
    vo = compress(vo)
    # hold the synthetic voice's spiky peaks to about 13 dB over its spoken
    # level, so the final limiter only has stray peaks left to catch
    vo /= np.abs(vo).max()
    speech = vo[maximum_filter1d(np.abs(vo), int(0.05 * SR)) > 0.05]
    ceiling = 20 * np.log10(np.sqrt(np.mean(speech ** 2))) + 13.0
    return limit(vo[None], ceiling, 0.003, 0.03)[0]


def main():
    sfx = np.zeros((2, N))
    for t, x in cue_sheet():
        place(sfx, x, t)
    sf.write(os.path.join(BUILD, "sfx.wav"), sfx.T.astype(np.float32), SR, subtype="PCM_24")

    vo, _ = sf.read(os.path.join(BUILD, "vo.wav"))
    vo = voice(vo)
    # the effect gains in the cue sheet are set against speech at -25.5 dBFS RMS
    speech = vo[maximum_filter1d(np.abs(vo), int(0.05 * SR)) > 0.05 * np.abs(vo).max()]
    vo *= db(-25.5) / np.sqrt(np.mean(speech ** 2))

    # dip the effects under speech: hold 120 ms, smooth attack/release
    level = maximum_filter1d(np.abs(vo), int(0.12 * SR))
    active = (level > 0.1 * level.max()).astype(float)
    k = int(0.15 * SR)
    win = np.hanning(2 * k)
    win /= win.sum()
    active = np.clip(fftconvolve(active, win, mode="same"), 0, 1)
    gain = db(-4.0 * active)

    mix = np.vstack([vo, vo]) * db(-1.0) + sfx * gain
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
