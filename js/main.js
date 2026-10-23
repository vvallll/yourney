/* =========================================================
   Yourney — small interactions
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- iOS: no zoom-in when a form field gets focus ----------
   Safari on iPhone and iPad zooms into any field with text under 16px.
   maximum-scale stops that; pinch-to-zoom still works on iOS. */
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
if (isIOS) {
  document.querySelector('meta[name="viewport"]')
    .setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
}

/* ---------- touch screens: a tap stands in for hover ---------- */
// remember how the last press was made, so a click can tell a finger from a mouse
let lastPointer = "mouse";
document.addEventListener("pointerdown", (e) => (lastPointer = e.pointerType), { capture: true, passive: true });
// lets :active styles show while a finger is down in iOS Safari
document.addEventListener("touchstart", () => {}, { passive: true });
const isTap = () => lastPointer !== "mouse";

const TAPPABLE = ".hero__photo, .step, .polaroid, .btn-paper, .logo, [data-jitter], .country";
const clearTapped = (except) =>
  document.querySelectorAll(".is-tapped").forEach((el) => el !== except && el.classList.remove("is-tapped"));

// a tap switches the hover look on, a second tap (or a tap anywhere else) switches it off
function tapToggle(selector) {
  document.querySelectorAll(selector).forEach((el) =>
    el.addEventListener("click", () => {
      if (!isTap()) return;
      clearTapped(el);
      el.classList.toggle("is-tapped");
    })
  );
}

// a tap plays the animation once
function tapOnce(selector, ms) {
  document.querySelectorAll(selector).forEach((el) =>
    el.addEventListener("click", () => {
      if (!isTap()) return;
      el.classList.remove("is-tapped");
      void el.offsetWidth; // restart the animation
      el.classList.add("is-tapped");
      clearTimeout(el._tapTimer);
      el._tapTimer = setTimeout(() => el.classList.remove("is-tapped"), ms);
    })
  );
}

tapToggle(".hero__photo, .step, .polaroid");
tapOnce(".btn-paper", 1600);
tapOnce(".logo", 1000);
// iOS sends no click for taps on empty space, so a tap "elsewhere" is caught on pointerup
document.addEventListener("pointerup", (e) => {
  if (e.pointerType !== "mouse" && !e.target.closest(TAPPABLE)) clearTapped();
});

/* ---------- header: shrink on scroll + mobile menu ---------- */
const header = document.querySelector(".site-header");
const burger = document.querySelector(".burger");
const mainNav = document.querySelector(".main-nav");

function onScrollHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}
onScrollHeader();
window.addEventListener("scroll", onScrollHeader, { passive: true });

burger.addEventListener("click", () => {
  const open = burger.getAttribute("aria-expanded") === "true";
  burger.setAttribute("aria-expanded", String(!open));
  mainNav.classList.toggle("is-open", !open);
});
mainNav.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    burger.setAttribute("aria-expanded", "false");
    mainNav.classList.remove("is-open");
  }
});

/* ---------- hero title: split into words that rise in ---------- */
document.querySelectorAll("[data-split]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent.trim());
  const spans = words.map((w, i) => `<span class="word" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`);
  // the last two words stay together, so a line never ends up with one word
  if (spans.length > 2) spans.push(`<span style="white-space:nowrap">${spans.splice(-2).join(" ")}</span>`);
  el.innerHTML = spans.join(" ");
});

/* ---------- no single word on the last line of a paragraph ----------
   The last two words of each text block are joined with a no-break space. */
const NBSP = "\u00A0";
document
  .querySelectorAll(".hero__text p, .lead, .band__subtitle, .step__title, .step__card p, .review p, .review cite, .start__lead, .copyright")
  .forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null;
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) last = walker.currentNode;
    if (!last) return;
    const text = last.textContent.replace(/\s+$/, "");
    const cut = text.lastIndexOf(" ");
    if (cut > 0) last.textContent = text.slice(0, cut) + NBSP + text.slice(cut + 1);
  });

/* ---------- jitter titles: letters twitch on hover ---------- */
const jitterTitles = document.querySelectorAll("[data-jitter]");

// every word is an unbreakable span of letters; the last two words share one span,
// so a title never leaves a single word on its last line
const splitWords = (text) => {
  const words = text.split(" ").filter(Boolean);
  if (words.length > 2) words.push(words.splice(-2).join(" "));
  return words
    .map((word) =>
      `<span style="white-space:nowrap" aria-hidden="true">${[...word]
        .map((ch) => `<span class="ch">${ch}</span>`)
        .join("")}</span>`
    )
    .join(" ");
};

