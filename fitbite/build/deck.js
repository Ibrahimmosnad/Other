// FitBite marketing strategy deck for an executive audience.
// Every fact comes from the source strategy (source/FitBite_Marketing_Strategy.pdf).
// Usage (from fitbite/): node build/deck.js
// Writes out/FitBite_Marketing_Strategy_Deck.pptx with the brand theme and a
// fade transition on every slide.

const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");
const gi = require("react-icons/gi");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "FitBite_Marketing_Strategy_Deck.pptx");
const fs = require("fs");
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
const LOGO = (f) => path.join(ROOT, "logo", f);

const THEME = {
  name: "FitBite",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1E2B25", // body text
    lt1: "FFFFFF",
    dk2: "0E3B2E", // deep green, the dominant brand colour
    lt2: "F2F6F3", // pale green-grey card fill
    accent1: "FF7A1A", // energy orange
    accent2: "2E9E5B", // leaf green
    accent3: "FFC23C", // sun yellow
    accent4: "E94F6E", // berry
    accent5: "1A9A93", // teal
    accent6: "5E6E66", // muted text
    hlink: "1A9A93",
    folHlink: "5E6E66",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "FitBite Healthy Snack: Marketing Strategy";
pres.subject = "Marketing strategy for FitBite Healthy Snack";
pres.author = "FitBite";
pres.company = "FitBite";
const C = pres.SchemeColor;

const W = 13.333;
const M = 0.6; // side margin
const CW = W - 2 * M; // content width

// ---------- icons ----------
async function icon(Comp, hex, px = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + hex, size: px })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 10, offset: 2, angle: 90 });

// Colour roles: the scheme colour for fills, plus the hex used to tint the
// icon glyph that sits on it (icons are images, so they need real hex).
const SWATCH = {
  orange: { fill: C.accent1, glyph: HEX.dk2 },
  green: { fill: C.accent2, glyph: HEX.lt1 },
  yellow: { fill: C.accent3, glyph: HEX.dk2 },
  berry: { fill: C.accent4, glyph: HEX.lt1 },
  teal: { fill: C.accent5, glyph: HEX.lt1 },
  ink: { fill: C.text2, glyph: HEX.lt1 },
  muted: { fill: C.accent6, glyph: HEX.lt1 },
};
const TINT = { orange: C.accent1, green: C.accent2, yellow: C.accent3, berry: C.accent4, teal: C.accent5 };

async function iconCircle(slide, name, x, y, d, swatch, Comp, glyphHex) {
  const s = SWATCH[swatch];
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: d, h: d, fill: { color: s.fill }, line: { type: "none" }, objectName: name + " circle",
  });
  const g = d * 0.52;
  slide.addImage({
    data: await icon(Comp, glyphHex || s.glyph), x: x + (d - g) / 2, y: y + (d - g) / 2, w: g, h: g,
    altText: name, objectName: name + " icon",
  });
}

function card(slide, name, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: opts.radius ?? 0.18,
    fill: opts.fill || { color: C.background1 },
    line: opts.line || { type: "none" },
    shadow: opts.shadow ? shadow() : undefined,
    objectName: name,
  });
}

function text(slide, name, str, x, y, w, h, opts = {}) {
  slide.addText(str, {
    x, y, w, h, isTextBox: true, margin: 0, valign: "top", fontSize: 15, color: C.text1,
    objectName: name, ...opts,
  });
}

// Small coloured "energy ball" dot before the section label, in the section's colour.
function kicker(slide, label, swatch) {
  slide.addShape(pres.shapes.OVAL, {
    x: M, y: 0.53, w: 0.16, h: 0.16, fill: { color: SWATCH[swatch].fill }, line: { type: "none" },
    objectName: "Section dot",
  });
  slide.addText(label, { placeholder: "kicker" });
}

// ---------- layouts ----------
const footer = (dark) => [
  { image: { path: LOGO("fitbite-icon.png"), x: M, y: 6.98, w: 0.3, h: 0.3 } },
  {
    text: {
      text: "FitBite  ·  Marketing Strategy",
      options: { x: M + 0.42, y: 6.96, w: 4, h: 0.34, margin: 0, fontSize: 11, valign: "middle",
        color: dark ? C.background1 : C.accent6 },
    },
  },
];
const placeholders = (dark) => [
  {
    placeholder: {
      options: { name: "kicker", type: "body", x: M + 0.28, y: 0.44, w: 9, h: 0.34, margin: 0,
        fontSize: 12, bold: true, charSpacing: 2, valign: "middle", color: dark ? C.accent3 : C.text2 },
      text: "",
    },
  },
  {
    placeholder: {
      options: { name: "title", type: "title", x: M, y: 0.82, w: CW, h: 0.82, margin: 0,
        fontSize: 34, bold: true, align: "left", valign: "top", color: dark ? C.background1 : C.text2 },
      text: "",
    },
  },
];
const slideNumber = (dark) => ({
  x: W - M - 0.8, y: 6.96, w: 0.8, h: 0.34, align: "right", fontSize: 11,
  color: dark ? C.background1 : C.accent6,
});

pres.defineSlideMaster({ title: "FB Cover", background: { color: C.text2 }, objects: [] });
pres.defineSlideMaster({
  title: "FB Content", background: { color: C.background1 },
  objects: [...footer(false), ...placeholders(false)], slideNumber: slideNumber(false),
});
pres.defineSlideMaster({
  title: "FB Dark", background: { color: C.text2 },
  objects: [
    { image: { path: LOGO("fitbite-icon.png"), x: M, y: 6.98, w: 0.3, h: 0.3 } },
    footer(true)[1],
    ...placeholders(true),
  ],
  slideNumber: slideNumber(true),
});

function addSlide(layout, section) {
  return pres.addSlide({ masterName: layout, sectionTitle: section });
}

