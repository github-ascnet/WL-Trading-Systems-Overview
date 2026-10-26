/**
 * equity-system-chart.js
 * Self-contained, responsive SVG equity chart for a single trading system.
 *
 * Exports:
 *   window.renderSystemEquityChart(svgEl, rawData [, opts])
 *     – One-shot render. opts.containerWidth can be supplied for correct layout.
 *
 *   window.mountSystemEquityChart(svgEl, rawData)
 *     – Renders and wires a ResizeObserver for automatic re-renders on resize.
 *     – Returns a cleanup() function to disconnect the observer.
 */
(function systemEquityChartModule(global) {
  "use strict";

  // ── Virtual SVG coordinate space ─────────────────────────────────────────
  // Wide (>= 480 px): 1000 × 340. Narrow (< 480 px, smartphones): own taller
  // space with larger type instead of a scaled-down desktop chart (D-036).
  const SVG_W_WIDE = 1000;
  const SVG_H_WIDE = 340;
  const SVG_W_NARROW = 600;
  const SVG_H_NARROW = 420;

  // Two margin presets: wide (>= 480 px) and narrow (< 480 px)
  const M_WIDE = { top: 20, right: 58, bottom: 40, left: 72 };
  const M_NARROW = { top: 24, right: 64, bottom: 46, left: 86 };

  // Type, stroke and tooltip sizes per coordinate space
  const SIZES_WIDE = {
    axisFont: 12,
    ddFont: 11,
    labelDy: 4,
    xLabelInset: 12,
    lineWidth: 3.2,
    glowWide: 12,
    glowMid: 6,
    ddWidth: 1.8,
    ddGlow: 5,
    dotRadius: 5,
    orbitRadius: 9,
    tipWidth: 210,
    tipFont: 12,
    tipValueFont: 13,
    tipFirstY: 18,
    tipValueGap: 19,
    tipLine: 17,
    tipPad: 10,
  };
  const SIZES_NARROW = {
    axisFont: 19,
    ddFont: 18,
    labelDy: 7,
    xLabelInset: 14,
    lineWidth: 5,
    glowWide: 18,
    glowMid: 9,
    ddWidth: 2.6,
    ddGlow: 7,
    dotRadius: 8,
    orbitRadius: 14,
    tipWidth: 300,
    tipFont: 19,
    tipValueFont: 20,
    tipFirstY: 28,
    tipValueGap: 28,
    tipLine: 26,
    tipPad: 14,
  };

  // ── Utility helpers ───────────────────────────────────────────────────────

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fmtNum(v, dec) {
    if (!Number.isFinite(Number(v))) return "N/A";
    return new Intl.NumberFormat("en-GB", {
      useGrouping: false,
      minimumFractionDigits: dec ?? 0,
      maximumFractionDigits: dec ?? 0,
    }).format(Number(v));
  }

  function fmtPct(v, dec) {
    if (v === null || v === undefined || !Number.isFinite(Number(v)))
      return "N/A";
    return `${fmtNum(v, dec ?? 2)}%`;
  }

  function fmtDate(v) {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v ?? "-");
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(d);
  }

  function getEquityDivisor() {
    const v = Number(global.WL_KPI_CONFIG?.display?.equityDivisor);
    return Number.isFinite(v) && v !== 0 ? v : 100;
  }

  function fmtEquity(v) {
    if (!Number.isFinite(Number(v))) return "N/A";
    return fmtNum(Number(v) / getEquityDivisor(), 0);
  }

  // ── Data helpers ──────────────────────────────────────────────────────────

  function normalizeData(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((p) => {
        const ts = Date.parse(String(p?.date ?? ""));
        const eq = Number(p?.equity);
        if (!Number.isFinite(ts) || !Number.isFinite(eq)) return null;
        return { date: String(p.date), timestamp: ts, equity: eq };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function calcDrawdownSeries(series) {
    let peak = Number(series[0]?.equity);
    return series.map((p) => {
      const eq = Number(p.equity);
      if (Number.isFinite(eq) && eq > peak) peak = eq;
      const dd =
        Number.isFinite(eq) && peak > 0 ? ((eq - peak) / peak) * 100 : 0;
      return { ...p, drawdown: dd };
    });
  }

  function calcRunningProfit(startEq, currentEq) {
    const s = Number(startEq),
      c = Number(currentEq);
    if (!Number.isFinite(s) || !Number.isFinite(c) || s <= 0) return null;
    return ((c - s) / s) * 100;
  }

  function detectCashZones(points, minBars) {
    const zones = [];
    let zStart = 0;
    for (let i = 1; i <= points.length; i++) {
      const same =
        i < points.length &&
        Math.abs(points[i].equity - points[zStart].equity) < 0.01;
      if (!same) {
        if (i - zStart >= (minBars ?? 3))
          zones.push({ from: zStart, to: i - 1 });
        zStart = i;
      }
    }
    return zones;
  }

  /**
   * Compute a sensible drawdown axis minimum.
   *
   * Algorithm:
   *   1. Add 10 % headroom below the actual minimum drawdown.
   *   2. Round away from zero to the nearest 5 pp step (or 10 pp for large values).
   *   3. Guarantee the result is always negative (minimum -5).
   *
   * Examples:
   *   actualMin = -14.2 % → withBuffer = -15.6 → step 5 → ddAxisMin = -20
   *   actualMin = -27.8 % → withBuffer = -30.6 → step 5 → ddAxisMin = -35
   *   actualMin = -48.0 % → withBuffer = -52.8 → step 10 → ddAxisMin = -60
   */
  function calcDrawdownAxisMin(ddSeries) {
    const actualMin = Math.min(...ddSeries.map((p) => p.drawdown));
    if (!Number.isFinite(actualMin) || actualMin >= 0) return -10;

    const withBuffer = actualMin * 1.1; // 10 % headroom
    const step = Math.abs(withBuffer) > 50 ? 10 : 5; // coarser grid for large drawdowns
    const result = Math.floor(withBuffer / step) * step; // round away from zero

    return result >= 0 ? -step : result; // always negative
  }

  // ── Main render ───────────────────────────────────────────────────────────

  /**
   * @param {SVGElement} svgEl
   * @param {Array}      rawData          – Array of { date, equity }
   * @param {object}     [opts]
   * @param {number}     [opts.containerWidth]  – Actual rendered width in CSS px
   */
  function renderSystemEquityChart(svgEl, rawData, opts) {
    if (!svgEl) return;

    // ── Responsive layout decision ───────────────────────────────────────
    const containerWidth =
      opts?.containerWidth ??
      svgEl.parentElement?.offsetWidth ??
      svgEl.getBoundingClientRect().width ??
      600;
    const isNarrow = containerWidth < 480;

    // Einlaufanimation nur beim ersten sichtbaren Rendern (opts.animate)
    const animate = opts?.animate === true;

    // class-Attribut: Theme-Klasse (wl-c-*) plus beim ersten Rendern die Motion-Klasse
    function classAttrs(themeClass, motionClass, delayMs, motionExtra) {
      return animate
        ? ` class="${themeClass} ${motionClass}"${
            motionExtra ?? ""
          } style="--wl-delay:${delayMs}ms"`
        : ` class="${themeClass}"`;
    }
    const SVG_W = isNarrow ? SVG_W_NARROW : SVG_W_WIDE;
    const SVG_H = isNarrow ? SVG_H_NARROW : SVG_H_WIDE;
    const sz = isNarrow ? SIZES_NARROW : SIZES_WIDE;
    const M = isNarrow ? M_NARROW : M_WIDE;
    const CW = SVG_W - M.left - M.right;
    const CH = SVG_H - M.top - M.bottom;
    const maxXLabels = isNarrow ? 4 : 12;
    const axisFontSz = sz.axisFont;
    const ddFontSz = sz.ddFont;

    // ── Ensure SVG scales with its container ─────────────────────────────
    svgEl.setAttribute("viewBox", `0 0 ${SVG_W} ${SVG_H}`);
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgEl.style.width = "100%";
    svgEl.style.height = "auto";
    svgEl.style.display = "block";

    // ── Normalize & validate data ────────────────────────────────────────
    const series = normalizeData(rawData);
    if (series.length < 2) {
      svgEl.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#b8bcc4" font-size="16">Not enough equity data available.</text>`;
      return;
    }

    const minTs = series[0].timestamp;
    const maxTs = series[series.length - 1].timestamp;
    const timeRange = Math.max(maxTs - minTs, 1);

    // ── Equity curve (log scale) ─────────────────────────────────────────
    const eqValues = series.map((p) => Math.max(p.equity, 1));
    const logMin = Math.log(Math.min(...eqValues));
    const logMax = Math.log(Math.max(...eqValues));
    const logRange = Math.max(logMax - logMin, 1e-9);

    const points = series.map((p) => ({
      ...p,
      x: M.left + ((p.timestamp - minTs) / timeRange) * CW,
      y: M.top + ((logMax - Math.log(Math.max(p.equity, 1))) / logRange) * CH,
    }));

    // ── Drawdown curve (dynamic right axis) ──────────────────────────────
    const ddSeries = calcDrawdownSeries(series);
    const ddAxisMin = calcDrawdownAxisMin(ddSeries); // e.g. -20, -25, -30 …
    const ddStep = Math.abs(ddAxisMin) > 50 ? 10 : 5; // must match calcDrawdownAxisMin logic
    const ddLabelCnt = Math.abs(ddAxisMin) / ddStep + 1; // always an integer

    const ddPoints = ddSeries.map((p, i) => ({
      x: points[i].x,
      // drawdown / ddAxisMin: both negative → positive ratio in [0, 1]
      y: M.top + Math.max(0, Math.min(1, p.drawdown / ddAxisMin)) * CH,
      drawdown: p.drawdown,
    }));

    // ── SVG paths ────────────────────────────────────────────────────────
    const linePath = points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`
      )
      .join(" ");
    const areaPath =
      `${linePath} ` +
      `L ${points[points.length - 1].x.toFixed(2)} ${SVG_H - M.bottom} ` +
      `L ${points[0].x.toFixed(2)} ${SVG_H - M.bottom} Z`;
    const ddPath = ddPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`
      )
      .join(" ");

    // ── Cash-zone bands (flat equity = out of market) ────────────────────
    const cashZoneRects = detectCashZones(points)
      .map(({ from, to }) => {
        const x1 = points[from].x,
          x2 = points[to].x;
        return `<rect class="wl-c-cash" x="${x1.toFixed(2)}" y="${M.top}" width="${(
          x2 - x1
        ).toFixed(2)}" height="${CH}" fill="#6b7280" opacity="0.15"/>`;
      })
      .join("");

    // ── Horizontal grid lines ────────────────────────────────────────────
    const hGrid = Array.from({ length: 5 }, (_, i) => {
      const y = M.top + (i / 4) * CH;
      return `<line x1="${M.left}" y1="${y}" x2="${
        SVG_W - M.right
      }" y2="${y}" />`;
    }).join("");

    // ── Left Y-axis: equity labels ───────────────────────────────────────
    const yLabelCnt = isNarrow ? 4 : 5;
    const yLabels = Array.from({ length: yLabelCnt }, (_, i) => {
      const val = Math.exp(logMax - (i / (yLabelCnt - 1)) * logRange);
      const y = M.top + (i / (yLabelCnt - 1)) * CH + sz.labelDy;
      return `<text x="12" y="${y}" class="wl-c-axis" fill="#aeb4be" font-size="${axisFontSz}">${esc(
        fmtEquity(val)
      )}</text>`;
    }).join("");

    // ── Right Y-axis: dynamic drawdown labels ────────────────────────────
    const ddAxisLabels = Array.from({ length: ddLabelCnt }, (_, i) => {
      const ddVal = -i * ddStep; // 0, -5, -10, ...
      const y = M.top + (i / (ddLabelCnt - 1)) * CH + sz.labelDy;
      return `<text x="${
        SVG_W - M.right + 6
      }" y="${y}" class="wl-c-axis" fill="#aeb4be" font-size="${ddFontSz}" opacity="0.8" text-anchor="start">${esc(
        fmtPct(ddVal, 0)
      )}</text>`;
    }).join("");

    // Schmaler Raum: kein Platz für den gedrehten Achsentitel
    const ddAxisTitle = (() => {
      if (isNarrow) return "";
      const x = SVG_W - 12,
        y = M.top + CH / 2;
      return `<text x="${x}" y="${y}" class="wl-c-axis" fill="#aeb4be" font-size="9" opacity="0.8" text-anchor="middle" transform="rotate(-90, ${x}, ${y})">Max. Drawdown</text>`;
    })();

    // ── X-axis: year labels (reduced on narrow screens) ──────────────────
    const allYears = [
      ...new Set(series.map((p) => new Date(p.date).getFullYear())),
    ];

    let labelYears = allYears;
    if (allYears.length > maxXLabels) {
      const stride = (allYears.length - 1) / (maxXLabels - 1);
      labelYears = Array.from(
        { length: maxXLabels },
        (_, i) =>
          allYears[Math.min(allYears.length - 1, Math.round(i * stride))]
      );
      labelYears[0] = allYears[0]; // always show first year
      labelYears[labelYears.length - 1] = allYears[allYears.length - 1]; // always show last year
      labelYears = [...new Set(labelYears)];
    }

    const xLabels = labelYears
      .map((year) => {
        const p = series.find((s) => new Date(s.date).getFullYear() === year);
        if (!p) return "";
        const ratio = (p.timestamp - minTs) / timeRange;
        const x = M.left + ratio * CW;
        const anchor = ratio < 0.08 ? "start" : ratio > 0.92 ? "end" : "middle";
        return `<text x="${x.toFixed(2)}" y="${
          SVG_H - sz.xLabelInset
        }" text-anchor="${anchor}" class="wl-c-axis" fill="#aeb4be" font-size="${axisFontSz}">${year}</text>`;
      })
      .join("");

    // ── Tooltip sizing ───────────────────────────────────────────────────
    const TIP_W = sz.tipWidth,
      TIP_H = sz.tipFirstY + sz.tipValueGap + sz.tipLine * 2 + 12;

    // ── Build SVG markup ─────────────────────────────────────────────────
    svgEl.innerHTML = `
      <defs>
        <linearGradient id="sysEquityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#58c4ff" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#58c4ff" stop-opacity="0.03"/>
        </linearGradient>
        <linearGradient id="wlAuroraLine" gradientUnits="userSpaceOnUse"
                        x1="${M.left}" y1="0" x2="${SVG_W - M.right}" y2="0">
          <stop offset="0%"   stop-color="#58c4ff"/>
          <stop offset="55%"  stop-color="#2de2c4"/>
          <stop offset="100%" stop-color="#6ee7a8"/>
        </linearGradient>
        <linearGradient id="wlAuroraArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#2de2c4" stop-opacity="0.26"/>
          <stop offset="100%" stop-color="#2de2c4" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="wlAuroraTip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#58c4ff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#2de2c4" stop-opacity="0.45"/>
        </linearGradient>
      </defs>
      <g class="wl-c-grid" opacity="0.28" stroke="#5a5f67" stroke-width="1">${hGrid}</g>
      ${
        global.WL_THEME
          ? global.WL_THEME.createStarfieldSvg({
              x: M.left,
              y: M.top,
              width: CW,
              height: CH,
              count: 70,
              seed: 11,
            })
          : ""
      }
      ${cashZoneRects}
      <path d="${areaPath}" fill="url(#sysEquityFill)"${classAttrs(
      "wl-c-area",
      "wl-fade-in",
      900
    )}/>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="${sz.glowWide}" stroke-opacity="0.07"
            stroke-linejoin="round" stroke-linecap="round" visibility="hidden"${classAttrs(
              "wl-c-glow",
              "wl-fade-in",
              900
            )}/>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="${sz.glowMid}" stroke-opacity="0.16"
            stroke-linejoin="round" stroke-linecap="round" visibility="hidden"${classAttrs(
              "wl-c-glow",
              "wl-fade-in",
              900
            )}/>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="${sz.lineWidth}"
            stroke-linejoin="round" stroke-linecap="round"${classAttrs(
              "wl-c-equity",
              "wl-draw-line",
              200,
              ' pathLength="1"'
            )}/>
      <path d="${ddPath}" fill="none" stroke="#ff8c00" stroke-width="${sz.ddGlow}" stroke-opacity="0.1"
            stroke-linejoin="round" stroke-linecap="round" visibility="hidden"${classAttrs(
              "wl-c-drawdown-glow",
              "wl-fade-in",
              700
            )}/>
      <path d="${ddPath}" fill="none" stroke="#ff8c00" stroke-width="${sz.ddWidth}"
            stroke-linejoin="round" stroke-linecap="round" opacity="0.7"${classAttrs(
              "wl-c-drawdown",
              "wl-fade-in",
              700
            )}/>
      ${yLabels}
      ${ddAxisLabels}
      ${ddAxisTitle}
      ${xLabels}
      <g id="sysTipGroup" style="display:none;">
        <line id="sysTipLine" class="wl-c-crosshair" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2"
              opacity="0.35" x1="0" x2="0" y1="${M.top}" y2="${
      SVG_H - M.bottom
    }"/>
        <circle id="sysTipOrbit" class="wl-c-orbit" r="${sz.orbitRadius}" fill="none" stroke="#2de2c4" stroke-width="1.2"
                visibility="hidden" cx="0" cy="0"/>
        <circle id="sysTipDot" class="wl-c-dot" r="${sz.dotRadius}" fill="#58c4ff" stroke="#1e1f22" stroke-width="2"
                cx="0" cy="0"/>
        <rect id="sysTipBox" class="wl-c-tip-box" rx="8" ry="8" fill="#2c2f34" stroke="#42464d"
              stroke-width="1" x="0" y="0" width="${TIP_W}" height="${TIP_H}"/>
        <path id="sysTipCorners" class="wl-c-tip-corners" fill="none" stroke="#2de2c4" stroke-width="1.5"
              visibility="hidden" d=""/>
        <text id="sysTipDate"   class="wl-c-tip-date" fill="#b8bcc4" font-size="${sz.tipFont}" x="0" y="0"/>
        <text id="sysTipValue"  class="wl-c-tip-value" fill="#e6e6e6" font-size="${sz.tipValueFont}" font-weight="600" x="0" y="0"/>
        <text id="sysTipProfit" class="wl-c-tip-text" fill="#b8bcc4" font-size="${sz.tipFont}" x="0" y="0"/>
        <text id="sysTipDD"     class="wl-c-tip-dd" fill="#ff8c00" font-size="${sz.tipFont}" x="0" y="0"/>
      </g>
      <rect id="sysChartOverlay" x="${M.left}" y="${
      M.top
    }" width="${CW}" height="${CH}"
            fill="transparent" style="cursor:crosshair;"/>
    `;

    // ── Tooltip interaction ───────────────────────────────────────────────
    const overlay = svgEl.querySelector("#sysChartOverlay");
    const tipGroup = svgEl.querySelector("#sysTipGroup");
    const tipLine = svgEl.querySelector("#sysTipLine");
    const tipDot = svgEl.querySelector("#sysTipDot");
    const tipOrbit = svgEl.querySelector("#sysTipOrbit");
    const tipBox = svgEl.querySelector("#sysTipBox");
    const tipCorners = svgEl.querySelector("#sysTipCorners");
    const tipDate = svgEl.querySelector("#sysTipDate");
    const tipVal = svgEl.querySelector("#sysTipValue");
    const tipProfit = svgEl.querySelector("#sysTipProfit");
    const tipDD = svgEl.querySelector("#sysTipDD");
    const startEq = series[0].equity;

    function findClosest(targetTs) {
      let ci = 0,
        sd = Infinity;
      points.forEach((p, i) => {
        const d = Math.abs(p.timestamp - targetTs);
        if (d < sd) {
          sd = d;
          ci = i;
        }
      });
      return ci;
    }

    function showTip(clientX) {
      const rect = svgEl.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(
          1,
          (((clientX - rect.left) / rect.width) * SVG_W - M.left) / CW
        )
      );
      const idx = findClosest(minTs + ratio * timeRange);
      const pt = points[idx];
      const ddPt = ddPoints[idx];
      if (!pt) return;

      tipGroup.style.display = "";
      tipLine.setAttribute("x1", pt.x);
      tipLine.setAttribute("x2", pt.x);
      tipDot.setAttribute("cx", pt.x);
      tipDot.setAttribute("cy", pt.y);
      tipOrbit.setAttribute("cx", pt.x);
      tipOrbit.setAttribute("cy", pt.y);

      const pad = sz.tipPad;
      let bx = pt.x + 12;
      if (bx + TIP_W > SVG_W - M.right) bx = pt.x - TIP_W - 12;
      bx = Math.max(4, bx); // schmaler Raum: nicht über den linken Rand hinaus
      const valueY = by0 => by0 + sz.tipFirstY + sz.tipValueGap;
      const by = Math.max(
        M.top,
        Math.min(pt.y - TIP_H / 2, SVG_H - M.bottom - TIP_H)
      );

      tipBox.setAttribute("x", bx);
      tipBox.setAttribute("y", by);
      if (global.WL_THEME) {
        tipCorners.setAttribute(
          "d",
          global.WL_THEME.hudCornersPath(bx, by, TIP_W, TIP_H)
        );
      }

      tipDate.setAttribute("x", bx + pad);
      tipDate.setAttribute("y", by + sz.tipFirstY);
      tipDate.textContent = fmtDate(pt.date);

      tipVal.setAttribute("x", bx + pad);
      tipVal.setAttribute("y", valueY(by));
      tipVal.textContent = `Portfolio: ${fmtEquity(pt.equity)}`;

      tipProfit.setAttribute("x", bx + pad);
      tipProfit.setAttribute("y", valueY(by) + sz.tipLine);
      tipProfit.textContent = `Profit: ${fmtPct(
        calcRunningProfit(startEq, pt.equity),
        2
      )}`;

      tipDD.setAttribute("x", bx + pad);
      tipDD.setAttribute("y", valueY(by) + sz.tipLine * 2);
      tipDD.textContent = `Max Drawdown: ${fmtPct(ddPt?.drawdown ?? null, 2)}`;
    }

    overlay.addEventListener("mousemove", (e) => showTip(e.clientX));
    overlay.addEventListener("mouseleave", () => {
      tipGroup.style.display = "none";
    });
    overlay.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          showTip(e.touches[0].clientX);
        }
      },
      { passive: false }
    );
    overlay.addEventListener("touchend", () => {
      tipGroup.style.display = "none";
    });
  }

  // ── Responsive mount ──────────────────────────────────────────────────────

  /**
   * Renders the chart and attaches a ResizeObserver so the chart re-renders
   * automatically when the container changes width.
   *
   * Handles re-mount safely: disconnects any previous observer on the same element.
   *
   * @param   {SVGElement} svgEl
   * @param   {Array}      rawData
   * @returns {function}   cleanup – call to disconnect the ResizeObserver
   */
  function mountSystemEquityChart(svgEl, rawData) {
    if (!svgEl) return () => {};

    // Clean up a previously mounted observer on this element
    if (typeof svgEl._sysChartCleanup === "function") {
      svgEl._sysChartCleanup();
      svgEl._sysChartCleanup = null;
    }

    // Der Tab "Equity Curve" ist beim Mount versteckt (Breite 0): animiert wird
    // erst das erste Rendern mit sichtbarem Container, danach nie wieder.
    let hasAnimated = false;
    let lastWidth = null;

    function render() {
      const containerWidth =
        svgEl.parentElement?.offsetWidth ??
        svgEl.getBoundingClientRect().width ??
        600;
      // Nur bei geänderter Breite neu zeichnen: Die Höhe folgt der viewBox, und ein
      // Wechsel zwischen schmalem und breitem Raum (D-036) darf kein zweites Rendern
      // auslösen, das die Einlaufanimation abbricht.
      if (containerWidth === lastWidth) return;
      lastWidth = containerWidth;
      const animate = !hasAnimated && containerWidth > 0;
      if (animate) hasAnimated = true;
      renderSystemEquityChart(svgEl, rawData, { containerWidth, animate });
    }

    // Initial render (synchronous, before observer fires)
    render();

    if (typeof ResizeObserver === "undefined") {
      return () => {};
    }

    const debouncedRender = debounce(render, 80);
    const ro = new ResizeObserver(debouncedRender);
    const target = svgEl.parentElement ?? svgEl;
    ro.observe(target);

    const cleanup = () => ro.disconnect();
    svgEl._sysChartCleanup = cleanup;
    return cleanup;
  }

  // ── Hero curve (theme "aurora", D-033) ───────────────────────────────────

  /**
   * Kompakte Hero-Kurve oben im Overview: log. Equity-Linie mit Verlauf, Glow,
   * Fläche, Sternenfeld, pulsierendem Endpunkt, Startdatum und Profit-%.
   * Zeichnet sich einmal ein; danach werden die Motion-Klassen entfernt, damit
   * ein Tab-Wechsel die Einlaufanimation nicht wiederholt.
   *
   * @param {SVGElement} svgEl   – viewBox 0 0 1000 170
   * @param {Array}      rawData – Array of { date, equity }
   * @param {object}     [opts]  – { startLabel, endLabel }
   */
  function renderSystemHeroChart(svgEl, rawData, opts) {
    if (!svgEl) return;

    // Schmale Container (Mobile): höherer Koordinatenraum, damit Kurve und Text lesbar bleiben
    const isNarrow = (svgEl.parentElement?.offsetWidth ?? 1000) < 600;
    const W = isNarrow ? 600 : 1000;
    const H = isNarrow ? 210 : 170;
    const m = isNarrow
      ? { top: 40, right: 112, bottom: 14, left: 12 }
      : { top: 34, right: 96, bottom: 14, left: 14 };
    svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svgEl.classList.toggle("wl-hero-narrow", isNarrow);
    const cw = W - m.left - m.right;
    const ch = H - m.top - m.bottom;

    const series = normalizeData(rawData);
    if (series.length < 2) {
      svgEl.innerHTML = "";
      return;
    }

    const minTs = series[0].timestamp;
    const timeRange = Math.max(series[series.length - 1].timestamp - minTs, 1);
    const logs = series.map((p) => Math.log(Math.max(p.equity, 1)));
    const logMin = Math.min(...logs);
    const logRange = Math.max(Math.max(...logs) - logMin, 1e-9);

    const points = series.map((p, i) => ({
      x: m.left + ((p.timestamp - minTs) / timeRange) * cw,
      y: m.top + (1 - (logs[i] - logMin) / logRange) * ch,
    }));
    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const end = points[points.length - 1];
    const areaPath =
      `${linePath} L${end.x.toFixed(1)} ${H - m.bottom} ` +
      `L${points[0].x.toFixed(1)} ${H - m.bottom} Z`;

    const stars = global.WL_THEME
      ? global.WL_THEME.createStarfieldSvg({
          x: 0,
          y: 0,
          width: W,
          height: H,
          count: 80,
          seed: 21,
        })
      : "";

    svgEl.innerHTML = `
      <defs>
        <linearGradient id="wlHeroLine" gradientUnits="userSpaceOnUse"
                        x1="${m.left}" y1="0" x2="${W - m.right}" y2="0">
          <stop offset="0%"   stop-color="#58c4ff"/>
          <stop offset="55%"  stop-color="#2de2c4"/>
          <stop offset="100%" stop-color="#6ee7a8"/>
        </linearGradient>
        <linearGradient id="wlHeroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#2de2c4" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#2de2c4" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${stars}
      <path d="${areaPath}" fill="url(#wlHeroArea)" class="wl-fade-in" style="--wl-delay:900ms"/>
      <path d="${linePath}" fill="none" stroke="#2de2c4" stroke-width="14" stroke-opacity="0.07"
            stroke-linejoin="round" stroke-linecap="round" class="wl-fade-in" style="--wl-delay:900ms"/>
      <path d="${linePath}" fill="none" stroke="#2de2c4" stroke-width="7" stroke-opacity="0.15"
            stroke-linejoin="round" stroke-linecap="round" class="wl-fade-in" style="--wl-delay:900ms"/>
      <path d="${linePath}" fill="none" stroke="url(#wlHeroLine)" stroke-width="3"
            stroke-linejoin="round" stroke-linecap="round" class="wl-draw-line" pathLength="1"
            style="--wl-delay:200ms"/>
      <circle class="wl-hero-pulse" cx="${end.x.toFixed(1)}" cy="${end.y.toFixed(
      1
    )}" r="10" fill="none" stroke="#6ee7a8" stroke-width="1.5"/>
      <circle class="wl-fade-in" cx="${end.x.toFixed(1)}" cy="${end.y.toFixed(
      1
    )}" r="4.5" fill="#6ee7a8" style="--wl-delay:1400ms"/>
      <text class="wl-hero-caption" x="${m.left}" y="${
      isNarrow ? 26 : 20
    }">EQUITY SINCE ${esc(
      String(opts?.startLabel ?? "").toUpperCase()
    )}</text>
      <text class="wl-hero-value wl-fade-in" x="${(end.x + 16).toFixed(1)}" y="${(
      end.y + 7
    ).toFixed(1)}" style="--wl-delay:1400ms">${esc(opts?.endLabel ?? "")}</text>
    `;

    // Einlaufanimation nur einmal: nach dem Ende die Motion-Klassen entfernen
    svgEl.querySelectorAll(".wl-draw-line, .wl-fade-in").forEach((el) => {
      el.addEventListener(
        "animationend",
        () => el.classList.remove("wl-draw-line", "wl-fade-in"),
        { once: true }
      );
    });
  }

  // ── Exports ───────────────────────────────────────────────────────────────
  global.renderSystemEquityChart = renderSystemEquityChart;
  global.mountSystemEquityChart = mountSystemEquityChart;
  global.renderSystemHeroChart = renderSystemHeroChart;
})(window);
