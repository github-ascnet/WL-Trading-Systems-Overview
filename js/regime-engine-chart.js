(function regimeEngineChartModule(global) {
  "use strict";

  const W = 1000;
  const H = 160;
  // left: enough for 3-digit Y labels at font-size 9.5; right: space for state labels outside plot
  const M = { top: 22, right: 58, bottom: 26, left: 30 };
  const CHART_W = W - M.left - M.right;
  const CHART_H = H - M.top - M.bottom;

  // Color constants — composite matches equity curve blue
  const COLOR_COMPOSITE = "#58c4ff";
  const COLOR_STRETCH = "#F5D97A";

  const STATE_COLORS = {
    StrongRiskOn: "rgba(171, 252, 203, 0.4)",
    RiskOn: "rgba(80, 220, 120, 0.0)",
    Neutral: "rgba(240, 210, 40, 0.0)",
    Caution: "rgba(255, 140, 0, 0.0)",
    RiskOff: "rgba(252, 160, 160, 0.4)",
  };

  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Cannot load ${path} (${res.status})`);
    return res.json();
  }

  function normalizeRegimeSeries(raw) {
    if (!Array.isArray(raw)) return [];
    const byDate = new Map();
    for (const point of raw) {
      const dateStr = String(point?.date ?? "").trim();
      const ts = Date.parse(dateStr);
      if (!dateStr || !Number.isFinite(ts)) continue;
      const val = Number(point?.value);
      if (!Number.isFinite(val)) continue;
      const normalized = new Date(ts).toISOString().slice(0, 10);
      byDate.set(normalized, {
        date: normalized,
        timestamp: Date.parse(normalized),
        value: val,
        state: String(point?.state ?? "Neutral"),
      });
    }
    return Array.from(byDate.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  function mapDateToX(timestamp, minTs, maxTs) {
    const range = Math.max(maxTs - minTs, 1);
    return M.left + ((timestamp - minTs) / range) * CHART_W;
  }

  // Y-axis range: extended to -5..105 with stretch (breathing room), exact 0..100 without
  function mapScoreToY(score, yMin, yMax) {
    return M.top + ((yMax - score) / (yMax - yMin)) * CHART_H;
  }

  // Simple 3-point SMA for visual smoothing only; raw data is preserved
  function smoothSeries(series, windowSize = 3) {
    if (series.length < windowSize) return series;
    const half = Math.floor(windowSize / 2);
    return series.map((p, i) => {
      const lo = Math.max(0, i - half);
      const hi = Math.min(series.length - 1, i + half);
      let sum = 0;
      let count = 0;
      for (let j = lo; j <= hi; j++) {
        sum += series[j].value;
        count++;
      }
      return { ...p, smoothedValue: sum / count };
    });
  }

  function buildRegimeBackgroundSegments(compositeSeries, minTs, maxTs) {
    const relevant = compositeSeries.filter(
      (p) => p.timestamp >= minTs && p.timestamp <= maxTs
    );
    if (relevant.length === 0) return "";

    const segs = [];
    let curState = relevant[0].state;
    let segStart = relevant[0].timestamp;

    for (let i = 1; i < relevant.length; i++) {
      const p = relevant[i];
      if (p.state !== curState) {
        segs.push({ state: curState, startTs: segStart, endTs: p.timestamp });
        curState = p.state;
        segStart = p.timestamp;
      }
    }
    segs.push({
      state: curState,
      startTs: segStart,
      endTs: relevant[relevant.length - 1].timestamp,
    });

    return segs
      .map((seg) => {
        const color = STATE_COLORS[seg.state];
        if (!color) return "";
        const x1 = mapDateToX(seg.startTs, minTs, maxTs);
        const x2 = mapDateToX(seg.endTs, minTs, maxTs);
        const segW = Math.max(0.5, x2 - x1);
        return `<rect x="${x1.toFixed(2)}" y="${M.top}" width="${segW.toFixed(
          2
        )}" height="${CHART_H}" fill="${escapeHtml(color)}"/>`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function renderRegimeEnginePanel(
    containerEl,
    compositeData,
    stretchData,
    minTs,
    maxTs
  ) {
    if (!containerEl) return;

    const showStretch =
      window.WL_KPI_CONFIG?.display?.showRegimeStretchScore ?? true;
    const yMin = showStretch ? -5 : 0;
    const yMax = showStretch ? 105 : 100;
    const timeRange = Math.max(maxTs - minTs, 1);
    const composite = (compositeData ?? []).filter(
      (p) => p.timestamp >= minTs && p.timestamp <= maxTs
    );
    const stretch = (stretchData ?? []).filter(
      (p) => p.timestamp >= minTs && p.timestamp <= maxTs
    );

    if (composite.length === 0 && stretch.length === 0) {
      containerEl.innerHTML = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#7f8ba4" font-size="14">Regime data unavailable</text>`;
      return;
    }

    const bgSegments = buildRegimeBackgroundSegments(
      compositeData ?? [],
      minTs,
      maxTs
    );

    // Subtle horizontal grid — no reference level lines
    const gridLines = [0, 25, 50, 75, 100]
      .map((val) => {
        const y = mapScoreToY(val, yMin, yMax).toFixed(2);
        return `<line x1="${M.left}" y1="${y}" x2="${
          W - M.right
        }" y2="${y}" stroke="#5a5f67" stroke-width="1" opacity="0.28"/>`;
      })
      .join("\n");

    const yAxisLabels = [0, 25, 50, 75, 100]
      .map((val) => {
        const y = mapScoreToY(val, yMin, yMax).toFixed(2);
        return `<text x="${
          M.left - 6
        }" y="${y}" text-anchor="end" dominant-baseline="middle" fill="#aeb4be" font-size="9.5">${val}</text>`;
      })
      .join("\n");

    // Composite line (primary, equity-blue, raw values)
    let compositePath = "";
    if (composite.length >= 2) {
      compositePath = composite
        .map((p, i) => {
          const x = mapDateToX(p.timestamp, minTs, maxTs).toFixed(2);
          const y = mapScoreToY(p.value, yMin, yMax).toFixed(2);
          return `${i === 0 ? "M" : "L"}${x} ${y}`;
        })
        .join(" ");
    }

    // Stretch line (secondary, vanilla-yellow, display-smoothed SMA-3)
    const stretchSmoothed = showStretch ? smoothSeries(stretch, 3) : [];
    let stretchPath = "";
    if (showStretch && stretchSmoothed.length >= 2) {
      stretchPath = stretchSmoothed
        .map((p, i) => {
          const x = mapDateToX(p.timestamp, minTs, maxTs).toFixed(2);
          const y = mapScoreToY(p.smoothedValue ?? p.value, yMin, yMax).toFixed(
            2
          );
          return `${i === 0 ? "M" : "L"}${x} ${y}`;
        })
        .join(" ");
    }

    // End labels sit just outside the right edge of the plot area
    const labelX = W - M.right + 5;
    let compositeEndLabel = "";
    let stretchEndLabel = "";

    if (composite.length > 0) {
      const last = composite[composite.length - 1];
      const y = mapScoreToY(last.value, yMin, yMax);
      compositeEndLabel = `<text x="${labelX}" y="${y.toFixed(
        2
      )}" text-anchor="start" dominant-baseline="middle" fill="${COLOR_COMPOSITE}" font-size="8.5" font-weight="600">${escapeHtml(
        last.state
      )}</text>`;
    }

    if (showStretch && stretch.length > 0) {
      const last = stretch[stretch.length - 1];
      let y = mapScoreToY(last.value, yMin, yMax);
      if (composite.length > 0) {
        const cY = mapScoreToY(
          composite[composite.length - 1].value,
          yMin,
          yMax
        );
        if (Math.abs(y - cY) < 18) y = cY + (y >= cY ? 18 : -18);
      }
      stretchEndLabel = `<text x="${labelX}" y="${y.toFixed(
        2
      )}" text-anchor="start" dominant-baseline="middle" fill="${COLOR_STRETCH}" font-size="8.5" opacity="0.75">${escapeHtml(
        last.state
      )}</text>`;
    }

    const refSeries = composite.length > 0 ? composite : stretch;
    const allYears = [
      ...new Set(refSeries.map((p) => new Date(p.date).getFullYear())),
    ];
    // Compute natural X position for every year label
    const MIN_LABEL_GAP = 38;
    const yearPositions = allYears
      .map((year) => {
        const pt = refSeries.find(
          (p) => new Date(p.date).getFullYear() === year
        );
        if (!pt) return null;
        const ratio = (pt.timestamp - minTs) / timeRange;
        return { year, x: M.left + ratio * CHART_W, ratio };
      })
      .filter(Boolean);

    // If first label is too close to the second, pull it left
    if (yearPositions.length >= 2) {
      const gap = yearPositions[1].x - yearPositions[0].x;
      if (gap < MIN_LABEL_GAP) {
        yearPositions[0].x = yearPositions[1].x - MIN_LABEL_GAP;
        yearPositions[0].x = Math.max(M.left, yearPositions[0].x);
      }
    }

    const xLabels = yearPositions
      .map(({ year, x, ratio }) => {
        const anchor =
          x <= M.left + 2 ? "start" : ratio > 0.92 ? "end" : "middle";
        return `<text x="${x.toFixed(2)}" y="${
          H - 6
        }" text-anchor="${anchor}" fill="#aeb4be" font-size="11">${year}</text>`;
      })
      .join("\n");

    const ttBoxH = showStretch ? 60 : 44;
    const tooltipMarkup = `
      <g id="regimeTooltipGroup" style="display:none;" pointer-events="none">
        <line id="regimeTTLine" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2" opacity="0.28"
              x1="0" x2="0" y1="${M.top}" y2="${H - M.bottom}"/>
        <circle id="regimeTTDotC" r="4" fill="${COLOR_COMPOSITE}" stroke="#1a2030" stroke-width="1.5" cx="0" cy="0"/>
        <circle id="regimeTTDotS" r="3" fill="${COLOR_STRETCH}" stroke="#1a2030" stroke-width="1.5" cx="0" cy="0"/>
        <rect id="regimeTTBox" rx="6" ry="6" fill="#1e2430" stroke="#364055" stroke-width="1"
              x="0" y="0" width="190" height="${ttBoxH}"/>
        <text id="regimeTTDate"      fill="#9aa7bf" font-size="11" x="0" y="0"/>
        <text id="regimeTTComposite" fill="${COLOR_COMPOSITE}" font-size="11" font-weight="600" x="0" y="0"/>
        <text id="regimeTTStretch"   fill="${COLOR_STRETCH}" font-size="10.5" x="0" y="0"/>
      </g>`;

    containerEl.innerHTML = `
      <defs>
        <clipPath id="regimeClip">
          <rect x="${M.left}" y="${
      M.top
    }" width="${CHART_W}" height="${CHART_H}"/>
        </clipPath>
      </defs>
      <rect x="${M.left}" y="${
      M.top
    }" width="${CHART_W}" height="${CHART_H}" fill="rgba(10,15,24,0.55)"/>
      <g clip-path="url(#regimeClip)">${bgSegments}</g>
      <g>${gridLines}</g>
      <g>${yAxisLabels}</g>
      ${
        stretchPath
          ? `<path d="${stretchPath}" fill="none" stroke="${COLOR_STRETCH}" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round" opacity="0.50" clip-path="url(#regimeClip)"/>`
          : ""
      }
      ${
        compositePath
          ? `<path d="${compositePath}" fill="none" stroke="${COLOR_COMPOSITE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#regimeClip)"/>`
          : ""
      }
      ${compositeEndLabel}
      ${stretchEndLabel}
      ${xLabels}
      ${tooltipMarkup}
      <rect id="regimeOverlay" x="${M.left}" y="${
      M.top
    }" width="${CHART_W}" height="${CHART_H}"
            fill="transparent" style="cursor:crosshair;"/>`;

    // ── Tooltip interaction ────────────────────────────────────────────────
    const overlay = containerEl.querySelector("#regimeOverlay");
    const ttGroup = containerEl.querySelector("#regimeTooltipGroup");
    if (!overlay || !ttGroup) return;

    const ttLine = containerEl.querySelector("#regimeTTLine");
    const ttDotC = containerEl.querySelector("#regimeTTDotC");
    const ttDotS = containerEl.querySelector("#regimeTTDotS");
    const ttBox = containerEl.querySelector("#regimeTTBox");
    const ttDate = containerEl.querySelector("#regimeTTDate");
    const ttComposite = containerEl.querySelector("#regimeTTComposite");
    const ttStretch = containerEl.querySelector("#regimeTTStretch");

    const compMap = new Map((compositeData ?? []).map((p) => [p.timestamp, p]));
    const strMap = new Map((stretchData ?? []).map((p) => [p.timestamp, p]));

    const visibleTs = [
      ...new Set([
        ...composite.map((p) => p.timestamp),
        ...stretch.map((p) => p.timestamp),
      ]),
    ].sort((a, b) => a - b);

    function findClosestTs(targetTs) {
      if (!visibleTs.length) return null;
      let lo = 0;
      let hi = visibleTs.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (visibleTs[mid] < targetTs) lo = mid + 1;
        else hi = mid;
      }
      if (
        lo > 0 &&
        Math.abs(visibleTs[lo - 1] - targetTs) <
          Math.abs(visibleTs[lo] - targetTs)
      ) {
        lo--;
      }
      return visibleTs[lo];
    }

    function fmtDate(ts) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }).format(new Date(ts));
    }

    overlay.addEventListener("mousemove", (e) => {
      const rect = containerEl.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const ratio = Math.max(0, Math.min(1, (svgX - M.left) / CHART_W));
      const targetTs = minTs + ratio * timeRange;
      const closestTs = findClosestTs(targetTs);
      if (closestTs === null) return;

      const cPt = compMap.get(closestTs);
      const sPt = strMap.get(closestTs);
      const posX = mapDateToX(closestTs, minTs, maxTs);

      ttGroup.style.display = "";
      ttLine.setAttribute("x1", posX.toFixed(2));
      ttLine.setAttribute("x2", posX.toFixed(2));

      if (cPt) {
        ttDotC.setAttribute("cx", posX.toFixed(2));
        ttDotC.setAttribute(
          "cy",
          mapScoreToY(cPt.value, yMin, yMax).toFixed(2)
        );
        ttDotC.style.display = "";
      } else {
        ttDotC.style.display = "none";
      }

      if (showStretch) {
        if (sPt) {
          ttDotS.setAttribute("cx", posX.toFixed(2));
          ttDotS.setAttribute(
            "cy",
            mapScoreToY(sPt.value, yMin, yMax).toFixed(2)
          );
          ttDotS.style.display = "";
        } else {
          ttDotS.style.display = "none";
        }
      } else {
        ttDotS.style.display = "none";
      }

      const boxW = 190;
      const boxH = ttBoxH;
      let boxX = posX + 10;
      if (boxX + boxW > W - M.right) boxX = posX - boxW - 10;
      const boxY = Math.max(
        M.top + 2,
        Math.min(H - M.bottom - boxH - 2, M.top + CHART_H / 2 - boxH / 2)
      );

      ttBox.setAttribute("x", boxX);
      ttBox.setAttribute("y", boxY);
      ttDate.setAttribute("x", boxX + 8);
      ttDate.setAttribute("y", boxY + 14);
      ttDate.textContent = fmtDate(closestTs);
      ttComposite.setAttribute("x", boxX + 8);
      ttComposite.setAttribute("y", boxY + 30);
      ttComposite.textContent = cPt
        ? `Composite: ${cPt.value.toFixed(1)} / ${cPt.state}`
        : "";
      if (showStretch) {
        ttStretch.setAttribute("x", boxX + 8);
        ttStretch.setAttribute("y", boxY + 46);
        ttStretch.textContent = sPt
          ? `Stretch: ${sPt.value.toFixed(1)} / ${sPt.state}`
          : "";
      }
    });

    overlay.addEventListener("mouseleave", () => {
      ttGroup.style.display = "none";
    });
  }

  async function loadRegimeEngineData() {
    const [compResult, strResult] = await Promise.allSettled([
      fetchJson("./systems/risk-regime/wl-regime-composite.json"),
      fetchJson("./systems/risk-regime/wl-stretch-score.json"),
    ]);
    return {
      compositeData:
        compResult.status === "fulfilled"
          ? normalizeRegimeSeries(compResult.value)
          : [],
      stretchData:
        strResult.status === "fulfilled"
          ? normalizeRegimeSeries(strResult.value)
          : [],
    };
  }

  async function initRegimeEnginePanel(containerEl, minTs, maxTs) {
    if (!containerEl) return;
    try {
      const { compositeData, stretchData } = await loadRegimeEngineData();
      const allPoints = [...compositeData, ...stretchData].sort(
        (a, b) => a.timestamp - b.timestamp
      );
      if (allPoints.length === 0) {
        containerEl.innerHTML = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#7f8ba4" font-size="14">Regime data unavailable</text>`;
        return;
      }
      const effectiveMin = Number.isFinite(minTs)
        ? minTs
        : allPoints[0].timestamp;
      const effectiveMax = Number.isFinite(maxTs)
        ? maxTs
        : allPoints[allPoints.length - 1].timestamp;
      renderRegimeEnginePanel(
        containerEl,
        compositeData,
        stretchData,
        effectiveMin,
        effectiveMax
      );
      // Sync legend item visibility with config
      const legendStretch = document.getElementById("regimeLegendStretch");
      if (legendStretch) {
        legendStretch.style.display =
          window.WL_KPI_CONFIG?.display?.showRegimeStretchScore ?? true
            ? ""
            : "none";
      }
    } catch (err) {
      console.error("[regime-engine-chart]", err);
      if (containerEl) {
        containerEl.innerHTML = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#7f8ba4" font-size="14">Regime data unavailable</text>`;
      }
    }
  }

  global.initRegimeEnginePanel = initRegimeEnginePanel;
  global.renderRegimeEnginePanel = renderRegimeEnginePanel;
})(window);