// ---------- slides ----------
async function build() {
  // 1. Cover -------------------------------------------------------------
  pres.addSection({ title: "Introduction" });
  {
    const s = addSlide("FB Cover", "Introduction");
    // Floating energy balls: the deck's circle motif.
    s.addShape(pres.shapes.OVAL, { x: 11.9, y: 0.55, w: 0.7, h: 0.7, fill: { color: C.accent3 }, line: { type: "none" }, objectName: "Decor yellow" });
    s.addShape(pres.shapes.OVAL, { x: 7.35, y: 5.95, w: 0.42, h: 0.42, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "Decor berry" });
    s.addShape(pres.shapes.OVAL, { x: 12.2, y: 5.85, w: 1.0, h: 1.0, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "Decor green" });
    s.addShape(pres.shapes.OVAL, { x: 6.9, y: 1.0, w: 0.26, h: 0.26, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "Decor orange" });
    const lw = 4.7;
    s.addImage({ path: LOGO("fitbite-logo-stacked-white.png"), x: 7.75, y: 1.45, w: lw, h: lw / (2000 / 1760),
      altText: "FitBite healthy snack logo", objectName: "FitBite logo" });

    text(s, "Cover label", "EXECUTIVE BRIEFING", M + 0.1, 1.55, 6, 0.4, { fontSize: 14, bold: true, charSpacing: 3, color: C.accent3 });
    text(s, "Cover title", "Marketing Strategy", M + 0.1, 2.05, 6.6, 1.9, { fontSize: 60, bold: true, color: C.background1, fontFace: THEME.headFontFace });
    text(s, "Cover subtitle", "FitBite Healthy Snack", M + 0.1, 3.95, 6.6, 0.6, { fontSize: 28, bold: true, color: C.accent1 });
    text(s, "Cover tagline", "“Great Taste, Convenient Energy, Ready for Your Day!”", M + 0.1, 4.75, 6.4, 0.9, { fontSize: 20, italic: true, color: C.background1 });
    s.addNotes("Welcome. This briefing walks through the FitBite marketing strategy: what the product is, who it is for, how we will price, place and promote it, and how we will keep customers coming back.");
  }

  // 2. At a glance -------------------------------------------------------
  {
    const s = addSlide("FB Content", "Introduction");
    kicker(s, "EXECUTIVE SUMMARY", "orange");
    s.addText("FitBite at a glance", { placeholder: "title" });
    text(s, "Summary line", "A locally made, affordable snack designed around a real customer need, and launched with penetration pricing, free sampling and a loyalty program.",
      M, 1.68, CW, 0.7, { fontSize: 17, color: C.accent6 });

    const stats = [
      ["1,000 SDG", "Introductory price per pack", "orange", fa.FaTag],
      ["≈ 33% lower", "Than the estimated 1,500 SDG competitor price", "green", fa.FaArrowTrendDown],
      ["Ages 16–35", "Students and employees with low to middle incomes", "yellow", fa.FaUsers],
      ["3 cities", "Khartoum, Omdurman and Bahri at launch", "berry", fa.FaLocationDot],
    ];
    const cw = (CW - 3 * 0.3) / 4;
    for (let i = 0; i < stats.length; i++) {
      const [num, label, sw, ico] = stats[i];
      const x = M + i * (cw + 0.3), y = 2.6;
      card(s, `Stat card ${i + 1}`, x, y, cw, 2.25, { fill: { color: TINT[sw], transparency: 86 } });
      await iconCircle(s, `Stat ${i + 1}`, x + 0.3, y + 0.3, 0.7, sw, ico);
      text(s, `Stat ${i + 1} value`, num, x + 0.3, y + 1.1, cw - 0.5, 0.55, { fontSize: 28, bold: true, color: C.text2 });
      text(s, `Stat ${i + 1} label`, label, x + 0.3, y + 1.62, cw - 0.5, 0.6, { fontSize: 14 });
    }

    text(s, "How we win label", "HOW WE WIN", M, 5.12, 4, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.text2 });
    const wins = [
      "Built on real customer needs: the Marketing Concept",
      "Penetration pricing plus free samples on campus and at gyms",
      "Loyalty that rewards habit: buy 9 packs, get 1 free",
    ];
    const pw = (CW - 2 * 0.3) / 3;
    for (let i = 0; i < wins.length; i++) {
      const x = M + i * (pw + 0.3), y = 5.5;
      card(s, `Win ${i + 1}`, x, y, pw, 1.05, { fill: { color: C.text2 } });
      s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.3, w: 0.45, h: 0.45, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `Win ${i + 1} dot` });
      text(s, `Win ${i + 1} number`, String(i + 1), x + 0.25, y + 0.3, 0.45, 0.45, { fontSize: 15, bold: true, align: "center", valign: "middle", color: C.text2 });
      text(s, `Win ${i + 1} text`, wins[i], x + 0.88, y + 0.12, pw - 1.05, 0.81, { fontSize: 15, bold: true, valign: "middle", color: C.background1 });
    }
    s.addNotes("The headline: FitBite is a low-cost, locally familiar snack for students and young employees. It enters at 1,000 Sudanese pounds against roughly 1,500 for competitors, which is about a third cheaper. We start in Khartoum, Omdurman and Bahri. We win by building around customer needs, pricing for penetration, sampling heavily, and rewarding repeat purchases.");
  }

  // 3. Agenda ------------------------------------------------------------
  {
    const s = addSlide("FB Content", "Introduction");
    kicker(s, "AGENDA", "green");
    s.addText("What we will cover", { placeholder: "title" });
    const items = [
      ["01", "Product and orientation", "What FitBite is and why we lead with customer needs", "orange"],
      ["02", "Competition", "Who we compete with and where we win", "green"],
      ["03", "Segmentation", "Four ways we divide the market", "yellow"],
      ["04", "Target market", "Who we serve first, and meet Ahmed", "berry"],
      ["05", "Marketing mix", "Product, Price, Place and Promotion", "teal"],
      ["06", "Customer relationships", "How we turn first bites into loyalty", "ink"],
    ];
    const tw = (CW - 2 * 0.3) / 3, th = 2.25;
    items.forEach(([n, head, sub, sw], i) => {
      const x = M + (i % 3) * (tw + 0.3), y = 1.9 + Math.floor(i / 3) * (th + 0.3);
      card(s, `Agenda ${n}`, x, y, tw, th, { fill: { color: C.background2 } });
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.8, h: 0.8, fill: { color: SWATCH[sw].fill }, line: { type: "none" }, objectName: `Agenda ${n} circle` });
      const onDark = ["green", "berry", "teal", "ink"].includes(sw);
      text(s, `Agenda ${n} number`, n, x + 0.3, y + 0.3, 0.8, 0.8, { fontSize: 20, bold: true, align: "center", valign: "middle", color: onDark ? C.background1 : C.text2 });
      text(s, `Agenda ${n} title`, head, x + 0.3, y + 1.2, tw - 0.6, 0.4, { fontSize: 19, bold: true, color: C.text2 });
      text(s, `Agenda ${n} detail`, sub, x + 0.3, y + 1.6, tw - 0.6, 0.55, { fontSize: 14, color: C.accent6 });
    });
    s.addNotes("Six parts, then the plan on one page. Each section has its own colour, and the dot next to each slide's label tells you which section you are in.");
  }

  // 4. Product -----------------------------------------------------------
  pres.addSection({ title: "Product and orientation" });
  {
    const s = addSlide("FB Content", "Product and orientation");
    kicker(s, "01  ·  PRODUCT AND ORIENTATION", "orange");
    s.addText("A familiar snack built for busy days", { placeholder: "title" });
    text(s, "Product summary", "Nutritious local ingredients in a small, easy-to-carry pack, designed for busy students and employees.",
      M, 1.68, 6.7, 0.7, { fontSize: 17, color: C.accent6 });

    text(s, "Ingredients label", "WHAT'S INSIDE", M, 2.6, 4, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.text2 });
    const ing = [
      ["Dates", "orange", gi.GiPalmTree],
      ["Peanuts", "yellow", gi.GiPeanut],
      ["Oats", "green", gi.GiWheat],
      ["Sesame", "teal", gi.GiSesame],
    ];
    for (let i = 0; i < ing.length; i++) {
      const [label, sw, ico] = ing[i];
      const x = M + i * 1.68;
      await iconCircle(s, label, x, 3.0, 1.3, sw, ico);
      text(s, `${label} label`, label, x - 0.15, 4.4, 1.6, 0.4, { fontSize: 18, bold: true, align: "center", color: C.text2 });
    }
    const facts = [
      [fa.FaBoxOpen, "Small, convenient pack with product information, expiry date and allergen warnings"],
      [fa.FaBolt, "A brand that reflects an active, convenient lifestyle"],
    ];
    for (let i = 0; i < facts.length; i++) {
      const y = 5.1 + i * 0.75;
      await iconCircle(s, `Product fact ${i + 1}`, M, y, 0.5, "ink", facts[i][0]);
      text(s, `Product fact ${i + 1} text`, facts[i][1], M + 0.7, y - 0.04, 6.2, 0.6, { fontSize: 15, valign: "middle" });
    }

    const cx = 7.75, cwid = W - M - cx;
    card(s, "Core value card", cx, 1.75, cwid, 4.85, { fill: { color: C.text2 } });
    text(s, "Core value label", "CORE VALUE", cx + 0.45, 2.1, 4, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.accent3 });
    const values = [
      [fa.FaFaceGrinStars, "Great taste", "Made from familiar, popular local ingredients"],
      [fa.FaClock, "Convenience", "A small pack that is easy to carry anywhere"],
      [fa.FaWallet, "Affordability", "Only 1,000 SDG per pack"],
    ];
    for (let i = 0; i < values.length; i++) {
      const y = 2.6 + i * 1.28;
      await iconCircle(s, values[i][1], cx + 0.45, y, 0.8, "orange", values[i][0]);
      text(s, `${values[i][1]} title`, values[i][1], cx + 1.5, y + 0.02, cwid - 1.9, 0.45, { fontSize: 22, bold: true, color: C.background1 });
      text(s, `${values[i][1]} detail`, values[i][2], cx + 1.5, y + 0.45, cwid - 1.9, 0.4, { fontSize: 15, color: C.background1 });
    }
    s.addNotes("FitBite is made from dates, peanuts, oats and sesame seeds: ingredients that are familiar and nutritious. The pack is small and practical. The core value combines great taste, convenience and affordability at 1,000 Sudanese pounds.");
  }

  // 5. Exchange ----------------------------------------------------------
  {
    const s = addSlide("FB Content", "Product and orientation");
    kicker(s, "01  ·  PRODUCT AND ORIENTATION", "orange");
    s.addText("A fair exchange that pays back twice", { placeholder: "title" });

    const d = 3.3, y = 2.05;
    const lx = 1.0, rx = W - 1.0 - d;
    s.addShape(pres.shapes.OVAL, { x: lx, y, w: d, h: d, fill: { color: C.accent1, transparency: 84 }, line: { type: "none" }, objectName: "Customer circle" });
    await iconCircle(s, "Customers", lx + (d - 1.0) / 2, y + 0.55, 1.0, "orange", fa.FaUsers);
    text(s, "Customer label", "Customers", lx, y + 1.7, d, 0.5, { fontSize: 24, bold: true, align: "center", color: C.text2 });
    text(s, "Customer detail", "Students and employees", lx, y + 2.2, d, 0.4, { fontSize: 15, align: "center" });

    s.addShape(pres.shapes.OVAL, { x: rx, y, w: d, h: d, fill: { color: C.text2 }, line: { type: "none" }, objectName: "FitBite circle" });
    s.addImage({ path: LOGO("fitbite-icon.png"), x: rx + (d - 1.25) / 2, y: y + 0.42, w: 1.25, h: 1.25, altText: "FitBite icon", objectName: "FitBite icon" });
    text(s, "FitBite label", "FitBite", rx, y + 1.7, d, 0.5, { fontSize: 24, bold: true, align: "center", color: C.background1 });
    text(s, "FitBite detail", "The company", rx, y + 2.2, d, 0.4, { fontSize: 15, align: "center", color: C.background1 });

    const ax1 = lx + d + 0.25, ax2 = rx - 0.25, aw = ax2 - ax1;
    const flows = [
      ["Money: 1,000 SDG per pack", 2.75, false, C.accent1, HEX.accent1],
      ["Valuable customer feedback", 3.75, false, C.accent5, HEX.accent5],
      ["Energy, nutrition and taste", 4.75, true, C.accent2, HEX.accent2],
    ];
    flows.forEach(([label, fy, back, col, hex], i) => {
      text(s, `Flow ${i + 1} label`, label, ax1, fy - 0.45, aw, 0.38, { fontSize: 16, bold: true, align: "center", color: C.text2 });
      s.addShape(pres.shapes.LINE, {
        x: ax1, y: fy, w: aw, h: 0,
        line: { color: col, width: 4, beginArrowType: back ? "triangle" : undefined, endArrowType: back ? undefined : "triangle" },
        objectName: `Flow ${i + 1} arrow`,
      });
    });
    text(s, "Exchange caption", "Customers get a snack that delivers on taste, energy and price. FitBite earns revenue and the feedback it needs to keep improving.",
      M, 5.85, CW, 0.7, { fontSize: 16, color: C.accent6, align: "center" });
    s.addNotes("The exchange is simple. Customers pay money and receive energy, nutrition and taste. The company receives revenue and, just as important, customer feedback that shapes the product.");
  }

  // 6. Orientation -------------------------------------------------------
  {
    const s = addSlide("FB Content", "Product and orientation");
    kicker(s, "01  ·  PRODUCT AND ORIENTATION", "orange");
    s.addText("We lead with the Marketing Concept", { placeholder: "title" });
    // The chosen orientation gets the big dark card; the alternatives sit beside it.
    const lw = 5.2, y = 1.95, h = 4.6;
    card(s, "Marketing Concept card", M, y, lw, h, { fill: { color: C.text2 } });
    await iconCircle(s, "Marketing Concept", M + 0.45, y + 0.45, 1.0, "orange", fa.FaBullseye);
    card(s, "Our choice badge", M + lw - 1.85, y + 0.6, 1.4, 0.44, { fill: { color: C.accent3 }, radius: 0.22 });
    text(s, "Our choice text", "OUR CHOICE", M + lw - 1.85, y + 0.6, 1.4, 0.44, { fontSize: 12, bold: true, align: "center", valign: "middle", color: C.text2, charSpacing: 1 });
    text(s, "Marketing Concept title", "Marketing Concept", M + 0.45, y + 1.7, lw - 0.9, 0.6, { fontSize: 28, bold: true, color: C.background1 });
    text(s, "Marketing Concept focus", [
      { text: "Focus", options: { bold: true, breakLine: true, color: C.accent3 } },
      { text: "Understand and satisfy customers' needs and wants." },
    ], M + 0.45, y + 2.4, lw - 0.9, 0.85, { fontSize: 16, color: C.background1 });
    text(s, "Marketing Concept fit", [
      { text: "Why it fits FitBite", options: { bold: true, breakLine: true, color: C.accent3 } },
      { text: "The product was developed after identifying a real need: Ahmed, a student who needs an affordable, nutritious snack." },
    ], M + 0.45, y + 3.35, lw - 0.9, 1.1, { fontSize: 16, color: C.background1 });

    const alts = [
      ["Production Concept", "Efficiency and distribution.", "May overlook customer preferences.", fa.FaIndustry],
      ["Product Concept", "Quality and performance.", "Can lead to excessively high prices.", fa.FaStar],
      ["Selling Concept", "Aggressive promotion and sales.", "Little long-term customer loyalty.", fa.FaBullhorn],
    ];
    const rx = M + lw + 0.4, rw = W - M - rx, rgap = 0.15, rh = (h - 0.4 - 2 * rgap) / 3;
    text(s, "Alternatives label", "THE ALTERNATIVES WE SET ASIDE", rx, y, rw, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.accent6 });
    for (let i = 0; i < alts.length; i++) {
      const [head, focus, risk, ico] = alts[i];
      const ry = y + 0.4 + i * (rh + rgap);
      card(s, `${head} card`, rx, ry, rw, rh, { fill: { color: C.background2 } });
      await iconCircle(s, head, rx + 0.3, ry + (rh - 0.74) / 2, 0.74, "muted", ico);
      text(s, `${head} title`, head, rx + 1.3, ry + 0.14, rw - 1.5, 0.4, { fontSize: 19, bold: true, color: C.text2 });
      const colw = (rw - 1.3 - 0.45) / 2;
      text(s, `${head} focus`, [
        { text: "Focus  ", options: { bold: true, color: C.text2 } },
        { text: focus },
      ], rx + 1.3, ry + 0.56, colw, 0.65, { fontSize: 14 });
      text(s, `${head} risk`, [
        { text: "Risk  ", options: { bold: true, color: C.accent4 } },
        { text: risk },
      ], rx + 1.3 + colw + 0.25, ry + 0.56, colw, 0.65, { fontSize: 14 });
    }
    s.addNotes("We chose the Marketing Concept: start from what customers need and want. FitBite came out of a real need, represented by our persona Ahmed. The alternatives each carry a risk: the Production Concept can ignore preferences, the Product Concept can push prices too high, and the Selling Concept leans on aggressive promotion rather than loyalty.");
  }

  // 7. Competition -------------------------------------------------------
  pres.addSection({ title: "Competition" });
  {
    const s = addSlide("FB Content", "Competition");
    kicker(s, "02  ·  COMPETITION", "green");
    s.addText("We compete for every snack break", { placeholder: "title" });
    const panels = [
      ["Direct competitors", "Products with similar benefits that serve the same purpose: energy bars and snack products.", ["Tiger Bar", "Break Bar", "Abu Auf", "Datto"], "orange", fa.FaBullseye],
      ["Indirect competitors", "Alternatives customers may buy instead to satisfy their hunger.", ["Royal biscuits", "Captain Majid chips", "Cadbury chocolate", "Bakery products", "Fresh fruits"], "green", fa.FaCookieBite],
    ];
    const pw = (CW - 0.4) / 2, y = 1.95, h = 4.65;
    for (let i = 0; i < panels.length; i++) {
      const [head, desc, chips, sw, ico] = panels[i];
      const x = M + i * (pw + 0.4);
      card(s, `${head} panel`, x, y, pw, h, { fill: { color: TINT[sw], transparency: 86 } });
      await iconCircle(s, head, x + 0.4, y + 0.4, 0.85, sw, ico);
      text(s, `${head} title`, head, x + 1.45, y + 0.42, pw - 1.8, 0.5, { fontSize: 24, bold: true, color: C.text2 });
      text(s, `${head} count`, i === 0 ? `${chips.length} brands` : `${chips.length} alternatives`, x + 1.45, y + 0.9, pw - 1.8, 0.35, { fontSize: 14, color: C.accent6 });
      text(s, `${head} description`, desc, x + 0.4, y + 1.5, pw - 0.8, 0.8, { fontSize: 16 });
      const chw = (pw - 0.8 - 0.25) / 2;
      chips.forEach((c, j) => {
        const cx = x + 0.4 + (j % 2) * (chw + 0.25), cy = y + 2.45 + Math.floor(j / 2) * 0.72;
        card(s, `${c} chip`, cx, cy, chw, 0.56, { fill: { color: C.background1 }, radius: 0.28, shadow: true });
        text(s, `${c} name`, c, cx, cy, chw, 0.56, { fontSize: 16, bold: true, align: "center", valign: "middle", color: C.text2 });
      });
    }
    s.addNotes("Direct competitors offer similar benefits for the same purpose: Tiger Bar, Break Bar, Abu Auf and Datto. Indirect competitors are anything else people buy to satisfy hunger: Royal biscuits, Captain Majid chips, Cadbury chocolate, bakery products and fresh fruit.");
  }

  // 8. Advantage ---------------------------------------------------------
  {
    const s = addSlide("FB Content", "Competition");
    kicker(s, "02  ·  COMPETITION", "green");
    s.addText("Three advantages set FitBite apart", { placeholder: "title" });
    const adv = [
      ["Familiar local ingredients", "Ingredients that are familiar and popular among Sudanese consumers.", "orange", fa.FaSeedling],
      ["Convenient packaging", "A small, practical pack that is easy to carry and eat anywhere.", "teal", fa.FaBoxOpen],
      ["Affordable price", "1,000 SDG, compared with about 1,500 SDG for many competing products.", "green", fa.FaWallet],
    ];
    for (let i = 0; i < adv.length; i++) {
      const [head, body, sw, ico] = adv[i];
      const y = 2.0 + i * 1.55;
      await iconCircle(s, head, M, y, 0.95, sw, ico);
      text(s, `${head} title`, head, M + 1.25, y + 0.02, 5.3, 0.45, { fontSize: 21, bold: true, color: C.text2 });
      text(s, `${head} detail`, body, M + 1.25, y + 0.5, 5.3, 0.8, { fontSize: 16 });
    }
    const cx = 7.55, cwid = W - M - cx;
    card(s, "Price chart card", cx, 1.9, cwid, 4.7, { fill: { color: C.background2 } });
    s.addChart(pres.charts.BAR, [{ name: "Price per pack (SDG)", labels: ["FitBite", "Competing products (est.)"], values: [1000, 1500] }], {
      x: cx + 0.25, y: 2.05, w: cwid - 0.5, h: 3.75, barDir: "col", barGapWidthPct: 70,
      chartColors: [HEX.accent1, HEX.accent5],
      showTitle: true, title: "Price per pack (SDG)", titleFontSize: 16, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0", dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelColor: HEX.dk2, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 14, catAxisLabelFontFace: "+mn-lt", catAxisLineShow: false,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 1800, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, plotArea: { fill: { color: HEX.lt2 } }, chartArea: { fill: { color: HEX.lt2 } },
      objectName: "Price comparison chart",
    });
    text(s, "Chart caption", "About one-third cheaper. The competitor price is an estimate.", cx + 0.35, 5.9, cwid - 0.7, 0.5, { fontSize: 14, color: C.accent6 });
    s.addNotes("Our three advantages: ingredients Sudanese consumers already know and like, a pack that is easy to carry, and a price of 1,000 pounds versus about 1,500 for many competitors. That is roughly a third cheaper. The competitor price is an estimate.");
  }

  // 9. Segmentation ------------------------------------------------------
  pres.addSection({ title: "Segmentation" });
  {
    const s = addSlide("FB Content", "Segmentation");
    kicker(s, "03  ·  SEGMENTATION", "yellow");
    s.addText("Four lenses on the market", { placeholder: "title" });
    const segs = [
      ["Demographic", "Ages 16 to 35, especially students and employees with low to middle incomes.", "orange", fa.FaUsers],
      ["Geographic", "Khartoum, Omdurman and Bahri, near universities, gyms and other places our customers visit.", "green", fa.FaLocationDot],
      ["Psychographic", "People who prefer convenient, familiar and affordable snacks that fit an active lifestyle.", "yellow", fa.FaHeartPulse],
      ["Behavioral", "Regular snack buyers who need a quick refreshment during breaks and respond to discounts, offers and multipacks.", "berry", fa.FaCartShopping],
    ];
    const gw = (CW - 0.4) / 2, gh = 2.2;
    for (let i = 0; i < segs.length; i++) {
      const [head, body, sw, ico] = segs[i];
      const x = M + (i % 2) * (gw + 0.4), y = 1.95 + Math.floor(i / 2) * (gh + 0.3);
      card(s, `${head} card`, x, y, gw, gh, { fill: { color: TINT[sw], transparency: 86 } });
      await iconCircle(s, head, x + 0.4, y + 0.4, 0.95, sw, ico);
      text(s, `${head} title`, head, x + 1.65, y + 0.4, gw - 2.0, 0.45, { fontSize: 22, bold: true, color: C.text2 });
      text(s, `${head} detail`, body, x + 1.65, y + 0.9, gw - 2.0, 1.15, { fontSize: 16 });
    }
    s.addNotes("We segment on four dimensions. Demographic: 16 to 35, students and employees on low to middle incomes. Geographic: Khartoum, Omdurman and Bahri, near universities and gyms. Psychographic: people who want convenient, familiar, affordable snacks for an active life. Behavioral: regular snack buyers who need quick refreshment and respond to discounts and multipacks.");
  }

  // 10. Target market ----------------------------------------------------
  pres.addSection({ title: "Target market" });
  {
    const s = addSlide("FB Content", "Target market");
    kicker(s, "04  ·  TARGET MARKET", "berry");
    s.addText("Students first, then gyms and professionals", { placeholder: "title" });
    const lw = 6.9;
    card(s, "Primary market card", M, 1.95, lw, 2.4, { fill: { color: C.text2 } });
    await iconCircle(s, "Primary market", M + 0.4, 2.35, 0.95, "orange", fa.FaGraduationCap);
    text(s, "Primary label", "PRIMARY TARGET", M + 1.65, 2.35, 4, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.accent3 });
    text(s, "Primary title", "University students aged 18 to 30", M + 1.65, 2.7, lw - 2.0, 0.5, { fontSize: 23, bold: true, color: C.background1 });
    text(s, "Primary detail", "Need affordable, tasty and convenient snacks during their studies and daily activities.", M + 1.65, 3.25, lw - 2.0, 0.9, { fontSize: 16, color: C.background1 });

    card(s, "Secondary market card", M, 4.6, lw, 1.95, { fill: { color: C.accent4, transparency: 86 } });
    await iconCircle(s, "Secondary market", M + 0.4, 4.95, 0.95, "berry", fa.FaDumbbell);
    text(s, "Secondary label", "SECONDARY TARGET", M + 1.65, 4.95, 4, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.text2 });
    text(s, "Secondary title", "Gym members and busy professionals", M + 1.65, 5.3, lw - 2.0, 0.5, { fontSize: 21, bold: true, color: C.text2 });
    text(s, "Secondary detail", "Need a quick snack during their daily routines.", M + 1.65, 5.82, lw - 2.0, 0.5, { fontSize: 16 });

    const rx = M + lw + 0.5, rw = W - M - rx;
    text(s, "Attractive title", "Why this market is attractive", rx, 1.98, rw, 0.45, { fontSize: 20, bold: true, color: C.text2 });
    const why = [
      [fa.FaRotate, "Repeat sales", "Students buy snacks regularly.", "green"],
      [fa.FaTiktok, "Affordable reach", "TikTok, Instagram and word of mouth among students.", "teal"],
    ];
    for (let i = 0; i < why.length; i++) {
      const y = 2.6 + i * 1.15;
      await iconCircle(s, why[i][1], rx, y, 0.7, why[i][3], why[i][0]);
      text(s, `${why[i][1]} title`, why[i][1], rx + 0.9, y - 0.02, rw - 0.9, 0.38, { fontSize: 17, bold: true, color: C.text2 });
      text(s, `${why[i][1]} detail`, why[i][2], rx + 0.9, y + 0.36, rw - 0.9, 0.65, { fontSize: 15 });
    }
    card(s, "Verify note card", rx, 5.0, rw, 1.55, { fill: { color: C.accent3, transparency: 75 } });
    text(s, "Verify note", [
      { text: "To verify: ", options: { bold: true } },
      { text: "the assumption that this market is more than 40% of the total market needs market research before it is presented as a confirmed figure." },
    ], rx + 0.3, 5.18, rw - 0.6, 1.2, { fontSize: 14, valign: "middle" });
    s.addNotes("Our primary target is university students aged 18 to 30. Secondary: gym members and busy professionals. Students buy snacks regularly, which means repeat sales, and they are cheap to reach through TikTok, Instagram and word of mouth. One caution: the idea that this market is more than 40 percent of the total is an assumption and must be checked with market research.");
  }

  // 11. Persona ----------------------------------------------------------
  {
    const s = addSlide("FB Content", "Target market");
    kicker(s, "04  ·  TARGET MARKET", "berry");
    s.addText("Meet Ahmed, the customer we designed for", { placeholder: "title" });
    const pw = 4.5;
    card(s, "Persona card", M, 1.95, pw, 4.65, { fill: { color: C.accent1, transparency: 84 } });
    await iconCircle(s, "Ahmed", M + (pw - 1.8) / 2, 2.25, 1.8, "orange", fa.FaUserGraduate);
    text(s, "Persona name", "Ahmed", M, 4.2, pw, 0.6, { fontSize: 32, bold: true, align: "center", color: C.text2 });
    text(s, "Persona role", "22 years old  ·  University student", M, 4.82, pw, 0.4, { fontSize: 17, align: "center" });
    card(s, "Budget pill", M + (pw - 2.2) / 2, 5.45, 2.2, 0.5, { fill: { color: C.text2 }, radius: 0.25 });
    text(s, "Budget pill text", "Limited budget", M + (pw - 2.2) / 2, 5.45, 2.2, 0.5, { fontSize: 15, bold: true, align: "center", valign: "middle", color: C.background1 });

    const rx = M + pw + 0.5, rw = W - M - rx;
    text(s, "Needs title", "What Ahmed needs", rx, 1.98, rw, 0.45, { fontSize: 20, bold: true, color: C.text2 });
    const needs = [
      ["Affordable", "A snack that fits a student budget", "green", fa.FaWallet],
      ["Tasty", "Something he enjoys eating", "yellow", fa.FaFaceGrinStars],
      ["Nutritious", "Energy and nutrition for a busy day", "teal", fa.FaSeedling],
      ["Portable", "Fits in his backpack, eaten between lectures", "berry", fa.FaClock],
    ];
    const tw = (rw - 0.3) / 2, th = 1.85;
    for (let i = 0; i < needs.length; i++) {
      const [head, body, sw, ico] = needs[i];
      const x = rx + (i % 2) * (tw + 0.3), y = 2.6 + Math.floor(i / 2) * (th + 0.2);
      card(s, `${head} need card`, x, y, tw, th, { fill: { color: C.background2 } });
      await iconCircle(s, head, x + 0.3, y + 0.3, 0.7, sw, ico);
      text(s, `${head} need title`, head, x + 1.2, y + 0.35, tw - 1.4, 0.45, { fontSize: 19, bold: true, color: C.text2 });
      text(s, `${head} need detail`, body, x + 0.3, y + 1.1, tw - 0.55, 0.65, { fontSize: 15 });
    }
    s.addNotes("Ahmed is 22, a university student on a limited budget. He needs a snack that is affordable, tasty and nutritious, that fits in his backpack and that he can eat between lectures. FitBite was designed for exactly this need.");
  }

  // 12. Product and Price ------------------------------------------------
  pres.addSection({ title: "Marketing mix" });
  {
    const s = addSlide("FB Content", "Marketing mix");
    kicker(s, "05  ·  MARKETING MIX", "teal");
    s.addText("Product and Price: an easy first purchase", { placeholder: "title" });
    text(s, "Mix intro", "The four Ps work together to attract students and employees and create competitive value.", M, 1.68, CW, 0.45, { fontSize: 17, color: C.accent6 });
    const pw = (CW - 0.4) / 2, y = 2.3, h = 4.3;

    // Product panel
    let x = M;
    card(s, "Product panel", x, y, pw, h, { fill: { color: C.accent1, transparency: 86 } });
    await iconCircle(s, "Product", x + 0.35, y + 0.35, 0.75, "orange", fa.FaCookieBite);
    text(s, "Product title", "Product", x + 1.3, y + 0.45, 3, 0.55, { fontSize: 24, bold: true, color: C.text2 });
    text(s, "Product bullets", [
      { text: "Familiar local ingredients: dates, peanuts, oats and sesame seeds", options: { bullet: true, breakLine: true } },
      { text: "Small pack with product information, expiry date and allergen warnings", options: { bullet: true, breakLine: true } },
      { text: "A brand that reflects an active, convenient lifestyle", options: { bullet: true } },
    ], x + 0.35, y + 1.3, pw - 0.7, 1.75, { fontSize: 15, paraSpaceAfter: 6 });
    card(s, "Message card", x + 0.35, y + 3.15, pw - 0.7, 0.9, { fill: { color: C.text2 } });
    text(s, "Message", "“Great Taste, Convenient Energy, Ready for Your Day!”", x + 0.55, y + 3.15, pw - 1.1, 0.9, { fontSize: 17, bold: true, italic: true, valign: "middle", color: C.background1 });

    // Price panel
    x = M + pw + 0.4;
    card(s, "Price panel", x, y, pw, h, { fill: { color: C.accent2, transparency: 86 } });
    await iconCircle(s, "Price", x + 0.35, y + 0.35, 0.75, "green", fa.FaTag);
    text(s, "Price title", "Price: market penetration", x + 1.3, y + 0.45, pw - 1.6, 0.55, { fontSize: 24, bold: true, color: C.text2 });
    const bw = (pw - 0.7 - 0.3) / 2;
    card(s, "FitBite price box", x + 0.35, y + 1.3, bw, 1.25, { fill: { color: C.background1 }, shadow: true });
    text(s, "FitBite price", "1,000 SDG", x + 0.55, y + 1.42, bw - 0.4, 0.55, { fontSize: 28, bold: true, color: C.text2 });
    text(s, "FitBite price label", "FitBite introductory price", x + 0.55, y + 1.98, bw - 0.4, 0.45, { fontSize: 14 });
    card(s, "Competitor price box", x + 0.35 + bw + 0.3, y + 1.3, bw, 1.25, { fill: { color: C.background1, transparency: 40 } });
    text(s, "Competitor price", "1,500 SDG", x + 0.55 + bw + 0.3, y + 1.42, bw - 0.4, 0.55, { fontSize: 28, bold: true, color: C.accent6 });
    text(s, "Competitor price label", "Estimated competitor price", x + 0.55 + bw + 0.3, y + 1.98, bw - 0.4, 0.45, { fontSize: 14, color: C.accent6 });
    text(s, "Price bullets", [
      { text: "Student discounts and multipack discounts", options: { bullet: true, breakLine: true } },
      { text: "Goal: encourage first-time purchases and build market share", options: { bullet: true } },
    ], x + 0.35, y + 2.85, pw - 0.7, 1.2, { fontSize: 15, paraSpaceAfter: 6 });
    s.addNotes("Product: local ingredients, a small pack that carries product information, expiry date and allergen warnings, and a brand built around an active lifestyle. The message is: Great Taste, Convenient Energy, Ready for Your Day. Price: market penetration. We enter at 1,000 pounds against an estimated 1,500, with student and multipack discounts, to drive first purchases and build share quickly.");
  }

  // 13. Place and Promotion ----------------------------------------------
  {
    const s = addSlide("FB Content", "Marketing mix");
    kicker(s, "05  ·  MARKETING MIX", "teal");
    s.addText("Place and Promotion: be where students are", { placeholder: "title" });
    const pw = (CW - 0.4) / 2, y = 1.95, h = 4.65;

    let x = M;
    card(s, "Place panel", x, y, pw, h, { fill: { color: C.accent3, transparency: 80 } });
    await iconCircle(s, "Place", x + 0.35, y + 0.35, 0.75, "yellow", fa.FaStore);
    text(s, "Place title", "Place", x + 1.3, y + 0.45, 3, 0.55, { fontSize: 24, bold: true, color: C.text2 });
    const places = [
      [fa.FaBasketShopping, "Local grocery stores and supermarkets"],
      [fa.FaGraduationCap, "University cafeterias"],
      [fa.FaDumbbell, "Gyms and fitness centers"],
      [fa.FaInstagram, "Online: Facebook, Instagram and TikTok"],
    ];
    const tw = (pw - 0.7 - 0.25) / 2, th = 1.4;
    for (let i = 0; i < places.length; i++) {
      const tx = x + 0.35 + (i % 2) * (tw + 0.25), ty = y + 1.35 + Math.floor(i / 2) * (th + 0.2);
      card(s, `Place ${i + 1} tile`, tx, ty, tw, th, { fill: { color: C.background1 }, shadow: true });
      await iconCircle(s, `Place ${i + 1}`, tx + 0.25, ty + 0.25, 0.55, "ink", places[i][0]);
      text(s, `Place ${i + 1} text`, places[i][1], tx + 0.25, ty + 0.85, tw - 0.45, 0.6, { fontSize: 15, bold: true, color: C.text2 });
    }

    x = M + pw + 0.4;
    card(s, "Promotion panel", x, y, pw, h, { fill: { color: C.accent4, transparency: 86 } });
    await iconCircle(s, "Promotion", x + 0.35, y + 0.35, 0.75, "berry", fa.FaBullhorn);
    text(s, "Promotion title", "Promotion", x + 1.3, y + 0.45, 3, 0.55, { fontSize: 24, bold: true, color: C.text2 });
    const promos = [
      [fa.FaMobileScreenButton, "Social media advertising"],
      [fa.FaGift, "Free samples at universities and gyms"],
      [fa.FaStar, "Influencers review and promote the product"],
      [fa.FaTag, "Posters and materials at points of sale"],
      [fa.FaComments, "Satisfied customers recommend us to friends and family"],
    ];
    for (let i = 0; i < promos.length; i++) {
      const ry = y + 1.35 + i * 0.64;
      await iconCircle(s, `Promotion ${i + 1}`, x + 0.35, ry, 0.48, "ink", promos[i][0]);
      text(s, `Promotion ${i + 1} text`, promos[i][1], x + 1.05, ry - 0.04, pw - 1.35, 0.56, { fontSize: 15, valign: "middle" });
    }
    s.addNotes("Place: grocery stores and supermarkets, university cafeterias, gyms and fitness centers, and direct online sales through Facebook, Instagram and TikTok. Promotion: social media ads, free samples at universities and gyms, influencer reviews, point-of-sale posters, and word of mouth from satisfied customers.");
  }

  // 14. CRM --------------------------------------------------------------
  pres.addSection({ title: "Customer relationships" });
  {
    const s = addSlide("FB Content", "Customer relationships");
    kicker(s, "06  ·  CUSTOMER RELATIONSHIPS", "ink");
    s.addText("Turning first bites into loyal customers", { placeholder: "title" });
    const nodes = [
      ["Satisfaction", "Good quality at affordable prices keeps customers happy.", "orange", fa.FaFaceGrinStars],
      ["Repeat purchases", "Special offers encourage customers to buy regularly.", "green", fa.FaRotate],
      ["Feedback", "We listen to improve the product and introduce new flavors.", "teal", fa.FaComments],
      ["Loyalty", "Trust built through the loyalty program.", "berry", fa.FaHeart],
    ];
    // Clockwise: top-left, top-right, bottom-right, bottom-left.
    const pos = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const order = [0, 1, 3, 2]; // grid index of each step in cycle order
    const gw = 3.4, gh = 2.05, gx = 0.6, gy = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      const [head, body, sw, ico] = nodes[i];
      const step = order.indexOf(i) + 1;
      const [c, r] = pos[i];
      const x = M + c * (gw + gx), y = 1.95 + r * (gh + gy);
      card(s, `${head} card`, x, y, gw, gh, { fill: { color: TINT[sw], transparency: 86 } });
      await iconCircle(s, head, x + 0.3, y + 0.3, 0.7, sw, ico);
      text(s, `${head} step`, `STEP ${step}`, x + 1.2, y + 0.3, 2, 0.28, { fontSize: 11, bold: true, charSpacing: 2, color: C.accent6 });
      text(s, `${head} title`, head, x + 1.2, y + 0.58, gw - 1.4, 0.42, { fontSize: 19, bold: true, color: C.text2 });
      text(s, `${head} detail`, body, x + 0.3, y + 1.15, gw - 0.85, 0.8, { fontSize: 14 });
    }
    // Hub in the middle of the cycle.
    const hx = M + gw + gx / 2, hy = 1.95 + gh + gy / 2, hd = 1.05;
    s.addShape(pres.shapes.OVAL, { x: hx - hd / 2, y: hy - hd / 2, w: hd, h: hd, fill: { color: C.background1 }, line: { color: C.text2, width: 2 }, shadow: shadow(), objectName: "Cycle hub" });
    s.addImage({ data: await icon(fa.FaArrowsRotate, HEX.accent1), x: hx - 0.3, y: hy - 0.3, w: 0.6, h: 0.6, altText: "Repeating cycle", objectName: "Cycle icon" });

    // Loyalty punch card.
    const cx = M + 2 * gw + gx + 0.5, cwid = W - M - cx;
    card(s, "Loyalty card", cx, 1.95, cwid, 4.6, { fill: { color: C.text2 } });
    text(s, "Loyalty label", "LOYALTY PROGRAM", cx + 0.4, 2.3, cwid - 0.8, 0.3, { fontSize: 12, bold: true, charSpacing: 2, color: C.accent3 });
    text(s, "Loyalty offer", "Buy 9, get 1 free", cx + 0.4, 2.65, cwid - 0.8, 0.65, { fontSize: 30, bold: true, color: C.background1 });
    const dd = 0.58, gap = (cwid - 0.8 - 5 * dd) / 4;
    const check = await icon(fa.FaCheck, HEX.dk2);
    for (let i = 0; i < 10; i++) {
      const px = cx + 0.4 + (i % 5) * (dd + gap), py = 3.65 + Math.floor(i / 5) * (dd + 0.25);
      const free = i === 9;
      s.addShape(pres.shapes.OVAL, { x: px, y: py, w: dd, h: dd, fill: { color: free ? C.accent3 : C.accent1 }, line: { type: "none" }, objectName: free ? "Free pack stamp" : `Pack ${i + 1} stamp` });
      if (free) {
        text(s, "Free stamp text", "FREE", px, py, dd, dd, { fontSize: 11, bold: true, align: "center", valign: "middle", color: C.text2 });
      } else {
        s.addImage({ data: check, x: px + dd * 0.27, y: py + dd * 0.27, w: dd * 0.46, h: dd * 0.46, altText: "Stamp", objectName: `Pack ${i + 1} check` });
      }
    }
    text(s, "Loyalty caption", "Every tenth pack is on us. It builds trust and keeps customers coming back.", cx + 0.4, 5.3, cwid - 0.8, 1.0, { fontSize: 15, color: C.background1 });
    s.addNotes("Customer relationships run as a cycle. Good quality at affordable prices drives satisfaction. Special offers drive repeat purchases. A loyalty program, buy nine packs and get one free, builds trust. And we listen to feedback to improve the product and add new flavors, which feeds back into satisfaction.");
  }

  // 15. Plan -------------------------------------------------------------
  pres.addSection({ title: "Conclusion" });
  {
    const s = addSlide("FB Dark", "Conclusion");
    kicker(s, "THE PLAN ON ONE PAGE", "orange");
    s.addText("Five moves to launch FitBite", { placeholder: "title" });
    const moves = [
      ["Launch where students are", "Universities, gyms and stores in Khartoum, Omdurman and Bahri.", "orange", fa.FaLocationDot],
      ["Enter at 1,000 SDG", "Penetration pricing, with student and multipack discounts.", "green", fa.FaTag],
      ["Drive trial", "Free samples, influencer reviews and social media advertising.", "yellow", fa.FaGift],
      ["Reward loyalty", "Buy 9, get 1 free, plus special offers for regular buyers.", "berry", fa.FaHeart],
      ["Validate and improve", "Confirm market size with research. Use feedback for new flavors.", "teal", fa.FaMagnifyingGlassChart],
    ];
    const cw = (CW - 4 * 0.25) / 5, y = 2.05, h = 4.45;
    for (let i = 0; i < moves.length; i++) {
      const [head, body, sw, ico] = moves[i];
      const x = M + i * (cw + 0.25);
      card(s, `Move ${i + 1} card`, x, y, cw, h, { fill: { color: C.background1, transparency: 90 } });
      text(s, `Move ${i + 1} number`, `0${i + 1}`, x + 0.3, y + 0.3, 1.0, 0.45, { fontSize: 16, bold: true, color: C.accent3 });
      await iconCircle(s, `Move ${i + 1}`, x + 0.3, y + 0.85, 0.85, sw, ico);
      text(s, `Move ${i + 1} title`, head, x + 0.3, y + 1.95, cw - 0.5, 0.8, { fontSize: 19, bold: true, color: C.background1 });
      text(s, `Move ${i + 1} detail`, body, x + 0.3, y + 2.8, cw - 0.5, 1.5, { fontSize: 15, color: C.background1 });
    }
    s.addNotes("To bring it together, five moves. Launch where students are. Enter at 1,000 pounds with discounts. Drive trial through free samples, influencers and social media. Reward loyalty with buy nine, get one free. And validate the market-size assumption with research while using feedback to develop new flavors.");
  }

  // 16. Close ------------------------------------------------------------
  {
    const s = addSlide("FB Cover", "Conclusion");
    s.addShape(pres.shapes.OVAL, { x: 0.9, y: 0.8, w: 0.9, h: 0.9, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "Decor green" });
    s.addShape(pres.shapes.OVAL, { x: 11.7, y: 1.1, w: 0.5, h: 0.5, fill: { color: C.accent4 }, line: { type: "none" }, objectName: "Decor berry" });
    s.addShape(pres.shapes.OVAL, { x: 11.2, y: 5.6, w: 1.1, h: 1.1, fill: { color: C.accent3 }, line: { type: "none" }, objectName: "Decor yellow" });
    s.addShape(pres.shapes.OVAL, { x: 1.6, y: 6.0, w: 0.3, h: 0.3, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "Decor orange" });
    const lw = 3.6, lh = lw / (2000 / 1760);
    s.addImage({ path: LOGO("fitbite-logo-stacked-white.png"), x: (W - lw) / 2, y: 1.3, w: lw, h: lh, altText: "FitBite healthy snack logo", objectName: "FitBite logo" });
    text(s, "Closing tagline", "Great Taste, Convenient Energy, Ready for Your Day!", 1.5, 4.8, W - 3.0, 0.7, { fontSize: 28, bold: true, align: "center", color: C.background1 });
    text(s, "Closing thanks", "Thank you  ·  Questions and discussion", 1.5, 5.6, W - 3.0, 0.5, { fontSize: 18, align: "center", color: C.accent3 });
    s.addNotes("Thank you. Happy to take questions.");
  }

  await pres.writeFile({ fileName: OUT });
  await finish(OUT);
  console.log("wrote", OUT);
}

