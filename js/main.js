/* =========================================================
   Yourney — small interactions
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  el.innerHTML = words
    .map((w, i) => `<span class="word" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
    .join(" ");
});

/* ---------- jitter titles: letters twitch on hover ---------- */
const jitterTitles = document.querySelectorAll("[data-jitter]");

jitterTitles.forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split(" ")
    .map((word) =>
      `<span style="white-space:nowrap" aria-hidden="true">${[...word]
        .map((ch) => `<span class="ch">${ch}</span>`)
        .join("")}</span>`
    )
    .join(" ");

  el.addEventListener("mouseenter", () => jitter(el));
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
   Star positions and line shapes are the ones from the Figma
   layout (1112 × 500 box); the countries are grouped by region,
   one constellation each. On hover a country says "hello" in
   its own language and its whole constellation lights up.
   ========================================================= */
const COUNTRIES = [
  // Asia
  { name: "Japan",       x: 56,   y: 23.5,  hello: "Konnichiwa",   lang: "Japanese" },
  { name: "South Korea", x: 133,  y: 94.5,  hello: "Annyeong",     lang: "Korean" },
  { name: "Vietnam",     x: 45,   y: 295.5, hello: "Xin chào",     lang: "Vietnamese" },
  { name: "Thailand",    x: 245,  y: 392.5, hello: "Sawasdee",     lang: "Thai" },
  { name: "India",       x: 95,   y: 465.5, hello: "Namaste",      lang: "Hindi" },
  { name: "Nepal",       x: 364,  y: 478.5, hello: "Namaskar",     lang: "Nepali" },

  // Americas
  { name: "Canada",      x: 311,  y: 63.5,  hello: "Bonjour, hi!", lang: "French & English" },
  { name: "Mexico",      x: 340,  y: 154.5, hello: "¿Qué onda?",   lang: "Mexican Spanish" },
  { name: "Peru",        x: 291,  y: 282.5, hello: "Allillanchu",  lang: "Quechua" },
  { name: "Brazil",      x: 174,  y: 212.5, hello: "Oi, tudo bem?", lang: "Portuguese" },

  // Southern Europe
  { name: "Greece",      x: 581,  y: 43.5,  hello: "Yassou",       lang: "Greek" },
  { name: "Italy",       x: 525,  y: 160.5, hello: "Ciao",         lang: "Italian" },
  { name: "Switzerland", x: 601,  y: 282.5, hello: "Grüezi",       lang: "Swiss German" },
  { name: "France",      x: 447,  y: 321.5, hello: "Bonjour",      lang: "French" },
  { name: "Spain",       x: 490,  y: 412.5, hello: "¡Hola!",       lang: "Spanish" },
  { name: "Portugal",    x: 700,  y: 445.5, hello: "Olá",          lang: "Portuguese" },

  // Northern Europe
  { name: "Iceland",     x: 762,  y: 238.5, hello: "Halló",        lang: "Icelandic" },
  { name: "Norway",      x: 880,  y: 107.5, hello: "Hei",          lang: "Norwegian" },
  { name: "Finland",     x: 718,  y: 88.5,  hello: "Moi",          lang: "Finnish" },

  // Middle East & Africa
  { name: "Turkey",      x: 1026, y: 23.5,  hello: "Merhaba",      lang: "Turkish" },
  { name: "Egypt",       x: 970,  y: 179.5, hello: "Ahlan",        lang: "Arabic" },
  { name: "Morocco",     x: 1064, y: 262.5, hello: "Salam",        lang: "Darija" },
  { name: "Kenya",       x: 1006, y: 445.5, hello: "Jambo",        lang: "Swahili" },
  { name: "Madagascar",  x: 872,  y: 347.5, hello: "Salama",       lang: "Malagasy" },
];