jitterTitles.forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  // an em dash gets its own span, so on phones the title can break there
  el.innerHTML = text
    .split("—")
    .map(splitWords)
    .join('<span class="ch ch--dash" aria-hidden="true">—</span>');

  el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && jitter(el));
  el.addEventListener("click", () => isTap() && jitter(el));
});

function jitter(el, rounds = 3) {
  if (reduceMotion || el.dataset.busy) return;
  el.dataset.busy = "1";
  const chars = el.querySelectorAll(".ch");
  let n = 0;

  const shake = () => {
    chars.forEach((c) => {
      const strength = Math.random() < 0.35 ? 1 : 0.35;
      c.style.setProperty("--jx", `${(Math.random() - 0.5) * 6 * strength}px`);
      c.style.setProperty("--jy", `${(Math.random() - 0.5) * 10 * strength}px`);
      c.style.setProperty("--jr", `${(Math.random() - 0.5) * 14 * strength}deg`);
    });
    el.classList.add("is-jittering");
    n += 1;
    if (n < rounds) {
      setTimeout(shake, 110);
    } else {
      setTimeout(() => {
        el.classList.remove("is-jittering");
        setTimeout(() => delete el.dataset.busy, 400);
      }, 120);
    }
  };
  shake();
}

/* ---------- reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      if (entry.target.matches("[data-jitter]")) setTimeout(() => jitter(entry.target, 4), 250);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll("[data-reveal], [data-jitter]").forEach((el) => revealObserver.observe(el));

/* ---------- how it works: the same number of lines in every card ----------
   Finds the card whose text wraps into the most lines, then narrows
   the text of the other cards until they wrap into as many lines. */
const stepTexts = [...document.querySelectorAll(".step__card p")];
let stepsWidth = 0;

function lineCount(p) {
  return Math.round(p.offsetHeight / parseFloat(getComputedStyle(p).lineHeight));
}

function equalizeSteps() {
  stepTexts.forEach((p) => (p.style.maxWidth = ""));
  const counts = stepTexts.map(lineCount);
  const target = Math.max(...counts);

  stepTexts.forEach((p, i) => {
    if (counts[i] === target) return;
    let lo = p.offsetWidth * 0.4;
    let hi = p.offsetWidth;
    // widest text box that still wraps into `target` lines
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      p.style.maxWidth = `${mid}px`;
      if (lineCount(p) >= target) lo = mid;
      else hi = mid;
    }
    p.style.maxWidth = `${Math.floor(lo)}px`;
  });
}

new ResizeObserver(([entry]) => {
  const w = Math.round(entry.contentRect.width);
  if (w === stepsWidth) return;
  stepsWidth = w;
  equalizeSteps();
}).observe(document.querySelector(".steps"));
document.fonts && document.fonts.ready.then(equalizeSteps);

/* ---------- panorama parallax ---------- */
const panorama = document.querySelector(".panorama");
const panoramaImg = document.querySelector(".panorama__img");
let ticking = false;

function updateParallax() {
  ticking = false;
  const rect = panorama.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;
  const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height); // 0 → 1
  const shift = (progress - 0.5) * rect.height * 0.2;
  panoramaImg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
}
if (!reduceMotion) {
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    },
    { passive: true }
  );
  updateParallax();
}

/* =========================================================
   DESTINATIONS — constellation map
   The countries are grouped by region, one constellation each.
   Every screen size has its own arrangement (positions inside a
   box of design units). Between the tablet-landscape and desktop
   arrangements the stars glide smoothly while the window grows.
   On hover a country says "hello" in its own language and its
   whole constellation lights up.
   ========================================================= */