// pptxgenjs writes Office's stock palette into the theme and has no option for
// slide transitions, so both are written into the package afterwards.
const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
const TRANSITION = '<p:transition spd="slow"><p:fade/></p:transition>';

async function finish(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const themePart = "ppt/theme/theme1.xml";
  const scheme = `<a:clrScheme name="${THEME.name}">` +
    SLOTS.map((k) => `<a:${k}><a:srgbClr val="${HEX[k]}"/></a:${k}>`).join("") + "</a:clrScheme>";
  const theme = (await zip.file(themePart).async("string"))
    .replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, head) => `${head}${THEME.name}"`);
  if (!theme.includes(scheme)) throw new Error("theme colour scheme not found");
  zip.file(themePart, theme);

  const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  for (const name of slides) {
    const xml = await zip.file(name).async("string");
    if (xml.includes("<p:transition")) continue;
    if (!xml.includes("</p:clrMapOvr>")) throw new Error(`${name}: no clrMapOvr to anchor the transition`);
    zip.file(name, xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + TRANSITION));
  }
  // A scheme colour passed to a hex-only option comes out as an invalid srgbClr.
  for (const name of Object.keys(zip.files).filter((n) => n.endsWith(".xml"))) {
    const bad = (await zip.file(name).async("string")).match(/<a:srgbClr val="((?![0-9A-Fa-f]{6}")[^"]*)"/);
    if (bad) throw new Error(`${name}: srgbClr "${bad[1]}" is not hex; use HEX.* for that option`);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
