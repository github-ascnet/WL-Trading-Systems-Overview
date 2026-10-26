/**
 * motion.js
 * Aktiviert die Einlaufanimationen (css/motion.css) und zählt Kennzahlen hoch.
 *
 * - Setzt <html class="wl-motion">, ausser bei prefers-reduced-motion.
 * - Setzt <html class="wl-motion-ready">, sobald der Loader (#pageLoader) ausgeblendet ist.
 * - Ohne dieses Skript bleibt die Darstellung unverändert (Endzustand).
 *
 * Exports:
 *   window.WL_MOTION.enabled              – false bei prefers-reduced-motion
 *   window.WL_MOTION.whenReady(fn)        – fn nach dem Ausblenden des Loaders
 *   window.WL_MOTION.countUp(containerEl) – zählt alle .wl-count-Elemente hoch
 *   window.WL_MOTION.setRegime(state)     – färbt den Hintergrund nach Regime-Zustand (Landing)
 *   window.WL_MOTION.initTabIndicator(nav) – gleitende Tab-Markierung (Dashboard)
 */
(function motionModule(global) {
  "use strict";

  const READY_FALLBACK_MS = 8000;
  const COUNT_DURATION_MS = 1200;

  const rootEl = document.documentElement;
  const reducedMotionQuery =
    typeof global.matchMedia === "function"
      ? global.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const enabled = !(reducedMotionQuery && reducedMotionQuery.matches);

  let ready = false;
  const waiting = [];

  function markReady() {
    if (ready) return;
    ready = true;
    rootEl.classList.add("wl-motion-ready");
    waiting.splice(0).forEach((callback) => callback());
  }

  function whenReady(callback) {
    if (!enabled || ready) {
      callback();
      return;
    }
    waiting.push(callback);
  }

  function watchLoader() {
    const loader = document.getElementById("pageLoader");
    if (!loader || loader.classList.contains("hidden")) {
      markReady();
      return;
    }

    const observer = new MutationObserver(() => {
      if (loader.classList.contains("hidden")) {
        observer.disconnect();
        markReady();
      }
    });
    observer.observe(loader, { attributes: true, attributeFilter: ["class"] });

    // Fallback, falls der Loader nie ausgeblendet wird
    global.setTimeout(markReady, READY_FALLBACK_MS);
  }

  // "-33.47%" -> { prefix: "", value: -33.47, decimals: 2, suffix: "%" }
  function parseCountText(text) {
    const match = /^(.*?)(-?\d+(?:\.(\d+))?)(\D*)$/.exec(text);
    if (!match) return null;

    const value = Number(match[2]);
    if (!Number.isFinite(value)) return null;

    return {
      prefix: match[1],
      value,
      decimals: match[3] ? match[3].length : 0,
      suffix: match[4],
    };
  }

  function runCountUp(targets) {
    const startedAt = global.performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / COUNT_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);

      targets.forEach(({ el, parsed, finalText }) => {
        // Am Ende wird exakt der ursprüngliche, bereits formatierte Text gesetzt
        el.textContent =
          progress < 1
            ? parsed.prefix +
              (parsed.value * eased).toFixed(parsed.decimals) +
              parsed.suffix
            : finalText;
      });

      if (progress < 1) global.requestAnimationFrame(frame);
    }

    global.requestAnimationFrame(frame);
  }

  function countUp(containerEl) {
    if (!enabled || !containerEl) return;

    const targets = [];
    containerEl.querySelectorAll(".wl-count").forEach((el) => {
      const finalText = el.textContent;
      const parsed = parseCountText(finalText.trim());
      if (!parsed) return;

      // Startwert sofort setzen, damit der Endwert nicht kurz aufblitzt
      el.textContent =
        parsed.prefix + (0).toFixed(parsed.decimals) + parsed.suffix;
      targets.push({ el, parsed, finalText });
    });

    if (targets.length > 0) {
      whenReady(() => runCountUp(targets));
    }
  }

  // Regime-Tint (Landing): setzt data-wl-regime an <html>, die Färbung steht in motion.css
  function setRegime(state) {
    if (!enabled) return;

    const value = String(state ?? "").trim();
    if (!/^[A-Za-z]+$/.test(value)) return;

    let ambient = document.querySelector(".wl-ambient");
    if (!ambient) {
      ambient = document.createElement("div");
      ambient.className = "wl-ambient";
      ambient.setAttribute("aria-hidden", "true");
      document.body.insertBefore(ambient, document.body.firstChild);
      // Ausgangszustand berechnen lassen, damit die Färbung weich übergeht
      global.getComputedStyle(ambient).getPropertyValue("--wl-tint");
    }

    whenReady(() => rootEl.setAttribute("data-wl-regime", value));
  }

  // Gleitende Markierung hinter dem aktiven Tab (nur oberhalb des Mobile-Breakpoints)
  function initTabIndicator(navEl) {
    if (!enabled || !navEl || navEl.dataset.indicatorBound === "1") return;
    navEl.dataset.indicatorBound = "1";

    const indicator = document.createElement("span");
    indicator.className = "wl-tab-indicator";
    indicator.setAttribute("aria-hidden", "true");
    navEl.appendChild(indicator);

    const compactQuery = global.matchMedia("(max-width: 768px)");

    function update() {
      const active = navEl.querySelector(".tab.active");
      if (!active || compactQuery.matches) {
        navEl.classList.remove("wl-has-indicator");
        return;
      }

      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
      // Erste Positionierung ohne Übergang: Position übernehmen lassen, erst danach
      // aktiviert die Klasse die Übergänge
      if (!navEl.classList.contains("wl-has-indicator")) {
        void indicator.offsetWidth;
        navEl.classList.add("wl-has-indicator");
      }
    }

    // main.js setzt .active im Klick-Handler des Tabs, dieser läuft vor dem Handler der Navigation
    navEl.addEventListener("click", update);
    compactQuery.addEventListener("change", update);
    if (typeof global.ResizeObserver === "function") {
      new global.ResizeObserver(update).observe(navEl);
    }
    update();
  }

  if (enabled) {
    rootEl.classList.add("wl-motion");
    watchLoader();
  }

  global.WL_MOTION = {
    enabled,
    whenReady,
    countUp,
    setRegime,
    initTabIndicator,
  };
})(window);
