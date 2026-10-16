// FitBite marketing strategy as a designed A4 document.
// Every fact comes from the source strategy (source/FitBite_Marketing_Strategy.pdf).
// Usage (from fitbite/): node build/document.js
// Writes build/document.html, then prints it to out/FitBite_Marketing_Strategy.pdf
// with Playwright's Chromium.

const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const fa = require("react-icons/fa6");
const gi = require("react-icons/gi");

const ROOT = path.join(__dirname, "..");
const HTML = path.join(__dirname, "document.html");
const PDF = path.join(ROOT, "out", "FitBite_Marketing_Strategy.pdf");

const ico = (Comp, color = "currentColor") =>
  ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: "100%", "aria-hidden": true }));

// Icon in a coloured circle: the motif shared with the deck.
const dot = (Comp, tone, size = "12mm") =>
  `<span class="dot tone-${tone}" style="--d:${size}">${ico(Comp)}</span>`;

const header = (section) => `
  <header class="run">
    <span class="run-brand"><img src="../logo/fitbite-icon.svg" alt="">FitBite · Marketing Strategy</span>
    <span class="run-section">${section}</span>
  </header>`;
const footer = (n) => `<footer class="folio">${String(n).padStart(2, "0")}</footer>`;

const opener = (num, tone, title, lead) => `
  <div class="opener">
    <span class="num tone-${tone}">${num}</span>
    <div>
      <div class="kicker">Section ${num}</div>
      <h1>${title}</h1>
    </div>
  </div>
  <p class="lead">${lead}</p>`;

const page = (n, section, body, cls = "") => `
<section class="page ${cls}">
  ${header(section)}
  <div class="body">${body}</div>
  ${footer(n)}
</section>`;

// ---------------------------------------------------------------------------
const cover = `
<section class="page cover">
  <span class="ball b1"></span><span class="ball b2"></span><span class="ball b3"></span>
  <span class="ball b4"></span><span class="ball b5"></span>
  <img class="cover-logo" src="../logo/fitbite-logo-stacked-white.svg" alt="FitBite healthy snack logo">
  <div class="cover-text">
    <div class="cover-label">Executive briefing</div>
    <h1>Marketing<br>Strategy</h1>
    <div class="cover-sub">FitBite Healthy Snack</div>
    <p class="cover-tag">“Great Taste, Convenient Energy, Ready for Your Day!”</p>
  </div>
</section>`;

const summary = page(2, "Executive summary", `
  <div class="kicker">Executive summary</div>
  <h1 class="page-title">FitBite at a glance</h1>
  <p class="lead">FitBite is a healthy snack made from familiar, nutritious local ingredients (dates, peanuts,
  oats and sesame seeds) in a small, convenient pack for busy students and employees. It is built on the
  Marketing Concept: start from a real customer need, then design the product to satisfy it.</p>

  <div class="stats">
    <div class="stat tint-orange">${dot(fa.FaTag, "orange", "10mm")}<b>1,000 SDG</b><span>Introductory price per pack</span></div>
    <div class="stat tint-green">${dot(fa.FaArrowTrendDown, "green", "10mm")}<b>≈ 33% lower</b><span>Than the estimated 1,500 SDG competitor price</span></div>
    <div class="stat tint-yellow">${dot(fa.FaUsers, "yellow", "10mm")}<b>Ages 16–35</b><span>Students and employees, low to middle incomes</span></div>
    <div class="stat tint-berry">${dot(fa.FaLocationDot, "berry", "10mm")}<b>3 cities</b><span>Khartoum, Omdurman and Bahri at launch</span></div>
  </div>

  <h2>The strategy in brief</h2>
  <ol class="brief">
    <li><span class="bnum tone-orange">01</span><div><b>Product and orientation</b><span>Taste, convenience and affordability, designed around customer needs.</span></div><em>3</em></li>
    <li><span class="bnum tone-green">02</span><div><b>Competition</b><span>Up against energy bars and everyday snacks. We win on local ingredients, packaging and price.</span></div><em>5</em></li>
    <li><span class="bnum tone-yellow">03</span><div><b>Segmentation</b><span>Demographic, geographic, psychographic and behavioral lenses.</span></div><em>6</em></li>
    <li><span class="bnum tone-berry">04</span><div><b>Target market</b><span>University students first; gym members and busy professionals second.</span></div><em>7</em></li>
    <li><span class="bnum tone-teal">05</span><div><b>Marketing mix</b><span>Penetration pricing, campus and gym distribution, free samples and influencers.</span></div><em>8</em></li>
    <li><span class="bnum tone-ink">06</span><div><b>Customer relationships</b><span>Satisfaction, repeat purchases, loyalty (buy 9, get 1 free) and feedback.</span></div><em>9</em></li>
    <li><span class="bnum tone-orange arrow-num">${ico(fa.FaArrowRight)}</span><div><b>The plan on one page</b><span>Five moves to launch FitBite.</span></div><em>10</em></li>
  </ol>
`);

