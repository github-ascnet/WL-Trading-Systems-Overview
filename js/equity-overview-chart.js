(function equityOverviewChartModule(global) {
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 340;
  const CHART_MARGIN = { top: 20, right: 20, bottom: 40, left: 72 };
  const DEFAULT_EQUITY_DIVISOR = 100;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }

    return new Intl.NumberFormat("en-GB", {
      useGrouping: false,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(value));
  }

  function formatDateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value ?? "-");
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  }

  function getEquityDivisor() {
    const configuredValue = Number(
      global.WL_KPI_CONFIG?.display?.equityDivisor
    );
    return Number.isFinite(configuredValue) && configuredValue !== 0
      ? configuredValue
      : DEFAULT_EQUITY_DIVISOR;
  }

  function formatScaledEquityValue(value, decimals = 0) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }

    // The portfolio curve is aggregated from raw equity values first.
    // Only the display layer applies equityDivisor for the axis and tooltip.
    return formatNumber(Number(value) / getEquityDivisor(), decimals);
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load file: ${path} (${response.status})`);
    }
    return response.json();
  }

  function setStatus(message) {
    const statusEl = document.getElementById("portfolioOverviewStatus");
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function renderEmptyState(containerElement, message) {
    if (!containerElement) return;

    containerElement.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" fill="#b8bcc4" font-size="16">${escapeHtml(
        message
      )}</text>
    `;
  }

  function normalizeEquitySeries(rawSeries, systemId) {
    if (!Array.isArray(rawSeries)) {
      console.warn(
        `[equity-overview-chart] Equity data for ${systemId} is not an array.`
      );
      return [];
    }

    const normalizedByDate = new Map();

    rawSeries.forEach((point) => {
      const dateValue = String(point?.date ?? "").trim();
      const equityValue = Number(point?.equity);
      const timestamp = Date.parse(dateValue);

      if (!dateValue || Number.isNaN(timestamp)) {
        console.warn(
          `[equity-overview-chart] Skipping invalid date for ${systemId}:`,
          point
        );
        return;
      }

      if (!Number.isFinite(equityValue)) {
        console.warn(
          `[equity-overview-chart] Skipping invalid equity for ${systemId}:`,
          point
        );
        return;
      }

      const normalizedDate = new Date(timestamp).toISOString().slice(0, 10);
      normalizedByDate.set(normalizedDate, {
        date: normalizedDate,
        timestamp: Date.parse(normalizedDate),
        equity: equityValue,
      });
    });

    return Array.from(normalizedByDate.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  async function loadAllSystemEquitySeries() {
    const systems = Array.isArray(global.SYSTEMS) ? global.SYSTEMS : [];

    const results = await Promise.allSettled(
      systems.map(async (system) => {
        const basePath =
          typeof system?.dataPath === "string" && system.dataPath.trim()
            ? system.dataPath
            : `./systems/${system?.id ?? "unknown-system"}`;

        const rawSeries = await fetchJson(`${basePath}/wl-equity.json`);
        const normalizedSeries = normalizeEquitySeries(rawSeries, system.id);

        if (normalizedSeries.length === 0) {
          throw new Error(`No valid equity points found for ${system.id}.`);
        }

        return {
          systemId: system.id,
          series: normalizedSeries,
        };
      })
    );

    const validSeries = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        validSeries.push(result.value);
        return;
      }

      console.warn(
        `[equity-overview-chart] Failed to load equity for ${
          systems[index]?.id ?? "unknown-system"
        }.`,
        result.reason
      );
    });

    return {
      systemsTotal: systems.length,
      systemsLoaded: validSeries.length,
      seriesCollection: validSeries,
    };
  }

  function buildUnifiedDateAxis(seriesCollection) {
    const allDates = new Set();

    seriesCollection.forEach((entry) => {
      entry.series.forEach((point) => {
        allDates.add(point.date);
      });
    });

    return Array.from(allDates)
      .map((date) => ({ date, timestamp: Date.parse(date) }))
      .filter((point) => Number.isFinite(point.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function carryForwardMissingValues(unifiedDateAxis, series) {
    const valueByDate = new Map(
      series.map((point) => [point.date, point.equity])
    );

    const firstKnownEquity = Number(series[0]?.equity);
    let lastKnownEquity = Number.isFinite(firstKnownEquity)
      ? firstKnownEquity
      : null;

    return unifiedDateAxis.map((axisPoint) => {
      if (valueByDate.has(axisPoint.date)) {
        lastKnownEquity = valueByDate.get(axisPoint.date);
      }

      // We intentionally seed the period before the first recorded point with the
      // first known raw equity value. This avoids an artificial jump at the start
      // when different systems begin reporting on slightly different dates.
      return {
        date: axisPoint.date,
        timestamp: axisPoint.timestamp,
        equity: lastKnownEquity,
      };
    });
  }

  function aggregatePortfolioSeries(seriesCollection, unifiedDateAxis) {
    const filledSeriesCollection = seriesCollection.map((entry) => ({
      systemId: entry.systemId,
      series: carryForwardMissingValues(unifiedDateAxis, entry.series),
    }));

    return unifiedDateAxis
      .map((axisPoint, index) => {
        let totalEquity = 0;
        let activeSystems = 0;

        filledSeriesCollection.forEach((entry) => {
          const point = entry.series[index];
          if (point && Number.isFinite(point.equity)) {
            totalEquity += point.equity;
            activeSystems += 1;
          }
        });

        return {
          date: axisPoint.date,
          timestamp: axisPoint.timestamp,
          equity: totalEquity,
          activeSystems,
        };
      })
      .filter((point) => point.activeSystems > 0);
  }

  function renderEquityOverviewChart(containerElement, portfolioSeries) {
    if (!containerElement) return;

    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      renderEmptyState(containerElement, "No portfolio equity data available.");
      return;
    }

    const width = SVG_WIDTH;
    const height = SVG_HEIGHT;
    const margin = CHART_MARGIN;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const values = portfolioSeries.map((item) =>
      Math.max(Number(item.equity), 1)
    );
    const logMin = Math.log(Math.min(...values));
    const logMax = Math.log(Math.max(...values));
    const logRange = Math.max(logMax - logMin, 1e-9);

    const points = portfolioSeries.map((item, index) => {
      const x =
        margin.left + (index / (portfolioSeries.length - 1)) * chartWidth;
      const y =
        margin.top +
        ((logMax - Math.log(Math.max(Number(item.equity), 1))) / logRange) *
          chartHeight;

      return {
        x,
        y,
        date: item.date,
        equity: item.equity,
        activeSystems: item.activeSystems,
      };
    });

    const linePath = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(
            2
          )}`
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

      return `<text x="12" y="${y}" fill="#aeb4be" font-size="12">${escapeHtml(
        formatScaledEquityValue(value, 0)
      )}</text>`;
    }).join("");

    const xLabels = [0, 0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const index = Math.min(
          portfolioSeries.length - 1,
          Math.round((portfolioSeries.length - 1) * ratio)
        );
        const x = margin.left + ratio * chartWidth;
        const anchor = ratio === 0 ? "start" : ratio === 1 ? "end" : "middle";

        return `<text x="${x}" y="${
          height - 12
        }" text-anchor="${anchor}" fill="#aeb4be" font-size="12">${escapeHtml(
          formatDateLabel(portfolioSeries[index].date)
        )}</text>`;
      })
      .join("");

    containerElement.innerHTML = `
      <defs>
        <linearGradient id="portfolioOverviewFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#58c4ff" stop-opacity="0.30"></stop>
          <stop offset="100%" stop-color="#58c4ff" stop-opacity="0.03"></stop>
        </linearGradient>
      </defs>
      <g opacity="0.28" stroke="#5a5f67" stroke-width="1">
        ${horizontalGrid}
        ${verticalGrid}
      </g>
      <path d="${areaPath}" fill="url(#portfolioOverviewFill)"></path>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"></path>
      ${yLabels}
      ${xLabels}
      <g id="portfolioTooltipGroup" style="display:none;">
        <line id="portfolioTooltipLine" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2" opacity="0.35" x1="0" x2="0" y1="${
          margin.top
        }" y2="${height - margin.bottom}"/>
        <circle id="portfolioTooltipDot" r="5" fill="#58c4ff" stroke="#1e1f22" stroke-width="2" cx="0" cy="0"/>
        <rect id="portfolioTooltipBox" rx="8" ry="8" fill="#2c2f34" stroke="#42464d" stroke-width="1" x="0" y="0" width="210" height="66"/>
        <text id="portfolioTooltipDate" fill="#b8bcc4" font-size="12" x="0" y="0"/>
        <text id="portfolioTooltipValue" fill="#e6e6e6" font-size="13" font-weight="600" x="0" y="0"/>
        <text id="portfolioTooltipSystems" fill="#b8bcc4" font-size="12" x="0" y="0"/>
      </g>
      <rect id="portfolioChartOverlay" x="${margin.left}" y="${
      margin.top
    }" width="${chartWidth}" height="${chartHeight}" fill="transparent" style="cursor:crosshair;"/>
    `;

    const overlay = containerElement.querySelector("#portfolioChartOverlay");
    const tooltipGroup = containerElement.querySelector(
      "#portfolioTooltipGroup"
    );
    const tooltipLine = containerElement.querySelector("#portfolioTooltipLine");
    const tooltipDot = containerElement.querySelector("#portfolioTooltipDot");
    const tooltipBox = containerElement.querySelector("#portfolioTooltipBox");
    const tooltipDateEl = containerElement.querySelector(
      "#portfolioTooltipDate"
    );
    const tooltipValueEl = containerElement.querySelector(
      "#portfolioTooltipValue"
    );
    const tooltipSystemsEl = containerElement.querySelector(
      "#portfolioTooltipSystems"
    );

    overlay.addEventListener("mousemove", (event) => {
      const rect = containerElement.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * width;
      const ratio = Math.max(0, Math.min(1, (svgX - margin.left) / chartWidth));
      const index = Math.round(ratio * (portfolioSeries.length - 1));
      const point = points[index];

      if (!point) return;

      tooltipGroup.style.display = "";
      tooltipLine.setAttribute("x1", point.x);
      tooltipLine.setAttribute("x2", point.x);
      tooltipDot.setAttribute("cx", point.x);
      tooltipDot.setAttribute("cy", point.y);

      const boxWidth = 210;
      const boxHeight = 66;
      const pad = 10;
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
      tooltipDateEl.textContent = formatDateLabel(point.date);

      tooltipValueEl.setAttribute("x", boxX + pad);
      tooltipValueEl.setAttribute("y", boxY + 37);
      tooltipValueEl.textContent = `Portfolio: ${formatScaledEquityValue(
        point.equity,
        0
      )}`;

      tooltipSystemsEl.setAttribute("x", boxX + pad);
      tooltipSystemsEl.setAttribute("y", boxY + 54);
      tooltipSystemsEl.textContent = `Active systems: ${point.activeSystems}`;
    });

    overlay.addEventListener("mouseleave", () => {
      tooltipGroup.style.display = "none";
    });
  }

  async function initEquityOverviewChart(containerElement) {
    if (!containerElement) return;

    setStatus("Loading portfolio...");

    try {
      const { systemsTotal, systemsLoaded, seriesCollection } =
        await loadAllSystemEquitySeries();

      if (seriesCollection.length === 0) {
        renderEmptyState(
          containerElement,
          "No portfolio equity data available."
        );
        setStatus("No valid data");
        return;
      }

      const unifiedDateAxis = buildUnifiedDateAxis(seriesCollection);
      const portfolioSeries = aggregatePortfolioSeries(
        seriesCollection,
        unifiedDateAxis
      );

      if (portfolioSeries.length < 2) {
        renderEmptyState(
          containerElement,
          "Not enough portfolio history available."
        );
        setStatus(`${systemsLoaded}/${systemsTotal} systems loaded`);
        return;
      }

      renderEquityOverviewChart(containerElement, portfolioSeries);
      setStatus(`${systemsLoaded}/${systemsTotal} systems included`);
    } catch (error) {
      console.error("[equity-overview-chart]", error);
      renderEmptyState(
        containerElement,
        error?.message || "Portfolio chart could not be rendered."
      );
      setStatus("Chart unavailable");
    }
  }

  global.initEquityOverviewChart = initEquityOverviewChart;
})(window);
