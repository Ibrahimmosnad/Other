// Designwave — brand introduction reel. 1080 x 1920, 30 fps, 30 s.
//
// Every frame is a pure function of time: render(t) sets each element's
// transform and opacity from the scene timings in timeline.json (which are
// set around the recorded narration). tools/render-frames.mjs calls
// window.seek(t) for each frame and captures the stage.

import * as B from "/comp/brand/brand.js";

const Q = new URLSearchParams(location.search);
const SUF = Q.has("preview") ? "_preview" : "";
const IMG = "/assets/img";

// ------------------------------------------------------------ easing + math

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x, d = dx(t);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    t = Math.min(1, Math.max(0, t));
    return sy(t);
  };
}
// Designwave's own curves (from the studio site): long-settle entrances,
// symmetric in-out for wipes and camera moves.
const E = {
  out: bezier(0.16, 1, 0.3, 1),
  io: bezier(0.76, 0, 0.24, 1),
  soft: bezier(0.45, 0, 0.25, 1),
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  lin: (t) => t,
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b, e = E.lin) => e(clamp((t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const loglerp = (a, b, u) => a * Math.pow(b / a, u);
const mix2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
const rot2 = (p, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};

// ------------------------------------------------------------- DOM helpers

const stage = document.getElementById("stage");
const node = (html, parent = stage) => {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  const n = d.firstElementChild;
  parent.appendChild(n);
  return n;
};
const layer = (id, bg) => node(`<div class="layer" id="${id}" ${bg ? `style="background:${bg}"` : ""}></div>`);
const T = (n, { x = 0, y = 0, s = 1, r = 0 } = {}) => {
  n.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;
};
const O = (n, o) => {
  n.style.opacity = o;
  n.style.visibility = o <= 0.0005 ? "hidden" : "visible";
};
const show = (n, on) => { n.style.display = on ? "" : "none"; };

// A statement: lines rise out of masks (as on the studio site), leave by fading.
function statement(parent, lines, top, size) {
  const n = node(`<div class="stmt" style="top:${top}px;font-size:${size}px">${lines
    .map((l) => `<span class="ln"><span>${l}</span></span>`).join("")}</div>`, parent);
  return { n, spans: [...n.querySelectorAll(".ln > span")] };
}
function statementAt(st, t, tin, tout, stagger = 0.1, dur = 0.8) {
  st.spans.forEach((s, i) => {
    const u = P(t, tin + i * stagger, tin + i * stagger + dur, E.out);
    s.style.transform = `translateY(${(1 - u) * 112}%)`;
  });
  const o = 1 - P(t, tout, tout + 0.26, E.soft);
  O(st.n, o);
  st.n.style.transform = `translateY(${-14 * P(t, tout, tout + 0.3, E.soft)}px)`;
}

// ------------------------------------------------------------------- data

const [TL, FL, PC, CB] = await Promise.all(
  ["/comp/timeline.json", `/assets/renders/flatlay${SUF}.json`, `/assets/renders/phone_close${SUF}.json`,
   `/assets/renders/chair_box${SUF}.json`].map((u) => fetch(u).then((r) => r.json())),
);
// width-normalised coordinates: 1 unit = image width (all renders are 9:16 or 4:5)
const wn = (json, p) => [p[0] / json.size[0], p[1] / json.size[0]];
const quad = (json, key) => json[key].map((p) => wn(json, p));
const centre = (q) => [q.reduce((a, p) => a + p[0], 0) / q.length, q.reduce((a, p) => a + p[1], 0) / q.length];
const edge = (q) => Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
const angle = (q) => (Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]) * 180) / Math.PI;

const S = TL.scenes;

// =================================================================== scenes

// ---- S8 (bottom): Designwave end card ------------------------------------
const s8 = layer("s8", "var(--dw-cream)");
const logo = node(`<div class="abs" style="left:0;top:0;width:1080px;text-align:center">
  <div style="font-size:78px;display:inline-block">${B.dwLogo()}</div></div>`, s8);
const tagline = node(`<div class="abs" style="left:0;width:1080px;text-align:center;font:400 44px/1 var(--dw-sans);letter-spacing:-0.015em;color:#4f4c46">Design with intention.</div>`, s8);

// ---- S7: the bigger picture (case-study board) ----------------------------
const s7 = layer("s7", "var(--dw-cream)");
const board = node(`<div class="abs" style="width:1080px;height:1920px"></div>`, s7);
const G = { x: 84, y: 600, gut: 16, cw: (912 - 32) / 3 };
const col = (c) => G.x + c * (G.cw + G.gut);
const tiles7 = [];
function tile7(x, y, w, h, html) {
  const t = node(`<div class="tile" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${html}</div>`, board);
  tiles7.push(t);
  return t;
}
const cover = (src, w, h, iw, ih, fx = 0.5, fy = 0.5, zoom = 1) => {
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  return `<img src="${src}" style="width:${dw}px;height:${dh}px;left:${(w - dw) * fx}px;top:${(h - dh) * fy}px">`;
};
const rowH = [227, 227, 229, 229];
const rowY = [600, 843, 1086, 1331];
tile7(col(0), rowY[0], G.cw * 2 + G.gut, rowH[0] * 2 + G.gut, cover(`${IMG}/chair_hero.jpg`, G.cw * 2 + G.gut, 470, 1296, 2304, 0.5, 0.52, 1.25));
tile7(col(2), rowY[0], G.cw, rowH[0], `<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:26px">
  <div style="width:64px;height:64px">${B.foMark("#252525", "#f5f2ec", "b7")}</div><div style="font-size:15px">${B.foWordmarkText()}</div></div>`);
tile7(col(2), rowY[1], G.cw, rowH[1], `<div style="position:absolute;left:0;top:0;transform:scale(${G.cw / 1080});transform-origin:0 0">${B.posts()[1]}</div>`);
tile7(col(0), rowY[2], G.cw, rowH[2] * 2 + G.gut, cover(`${IMG}/desk.jpg`, G.cw, 474, 1296, 2304, 0.5, 0.42, 1.55));
tile7(col(1), rowY[2], G.cw, rowH[2], cover(`${IMG}/chair_box.jpg`, G.cw, 229, 1200, 1500, 0.92, 0.9, 1.9));
tile7(col(1), rowY[3], G.cw, rowH[3], cover(`${IMG}/flatlay.jpg`, G.cw, 229, 1620, 2880, 0.86, 0.68, 2.4));
tile7(col(2), rowY[2], G.cw, rowH[2] * 2 + G.gut, `<div style="position:absolute;left:${(G.cw - 474 * 0.8) / 2}px;top:0;transform:scale(${474 / 1350});transform-origin:0 0">${B.posts()[2]}</div>`);
const st7 = statement(s7, ["Every detail", "contributes to the", "<em>bigger picture.</em>"], 270, 78);

// ---- S6c: visual communication -------------------------------------------
const s6c = layer("s6c", "#cfc6b9");
const s6cBg = node(`<img class="abs" src="${IMG}/flatlay.jpg" style="width:1620px;height:2880px">`, s6c);
const posts6 = B.posts().map((html, i) => node(`<div class="tile" style="left:${84 + i * 312}px;top:600px;width:288px;height:360px;box-shadow:0 22px 50px rgba(40,30,20,.20),0 2px 6px rgba(40,30,20,.12)">
  <div style="position:absolute;left:0;top:0;transform:scale(${288 / 1080});transform-origin:0 0">${html}</div></div>`, s6c));

// ---- S6b: digital presence ------------------------------------------------
const s6b = layer("s6b", "#cfc6b9");
const s6bImg = node(`<img class="abs" src="${IMG}/desk.jpg" style="width:1080px;height:1920px">`, s6b);

// ---- S6a: brand identity --------------------------------------------------
const s6a = layer("s6a", "var(--fo-paper)");
const s6aBoard = node(`<div class="abs" style="width:1080px;height:1920px"></div>`, s6a);
const SQ = { x: 300, y: 600, w: 480 };
const RR = B.RING_RADII.map((r) => r * (SQ.w / 120));
const cx = SQ.x + SQ.w, cy = SQ.y + SQ.w;
const circ = (r) => 2 * Math.PI * r;
const constr = node(`<svg class="abs" width="1080" height="1920" viewBox="0 0 1080 1920" style="overflow:visible">
  <defs><clipPath id="sqclip"><rect x="${SQ.x}" y="${SQ.y}" width="${SQ.w}" height="${SQ.w}"/></clipPath></defs>
  <g id="grid" stroke="#3b4bff" stroke-opacity=".45" stroke-width="1.5" fill="none">
    <line x1="${SQ.x}" y1="0" x2="${SQ.x}" y2="1920"/><line x1="${SQ.x + SQ.w}" y1="0" x2="${SQ.x + SQ.w}" y2="1920"/>
    <line x1="0" y1="${SQ.y}" x2="1080" y2="${SQ.y}"/><line x1="0" y1="${SQ.y + SQ.w}" x2="1080" y2="${SQ.y + SQ.w}"/>
  </g>
  <g id="mark6">
    <rect id="sqfill" x="${SQ.x}" y="${SQ.y}" width="${SQ.w}" height="${SQ.w}" fill="#252525"/>
    <g id="rings6" clip-path="url(#sqclip)" fill="none" stroke="#f5f2ec" stroke-width="${5.5 * SQ.w / 120}">
      ${RR.map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join("")}</g>
    <rect id="sqline" x="${SQ.x}" y="${SQ.y}" width="${SQ.w}" height="${SQ.w}" fill="none" stroke="#252525" stroke-width="2.5"/>
  </g>
  <g id="circles" fill="none" stroke="#3b4bff" stroke-width="1.6">
    ${RR.map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" transform="rotate(-90 ${cx} ${cy})" stroke-dasharray="${circ(r)}" stroke-dashoffset="${circ(r)}"/>`).join("")}</g>
  <g id="idots" fill="#3b4bff">${RR.map((r) => `<circle cx="${cx - r}" cy="${cy}" r="7"/><circle cx="${cx}" cy="${cy - r}" r="7"/>`).join("")}</g>