const LINKS = [
  // Asia
  ["Japan", "South Korea"], ["South Korea", "Vietnam"], ["Vietnam", "Thailand"],
  ["Thailand", "India"], ["Thailand", "Nepal"],
  // Americas
  ["Canada", "Mexico"], ["Mexico", "Peru"], ["Peru", "Brazil"],
  // Southern Europe
  ["Greece", "Italy"], ["Italy", "Switzerland"], ["Switzerland", "France"],
  ["France", "Spain"], ["Spain", "Portugal"],
  // Northern Europe
  ["Iceland", "Norway"], ["Norway", "Finland"],
  // Middle East & Africa
  ["Turkey", "Egypt"], ["Egypt", "Morocco"], ["Morocco", "Kenya"], ["Kenya", "Madagascar"],
];

const MAP_W = 1112;
const MAP_H = 500;

const map = document.getElementById("constellation");
const svg = map.querySelector(".constellation__lines");
const SVG_NS = "http://www.w3.org/2000/svg";

// group countries into connected constellations
const groupOf = {};
COUNTRIES.forEach((c) => (groupOf[c.name] = c.name));
const find = (n) => (groupOf[n] === n ? n : (groupOf[n] = find(groupOf[n])));
LINKS.forEach(([a, b]) => (groupOf[find(a)] = find(b)));

const nodes = {};
COUNTRIES.forEach((c, i) => {
  const el = document.createElement("span");
  el.className = "country";
  el.tabIndex = 0;
  el.style.setProperty("--x", `${(c.x / MAP_W) * 100}%`);
  el.style.setProperty("--y", `${(c.y / MAP_H) * 100}%`);
  el.style.setProperty("--i", i);
  el.style.setProperty("--twist", `${(Math.random() * 8 - 4).toFixed(1)}deg`);
  el.innerHTML = `<span class="country__text">${c.name}</span><span class="country__hint">hello in ${c.lang}</span>`;
  map.appendChild(el);
  nodes[c.name] = { ...c, el, text: el.querySelector(".country__text"), group: find(c.name) };
});

const lines = LINKS.map(([a, b], i) => {
  const line = document.createElementNS(SVG_NS, "line");
  line.style.setProperty("--i", i);
  svg.appendChild(line);
  return { a: nodes[a], b: nodes[b], line, group: find(a) };
});

// lines start/stop just outside each label, like in the design
function layoutLines() {
  const w = map.clientWidth;
  const h = map.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const pad = 3;

  lines.forEach(({ a, b, line }) => {
    const ax = (a.x / MAP_W) * w, ay = (a.y / MAP_H) * h;
    const bx = (b.x / MAP_W) * w, by = (b.y / MAP_H) * h;
    const dx = bx - ax, dy = by - ay;

    const exit = (node) => {
      const hw = node.el.offsetWidth / 2 + pad;
      const hh = node.el.offsetHeight / 2 + pad;
      return Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    };
    const t1 = exit(a);
    const t2 = 1 - exit(b);

    const x1 = ax + dx * t1, y1 = ay + dy * t1;
    const x2 = ax + dx * t2, y2 = ay + dy * t2;
    line.setAttribute("x1", x1.toFixed(1));
    line.setAttribute("y1", y1.toFixed(1));
    line.setAttribute("x2", x2.toFixed(1));
    line.setAttribute("y2", y2.toFixed(1));
    line.style.setProperty("--len", Math.hypot(x2 - x1, y2 - y1).toFixed(1));
  });
}

new ResizeObserver(layoutLines).observe(map);
document.fonts && document.fonts.ready.then(layoutLines);

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

function focusCountry(node) {
  map.classList.add("has-focus");
  Object.values(nodes).forEach((n) => n.el.classList.toggle("is-group", n.group === node.group));
  lines.forEach((l) => l.line.classList.toggle("is-group", l.group === node.group));
  node.el.classList.add("is-active");
  scramble(node.text, node.hello);
}

function blurCountry(node) {
  map.classList.remove("has-focus");
  node.el.classList.remove("is-active");
  scramble(node.text, node.name);
}

Object.values(nodes).forEach((node) => {
  node.el.addEventListener("mouseenter", () => focusCountry(node));
  node.el.addEventListener("mouseleave", () => blurCountry(node));
  node.el.addEventListener("focus", () => focusCountry(node));
  node.el.addEventListener("blur", () => blurCountry(node));
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

  if (signup) setTimeout(() => confirmInput.focus({ preventScroll: true }), 350);
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