const product = page(3, "01 · Product and orientation", `
  ${opener("01", "orange", "Product and marketing orientation",
    "FitBite is a healthy snack made from familiar and nutritious local ingredients. It comes in a small, convenient pack that is easy to carry, and it is designed specifically for the needs of busy students and employees.")}

  <h2>What's inside</h2>
  <div class="ingredients">
    <div>${dot(gi.GiPalmTree, "orange", "20mm")}<b>Dates</b></div>
    <div>${dot(gi.GiPeanut, "yellow", "20mm")}<b>Peanuts</b></div>
    <div>${dot(gi.GiWheat, "green", "20mm")}<b>Oats</b></div>
    <div>${dot(gi.GiSesame, "teal", "20mm")}<b>Sesame seeds</b></div>
  </div>

  <h2>Core value</h2>
  <p>The value FitBite offers lies in combining three things customers want at once.</p>
  <div class="values">
    <div class="value">${dot(fa.FaFaceGrinStars, "orange", "11mm")}<b>Great taste</b><span>Familiar ingredients that are popular among Sudanese consumers.</span></div>
    <div class="value">${dot(fa.FaClock, "orange", "11mm")}<b>Convenience</b><span>A small pack that is easy to carry and eat anywhere.</span></div>
    <div class="value">${dot(fa.FaWallet, "orange", "11mm")}<b>Affordability</b><span>Only 1,000 Sudanese pounds per pack.</span></div>
  </div>

  <h2>Pack and brand</h2>
  <div class="rows">
    <div class="row">${dot(fa.FaBoxOpen, "ink", "9mm")}<p>The pack carries product information, the expiry date and allergen warnings.</p></div>
    <div class="row">${dot(fa.FaBolt, "ink", "9mm")}<p>The brand reflects an active, convenient lifestyle.</p></div>
  </div>
  <div class="message">“Great Taste, Convenient Energy, Ready for Your Day!”<span>Marketing message</span></div>
`);

const exchange = page(4, "01 · Product and orientation", `
  <h2 class="first">The exchange</h2>
  <p>Customers pay money in return for energy, nutrition and taste. The company receives revenue, as well as
  valuable customer feedback that helps it keep improving.</p>
  <div class="exchange">
    <div class="party customer">${dot(fa.FaUsers, "orange", "15mm")}<b>Customers</b><span>Students and employees</span></div>
    <div class="flows">
      <div class="flow tone-line-orange"><span>Money: 1,000 SDG per pack</span><i class="arrow right"></i></div>
      <div class="flow tone-line-teal"><span>Valuable customer feedback</span><i class="arrow right"></i></div>
      <div class="flow tone-line-green"><span>Energy, nutrition and taste</span><i class="arrow left"></i></div>
    </div>
    <div class="party company"><img src="../logo/fitbite-icon.svg" alt=""><b>FitBite</b><span>The company</span></div>
  </div>

  <h2>Why we chose the Marketing Concept</h2>
  <p>The Marketing Concept focuses on understanding and satisfying customers' needs and wants. It fits
  FitBite because the product was developed after identifying a real need, represented by a customer
  persona named Ahmed: a student who needs an affordable and nutritious snack. The product was then
  designed to satisfy that need.</p>

  <table class="compare">
    <thead><tr><th>Orientation</th><th>Focus</th><th>What it means for FitBite</th></tr></thead>
    <tbody>
      <tr class="chosen"><td><span class="pill">Our choice</span><b>Marketing Concept</b></td><td>Understanding and satisfying customer needs and wants</td><td>The product is designed around a real need (Ahmed), which supports long-term loyalty</td></tr>
      <tr><td><b>Production Concept</b></td><td>Efficiency and distribution</td><td><span class="risk">Risk</span> May overlook customer preferences</td></tr>
      <tr><td><b>Product Concept</b></td><td>Quality and performance</td><td><span class="risk">Risk</span> Can lead to excessively high prices</td></tr>
      <tr><td><b>Selling Concept</b></td><td>Aggressive promotion and sales efforts</td><td><span class="risk">Risk</span> Relies on pushing sales rather than building long-term loyalty</td></tr>
    </tbody>
  </table>
`);