</svg>`, s6aBoard);
const gridLines = [...constr.querySelectorAll("#grid line")];
gridLines.forEach((l) => { const len = 1920; l.setAttribute("stroke-dasharray", len); l.setAttribute("stroke-dashoffset", len); });
const sqline = constr.querySelector("#sqline");
sqline.setAttribute("stroke-dasharray", 4 * SQ.w);
const sqfill = constr.querySelector("#sqfill");
const rings6 = constr.querySelector("#rings6");
const mark6 = constr.querySelector("#mark6");
const circles = [...constr.querySelectorAll("#circles circle")];
const idots = [...constr.querySelectorAll("#idots circle")];
const wm6 = node(`<div class="abs fo" style="left:84px;top:660px;font-size:46px;clip-path:inset(0 100% 0 0)">${B.foWordmarkText()}</div>`, s6aBoard);
const type6 = node(`<div class="abs fo" style="left:84px;top:760px;width:900px">
  <div style="font:400 200px/1 var(--fo-sans);letter-spacing:-.02em;display:inline-block">Aa</div>
  <div style="position:absolute;left:290px;top:52px"><div style="font:500 34px/1 var(--fo-sans)">Jost</div>
  <div style="font:400 25px/1.4 var(--fo-sans);color:var(--fo-ash);margin-top:12px">Light · Regular · Medium</div></div></div>`, s6aBoard);
const SW = [["Paper", "#F5F2EC", "#252525"], ["Stone", "#D8D0C4", "#252525"], ["Oak", "#B48A5E", "#F5F2EC"],
  ["Charcoal", "#252525", "#F5F2EC"], ["Ash", "#858585", "#F5F2EC"]];
const swatches = SW.map(([n, hex, ink], i) => node(`<div class="swatch fo" style="left:${84 + i * 170}px;top:1080px;background:${hex};color:${ink};${n === "Paper" ? "box-shadow:inset 0 0 0 1.5px #d9d2c6" : ""}"><b>${n}</b>${hex}</div>`, s6aBoard));
const rings6dev = node(`<div class="abs" style="left:540px;top:1380px;width:620px;height:620px">${B.foRings("#252525", 0.16, 1.4, 11)}</div>`, s6aBoard);