const COUNTRIES = [
  // Asia
  { name: "Japan",       hello: "Konnichiwa",    lang: "Japanese" },
  { name: "South Korea", hello: "Annyeong",      lang: "Korean" },
  { name: "Vietnam",     hello: "Xin chào",      lang: "Vietnamese" },
  { name: "Thailand",    hello: "Sawasdee",      lang: "Thai" },
  { name: "India",       hello: "Namaste",       lang: "Hindi" },
  { name: "Nepal",       hello: "Namaskar",      lang: "Nepali" },
  // Americas
  { name: "Canada",      hello: "Bonjour, hi!",  lang: "French & English" },
  { name: "Mexico",      hello: "¿Qué onda?",    lang: "Mexican Spanish" },
  { name: "Peru",        hello: "Allillanchu",   lang: "Quechua" },
  { name: "Brazil",      hello: "Oi, tudo bem?", lang: "Portuguese" },
  // Southern Europe
  { name: "Greece",      hello: "Yassou",        lang: "Greek" },
  { name: "Italy",       hello: "Ciao",          lang: "Italian" },
  { name: "Switzerland", hello: "Grüezi",        lang: "Swiss German" },
  { name: "France",      hello: "Bonjour",       lang: "French" },
  { name: "Spain",       hello: "¡Hola!",        lang: "Spanish" },
  { name: "Portugal",    hello: "Olá",           lang: "Portuguese" },
  // Northern Europe
  { name: "Iceland",     hello: "Halló",         lang: "Icelandic" },
  { name: "Norway",      hello: "Hei",           lang: "Norwegian" },
  { name: "Finland",     hello: "Moi",           lang: "Finnish" },
  // Middle East & Africa
  { name: "Turkey",      hello: "Merhaba",       lang: "Turkish" },
  { name: "Egypt",       hello: "Ahlan",         lang: "Arabic" },
  { name: "Morocco",     hello: "Salam",         lang: "Darija" },
  { name: "Kenya",       hello: "Jambo",         lang: "Swahili" },
  { name: "Madagascar",  hello: "Salama",        lang: "Malagasy" },
];

// lines of each constellation: the wide maps and the tall (tablet, phone) maps
const LINKS = {
  wide: [
    ["Japan", "South Korea"], ["South Korea", "Vietnam"], ["Vietnam", "Thailand"],
    ["Thailand", "India"], ["Thailand", "Nepal"],
    ["Canada", "Mexico"], ["Mexico", "Peru"], ["Peru", "Brazil"],
    ["Greece", "Italy"], ["Italy", "Switzerland"], ["Switzerland", "France"],
    ["France", "Spain"], ["Spain", "Portugal"],
    ["Iceland", "Norway"], ["Norway", "Finland"],
    ["Turkey", "Egypt"], ["Egypt", "Morocco"], ["Morocco", "Kenya"], ["Kenya", "Madagascar"],
  ],
  tall: [
    ["Japan", "South Korea"], ["South Korea", "Vietnam"], ["Vietnam", "Thailand"],
    ["Thailand", "India"], ["India", "Nepal"],
    ["Canada", "Mexico"], ["Mexico", "Peru"], ["Peru", "Brazil"],
    ["Greece", "Italy"], ["Italy", "Switzerland"], ["Switzerland", "France"],
    ["France", "Spain"], ["Spain", "Portugal"],
    ["Iceland", "Finland"], ["Finland", "Norway"],
    ["Turkey", "Egypt"], ["Egypt", "Morocco"], ["Morocco", "Kenya"], ["Kenya", "Madagascar"],
  ],
};