const competition = page(5, "02 · Competition", `
  ${opener("02", "green", "Competitive analysis",
    "Competition in the snack market falls into two categories: products that do the same job as FitBite, and anything else people buy to satisfy their hunger.")}
  <div class="two">
    <div class="panel tint-orange">
      <div class="panel-head">${dot(fa.FaBullseye, "orange", "11mm")}<div><b>Direct competitors</b><span>4 brands</span></div></div>
      <p>Products with similar benefits that serve the same purpose, such as energy bars and snack products.</p>
      <div class="chips"><span>Tiger Bar</span><span>Break Bar</span><span>Abu Auf</span><span>Datto</span></div>
    </div>
    <div class="panel tint-green">
      <div class="panel-head">${dot(fa.FaCookieBite, "green", "11mm")}<div><b>Indirect competitors</b><span>5 alternatives</span></div></div>
      <p>Alternative products customers may buy instead to satisfy their hunger.</p>
      <div class="chips"><span>Royal biscuits</span><span>Captain Majid chips</span><span>Cadbury chocolate</span><span>Bakery products</span><span>Fresh fruits</span></div>
    </div>
  </div>

  <h2>Competitive advantage</h2>
  <div class="adv-wrap">
    <div class="adv">
      <div class="row">${dot(fa.FaSeedling, "orange", "10mm")}<div><b>Familiar local ingredients</b><p>Ingredients that are familiar and popular among Sudanese consumers.</p></div></div>
      <div class="row">${dot(fa.FaBoxOpen, "teal", "10mm")}<div><b>Convenient packaging</b><p>A small, practical pack that is easy to carry and eat anywhere.</p></div></div>
      <div class="row">${dot(fa.FaWallet, "green", "10mm")}<div><b>Affordable price</b><p>1,000 SDG, compared with about 1,500 SDG for many competing products.</p></div></div>
    </div>
    <figure class="chart">
      <figcaption>Price per pack (SDG)</figcaption>
      <div class="bars">
        <div class="bar-row"><span class="bar-label">FitBite</span><span class="bar-track"><span class="bar" style="--v:${1000 / 1500}; --c:var(--orange)"></span><b>1,000</b></span></div>
        <div class="bar-row"><span class="bar-label">Competing products (est.)</span><span class="bar-track"><span class="bar" style="--v:1; --c:var(--teal)"></span><b>1,500</b></span></div>
      </div>
      <p class="note">FitBite is about one-third cheaper. The competitor price is an approximate estimate.</p>
    </figure>
  </div>
  <div class="banner"><span class="banner-label">Our position</span>Together, these advantages position FitBite as an affordable, convenient and appealing snack option.</div>
`);

const seg = (tone, Comp, title, text, chips) => `
  <div class="seg tint-${tone}">
    <div class="panel-head">${dot(Comp, tone, "11mm")}<div><b>${title}</b></div></div>
    <p>${text}</p>
    <div class="chips small">${chips.map((c) => `<span>${c}</span>`).join("")}</div>
  </div>`;

const segmentation = page(6, "03 · Segmentation", `
  ${opener("03", "yellow", "Market segmentation",
    "The market is divided into four segments based on demographic, geographic, psychographic and behavioral characteristics.")}
  <div class="grid2">
    ${seg("orange", fa.FaUsers, "Demographic", "FitBite targets consumers aged 16 to 35, particularly students and employees with low to middle incomes.", ["Ages 16–35", "Students", "Employees", "Low to middle income"])}
    ${seg("green", fa.FaLocationDot, "Geographic", "The first target areas are Khartoum, Omdurman and Bahri, particularly near universities, gyms and other places target customers visit often.", ["Khartoum", "Omdurman", "Bahri", "Near universities and gyms"])}
    ${seg("yellow", fa.FaHeartPulse, "Psychographic", "People who prefer convenient, familiar and affordable snacks that fit their active lifestyles.", ["Convenient", "Familiar", "Affordable", "Active lifestyle"])}
    ${seg("berry", fa.FaCartShopping, "Behavioral", "Consumers who buy snacks regularly, need a quick refreshment during breaks, and are attracted to discounts, special offers and multipack deals.", ["Regular buyers", "Quick breaks", "Discounts and offers", "Multipacks"])}
  </div>
  <div class="banner">
    <span class="banner-label">The four lenses combined</span>
    A 16-to-35-year-old student or employee in Khartoum, Omdurman or Bahri who wants a convenient, familiar,
    affordable snack, buys snacks regularly and responds to good offers.
  </div>
`);