// ---- S5: good design doesn't happen in isolation ---------------------------
const s5 = layer("s5", "var(--dw-cream)");
const st5 = statement(s5, ["Good design", "doesn’t happen", "in <em>isolation.</em>"], 262, 108);
const A = { x: 84, y: 720, w: 360, h: 360 };
const Bt = { x: 468, y: 720, w: 528, h: 760 };
const Ct = { x: 84, y: 1104, w: 360, h: 376 };
const tileA = node(`<div class="tile" style="left:${A.x}px;top:${A.y}px;width:${A.w}px;height:${A.h}px;box-shadow:0 20px 50px rgba(40,30,20,.10)">
  <div class="tileA-in" style="position:absolute;inset:0">
  <div style="position:absolute;left:40px;top:40px;width:120px;height:120px">${B.foMark("#252525", "#f5f2ec", "a5")}</div>
  <div style="position:absolute;left:40px;top:206px;font-size:22px">${B.foWordmarkText()}</div>
  <div class="chips" style="position:absolute;left:40px;top:278px">${["#f5f2ec", "#d8d0c4", "#b48a5e", "#252525", "#858585"].map((c) => `<i style="background:${c}"></i>`).join("")}</div>
  </div></div>`, s5);
const tileAin = tileA.querySelector(".tileA-in");
const tileC = node(`<div class="tile" style="left:${Ct.x}px;top:${Ct.y}px;width:${Ct.w}px;height:${Ct.h}px;box-shadow:0 20px 50px rgba(40,30,20,.12)">${cover(`${IMG}/chair_box.jpg`, Ct.w, Ct.h, 1200, 1500, 0.5, 0.5)}</div>`, s5);
const grid5 = node(`<svg class="abs" width="1080" height="1920" style="overflow:visible"><g stroke="#3b4bff" stroke-width="1.5" fill="none">
  ${[84, 444, 468, 996].map((x) => `<line x1="${x}" y1="660" x2="${x}" y2="1540"/>`).join("")}
  ${[720, 1080, 1104, 1480].map((y) => `<line x1="40" y1="${y}" x2="1040" y2="${y}"/>`).join("")}</g></svg>`, s5);
const grid5Lines = [...grid5.querySelectorAll("line")];
const links5 = node(`<svg class="abs" width="1080" height="1920" style="overflow:visible"><g stroke="#3b4bff" stroke-width="2.5" fill="none" stroke-linecap="round"><path/><path/><path/></g><g fill="#3b4bff"><circle r="9"/><circle r="9"/><circle r="9"/></g></svg>`, s5);
const linkPaths = [...links5.querySelectorAll("path")];
const linkDots = [...links5.querySelectorAll("g circle")];

// ---- S4: digital experience (phone + live site) ----------------------------
const s4wrap = node(`<div id="s4wrap"></div>`);
const s4cam = node(`<div id="s4cam"></div>`, s4wrap);
const screen = node(`<div id="screen"></div>`, s4cam);
node(`<img src="${IMG}/phone_close.png" class="abs" style="width:1080px;height:1920px">`, s4cam);
const glare = node(`<div id="glare"></div>`, s4cam);
const feedLayer = node(`<div class="feed-layer">${B.phoneFeed()}</div>`, screen);
const siteWrap = node(`<div class="site-wrap">${B.siteMobile()}</div>`, screen);
const sticky = node(`<div class="sticky fo"><div class="m-site" style="width:390px"><div class="nav" style="visibility:visible">${B.foWordmark("st")}<div class="burger"></div></div></div></div>`, screen);
const status = node(`<div class="status" style="height:54px;display:flex;justify-content:space-between;align-items:center;padding:0 30px;font:600 15px/1 var(--dw-sans);color:#111"><span>9:41</span><i style="display:inline-block;width:24px;height:11px;border:1.5px solid #111;border-radius:3px"></i></div>`, screen);
const morph = node(`<div class="morph"><div class="m-post" style="position:absolute;left:0;top:0;transform-origin:0 0">${B.posts()[0]}</div><div class="m-hero" style="position:absolute;inset:0;background:url(${IMG}/chair.jpg) 50% 50%/cover"></div></div>`, screen);
const mPost = morph.querySelector(".m-post");
const mHero = morph.querySelector(".m-hero");
const mPostWm = mPost.querySelectorAll(".wm, .cap");
const feedFeed = feedLayer.querySelector(".feed");
const feedPost = feedLayer.querySelector(".post");
const siteHero = siteWrap.querySelector(".hero");
const siteNav = siteWrap.querySelector(".nav");
const cta = siteWrap.querySelector("[data-cta]");
const ripple = node(`<div class="ripple"></div>`, screen);

