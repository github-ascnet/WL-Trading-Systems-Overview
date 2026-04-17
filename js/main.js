function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return new Intl.NumberFormat("en-GB", {
    useGrouping: false,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

function getDisplayDivisor(key, fallback = 1) {
  const configuredValue = Number(window.WL_KPI_CONFIG?.display?.[key]);
  return Number.isFinite(configuredValue) && configuredValue !== 0
    ? configuredValue
    : fallback;
}

function formatStartingCapital(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  const divisor = getDisplayDivisor("startingCapitalDivisor", 100);
  return formatNumber(Number(value) / divisor, decimals);
}

function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${formatNumber(value, decimals)}%`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB").format(date);
}

function formatDateLong(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getValueClass(value) {
  if (Number(value) > 0) return "positive";
  if (Number(value) < 0) return "negative";
  return "neutral";
}

function getConfiguredMetric(metricKey, value, fallback = "neutral") {
  if (typeof window.getKpiPresentation !== "function") {
    return { className: fallback, trophy: false };
  }

  const result = window.getKpiPresentation(metricKey, value, "dashboard");
  return {
    className: result.className || fallback,
    trophy: Boolean(result.trophy),
  };
}

function cleanStrategyName(name) {
  return String(name ?? "")
    .replace(/\s*\(.*?\)/g, "")
    .trim();
}

function buildOverviewSummary(text) {
  const normalized = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";

  const firstTwoSentences = normalized
    .split(/(?<=[.!?])\s+/)
    .slice(0, 2)
    .join(" ");

  if (firstTwoSentences.length <= 180) {
    return firstTwoSentences;
  }

  return `${firstTwoSentences.slice(0, 177).trimEnd()}...`;
}

function safeGet(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return fallback;
}

function countOpenPositions(positions) {
  if (!Array.isArray(positions)) return 0;
  return positions.filter(
    (p) =>
      p &&
      (p.isOpen === true ||
        p.exitDate === null ||
        p.exitDate === undefined ||
        String(p.exitDate).toLowerCase() === "open")
  ).length;
}

function normalizeCurrentState(raw, systemId, positions, signals) {
  const currentState = raw || {};

  const symbolUniverseRaw = String(
    safeGet(currentState, ["symbolUniverse", "universeName"], "")
  );
  const universeParts = symbolUniverseRaw.split(";");
  const universeName = universeParts[0]?.trim() || "Unknown";
  const datasourceName = universeParts[1]?.trim() || "Unknown";

  return {
    strategyName: safeGet(currentState, ["strategyName", "name"], systemId),
    strategyDescription: safeGet(
      currentState,
      ["strategyDescription", "description"],
      ""
    ),
    benchmark: safeGet(currentState, ["benchmark"], "-"),
    symbolUniverse: symbolUniverseRaw || "-",
    universeName,
    datasourceName,
    apr: safeGet(currentState, ["apr", "cagr", "totalReturnCagr"], null),
    maxDrawdown: safeGet(
      currentState,
      ["maxDrawdown", "maxDd", "drawdown"],
      null
    ),
    openPositions:
      safeGet(currentState, ["openPositions", "positionsCount"], null) ??
      countOpenPositions(positions),
    signalCount:
      safeGet(currentState, ["signalCount", "signalsCount"], null) ??
      (Array.isArray(signals) ? signals.length : 0),
    lastUpdated: safeGet(
      currentState,
      ["lastUpdated", "generatedAt", "updatedAt", "lastUpdate"],
      null
    ),

    startingCapital: safeGet(currentState, ["startingCapital"], null),
    backtestStartDate: safeGet(currentState, ["backtestStartDate"], null),
    profit: safeGet(currentState, ["profit"], null),
    profitPercent: safeGet(currentState, ["profitPercent"], null),
    riskReturnMetaScore: safeGet(currentState, ["riskReturnMetaScore"], null),
    sharpeRatio: safeGet(currentState, ["sharpeRatio"], null),
    marRatio: safeGet(currentState, ["marRatio"], null),
    recoveryFactor: safeGet(currentState, ["recoveryFactor"], null),
    avgReturnYear: safeGet(currentState, ["avgReturnYear"], null),
    stdDeviationYear: safeGet(currentState, ["stdDeviationYear"], null),
    avgBarsHeld: safeGet(currentState, ["avgBarsHeld"], null),
    exposure: safeGet(currentState, ["exposure"], null),
    maximumExposure: safeGet(currentState, ["maximumExposure"], null),
    profitFactor: safeGet(currentState, ["profitFactor"], null),
    avgProfitPercent: safeGet(currentState, ["avgProfitPercent"], null),
    profitablePercent: safeGet(currentState, ["profitablePercent"], null),
    positionCount:
      safeGet(currentState, ["positionCount"], null) ??
      (Array.isArray(positions) ? positions.length : 0),
    nsfPositionCount: safeGet(currentState, ["nsfPositionCount"], null),
    maxMarginUsed: safeGet(currentState, ["maxMarginUsed"], null),
    avgEntryEfficiencyPercent: safeGet(
      currentState,
      ["avgEntryEfficiencyPercent"],
      null
    ),
    avgExitEfficiencyPercent: safeGet(
      currentState,
      ["avgExitEfficiencyPercent"],
      null
    ),
  };
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mainNav = document.getElementById("mainNav");
  const activeTabLabel = document.getElementById("activeTabLabel");

  if (!tabs.length || !panels.length || !mainNav || !hamburgerBtn) {
    return;
  }

  function closeMenu() {
    mainNav.classList.remove("open");
    hamburgerBtn.classList.remove("open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }

  if (!hamburgerBtn.dataset.bound) {
    hamburgerBtn.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      hamburgerBtn.classList.toggle("open", isOpen);
      hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
    });
    hamburgerBtn.dataset.bound = "1";
  }

  if (!document.body.dataset.mainOutsideClickBound) {
    document.addEventListener("click", (e) => {
      if (!mainNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeMenu();
      }
    });
    document.body.dataset.mainOutsideClickBound = "1";
  }

  tabs.forEach((tab) => {
    if (tab.dataset.bound === "1") return;

    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (!target) return;

      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPanel = document.getElementById(target);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      if (activeTabLabel) {
        const titleSpan = tab.querySelector("span:last-child");
        activeTabLabel.textContent = titleSpan ? titleSpan.textContent : target;
      }
      closeMenu();
    });

    tab.dataset.bound = "1";
  });
}

function renderOverview(currentState, positions) {
  const overviewCards = document.getElementById("overviewCards");
  const overviewTableBody = document.getElementById("overviewTableBody");
  const overviewSubtitle = document.getElementById("overviewSubtitle");
  const lastUpdateBadge = document.getElementById("lastUpdateBadge");

  if (!overviewCards || !overviewTableBody) return;

  if (overviewSubtitle) {
    overviewSubtitle.textContent = "";
  }
  if (lastUpdateBadge) {
    lastUpdateBadge.textContent = `Updated: ${formatDate(
      currentState.lastUpdated
    )}`;
  }

  const normalizedOpenTrades = Number(currentState.openPositions);
  const openTrades = Number.isFinite(normalizedOpenTrades)
    ? normalizedOpenTrades
    : countOpenPositions(positions);
  const riskScore = Number(currentState.riskReturnMetaScore);
  const profitablePercent = Number(currentState.profitablePercent);
  const aprConfig = getConfiguredMetric(
    "apr",
    currentState.apr,
    getValueClass(currentState.apr)
  );
  const maxDrawdownConfig = getConfiguredMetric(
    "maxDrawdown",
    currentState.maxDrawdown,
    getValueClass(currentState.maxDrawdown)
  );
  const sharpeConfig = getConfiguredMetric(
    "sharpeRatio",
    currentState.sharpeRatio,
    "neutral"
  );
  const riskScoreConfig = getConfiguredMetric(
    "riskReturnMetaScore",
    currentState.riskReturnMetaScore,
    Number.isNaN(riskScore)
      ? "neutral"
      : riskScore >= 50
      ? "positive"
      : riskScore >= 35
      ? "neutral"
      : "negative"
  );
  const profitableConfig = getConfiguredMetric(
    "profitablePercent",
    currentState.profitablePercent,
    !Number.isNaN(profitablePercent) && profitablePercent > 50
      ? "positive"
      : "negative"
  );

  const cards = [
    {
      label: "APR",
      value: formatPercent(currentState.apr),
      cssClass: aprConfig.className,
    },
    {
      label: "Profit %",
      value: formatPercent(currentState.profitPercent, 0),
      cssClass: getValueClass(currentState.profitPercent),
    },
    {
      label: "Max Drawdown",
      value: formatPercent(currentState.maxDrawdown),
      cssClass: maxDrawdownConfig.className,
    },
    {
      label: "Sharpe Ratio",
      value: formatNumber(currentState.sharpeRatio),
      cssClass: sharpeConfig.className,
      valueSuffix: sharpeConfig.trophy ? " 🏆" : "",
    },
    {
      label: "MAR Ratio",
      value: formatNumber(currentState.marRatio),
      cssClass: getValueClass(currentState.marRatio),
    },
    {
      label: "Risk-Return Score",
      value: formatNumber(currentState.riskReturnMetaScore),
      cssClass: riskScoreConfig.className,
      valueSuffix: riskScoreConfig.trophy ? " 🏆" : "",
      tooltip:
        "RRSuperScore combines APR, MAR Ratio, Recovery Factor, stability metrics, maximum drawdown, and the share of extreme outliers into a weighted total score between 0 and 100.\n\nInterpretation:\n80-100 Very good - low risk, strong resilience\n50-79 Good - stable strategy with acceptable risk\n35-49 Average - visible weaknesses\n20-34 Weak - either inefficient or risky\n0-19 Critical - not recommended",
    },
    {
      label: "Profitable %",
      value: formatPercent(currentState.profitablePercent),
      cssClass: profitableConfig.className,
      valueSuffix: profitableConfig.trophy ? " 🏆" : "",
    },
    {
      label: "Open Trades",
      value: String(openTrades),
      cssClass: openTrades > 0 ? "positive" : "negative",
    },
  ];

  overviewCards.innerHTML = cards
    .map(
      (card) => `
    <div class="card">
      <div class="card-label">
        ${escapeHtml(card.label)}
        ${
          card.tooltip
            ? `<span class="card-info" data-tooltip="${escapeHtml(
                card.tooltip
              )}">&#33;</span>`
            : ""
        }
      </div>
      <div class="card-value ${escapeHtml(card.cssClass)}">${escapeHtml(
        card.value
      )}${card.valueSuffix ?? ""}</div>
    </div>
  `
    )
    .join("");

  const metrics = [
    ["Starting Capital", formatStartingCapital(currentState.startingCapital)],
    ["Start Date", formatDateLong(currentState.backtestStartDate)],
    ["Universe", currentState.universeName],
    ["Datasource", currentState.datasourceName],
    ["Benchmark", currentState.benchmark],
    ["Profit %", formatPercent(currentState.profitPercent, 0)],
    ["Position Count", currentState.positionCount],
    ["Avg Return % (Year)", formatPercent(currentState.avgReturnYear)],
    ["Std. Deviation (Year)", formatNumber(currentState.stdDeviationYear)],
    ["Exposure", formatPercent(currentState.exposure, 0)],
    ["Max Exposure", formatPercent(currentState.maximumExposure, 0)],
    ["Recovery Factor", formatNumber(currentState.recoveryFactor)],
    ["Avg Profit %", formatPercent(currentState.avgProfitPercent)],
  ];

  overviewTableBody.innerHTML = metrics
    .map(
      ([label, value]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `
    )
    .join("");
}

