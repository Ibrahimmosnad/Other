// Brand marks and FORM & OAK touchpoints as HTML strings.
// Used twice: by touchpoints.html (flat textures for Blender) and by the film
// itself, so every appearance of the brand comes from the same source.

const IMG = "/assets/img";

// Designwave mark, exactly as drawn on the studio's site.
export const dwMark = () =>
  `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#3b4bff"/><path d="M6 17.5c2.2-5 4.6-5 6.8 0s4.6 5 6.8 0 4.4-4.6 6.4-1" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;

export const dwLogo = () => `<span class="dw-logo">${dwMark()}<span>Designwave</span></span>`;

// FORM & OAK mark: a square (form) holding growth rings at one corner (oak).
// Ring spacing is uneven on purpose: real growth rings are.
export const RING_RADII = [30, 52, 70, 94];
export const foMark = (ink = "#252525", paper = "#f5f2ec", id = "m") =>
  `<svg class="fo-mark" viewBox="0 0 120 120" aria-hidden="true"><defs><clipPath id="c${id}"><rect width="120" height="120"/></clipPath></defs><rect width="120" height="120" fill="${ink}"/><g clip-path="url(#c${id})" fill="none" stroke="${paper}" stroke-width="5.5">${RING_RADII.map((r) => `<circle cx="120" cy="120" r="${r}"/>`).join("")}</g></svg>`;

// The same rings, larger and lighter, as the identity's graphic device.
export const foRings = (stroke = "#252525", opacity = 0.14, width = 2.2, count = 9) => {
  const radii = [30, 52, 70, 94, 112, 134, 150, 172, 190, 214, 232].slice(0, count);
  return `<svg viewBox="0 0 240 240" aria-hidden="true" style="width:100%;height:100%;display:block"><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${width}">${radii.map((r) => `<circle cx="240" cy="240" r="${r}"/>`).join("")}</g></svg>`;
};

export const foWordmark = (id = "w", ink, paper) =>
  `<span class="fo-wordmark">${foMark(ink, paper, id)}<span>Form <span class="amp">&amp;</span> Oak</span></span>`;

export const foWordmarkText = () => `<span class="fo-wordmark"><span>Form <span class="amp">&amp;</span> Oak</span></span>`;

export const PRODUCTS = [
  { no: "No. 01", name: "Arc Chair", price: "$690", img: `${IMG}/chair.jpg` },
  { no: "No. 02", name: "Ring Stool", price: "$340", img: `${IMG}/stool.jpg` },
  { no: "No. 03", name: "Side Table", price: "$420", img: `${IMG}/table.jpg` },
];

export const HEADLINE = "Made slowly.<br>Built to last.";

export const tag = (id = "tag") => `
<div class="fo fo-tag">
  <div class="hole"></div>
  <div class="fo-label no">No. 01</div>
  <div class="name">Arc Chair</div>
  <div class="mark">${foMark("#252525", "#f5f2ec", id)}</div>
  <div class="spec">
    <div><span>Wood</span>Solid white oak</div>
    <div><span>Finish</span>Hard wax oil</div>
    <div><span>Size</span>W 46 · D 43 · H 78 cm</div>
  </div>
  <div class="foot">${foWordmarkText()}</div>
</div>`;

export const sleeve = () => `
<div class="fo fo-sleeve">
  <div class="wm">${foWordmark("sl")}</div>
  <div class="rings">${foRings("#252525", 0.16, 2.4, 11)}</div>
  <div class="title">Care kit</div>
  <div class="sub">Oil, cloth and care guide for solid oak</div>
</div>`;

export const poster = () => `
<div class="fo fo-poster">
  <div class="photo" style="background-image:url(${IMG}/chair_hero.jpg)"></div>
  <div class="head">${HEADLINE}</div>
  <div class="fo-label meta">No. 01 Arc Chair</div>
  <div class="wm">${foWordmarkText()}</div>
</div>`;