// ---- S3: every interaction communicates ------------------------------------
const s3 = layer("s3", "#cfc6b9");
const flat = node(`<img class="abs" src="${IMG}/flatlay.jpg" style="width:1620px;height:2880px">`, s3);
const st3 = statement(s3, ["Every interaction", "<em>communicates.</em>"], 292, 84);

// ---- S2: the product -------------------------------------------------------
const s2 = layer("s2");
const s2photo = node(`<img class="abs" src="${IMG}/chair_hero.jpg" style="width:1080px;height:1920px">`, s2);

// ---- S1: the hook (the tag fills the frame) --------------------------------
const s1 = layer("s1");
s1.style.background = "transparent";
const hints = node(`<svg id="hints" class="abs" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect x="930" y="1210" width="240" height="500" rx="34"/><rect x="-170" y="1430" width="330" height="470" rx="3"/>
  <rect x="860" y="96" width="250" height="250" rx="3"/></svg>`, s1);
const hintRects = [...hints.querySelectorAll("rect")];
hintRects.forEach((r) => { const L = 2 * (+r.getAttribute("width") + +r.getAttribute("height")); r.setAttribute("stroke-dasharray", L); r.setAttribute("stroke-dashoffset", L); r.dataset.len = L; });

const tagEl = node(`<div id="tag" class="abs">${B.tag("s1")}</div>`);
const tagDetails = tagEl.querySelectorAll(".hole, .no, .name, .spec, .foot");
const tagMark = tagEl.querySelector(".mark");
const st1 = statement(stage, ["A business is", "more than", "its <em>logo.</em>"], 330, 100);

// ---- shared label ----------------------------------------------------------
const label = node(`<div class="label"><span class="dot"></span><span class="txt"><span></span></span></div>`);
const labelTxt = label.querySelector(".txt > span");
const dashes = node(`<div class="dashes"><i></i><i></i><i></i></div>`);
const dashEls = [...dashes.querySelectorAll("i")];
const LABELS = [
  ["Product experience", 3.3, 4.55],
  ["Digital experience", 7.3, 9.72],
  ["Brand identity", 16.9, 20.28],
  ["Digital presence", 20.74, 21.66],
  ["Visual communication", 22.12, 23.55],
];

// ---- film grain --------------------------------------------------------------
const grain = node(`<div id="grain"></div>`);
const grainTiles = [];
{
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 4; k++) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const im = g.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 90;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    grainTiles.push(c.toDataURL());
  }
}
if (Q.has("safe")) {
  node(`<svg class="abs" width="1080" height="1920" style="pointer-events:none"><rect x="0" y="0" width="1080" height="220" fill="rgba(255,0,0,.18)"/><rect x="0" y="1540" width="1080" height="380" fill="rgba(255,0,0,.18)"/><rect x="940" y="980" width="140" height="560" fill="rgba(255,0,0,.18)"/></svg>`);
}

// ================================================================ geometry

// Scene 3 framing: the flat-lay at 1.12x with a slow drift
const FLW = 1620;
const s3Frame = (t) => {
  const d = P(t, 4.9, 6.35, E.sine);
  const W = lerp(1209.6, 1236, d);
  return { W, x: lerp(-64.8, -84, d), y: lerp(-115, -168, d) };
};
const flatToScreen = (f, p) => [f.x + f.W * p[0], f.y + f.W * p[1]];

// Scene 3 -> 4: push into the phone until the flat-lay matches the close-up.
// Both layers are driven from this one state so they never drift apart.
// (uses kFC, dFC and fPhone, defined below; only called at render time)
function flatState(t) {
  const f = s3Frame(t);
  const uP = P(t, 6.28, 7.1, E.io);
  if (uP <= 0) return f;
  const f0 = s3Frame(6.28);
  const W1 = 1080 * kFC;
  const S0 = flatToScreen(f0, fPhone);
  const S1 = [1080 * dFC[0] + W1 * fPhone[0], 1080 * dFC[1] + W1 * fPhone[1]];
  const W = loglerp(f0.W, W1, uP);
  const Sc = mix2(S0, S1, uP);
  return { W, x: Sc[0] - W * fPhone[0], y: Sc[1] - W * fPhone[1] };
}

// Scene 4 framing: the phone close-up covers the frame; screen geometry
const scrQ = quad(PC, "screen").map((p) => [p[0] * 1080, p[1] * 1080]);
const scrC = centre(scrQ), scrW = edge(scrQ), scrA = angle(scrQ);
const phoneC = centre(quad(PC, "phone")).map((v) => v * 1080);
const scrScale = scrW / 390;
// where the call to action sits on the 390-wide page (measured at boot, once
// the fonts are in, with the display untransformed)
let ctaC = [195, 760];
for (const n of [screen, glare]) {
  n.style.left = `${scrC[0] - 195}px`;
  n.style.top = `${scrC[1] - 416}px`;
  n.style.transform = `rotate(${scrA}deg) scale(${scrScale})`;
}
// map between the flat-lay and the close-up (same orientation, ortho)
const fScr = quad(FL, "screen"), cScr = quad(PC, "screen");
const kFC = edge(cScr) / edge(fScr);
const dFC = [cScr[0][0] - kFC * fScr[0][0], cScr[0][1] - kFC * fScr[0][1]];
const fPhone = centre(quad(FL, "phone"));