function renderMetricsReport(currentState) {
  const metricsTableBody = document.getElementById("metricsTableBody");
  if (!metricsTableBody) return;

  const rows = [
    ["Starting Capital", formatStartingCapital(currentState.startingCapital)],
    ["Start Date", formatDateLong(currentState.backtestStartDate)],
    ["APR", formatPercent(currentState.apr)],
    ["Profit %", formatPercent(currentState.profitPercent, 0)],
    ["Risk-Return Meta Score", currentState.riskReturnMetaScore],
    ["Sharpe Ratio", formatNumber(currentState.sharpeRatio)],
    ["MAR Ratio", formatNumber(currentState.marRatio)],
    ["Recovery Factor", formatNumber(currentState.recoveryFactor)],
    ["Max Drawdown %", formatPercent(currentState.maxDrawdown)],
    ["Avg Return % (Year)", formatPercent(currentState.avgReturnYear)],
    ["Std. Deviation (Year)", formatNumber(currentState.stdDeviationYear)],
    ["Avg Bars Held", formatNumber(currentState.avgBarsHeld)],
    ["Exposure", formatPercent(currentState.exposure, 0)],
    ["Maximum Exposure", formatPercent(currentState.maximumExposure, 0)],
    ["Profit Factor", formatNumber(currentState.profitFactor)],
    ["Avg Profit %", formatPercent(currentState.avgProfitPercent)],
    ["Profitable %", formatPercent(currentState.profitablePercent)],
    ["NSF Position Count", formatNumber(currentState.nsfPositionCount, 0)],
    ["Max Margin Used", formatNumber(currentState.maxMarginUsed)],
    [
      "Avg Entry Efficiency %",
      formatPercent(currentState.avgEntryEfficiencyPercent),
    ],
    [
      "Avg Exit Efficiency %",
      formatPercent(currentState.avgExitEfficiencyPercent),
    ],
  ];

  metricsTableBody.innerHTML = rows
    .map(
      ([label, value]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `
    )
    .join("");
}

let _positionsData = [];
let _positionsSortKey = null;
let _positionsSortAsc = true;

function renderPositionsRows(positions) {
  const positionsTableBody = document.getElementById("positionsTableBody");
  if (!positionsTableBody) return;

  positionsTableBody.innerHTML = positions
    .map((position) => {
      const plPercentClass = getValueClass(position.plPercent);
      const symbol = String(position.symbol ?? "").replace(/\..*$/, "");
      const exitDateDisplay = position.exitDate
        ? formatDateLong(position.exitDate)
        : "Open";

      const entryMs = position.entryDate
        ? new Date(position.entryDate).getTime()
        : null;
      const exitMs = position.exitDate
        ? new Date(position.exitDate).getTime()
        : Date.now();
      const daysHeld =
        entryMs != null ? Math.round((exitMs - entryMs) / 86400000) : "";

      return `
      <tr>
        <td class="col-symbol">${escapeHtml(symbol)}</td>
        <td>${escapeHtml(formatDateLong(position.entryDate))}</td>
        <td>${escapeHtml(exitDateDisplay)}</td>
        <td class="col-hide-mobile">${escapeHtml(
          formatNumber(position.entryPrice)
        )}</td>
        <td class="col-hide-mobile">${escapeHtml(
          formatNumber(position.exitPrice)
        )}</td>
        <td class="${escapeHtml(plPercentClass)}">${escapeHtml(
        formatPercent(position.plPercent)
      )}</td>
        <td>${daysHeld}</td>
      </tr>
    `;
    })
    .join("");
}

function renderPositions(positions) {
  const positionsTableBody = document.getElementById("positionsTableBody");
  if (!positionsTableBody) return;

  if (!Array.isArray(positions) || positions.length === 0) {
    positionsTableBody.innerHTML =
      '<tr><td colspan="7" class="empty">No positions available.</td></tr>';
    return;
  }

  _positionsData = positions;
  renderPositionsRows(_positionsData);

  document.querySelectorAll("#positions .sortable").forEach((th) => {
    if (th.dataset.bound === "1") return;

    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (_positionsSortKey === key) {
        _positionsSortAsc = !_positionsSortAsc;
      } else {
        _positionsSortKey = key;
        _positionsSortAsc = true;
      }

      const sorted = [..._positionsData].sort((a, b) => {
        let valA = a[key] ?? "";
        let valB = b[key] ?? "";
        if (key === "entryDate" || key === "exitDate") {
          valA = valA
            ? new Date(valA).getTime()
            : key === "exitDate"
            ? Infinity
            : 0;
          valB = valB
            ? new Date(valB).getTime()
            : key === "exitDate"
            ? Infinity
            : 0;
        } else {
          valA = Number(valA);
          valB = Number(valB);
        }
        return _positionsSortAsc ? valA - valB : valB - valA;
      });

      document
        .querySelectorAll("#positions .sortable .sort-icon")
        .forEach((icon) => {
          icon.textContent = "";
        });
      th.querySelector(".sort-icon").textContent = _positionsSortAsc
        ? " ▲"
        : " ▼";

      renderPositionsRows(sorted);
    });

    th.dataset.bound = "1";
  });
}

function renderEquityChart(equityData) {
  const svg = document.getElementById("equityChart");
  if (!svg) return;

  if (!Array.isArray(equityData) || equityData.length < 2) {
    svg.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" fill="#b8bcc4" font-size="16">Not enough equity data available.</text>
    `;
    return;
  }

  const width = 1000;
  const height = 340;
  const yAxisLabelDivisor = getDisplayDivisor("equityDivisor", 100);
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const values = equityData.map((item) => Math.max(Number(item.equity), 1));
  const logMin = Math.log(Math.min(...values));
  const logMax = Math.log(Math.max(...values));
  const logRange = Math.max(logMax - logMin, 1e-9);

  const points = equityData.map((item, index) => {
    const x = margin.left + (index / (equityData.length - 1)) * chartWidth;
    const y =
      margin.top +
      ((logMax - Math.log(Math.max(Number(item.equity), 1))) / logRange) *
        chartHeight;
    return { x, y, date: item.date, equity: Number(item.equity) };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${
    height - margin.bottom
  } L ${points[0].x.toFixed(2)} ${height - margin.bottom} Z`;

  const horizontalGrid = Array.from({ length: 5 }, (_, i) => {
    const y = margin.top + (i / 4) * chartHeight;
    return `<line x1="${margin.left}" y1="${y}" x2="${
      width - margin.right
    }" y2="${y}" />`;
  }).join("");

  const verticalGrid = Array.from({ length: 6 }, (_, i) => {
    const x = margin.left + (i / 5) * chartWidth;
    return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${
      height - margin.bottom
    }" />`;
  }).join("");

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const logValue = logMax - (i / 4) * logRange;
    const value = Math.exp(logValue);
    const y = margin.top + (i / 4) * chartHeight + 4;
    return `<text x="10" y="${y}" fill="#aeb4be" font-size="12">${escapeHtml(
      formatNumber(value / yAxisLabelDivisor, 0)
    )}</text>`;
  }).join("");

  const xLabels = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const index = Math.min(
        equityData.length - 1,
        Math.round((equityData.length - 1) * ratio)
      );
      const x = margin.left + ratio * chartWidth;
      const anchor = ratio === 0 ? "start" : ratio === 1 ? "end" : "middle";
      return `<text x="${x}" y="${
        height - 12
      }" text-anchor="${anchor}" fill="#aeb4be" font-size="12">${escapeHtml(
        equityData[index].date
      )}</text>`;
    })
    .join("");

  const cashZones = [];
  let zoneStart = 0;
  for (let i = 1; i <= points.length; i += 1) {
    const same =
      i < points.length &&
      Math.abs(points[i].equity - points[zoneStart].equity) < 0.01;
    if (!same) {
      if (i - zoneStart >= 3) {
        cashZones.push({ from: zoneStart, to: i - 1 });
      }
      zoneStart = i;
    }
  }

  const cashZoneRects = cashZones
    .map(({ from, to }) => {
      const x1 = points[from].x;
      const x2 = points[to].x;
      return `<rect x="${x1.toFixed(2)}" y="${margin.top}" width="${(
        x2 - x1
      ).toFixed(
        2
      )}" height="${chartHeight}" fill="#ff8080" opacity="0.18" rx="0"/>`;
    })
    .join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#49df68" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="#49df68" stop-opacity="0.02"></stop>
      </linearGradient>
    </defs>
    <g opacity="0.28" stroke="#5a5f67" stroke-width="1">
      ${horizontalGrid}
      ${verticalGrid}
    </g>
    ${cashZoneRects}
    <path d="${areaPath}" fill="url(#fillGreen)"></path>
    <path d="${linePath}" fill="none" stroke="#56e86c" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"></path>
    ${yLabels}
    ${xLabels}
    <g id="equityTooltipGroup" style="display:none;">
      <line id="equityTooltipLine" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2" opacity="0.35" x1="0" x2="0" y1="${
        margin.top
      }" y2="${height - margin.bottom}"/>
      <circle id="equityTooltipDot" r="5" fill="#56e86c" stroke="#1e1f22" stroke-width="2" cx="0" cy="0"/>
      <rect id="equityTooltipBox" rx="6" ry="6" fill="#2c2f34" stroke="#42464d" stroke-width="1" x="0" y="0" width="160" height="50"/>
      <text id="equityTooltipDate" fill="#b8bcc4" font-size="12" x="0" y="0"/>
      <text id="equityTooltipValue" fill="#e6e6e6" font-size="13" font-weight="600" x="0" y="0"/>
    </g>
    <rect id="equityChartOverlay" x="${margin.left}" y="${
    margin.top
  }" width="${chartWidth}" height="${chartHeight}" fill="transparent" style="cursor:crosshair;"/>
  `;

  const overlay = svg.querySelector("#equityChartOverlay");
  const tooltipGroup = svg.querySelector("#equityTooltipGroup");
  const tooltipLine = svg.querySelector("#equityTooltipLine");
  const tooltipDot = svg.querySelector("#equityTooltipDot");
  const tooltipBox = svg.querySelector("#equityTooltipBox");
  const tooltipDateEl = svg.querySelector("#equityTooltipDate");
  const tooltipValueEl = svg.querySelector("#equityTooltipValue");

  overlay.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;

    const ratio = Math.max(0, Math.min(1, (svgX - margin.left) / chartWidth));
    const index = Math.round(ratio * (equityData.length - 1));
    const point = points[index];

    tooltipGroup.style.display = "";

    tooltipLine.setAttribute("x1", point.x);
    tooltipLine.setAttribute("x2", point.x);

    tooltipDot.setAttribute("cx", point.x);
    tooltipDot.setAttribute("cy", point.y);

    const boxWidth = 160;
    const boxHeight = 50;
    const pad = 8;
    let boxX = point.x + 12;
    if (boxX + boxWidth > width - margin.right) {
      boxX = point.x - boxWidth - 12;
    }
    const boxY = Math.max(
      margin.top,
      Math.min(point.y - boxHeight / 2, height - margin.bottom - boxHeight)
    );

    tooltipBox.setAttribute("x", boxX);
    tooltipBox.setAttribute("y", boxY);

    tooltipDateEl.setAttribute("x", boxX + pad);
    tooltipDateEl.setAttribute("y", boxY + 18);
    tooltipDateEl.textContent = formatDate(point.date);

    tooltipValueEl.setAttribute("x", boxX + pad);
    tooltipValueEl.setAttribute("y", boxY + 37);
    tooltipValueEl.textContent = `USD ${formatNumber(
      point.equity / yAxisLabelDivisor,
      0
    )}`;
  });

  overlay.addEventListener("mouseleave", () => {
    tooltipGroup.style.display = "none";
  });
}

function renderError(error) {
  const safeMessage = escapeHtml(error?.message || "Unknown error");

  const overviewCards = document.getElementById("overviewCards");
  if (overviewCards) {
    overviewCards.innerHTML = `<div class="error">${safeMessage}</div>`;
  }

  const overviewTableBody = document.getElementById("overviewTableBody");
  if (overviewTableBody) {
    overviewTableBody.innerHTML = `<tr><td colspan="2" class="error">${safeMessage}</td></tr>`;
  }

  const metricsTableBody = document.getElementById("metricsTableBody");
  if (metricsTableBody) {
    metricsTableBody.innerHTML = `<tr><td colspan="2" class="error">${safeMessage}</td></tr>`;
  }

  const monthlyReturnsGrid = document.getElementById("monthlyReturnsGrid");
  if (monthlyReturnsGrid) {
    monthlyReturnsGrid.innerHTML = `<div class="error">${safeMessage}</div>`;
  }

  const positionsTableBody = document.getElementById("positionsTableBody");
  if (positionsTableBody) {
    positionsTableBody.innerHTML = `<tr><td colspan="9" class="error">${safeMessage}</td></tr>`;
  }

  const equityChart = document.getElementById("equityChart");
  if (equityChart) {
    equityChart.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#ff6666" font-size="16">${safeMessage}</text>`;
  }
}