export const posts = () => [
  `<div class="fo fo-post"><div class="photo" style="background-image:url(${IMG}/chair.jpg)"></div><div class="wm">${foWordmark("p1")}</div><div class="fo-label cap">No. 01<b>Arc Chair</b></div></div>`,
  `<div class="fo fo-post type"><div class="wm" style="color:#f5f2ec">${foWordmark("p2", "#f5f2ec", "#b48a5e")}</div><div class="big">${HEADLINE}</div><div class="rings">${foRings("#f5f2ec", 0.28, 2.4, 11)}</div></div>`,
  `<div class="fo fo-post"><div class="photo" style="background-image:url(${IMG}/stool.jpg)"></div><div class="wm">${foWordmark("p3")}</div><div class="fo-label cap">No. 02<b>Ring Stool</b></div></div>`,
];

export const siteMobile = () => `
<div class="fo fo-site m-site">
  <div class="nav">${foWordmark("ms")}<div class="burger"></div></div>
  <div class="hero" style="background-image:url(${IMG}/chair.jpg)"></div>
  <div class="intro">
    <div class="fo-label">No. 01 Arc Chair</div>
    <h1>${HEADLINE}</h1>
    <p>Solid oak furniture, made by hand in our workshop.</p>
    <span class="fo-btn" data-cta>Shop the collection <span class="arr">→</span></span>
  </div>
  <div class="sect"><h2>The collection</h2><span>3 pieces</span></div>
  <div class="grid">
    ${PRODUCTS.map((p) => `<div class="card"><div class="img" style="background-image:url(${p.img})"></div><div class="t">${p.name}</div><div class="p">${p.price}</div></div>`).join("")}
    <div class="card"><div class="img" style="background:#b48a5e;position:relative;overflow:hidden">${foRings("#f5f2ec", 0.3, 2.4, 11)}</div><div class="t">Care kit</div><div class="p">$38</div></div>
  </div>
</div>`;

export const siteDesktop = () => `
<div class="fo fo-site d-site">
  <div class="nav">${foWordmark("ds")}<div class="links"><span>Collection</span><span>Workshop</span><span>Journal</span><span>Cart (0)</span></div></div>
  <div class="hero">
    <div class="copy">
      <div class="fo-label">No. 01 Arc Chair</div>
      <h1>${HEADLINE}</h1>
      <p>Solid oak furniture, made by hand in our workshop.</p>
      <div><span class="fo-btn">Shop the collection <span class="arr">→</span></span></div>
    </div>
    <div class="pic" style="background-image:url(${IMG}/chair_hero.jpg)"></div>
  </div>
  <div class="row">${PRODUCTS.map((p) => `<div>${p.name}<span>${p.price}</span></div>`).join("")}</div>
</div>`;

const ICONS = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3.3-6.5A8 8 0 0 1 20 12zm0 0 .8 7-6-1.9"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M21 4 3 11l7 2.5L12.5 21z"/><path d="m10 13.5 5-5"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>',
};

// A phone screen showing the brand's first post in a generic feed.
export const phoneFeed = () => `
<div class="feed">
  <div class="status"><span>9:41</span><i></i></div>
  <div class="head"><span class="av">${foMark("#252525", "#f5f2ec", "fa")}</span>formandoak<span class="dots">···</span></div>
  <div class="post">${posts()[0]}</div>
  <div class="acts">${ICONS.heart}${ICONS.chat}${ICONS.send}${ICONS.save}</div>
  <div class="cap"><b>formandoak</b> No. 01, the Arc Chair. Solid white oak, made by hand.</div>
  <div class="next"><span class="av">${foMark("#252525", "#f5f2ec", "fb")}</span>formandoak</div>
  <div class="next-img" style="background-image:url(${IMG}/stool.jpg)"></div>
</div>`;

// The site as it sits in a phone's display: status bar plus the first screen.
export const siteMobileScreen = () => `
<div class="feed" style="height:832px">
  <div class="status"><span>9:41</span><i></i></div>
  <div style="margin-top:-6px">${siteMobile()}</div>
</div>`;
