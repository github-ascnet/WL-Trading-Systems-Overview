/**
 * theme.js
 * Schalter für das visuelle Theme (D-031). Wird synchron im <head> geladen,
 * damit das Theme ab dem ersten Bild gilt.
 *
 *   "aurora"  – Future State: Weltraum mit Polarlicht-Tönen (css/theme-aurora.css)
 *   "classic" – bisheriges Design
 *
 * Exports:
 *   window.WL_VISUAL_THEME – aktives Theme
 *   window.WL_THEME.createStarfieldSvg(opts) – Sternenfeld für einen Plotbereich (Markup)
 *   window.WL_THEME.hudCornersPath(x, y, w, h, size) – Eckmarken eines HUD-Tooltips (Pfad)
 *
 * Die Chart-Elemente aus diesen Helfern tragen visibility="hidden" und werden
 * nur im Theme "aurora" sichtbar (css/theme-aurora.css).
 */
(function themeModule(global) {
  "use strict";

  const WL_VISUAL_THEME = "aurora";

  document.documentElement.setAttribute("data-theme", WL_VISUAL_THEME);

  // Deterministischer Zufall (mulberry32), damit das Sternenfeld beim Neuzeichnen identisch bleibt
  function createRandom(seed) {
    let state = seed >>> 0;
    return function random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createStarfieldSvg({
    x,
    y,
    width,
    height,
    count = 60,
    seed = 1,
    twinkle = 8,
  }) {
    const random = createRandom(seed);

    const stars = Array.from({ length: count }, (_, index) => {
      const cx = (x + random() * width).toFixed(1);
      const cy = (y + random() * height).toFixed(1);
      const r = (0.4 + random() * 0.9).toFixed(2);
      const opacity = (0.25 + random() * 0.55).toFixed(2);
      const twinkleAttrs =
        index < twinkle
          ? ` class="wl-c-twinkle" style="--tw-delay:${(random() * 4).toFixed(
              2
            )}s"`
          : "";
      return `<circle cx="${cx}" cy="${cy}" r="${r}" opacity="${opacity}"${twinkleAttrs}></circle>`;
    }).join("");

    return `<g class="wl-c-stars" fill="#dff8ff" visibility="hidden">${stars}</g>`;
  }

  function hudCornersPath(x, y, w, h, size = 8) {
    const s = size;
    return [
      `M${x} ${y + s} V${y} H${x + s}`,
      `M${x + w - s} ${y} H${x + w} V${y + s}`,
      `M${x + w} ${y + h - s} V${y + h} H${x + w - s}`,
      `M${x + s} ${y + h} H${x} V${y + h - s}`,
    ].join(" ");
  }

  global.WL_VISUAL_THEME = WL_VISUAL_THEME;
  global.WL_THEME = { createStarfieldSvg, hudCornersPath };
})(window);