const target = page(7, "04 · Target market", `
  ${opener("04", "berry", "Target market",
    "FitBite's target market is divided into two groups: one we lead with, and one we grow into.")}
  <div class="two">
    <div class="panel dark">
      <div class="panel-head">${dot(fa.FaGraduationCap, "orange", "11mm")}<div><span class="label">Primary target</span><b>University students aged 18 to 30</b></div></div>
      <p>Need affordable, tasty and convenient snacks during their studies and daily activities.</p>
    </div>
    <div class="panel tint-berry">
      <div class="panel-head">${dot(fa.FaDumbbell, "berry", "11mm")}<div><span class="label">Secondary target</span><b>Gym members and busy professionals</b></div></div>
      <p>Need a quick snack during their daily routines.</p>
    </div>
  </div>

  <div class="persona">
    <div class="persona-id">${dot(fa.FaUserGraduate, "orange", "26mm")}<b>Ahmed</b><span>22 · University student</span><em>Limited budget</em></div>
    <div class="persona-body">
      <div class="kicker">Customer persona</div>
      <p class="persona-text">Ahmed is a 22-year-old university student with a limited budget. He needs an affordable,
      tasty and nutritious snack that he can easily carry in his backpack and eat between lectures.</p>
      <div class="needs">
        <span>${dot(fa.FaWallet, "green", "7mm")}Affordable</span>
        <span>${dot(fa.FaFaceGrinStars, "yellow", "7mm")}Tasty</span>
        <span>${dot(fa.FaSeedling, "teal", "7mm")}Nutritious</span>
        <span>${dot(fa.FaClock, "berry", "7mm")}Easy to carry</span>
      </div>
    </div>
  </div>

  <h2>Why this market is attractive</h2>
  <div class="two">
    <div class="row">${dot(fa.FaRotate, "green", "10mm")}<div><b>Repeat sales</b><p>Students buy snacks regularly, which makes them a source of repeat sales.</p></div></div>
    <div class="row">${dot(fa.FaTiktok, "teal", "10mm")}<div><b>Affordable reach</b><p>They can be reached through low-cost channels: TikTok, Instagram and word of mouth among students.</p></div></div>
  </div>
  <div class="verify">${dot(fa.FaMagnifyingGlassChart, "yellow", "10mm")}<p><b>To verify before presenting as fact.</b>
  The assumption that this market represents more than 40% of the total market needs to be confirmed through
  market research before it is presented as a confirmed statistic.</p></div>
`);

const mixBlock = (tone, Comp, title, sub, items) => `
  <div class="mix tint-${tone}">
    <div class="panel-head">${dot(Comp, tone, "11mm")}<div><b>${title}</b><span>${sub}</span></div></div>
    <ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
  </div>`;

const mix = page(8, "05 · Marketing mix", `
  ${opener("05", "teal", "Marketing mix: the 4 Ps",
    "The four Ps (Product, Price, Place and Promotion) work together to attract students and employees and create competitive value.")}
  <div class="grid2 mixgrid">
    ${mixBlock("orange", fa.FaCookieBite, "Product", "What we sell", [
      "Made from familiar local ingredients: dates, peanuts, oats and sesame seeds",
      "Small, convenient pack with product information, expiry date and allergen warnings",
      "A brand that reflects an active, convenient lifestyle",
    ])}
    ${mixBlock("green", fa.FaTag, "Price", "Market penetration", [
      "Introductory price of 1,000 SDG per pack, against an estimated 1,500 SDG for competitors",
      "Student discounts and discounts on multipack purchases",
      "Goal: encourage first-time purchases and build market share quickly",
    ])}
    ${mixBlock("yellow", fa.FaStore, "Place", "Where customers find us", [
      "Local grocery stores and supermarkets",
      "University cafeterias",
      "Gyms and fitness centers",
      "Direct online sales through Facebook, Instagram and TikTok",
    ])}
    ${mixBlock("berry", fa.FaBullhorn, "Promotion", "How they hear about us", [
      "Advertising on social media platforms",
      "Free samples at universities and gyms",
      "Influencers who review and promote the product",
      "Posters and materials at points of sale",
      "Satisfied customers recommending FitBite to friends and family",
    ])}
  </div>
  <div class="message">“Great Taste, Convenient Energy, Ready for Your Day!”<span>The message that ties the mix together</span></div>
`);