// a point inside the phone's screen (css px of the 390-wide page) to S4 content px
const screenPoint = (px, py) => {
  const local = [(px - 195) * scrScale, (py - 416) * scrScale];
  const r = rot2(local, scrA);
  return [scrC[0] + r[0], scrC[1] + r[1]];
};
const camApply = (cam, p) => {
  const r = rot2([p[0] * cam.z, p[1] * cam.z], cam.r);
  return [cam.tx + r[0], cam.ty + r[1]];
};
const camFor = (D, z, r) => {
  const rp = rot2([phoneC[0] * z, phoneC[1] * z], r);
  return { z, r, tx: D[0] - rp[0], ty: D[1] - rp[1] };
};

// Scene 5 tile states
const scatter = {
  A: { dx: -26, dy: 46, r: -5, s: 0.88 },
  B: { dx: 40, dy: -26, r: 3.5, s: 0.9 },
  C: { dx: 54, dy: 64, r: 4.2, s: 0.84 },
};
const tileState = (base, sc, u) => ({
  x: base.x + sc.dx * (1 - u), y: base.y + sc.dy * (1 - u), w: base.w, h: base.h,
  r: sc.r * (1 - u), s: lerp(sc.s, 1, u),
});
const placeTile = (n, st, extra = {}) => {
  n.style.left = `${st.x}px`; n.style.top = `${st.y}px`;
  n.style.width = `${st.w}px`; n.style.height = `${st.h}px`;
  n.style.transform = `translate(${extra.x || 0}px,${extra.y || 0}px) rotate(${st.r}deg) scale(${st.s})`;
};

// ================================================================= render