function setupCardTooltip() {
  const tooltip = document.getElementById("cardTooltip");
  if (!tooltip || document.body.dataset.cardTooltipBound === "1") return;

  function showTooltip(target) {
    const text = target?.dataset.tooltip;
    if (!text) return;

    tooltip.textContent = text;
    tooltip.classList.add("visible");

    const rect = target.getBoundingClientRect();
    const tipW = tooltip.offsetWidth;
    const tipH = tooltip.offsetHeight;
    const margin = 8;

    let left = rect.left + rect.width / 2 - tipW / 2;
    let top = rect.top - tipH - margin;

    if (left < margin) left = margin;
    if (left + tipW > window.innerWidth - margin) {
      left = window.innerWidth - tipW - margin;
    }
    if (top < margin) top = rect.bottom + margin;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
  }

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest("[data-tooltip]");
    if (!target) return;
    showTooltip(target);
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-tooltip]")) {
      hideTooltip();
    }
  });

  document.addEventListener("focusin", (e) => {
    const target = e.target.closest("[data-tooltip]");
    if (!target) return;
    showTooltip(target);
  });

  document.addEventListener("focusout", (e) => {
    if (e.target.closest("[data-tooltip]")) {
      hideTooltip();
    }
  });

  document.body.dataset.cardTooltipBound = "1";
}