const node = (tone, Comp, step, title, text) => `
  <div class="node tint-${tone}">
    <div class="panel-head">${dot(Comp, tone, "10mm")}<div><span class="label">Step ${step}</span><b>${title}</b></div></div>
    <p>${text}</p>
  </div>`;

const stamps = Array.from({ length: 10 }, (_, i) =>
  i === 9 ? `<span class="stamp free">FREE</span>` : `<span class="stamp">${ico(fa.FaCheck)}</span>`).join("");

const crm = page(9, "06 · Customer relationships", `
  ${opener("06", "ink", "Customer relationship management",
    "Four practices work as a cycle: keep customers satisfied, bring them back, earn their loyalty, and listen to what they say.")}
  <div class="cycle">
    ${node("orange", fa.FaFaceGrinStars, 1, "Customer satisfaction", "We provide good quality and affordable prices to keep our customers happy.")}
    ${node("green", fa.FaRotate, 2, "Repeat purchases", "We encourage customers to buy FitBite regularly through special offers.")}
    ${node("teal", fa.FaComments, 4, "Customer feedback", "We listen to customers' opinions to improve the product and introduce new flavors.")}
    ${node("berry", fa.FaHeart, 3, "Customer loyalty", "We build trust with customers through a loyalty program.")}
    <span class="hub">${ico(fa.FaArrowsRotate)}</span>
  </div>
  <div class="loyalty">
    <div>
      <span class="label">Loyalty program</span>
      <b>Buy 9, get 1 free</b>
      <p>Buy 9 packages and the tenth is free. It builds trust and keeps customers coming back.</p>
    </div>
    <div class="stamps">${stamps}</div>
  </div>
`);

const move = (n, tone, Comp, title, text, from) => `
  <li class="move">
    <span class="bnum tone-${tone}">0${n}</span>
    ${dot(Comp, tone, "11mm")}
    <div><b>${title}</b><p>${text}</p><span class="from">${from}</span></div>
  </li>`;

const plan = page(10, "The plan on one page", `
  <div class="kicker">The plan on one page</div>
  <h1 class="page-title">Five moves to launch FitBite</h1>
  <p class="lead">Each move comes straight from the strategy. Together they take a customer from first taste to loyal buyer.</p>
  <ol class="moves">
    ${move(1, "orange", fa.FaLocationDot, "Launch where students are", "Sell through university cafeterias, gyms and fitness centers, grocery stores and supermarkets in Khartoum, Omdurman and Bahri, plus online on Facebook, Instagram and TikTok.", "Segmentation · Place")}
    ${move(2, "green", fa.FaTag, "Enter at 1,000 SDG", "Use market penetration pricing, below the estimated 1,500 SDG competitor price, with student and multipack discounts.", "Price")}
    ${move(3, "yellow", fa.FaGift, "Drive trial", "Hand out free samples at universities and gyms, work with influencers, advertise on social media and use point-of-sale posters.", "Promotion")}
    ${move(4, "berry", fa.FaHeart, "Reward loyalty", "Run the loyalty program (buy 9 packages, get 1 free) and special offers that turn first purchases into a habit.", "Customer relationships")}
    ${move(5, "teal", fa.FaMagnifyingGlassChart, "Validate and improve", "Confirm the size of the target market through market research, and use customer feedback to improve the product and introduce new flavors.", "Target market · Feedback")}
  </ol>
`);

const back = `
<section class="page cover back">
  <span class="ball b1"></span><span class="ball b2"></span><span class="ball b3"></span><span class="ball b4"></span>
  <img class="back-logo" src="../logo/fitbite-logo-stacked-white.svg" alt="FitBite healthy snack logo">
  <p class="back-tag">Great Taste, Convenient Energy, Ready for Your Day!</p>
</section>`;

// ---------------------------------------------------------------------------
const css = fs.readFileSync(path.join(__dirname, "document.css"), "utf8");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>FitBite Marketing Strategy</title>
<style>${css}</style></head>
<body>
${cover}${summary}${product}${exchange}${competition}${segmentation}${target}${mix}${crm}${plan}${back}
</body></html>`;
fs.writeFileSync(HTML, html);
console.log("wrote", HTML);

(async () => {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const pg = await browser.newPage();
  await pg.goto("file://" + HTML, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: PDF, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log("wrote", PDF);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