function render(t) {
  // ---------------------------------------------------------------- S1 + S2
  const on12 = t < S.s3_communication[0] + 0.7;
  show(s1, on12); show(s2, on12); show(tagEl, t < 5.45);
  if (on12) {
    // push in slowly, then pull all the way back to a card beside the chair
    const wPush = lerp(1080, 1134, P(t, 0, 2.45, E.sine));
    const u = P(t, 2.45, 3.35, E.io);
    const cardC = [792, 558.2];
    let w = loglerp(wPush, 232, u);
    let c = mix2([540, 960], cardC, u);
    let rTag = 0;
    // scene 2 -> 3: the card travels with the camera and lands on the table
    const fEnd = s3Frame(5.3);
    const tagQ = quad(FL, "tag").map((p) => flatToScreen(fEnd, p));
    const uL = P(t, 4.62, 5.3, E.io);
    if (uL > 0) {
      w = loglerp(232, edge(tagQ), uL);
      c = mix2(cardC, centre(tagQ), uL);
      rTag = angle(tagQ) * uL;
    }
    const s = w / 540;
    tagEl.style.transform = `translate(${c[0]}px,${c[1]}px) rotate(${rTag}deg) scale(${s}) translate(-270px,-480px)`;
    tagEl.style.borderRadius = `${lerp(0, 12, u)}px`;
    tagEl.style.boxShadow = `0 ${30 * u}px ${70 * u}px rgba(50,38,26,${0.22 * u}), 0 ${3 * u}px ${8 * u}px rgba(50,38,26,${0.14 * u})`;
    O(tagEl, 1 - P(t, 5.26, 5.42));
    const dOp = P(t, 2.85, 3.3, E.soft);
    tagDetails.forEach((d) => O(d, dOp));
    const mu = P(t, 0.06, 0.8, E.out);
    tagMark.style.clipPath = `inset(${(1 - mu) * 100}% 0 0 0)`;
    tagMark.style.transform = `translateY(${(1 - mu) * 18}px)`;

    hintRects.forEach((r, i) => {
      const d = P(t, 1.25 + i * 0.14, 2.15 + i * 0.14, E.out);
      r.setAttribute("stroke-dashoffset", r.dataset.len * (1 - d));
    });
    O(hints, 1 - P(t, 2.42, 2.7));

    // the photo behind: a slight pull-back during the zoom, then a slow drift
    let ps, po;
    if (t < 3.35) { ps = lerp(1.12, 1.0, u); po = cardC; } else { ps = lerp(1.0, 1.04, P(t, 3.35, 4.85, E.sine)); po = [430, 1010]; }
    const yPush = -1920 * P(t, 4.62, 5.22, E.io);
    T(s2photo, { x: po[0] * (1 - ps), y: po[1] * (1 - ps) + yPush, s: ps });
  }
  show(st1.n, t < 2.9);
  statementAt(st1, t, 0.3, 2.3, 0.11, 0.85);

  // ---------------------------------------------------------------- S3
  const on3 = t > S.s3_communication[0] - 0.4 && t < 7.15;
  show(s3, on3);
  if (on3) {
    const yIn = 1920 * (1 - P(t, 4.62, 5.22, E.io));
    const { W, x, y } = flatState(t);
    T(flat, { x, y: y + yIn, s: W / FLW });
    st3.n.style.marginTop = `${yIn}px`;
    statementAt(st3, t, 5.12, 6.16, 0.1, 0.8);
  }

  // ---------------------------------------------------------------- S4 -> S5 tile B
  const on4 = t > 6.75 && t < S.s5_isolation[1] + 0.4;
  show(s4wrap, on4);
  if (on4) {
    O(s4wrap, P(t, 6.6, 6.98, E.soft));
    // feather the close-up's edges while it blends over the flat-lay
    const fe = P(t, 6.6, 7.08);
    s4cam.style.webkitMaskImage = s4cam.style.maskImage = fe < 1
      ? `radial-gradient(ellipse 50% 50% at ${phoneC[0]}px ${phoneC[1]}px, #000 ${lerp(70, 260, fe)}%, transparent ${lerp(120, 300, fe)}%)`
      : "none";
    const rot = 0; // the phone stays as it lies on the table
    const z4 = lerp(1, 1.035, P(t, 7.1, 9.9, E.sine));
    const uB = P(t, 9.84, 10.6, E.io);
    const uAlign = P(t, 11.15, 11.85, E.io);
    const tb = tileState(Bt, scatter.B, uAlign);
    const exitB = P(t, 12.98, 13.3, E.soft);
    // wrap rect: full frame -> scattered tile -> aligned tile
    const R = {
      x: lerp(0, tb.x, uB), y: lerp(0, tb.y, uB), w: lerp(1080, tb.w, uB), h: lerp(1920, tb.h, uB),
    };
    s4wrap.style.left = `${R.x}px`; s4wrap.style.top = `${R.y}px`;
    s4wrap.style.width = `${R.w}px`; s4wrap.style.height = `${R.h}px`;
    s4wrap.style.borderRadius = `${6 * uB}px`;
    s4wrap.style.boxShadow = `0 20px 50px rgba(40,30,20,${0.12 * uB})`;
    s4wrap.style.transformOrigin = "50% 50%";
    s4wrap.style.transform = `translateY(${40 * exitB}px) rotate(${tb.r * uB}deg) scale(${lerp(1, tb.s, uB)})`;
    if (exitB > 0) O(s4wrap, 1 - exitB);
    const zT = lerp(z4, 0.655, uB);
    const D = [lerp(phoneC[0], R.w / 2, uB), lerp(phoneC[1], R.h / 2, uB)];
    const cam = camFor(D, zT, rot);
    if (t < 7.1) {
      // locked to the flat-lay push (see flatState)
      const fs = flatState(t);
      const z = fs.W / (1080 * kFC);
      s4cam.style.transform = `translate(${fs.x - (fs.W / kFC) * dFC[0]}px,${fs.y - (fs.W / kFC) * dFC[1]}px) scale(${z})`;
    } else {
      s4cam.style.transform = `translate(${cam.tx}px,${cam.ty}px) rotate(${cam.r}deg) scale(${cam.z})`;
    }
    s4wrap.dataset.cam = JSON.stringify(cam);

    // display: the post grows into the website's hero image
    const um = P(t, 7.12, 7.7, E.io);
    O(feedFeed, 1 - P(t, 7.1, 7.32, E.soft));
    const from = { x: 0, y: 108, w: 390, h: 487 };
    const to = { x: 14, y: 54 + 64, w: 362, h: 404 };
    const mr = { x: lerp(from.x, to.x, um), y: lerp(from.y, to.y, um), w: lerp(from.w, to.w, um), h: lerp(from.h, to.h, um) };
    Object.assign(morph.style, { left: `${mr.x}px`, top: `${mr.y}px`, width: `${mr.w}px`, height: `${mr.h}px`, borderRadius: `${4 * um}px` });
    const ps = Math.max(mr.w / 1080, mr.h / 1350);
    mPost.style.transform = `translate(${(mr.w - 1080 * ps) / 2}px,${(mr.h - 1350 * ps) / 2}px) scale(${ps})`;
    mPostWm.forEach((n) => O(n, 1 - P(t, 7.1, 7.3)));
    O(mHero, P(t, 7.2, 7.62, E.soft));
    show(morph, t < 7.75);
    feedPost.style.visibility = "hidden";
    const siteO = P(t, 7.38, 7.78, E.soft);
    O(siteWrap, t < 7.3 ? 0 : 1);
    siteWrap.querySelectorAll(".intro, .sect, .grid").forEach((n, i) => {
      O(n, P(t, 7.38 + i * 0.06, 7.8 + i * 0.06, E.soft));
      n.style.transform = `translateY(${(1 - P(t, 7.38 + i * 0.06, 7.95 + i * 0.06, E.out)) * 24}px)`;
    });
    O(siteHero, t >= 7.7 ? 1 : 0);
    O(sticky, siteO);
    siteNav.style.visibility = "hidden";
    // tap the call to action, then scroll to the collection
    const press = P(t, 8.78, 8.9, E.soft) * (1 - P(t, 8.95, 9.12, E.soft));
    cta.style.transform = `scale(${1 - 0.05 * press})`;
    cta.style.background = press > 0 ? `rgb(${37 + 40 * press},${37 + 36 * press},${37 + 34 * press})` : "";
    const ur = P(t, 8.82, 9.32, E.out);
    show(ripple, ur > 0 && ur < 1);
    const scroll = 470 * P(t, 8.98, 9.72, E.io);
    Object.assign(ripple.style, { left: `${ctaC[0]}px`, top: `${ctaC[1] - scroll}px`, transform: `scale(${0.2 + 2.4 * ur})`, opacity: 0.6 * (1 - ur) });
    siteWrap.style.transform = `translateY(${-scroll}px)`;
  }

  // ---------------------------------------------------------------- S5
  const on5 = t > 9.8 && t < 13.6;
  show(s5, on5);
  show(links5, on5);
  if (on5) {
    const uAlign = P(t, 11.15, 11.85, E.io);
    const exit = P(t, 12.98, 13.3, E.soft);
    // tile A: in from the left, then expands into the identity board
    const ta = tileState(A, scatter.A, uAlign);
    const inA = 1 - P(t, 9.95, 10.7, E.out);
    const uX = P(t, 13.0, 13.6, E.io);
    const ex = { x: lerp(ta.x, 0, uX), y: lerp(ta.y, 0, uX), w: lerp(ta.w, 1080, uX), h: lerp(ta.h, 1920, uX), r: ta.r, s: ta.s };
    placeTile(tileA, ex, { x: -560 * inA });
    tileA.style.borderRadius = `${6 * (1 - uX)}px`;
    O(tileAin, 1 - P(t, 13.0, 13.18));
    const tc = tileState(Ct, scatter.C, uAlign);
    placeTile(tileC, tc, { y: 700 * (1 - P(t, 10.08, 10.85, E.out)) + 40 * exit });
    O(tileC, 1 - exit);
    statementAt(st5, t, 10.2, 12.95, 0.1, 0.85);
    // shared grid draws in as the pieces line up
    grid5Lines.forEach((l, i) => {
      const len = 1000;
      l.setAttribute("stroke-dasharray", len);
      l.setAttribute("stroke-dashoffset", len * (1 - P(t, 11.2 + i * 0.04, 11.85 + i * 0.04, E.out)));
    });
    grid5.style.opacity = (0.5 - 0.28 * P(t, 12.1, 12.6)) * (1 - exit);
    // connections between the three wordmarks
    const cam = s4wrap.dataset.cam ? JSON.parse(s4wrap.dataset.cam) : null;
    const pA = [A.x + 40 + 60, A.y + 40 + 60];
    let pB = [Bt.x + Bt.w / 2, Bt.y + 80];
    if (cam) {
      const local = camApply(cam, screenPoint(22 + 11, 54 + 32));
      pB = [Bt.x + local[0], Bt.y + local[1]];
    }
    const sm = wn(CB, CB.sleeve_mark);
    const cs = Math.max(Ct.w / 1200, Ct.h / 1500);
    const pC = [Ct.x + (Ct.w - 1200 * cs) / 2 + sm[0] * 1200 * cs, Ct.y + (Ct.h - 1500 * cs) / 2 + sm[1] * 1200 * cs];
    const pts = [[pA, pB], [pB, pC], [pC, pA]];
    linkPaths.forEach((pth, i) => {
      const [a, b] = pts[i];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      pth.setAttribute("d", `M${a[0]},${a[1]} L${b[0]},${b[1]}`);
      pth.setAttribute("stroke-dasharray", len);
      pth.setAttribute("stroke-dashoffset", len * (1 - P(t, 11.9 + i * 0.12, 12.5 + i * 0.12, E.out)));
    });
    [pA, pB, pC].forEach((p, i) => {
      const k = P(t, 11.86 + i * 0.1, 12.2 + i * 0.1, E.out);
      linkDots[i].setAttribute("cx", p[0]); linkDots[i].setAttribute("cy", p[1]);
      linkDots[i].setAttribute("r", 9 * k);
    });
    links5.style.opacity = 1 - exit;
  }

  // ---------------------------------------------------------------- S6a
  const on6a = t > 13.5 && t < 20.9;
  show(s6a, on6a);
  if (on6a) {
    O(s6a, P(t, 13.52, 13.6));
    const yOut = -1920 * P(t, 20.32, 20.82, E.io);
    s6a.style.transform = `translateY(${yOut}px)`;
    gridLines.forEach((l, i) => l.setAttribute("stroke-dashoffset", 1920 * (1 - P(t, 13.6 + i * 0.07, 14.3 + i * 0.07, E.out))));
    constr.querySelector("#grid").style.opacity = 1 - P(t, 16.1, 16.7, E.soft);
    sqline.setAttribute("stroke-dashoffset", 4 * SQ.w * (1 - P(t, 13.8, 14.5, E.out)));
    circles.forEach((c, i) => {
      const L = circ(RR[i]);
      c.setAttribute("stroke-dashoffset", L * (1 - P(t, 14.25 + i * 0.2, 15.15 + i * 0.2, E.out)));
    });
    constr.querySelector("#circles").style.opacity = 1 - P(t, 15.8, 16.4, E.soft);
    idots.forEach((d, i) => {
      const k = P(t, 14.55 + Math.floor(i / 2) * 0.2, 14.9 + Math.floor(i / 2) * 0.2, E.out) * (1 - P(t, 15.8, 16.3));
      d.setAttribute("r", 7 * k);
    });
    const fill = P(t, 15.45, 16.1, E.soft);
    sqfill.style.opacity = fill;
    rings6.style.opacity = fill;
    // the finished mark moves into the identity layout
    const um = P(t, 16.7, 17.45, E.io);
    const sc = lerp(1, 200 / 480, um);
    const tx = lerp(0, 84 - SQ.x * sc, um), ty = lerp(0, 410 - SQ.y * sc, um);
    mark6.setAttribute("transform", `translate(${tx},${ty}) scale(${sc})`);
    mark6.querySelector("#sqline").style.opacity = 1 - fill;
    const wu = P(t, 17.25, 17.95, E.out);
    wm6.style.clipPath = `inset(0 ${100 - 100 * wu}% 0 0)`;
    O(type6, P(t, 17.55, 18.1, E.soft));
    type6.style.transform = `translateY(${30 * (1 - P(t, 17.55, 18.3, E.out))}px)`;
    swatches.forEach((n, i) => {
      const k = P(t, 17.9 + i * 0.09, 18.65 + i * 0.09, E.out);
      O(n, k);
      n.style.transform = `translateY(${70 * (1 - k)}px)`;
    });
    O(rings6dev, P(t, 18.3, 19.2, E.soft));
    const drift = lerp(1, 1.025, P(t, 16.8, 20.4, E.sine));
    s6aBoard.style.transform = `translate(${540 * (1 - drift)}px,${900 * (1 - drift)}px) scale(${drift})`;
  }

  // ---------------------------------------------------------------- S6b
  const on6b = t > 20.3 && t < 22.25;
  show(s6b, on6b);
  if (on6b) {
    const yIn = 1920 * (1 - P(t, 20.32, 20.82, E.io)) - 1920 * P(t, 21.7, 22.2, E.io);
    const z = lerp(1.0, 1.045, P(t, 20.4, 22.2, E.sine));
    s6b.style.transform = `translateY(${yIn}px)`;
    T(s6bImg, { x: 540 * (1 - z), y: 1050 * (1 - z), s: z });
  }

  // ---------------------------------------------------------------- S6c
  const on6c = t > 21.65 && t < 24.05;
  show(s6c, on6c);
  if (on6c) {
    const yIn = 1920 * (1 - P(t, 21.7, 22.2, E.io));
    s6c.style.transform = `translateY(${yIn}px)`;
    O(s6c, 1 - P(t, 23.6, 23.95, E.soft));
    const d = P(t, 21.7, 23.9, E.sine);
    T(s6cBg, { x: lerp(-64.8, -80, d), y: lerp(-115, -150, d), s: 1209.6 / FLW });
    posts6.forEach((n, i) => {
      const k = P(t, 21.95 + i * 0.1, 22.65 + i * 0.1, E.out);
      O(n, k);
      n.style.transform = `translate(${(1 - k) * 160 - 18 * d}px,0)`;
    });
  }

  // ---------------------------------------------------------------- S7
  const on7 = t > 23.55 && t < 27.05;
  show(s7, on7);
  if (on7) {
    O(s7, P(t, 23.6, 23.92, E.soft));
    const u = P(t, 23.62, 25.55, E.io);
    const sB = loglerp(2.2, 1, u);
    const pivot = [385, 835];
    const pos = mix2([540, 980], pivot, u);
    board.style.transform = `translate(${pos[0] - sB * pivot[0]}px,${pos[1] - sB * pivot[1]}px) scale(${sB})`;
    tiles7.forEach((n, i) => {
      const k = P(t, 26.45 + i * 0.045, 26.75 + i * 0.045, E.soft);
      O(n, 1 - k);
      n.style.transform = `scale(${1 - 0.03 * k})`;
    });
    statementAt(st7, t, 24.5, 26.55, 0.1, 0.85);
  }

  // ---------------------------------------------------------------- S8
  const on8 = t > 26.4;
  show(s8, on8);
  if (on8) {
    const k = P(t, 26.95, 27.8, E.out);
    O(logo, k);
    logo.style.transform = `translateY(${880 - 39}px) scale(${lerp(0.965, 1, k)})`;
    logo.style.transformOrigin = "540px 39px";
    const k2 = P(t, 27.55, 28.25, E.out);
    O(tagline, k2);
    tagline.style.transform = `translateY(${1000 + 12 * (1 - k2)}px)`;
  }

  // ---------------------------------------------------------------- labels
  let lab = null;
  for (const l of LABELS) if (t >= l[1] - 0.05 && t <= l[2] + 0.35) lab = l;
  show(label, !!lab);
  if (lab) {
    labelTxt.textContent = lab[0];
    const i = P(t, lab[1], lab[1] + 0.7, E.out);
    const o = 1 - P(t, lab[2], lab[2] + 0.25, E.soft);
    labelTxt.style.transform = `translateY(${(1 - i) * 115}%)`;
    label.querySelector(".dot").style.transform = `scale(${P(t, lab[1] - 0.05, lab[1] + 0.35, E.out)})`;
    O(label, o);
  }
  const chapter = t >= 16.85 && t < 23.6;
  show(dashes, chapter);
  if (chapter) {
    const idx = t < 20.5 ? 0 : t < 21.9 ? 1 : 2;
    dashEls.forEach((d, i) => d.classList.toggle("on", i === idx));
    O(dashes, P(t, 16.95, 17.4, E.soft) * (1 - P(t, 23.45, 23.7, E.soft)));
  }

  // ---------------------------------------------------------------- grain
  const f = Math.round(t * 30);
  grain.style.backgroundImage = `url(${grainTiles[f % 4]})`;
  grain.style.backgroundPosition = `${(f * 37) % 256}px ${(f * 91) % 256}px`;
}