function bootDashboard({ systemId, currentState, equity, positions, signals }) {
  try {
    setupTabs();
    setupCardTooltip();

    const safeCurrentState = normalizeCurrentState(
      currentState || {},
      systemId || "unknown-system",
      positions,
      signals
    );

    const cleanedName = cleanStrategyName(safeCurrentState.strategyName);
    const fullStrategyDescription = String(
      safeCurrentState.strategyDescription ?? ""
    ).trim();

    const strategyTitleEl = document.getElementById("strategyTitle");
    if (strategyTitleEl) {
      strategyTitleEl.textContent = cleanedName || systemId || "Dashboard";
    }

    const strategyInfoEl = document.getElementById("strategyInfo");
    if (strategyInfoEl) {
      if (fullStrategyDescription) {
        strategyInfoEl.dataset.tooltip = fullStrategyDescription;
        strategyInfoEl.hidden = false;
      } else {
        delete strategyInfoEl.dataset.tooltip;
        strategyInfoEl.hidden = true;
      }
    }

    if (cleanedName) {
      document.title = cleanedName;
    }

    const strategyDescEl = document.getElementById("strategyDescription");
    if (strategyDescEl) {
      strategyDescEl.textContent = "";
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        safeCurrentState.strategyDescription ||
          `Dashboard for ${cleanedName || systemId || "System"}`
      );
    }

    renderOverview(safeCurrentState, positions);
    renderMetricsReport(safeCurrentState);
    renderPositions(Array.isArray(positions) ? positions : []);
    renderMonthlyReturns(Array.isArray(equity) ? equity : [], safeCurrentState);
    renderEquityChart(Array.isArray(equity) ? equity : []);
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

window.bootDashboard = bootDashboard;
window.renderError = renderError;