// [x, y] of every country inside each layout's box
const LAYOUTS = {
  // desktop: the original Figma map
  desktop: { w: 1112, h: 500, pos: {
    Japan: [56, 23.5], "South Korea": [133, 94.5], Vietnam: [45, 295.5], Thailand: [245, 392.5], India: [95, 465.5], Nepal: [364, 478.5],
    Canada: [311, 63.5], Mexico: [340, 154.5], Peru: [291, 282.5], Brazil: [174, 212.5],
    Greece: [581, 43.5], Italy: [525, 160.5], Switzerland: [601, 282.5], France: [447, 321.5], Spain: [490, 412.5], Portugal: [700, 445.5],
    Iceland: [762, 238.5], Norway: [880, 107.5], Finland: [718, 88.5],
    Turkey: [1026, 23.5], Egypt: [970, 179.5], Morocco: [1064, 262.5], Kenya: [1006, 445.5], Madagascar: [872, 347.5],
  } },
  // tablet landscape: the same constellations pulled closer together
  wide: { w: 980, h: 500, pos: {
    Japan: [72, 24], "South Korea": [141, 94], Vietnam: [52, 295], Thailand: [252, 392], India: [102, 465], Nepal: [371, 478],
    Canada: [297, 65], Mexico: [333, 153], Peru: [284, 282], Brazil: [167, 212],
    Greece: [519, 45], Italy: [463, 162], Switzerland: [539, 284], France: [385, 323], Spain: [428, 414], Portugal: [623, 447],
    Iceland: [655, 240], Norway: [773, 109], Finland: [611, 90],
    Turkey: [890, 25], Egypt: [836, 181], Morocco: [930, 264], Kenya: [870, 447], Madagascar: [736, 349],
  } },
  // tablet portrait: two columns of constellations
  tablet: { w: 620, h: 700, pos: {
    Japan: [46, 42], "South Korea": [192, 106], Vietnam: [46, 271], Thailand: [233, 370], India: [284, 217], Nepal: [165, 252],
    Canada: [537, 22], Mexico: [572, 110], Peru: [436, 218], Brazil: [350, 67],
    Greece: [108, 403], Italy: [34, 473], Switzerland: [202, 496], France: [72, 562], Spain: [173, 682], Portugal: [276, 599],
    Iceland: [571, 377], Norway: [550, 266], Finland: [383, 342],
    Turkey: [483, 429], Egypt: [330, 463], Morocco: [459, 536], Kenya: [550, 592], Madagascar: [390, 656],
  } },
  // phone: the constellations one under another
  phone: { w: 358, h: 790, pos: {
    Japan: [32, 36], "South Korea": [149, 68], Vietnam: [52, 202], Thailand: [221, 128], India: [325, 172], Nepal: [283, 43],
    Canada: [248, 203], Mexico: [297, 265], Peru: [60, 304], Brazil: [127, 243],
    Iceland: [40, 352], Finland: [162, 378], Norway: [296, 344],
    Greece: [212, 425], Italy: [320, 474], Switzerland: [257, 543], France: [118, 488], Spain: [41, 553], Portugal: [160, 610],
    Turkey: [292, 638], Egypt: [95, 665], Morocco: [62, 745], Kenya: [231, 690], Madagascar: [300, 762],
  } },
};

const map = document.getElementById("constellation");
const svg = map.querySelector(".constellation__lines");
const SVG_NS = "http://www.w3.org/2000/svg";

// group countries into connected constellations (the same groups in every layout)
const groupOf = {};
COUNTRIES.forEach((c) => (groupOf[c.name] = c.name));
const find = (n) => (groupOf[n] === n ? n : (groupOf[n] = find(groupOf[n])));
LINKS.wide.forEach(([a, b]) => (groupOf[find(a)] = find(b)));

const nodes = {};
COUNTRIES.forEach((c, i) => {
  const el = document.createElement("span");
  el.className = "country";
  el.tabIndex = 0;
  el.style.setProperty("--i", i);
  el.style.setProperty("--twist", `${(Math.random() * 8 - 4).toFixed(1)}deg`);
  el.innerHTML = `<span class="country__text">${c.name}</span><span class="country__hint">hello in ${c.lang}</span>`;
  map.appendChild(el);
  nodes[c.name] = { ...c, el, text: el.querySelector(".country__text"), group: find(c.name), x: 0, y: 0 };
});

let lines = [];
let currentLinks = null;

function buildLines(links) {
  svg.replaceChildren();
  lines = links.map(([a, b], i) => {
    const line = document.createElementNS(SVG_NS, "line");
    line.style.setProperty("--i", i);
    svg.appendChild(line);
    return { a: nodes[a], b: nodes[b], line, group: find(a) };
  });
}

// the layout for the current window: phone, tablet, or a blend of tablet landscape and desktop
function currentLayout() {
  const vw = window.innerWidth;
  if (vw < 600) return { box: LAYOUTS.phone, links: LINKS.tall };
  if (vw < 1000) return { box: LAYOUTS.tablet, links: LINKS.tall };

  const t = Math.min(Math.max((map.clientWidth - 960) / (1150 - 960), 0), 1);
  const from = LAYOUTS.wide, to = LAYOUTS.desktop;
  const pos = {};
  for (const name in to.pos) {
    pos[name] = from.pos[name].map((v, k) => v + (to.pos[name][k] - v) * t);
  }
  return { box: { w: from.w + (to.w - from.w) * t, h: 500, pos }, links: LINKS.wide };
}