// ================================================================== boot

stage.appendChild(s4wrap); // phone layer sits above S3, below S2/S1
stage.insertBefore(s4wrap, s2);
stage.insertBefore(links5, s2); // connections draw over the phone tile
stage.appendChild(tagEl);
stage.appendChild(hints);
stage.appendChild(st1.n);
stage.appendChild(label);
stage.appendChild(dashes);
stage.appendChild(grain);

await document.fonts.ready;
await Promise.all(["600 40px 'Inter Tight'", "500 40px 'Inter Tight'", "400 40px 'Inter Tight'",
  "italic 400 40px 'Instrument Serif'", "300 40px Jost", "400 40px Jost", "500 40px Jost"].map((f) => document.fonts.load(f)));
const urls = new Set([...document.querySelectorAll("img")].map((i) => i.src));
for (const n of document.querySelectorAll("[style*='url(']")) {
  const m = n.style.backgroundImage.match(/url\("?(.*?)"?\)/);
  if (m) urls.add(new URL(m[1], location.href).href);
}
await Promise.all([...urls].map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => console.error("image failed", u)); }));

{
  const keep = screen.style.transform;
  screen.style.transform = "none";
  const c = cta.getBoundingClientRect(), r = screen.getBoundingClientRect();
  ctaC = [c.left - r.left + c.width / 2, c.top - r.top + c.height / 2];
  screen.style.transform = keep;
}
window.seek = (t) => new Promise((res) => { render(t); requestAnimationFrame(() => requestAnimationFrame(res)); });
window.duration = TL.duration;
window.fps = TL.fps;
render(Number(Q.get("t") || 0));
window.ready = true;
