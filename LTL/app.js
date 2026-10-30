/* Caso de estudio — riel de títulos, spy de scroll y ajuste del roadmap. */

var CONFIG = {
  showProgress: true,  // barra de progreso en el riel
  snapScroll: true     // encaje suave de sección a sección
};

var LABELS = ["Proyecto", "Antes", "El desafío", "El enfoque", "Roadmap",
              "Después", "Resultados", "Gráfico 01", "Gráfico 02", "Nota"];

var q = function (s, r) { return (r || document).querySelector(s); };
var qa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
var pad = function (n) { return (n < 10 ? "0" : "") + n; };

var stack = q("[data-stack]");
var slots = { prev: q('[data-slot="prev"]'), main: q('[data-slot="main"]'), next: q('[data-slot="next"]') };
var fill = q("[data-progress-fill]");
var blocks = qa("[data-block]");
var cards = qa("[data-card]");
var active = 1;
var sub = 0;
var raf = 0;

/* --- configuración --- */
if (!CONFIG.showProgress) { var p = q("[data-progress]"); if (p) p.style.display = "none"; }
document.documentElement.classList.toggle("snap", CONFIG.snapScroll === true);

/* --- ilustración de portada: si el archivo no existe, queda el placeholder --- */
(function () {
  var img = q("[data-art]");
  if (!img) return;
  var art = img.parentElement;
  var ok = function () { art.classList.add("has-art"); };
  if (img.complete && img.naturalWidth) ok();
  img.addEventListener("load", ok);
  img.addEventListener("error", function () { img.remove(); });
})();

/* --- ticker: se duplica para que el bucle a -50% sea continuo --- */
(function () {
  var track = q("[data-ticker]");
  if (!track) return;
  var clone = track.cloneNode(true);
  clone.removeAttribute("data-ticker");
  while (clone.firstChild) {
    var n = clone.firstChild;
    if (n.setAttribute) n.setAttribute("aria-hidden", "true");
    track.appendChild(n);
  }
})();

/* --- volver al inicio --- */
(function () {
  var btn = q("[data-top]");
  if (btn) btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
})();

/* --- escala el roadmap (ancho fijo de 900px) al ancho disponible --- */
function fit() {
  qa("[data-fit]").forEach(function (el) {
    var w = parseFloat(el.getAttribute("data-fit"));
    var track = el.parentElement;
    var box = track && track.parentElement;
    if (!box || !w) return;
    var natH = el.offsetHeight || 1;
    var s = Math.max(0.35, Math.min(1, box.clientWidth / w));
    el.style.transformOrigin = "top left";
    el.style.transform = s < 1 ? "scale(" + s + ")" : "none";
    track.style.width = Math.round(w * s) + "px";
    track.style.margin = "0 auto";
    track.style.height = Math.round(natH * s) + "px";
    box.style.overflowX = w * s > box.clientWidth + 1 ? "auto" : "hidden";
  });
}

function setSlot(el, n) {
  if (!el) return;
  var ok = n >= 1 && n <= LABELS.length;
  el.style.visibility = ok ? "visible" : "hidden";
  if (!ok) return;
  q("[data-num]", el).textContent = pad(n);
  q("[data-title]", el).textContent = LABELS[n - 1];
}

function paint(el, c, o) {
  if (!el) return;
  el.style.opacity = Math.max(0, o).toFixed(3);
  el.style.transform = "scale(" + (0.74 + 0.26 * c).toFixed(3) + ")";
  var box = q("[data-slot-box]", el) || el.firstElementChild;
  if (box) {
    box.style.background = "rgba(239,234,223," + (0.95 * c).toFixed(3) + ")";
    box.style.borderColor = "rgba(28,28,26," + (0.18 * c).toFixed(3) + ")";
  }
  var bar = q("[data-bar]", el);
  if (bar) bar.style.width = (22 * c).toFixed(1) + "px";
  var num = q("[data-num]", el);
  if (num) num.style.color = c > 0.55 ? "var(--accent)" : "var(--text-meta)";
}

function progress() {
  if (!fill) return;
  var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  fill.style.width = Math.round(Math.min(1, Math.max(0, window.scrollY / max)) * 100) + "%";
}

function place() {
  var t = Math.min(1, Math.max(0, (sub - 0.72) / 0.28));
  var e = t * t * (3 - 2 * t);
  progress();

  cards.forEach(function (el) {
    var n = +el.getAttribute("data-card");
    var c = n === active ? 1 - e : (n === active + 1 ? e : 0);
    el.style.opacity = (0.3 + 0.7 * c).toFixed(3);
    el.style.transform = "scale(" + (0.9 + 0.1 * c).toFixed(4) + ")";
  });

  if (!stack) return;
  setSlot(slots.prev, active - 1);
  setSlot(slots.main, active);
  setSlot(slots.next, active + 1);
  paint(slots.prev, 0, 0.3 * (1 - e));
  paint(slots.main, 1 - e, 1 - 0.7 * e);
  paint(slots.next, e, 0.3 + 0.7 * e);

  if (window.innerWidth <= 860) { stack.style.transform = "none"; return; }
  if (slots.main) {
    var hN = slots.next ? slots.next.offsetHeight : 0;
    var shift = hN ? (slots.main.offsetHeight + hN) / 2 + 14 : 0;
    var base = stack.offsetHeight / 2 - (slots.main.offsetTop + slots.main.offsetHeight / 2);
    stack.style.transform = "translateY(" + (base - e * shift).toFixed(1) + "px)";
  }
}

function spy() {
  var mid = window.innerHeight / 2;
  var best = 1, bestD = Infinity;
  blocks.forEach(function (el) {
    var r = el.getBoundingClientRect();
    var d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (d < bestD) { bestD = d; best = parseInt(el.getAttribute("data-block"), 10); }
  });
  var cur = q('[data-block="' + best + '"]');
  if (cur) {
    var rr = cur.getBoundingClientRect();
    sub = (mid - rr.top) / Math.max(rr.height, 1);
  }
  active = best;
  place();
}

function settle() { fit(); spy(); }

window.addEventListener("scroll", function () {
  if (raf) return;
  raf = requestAnimationFrame(function () { raf = 0; spy(); });
}, { passive: true });
window.addEventListener("resize", settle);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
setTimeout(settle, 300);
settle();