function layoutMap() {
  const { box, links } = currentLayout();
  map.style.aspectRatio = `${box.w} / ${box.h}`;
  Object.values(nodes).forEach((n) => {
    const [x, y] = box.pos[n.name];
    n.x = x / box.w;
    n.y = y / box.h;
    n.el.style.setProperty("--x", `${n.x * 100}%`);
    n.el.style.setProperty("--y", `${n.y * 100}%`);
  });
  if (links !== currentLinks) {
    currentLinks = links;
    buildLines(links);
  }
  layoutLines();
}

// lines start/stop just outside each label, like in the design
function layoutLines() {
  const w = map.clientWidth;
  const h = map.clientHeight;
  if (!w || !h) return; // the map is hidden or not laid out yet
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const pad = 3;

  // a country saying hello takes more room (see keepInside), so its lines step back
  const active = (node) => node.box && node.el.classList.contains("is-active");
  const centerX = (node) => (active(node) ? node.box.cx : node.x * w);

  lines.forEach(({ a, b, line }) => {
    const ax = centerX(a), ay = a.y * h;
    const bx = centerX(b), by = b.y * h;
    const dx = bx - ax, dy = by - ay;
    if (!dx && !dy) return;

    // fraction of the line hidden inside a node's label box; goingDown: the line leaves it downwards
    const exit = (node, goingDown) => {
      const hw = active(node) ? node.box.hw : node.el.offsetWidth / 2 + pad;
      const hh = active(node) ? (goingDown ? node.box.down : node.box.up) : node.el.offsetHeight / 2 + pad;
      return Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    };
    const t1 = exit(a, dy > 0);
    const t2 = 1 - exit(b, dy < 0);

    const x1 = ax + dx * t1, y1 = ay + dy * t1;
    const x2 = ax + dx * t2, y2 = ay + dy * t2;
    line.setAttribute("x1", x1.toFixed(1));
    line.setAttribute("y1", y1.toFixed(1));
    line.setAttribute("x2", x2.toFixed(1));
    line.setAttribute("y2", y2.toFixed(1));
    line.style.setProperty("--len", Math.hypot(x2 - x1, y2 - y1).toFixed(1));
  });
}

let mapWidth = 0;
new ResizeObserver(([entry]) => {
  const w = Math.round(entry.contentRect.width);
  if (w === mapWidth) return;
  mapWidth = w;
  layoutMap();
}).observe(map);
layoutMap();
document.fonts && document.fonts.ready.then(layoutMap);

// draw the constellation when it scrolls into view
new IntersectionObserver(
  (entries, obs) => {
    if (!entries[0].isIntersecting) return;
    map.classList.add("is-drawn");
    setTimeout(() => map.classList.add("is-ready"), 1800);
    obs.disconnect();
  },
  { threshold: 0.3 }
).observe(map);

// scramble text from one word into another
const GLYPHS = "abcdefghijklmnopqrstuvwxyzáéíóúçñ";
function scramble(el, to) {
  cancelAnimationFrame(el._raf);
  if (reduceMotion) { el.textContent = to; return; }
  const from = el.textContent;
  const len = Math.max(from.length, to.length);
  const start = performance.now();
  const duration = 420;

  const frame = (now) => {
    const p = Math.min((now - start) / duration, 1);
    let out = "";
    for (let i = 0; i < len; i++) {
      const settleAt = (i + 1) / len;
      if (p >= settleAt) out += to[i] || "";
      else if (p > settleAt - 0.45) out += to[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      else out += from[i] || "";
    }
    el.textContent = out;
    if (p < 1) el._raf = requestAnimationFrame(frame);
  };
  el._raf = requestAnimationFrame(frame);
}

// a greeting is longer than the name and grows a little, so near the edge of the map
// it is nudged back inside (measured in advance, before the letters scramble)
const measureCtx = document.createElement("canvas").getContext("2d");
function keepInside(node) {
  const style = getComputedStyle(node.el);
  const scale = parseFloat(getComputedStyle(map).getPropertyValue("--active-scale")) || 1;
  measureCtx.font = `italic ${style.fontSize} ${style.fontFamily}`;
  const textW = measureCtx.measureText(node.hello).width * scale + parseFloat(style.paddingLeft) * 2;
  const width = Math.max(textW, node.el.querySelector(".country__hint").offsetWidth);
  const center = node.x * map.clientWidth;
  const left = center - width / 2;
  const right = center + width / 2;
  const shift = left < 0 ? -left : right > map.clientWidth ? map.clientWidth - right : 0;
  node.el.style.setProperty("--shift", `${shift.toFixed(1)}px`);

  // the room the greeting takes, so the lines can stop at its edge
  const textH = parseFloat(style.fontSize) * scale;
  const hint = node.el.querySelector(".country__hint");
  node.box = { cx: center + shift, hw: width / 2 + 4, up: textH / 2 + 4, down: textH / 2 + hint.offsetHeight + 10 };
}

function focusCountry(node) {
  map.classList.add("has-focus");
  Object.values(nodes).forEach((n) => n.el.classList.toggle("is-group", n.group === node.group));
  lines.forEach((l) => l.line.classList.toggle("is-group", l.group === node.group));
  keepInside(node);
  node.el.classList.add("is-active");
  layoutLines();
  scramble(node.text, node.hello);
}

function blurCountry(node) {
  map.classList.remove("has-focus");
  node.el.classList.remove("is-active");
  node.el.style.setProperty("--shift", "0px");
  layoutLines();
  scramble(node.text, node.name);
}

// mouse: hover; keyboard: focus; touch: a tap says hello, a second tap (or a tap elsewhere) says goodbye
let tappedCountry = null;

Object.values(nodes).forEach((node) => {
  node.el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && focusCountry(node));
  node.el.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && blurCountry(node));
  node.el.addEventListener("focus", () => node.el.matches(":focus-visible") && focusCountry(node));
  node.el.addEventListener("blur", () => tappedCountry !== node && node.el.classList.contains("is-active") && blurCountry(node));
  node.el.addEventListener("click", () => {
    if (!isTap()) return;
    const same = tappedCountry === node;
    if (tappedCountry) blurCountry(tappedCountry);
    tappedCountry = same ? null : node;
    if (tappedCountry) focusCountry(node);
  });
});

document.addEventListener("pointerup", (e) => {
  if (tappedCountry && e.pointerType !== "mouse" && !e.target.closest(".country")) {
    blurCountry(tappedCountry);
    tappedCountry = null;
  }
});

/* ---------- log in / sign up form (front-end only for now) ---------- */
const form = document.getElementById("signup");
const toast = document.getElementById("toast");
const formSwitch = document.querySelector(".start__switch");
const extra = form.querySelector(".signup__extra");
const confirmInput = form.passwordConfirm;
let toastTimer;

// every .swap element keeps its text for both states in data-login / data-signup
function swapText(el, text) {
  if (el.textContent === text) return;
  if (reduceMotion) { el.textContent = text; return; }
  el.classList.add("is-out");
  setTimeout(() => {
    el.textContent = text;
    el.classList.remove("is-out");
  }, 200);
}

function setMode(mode) {
  form.dataset.mode = mode;
  const signup = mode === "signup";

  extra.setAttribute("aria-hidden", String(!signup));
  confirmInput.disabled = !signup;
  form.password.autocomplete = signup ? "new-password" : "current-password";

  document.querySelectorAll("#start .swap").forEach((el) => swapText(el, el.dataset[mode]));
  form.querySelectorAll(".signup__input").forEach((input) => input.classList.remove("is-invalid"));

  // with a mouse the cursor jumps into the new field; on touch screens that would only pop up the keyboard
  if (signup && !isTap()) setTimeout(() => confirmInput.focus({ preventScroll: true }), 350);
}

formSwitch.addEventListener("click", () => {
  setMode(form.dataset.mode === "login" ? "signup" : "login");
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 3800);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;

  form.querySelectorAll(".signup__input").forEach((input) => {
    input.classList.remove("is-invalid");
    if (!input.checkValidity()) {
      void input.offsetWidth; // restart the shake animation
      input.classList.add("is-invalid");
      ok = false;
    }
  });

  if (!ok) {
    showToast("Almost there — please fill in every field.");
    return;
  }

  const signup = form.dataset.mode === "signup";
  if (signup && confirmInput.value !== form.password.value) {
    void confirmInput.offsetWidth;
    confirmInput.classList.add("is-invalid");
    showToast("The passwords don’t match — try once more.");
    return;
  }

  const name = form.firstName.value.trim();
  showToast(signup
    ? `Welcome aboard, ${name}! Your Yourney starts soon.`
    : `Welcome back, ${name}! Your next adventure is waiting.`);
  form.reset();
});

form.addEventListener("input", (e) => e.target.classList.remove("is-invalid"));
