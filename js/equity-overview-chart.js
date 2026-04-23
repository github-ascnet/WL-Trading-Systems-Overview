(function equityOverviewChartModule(global) {
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 340;
  const CHART_MARGIN = { top: 20, right: 58, bottom: 40, left: 72 };
  const DEFAULT_EQUITY_DIVISOR = 100;
  const DEFAULT_PERIODS_PER_YEAR = 252;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatNumber(value, decimals = 0, fallback = "N/A") {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return fallback;
    }

    return new Intl.NumberFormat("en-GB", {
      useGrouping: false,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(value));
  }

  function formatPercent(value, decimals = 2, fallback = "N/A") {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return fallback;
    }

    return `${formatNumber(value, decimals, fallback)}%`;
  }

  function formatRatio(value, decimals = 2, fallback = "N/A") {
    return formatNumber(value, decimals, fallback);
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
      return "N/A";
    }

    // The portfolio curve and all derived KPIs are calculated on raw aggregated
    // equity values. Only displayed equity amounts use equityDivisor. The
    // startingCapitalDivisor is intentionally not applied here.
    return formatNumber(Number(value) / getEquityDivisor(), decimals, "N/A");
  }

  function getKpiPresentationConfig(metricKey, numericValue) {
    if (
      typeof global.getKpiPresentation !== "function" ||
      !Number.isFinite(Number(numericValue))
    ) {
      return { className: "", trophy: false };
    }

    const result = global.getKpiPresentation(
      metricKey,
      Number(numericValue),
      "landing"
    );

    return {
      className: result?.className || "",
      trophy: Boolean(result?.trophy),
    };
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

  function renderChartEmptyState(containerElement, message) {
    if (!containerElement) return;

    containerElement.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" fill="#b8bcc4" font-size="16">${escapeHtml(
        message
      )}</text>
    `;
  }

  function renderCardsEmptyState(containerElement, message) {
    if (!containerElement) return;
    containerElement.innerHTML = `<div class="portfolio-kpi-empty">${escapeHtml(
      message
    )}</div>`;
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

  function calculateTradeStats(rawPositions) {
    if (!Array.isArray(rawPositions)) {
      return {
        profitableTrades: 0,
        closedTrades: 0,
        grossProfit: 0,
        grossLoss: 0,
      };
    }

    return rawPositions.reduce(
      (stats, position) => {
        const exitDate = String(position?.exitDate ?? "")
          .trim()
          .toLowerCase();
        const isOpen =
          position?.isOpen === true || !exitDate || exitDate === "open";

        if (isOpen) {
          return stats;
        }

        const profitLoss = Number(position?.pl);
        const profitPercent = Number(position?.plPercent);
        const tradeResult = Number.isFinite(profitLoss)
          ? profitLoss
          : profitPercent;

        if (!Number.isFinite(tradeResult)) {
          return stats;
        }

        stats.closedTrades += 1;

        if (tradeResult > 0) {
          stats.profitableTrades += 1;
          if (Number.isFinite(profitLoss)) {
            stats.grossProfit += profitLoss;
          }
        } else if (tradeResult < 0 && Number.isFinite(profitLoss)) {
          stats.grossLoss += Math.abs(profitLoss);
        }

        return stats;
      },
      {
        profitableTrades: 0,
        closedTrades: 0,
        grossProfit: 0,
        grossLoss: 0,
      }
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

        const [rawSeries, rawPositions] = await Promise.all([
          fetchJson(`${basePath}/wl-equity.json`),
          fetchJson(`${basePath}/wl-positions.json`).catch(() => []),
        ]);
        const normalizedSeries = normalizeEquitySeries(rawSeries, system.id);
        const tradeStats = calculateTradeStats(rawPositions);

        if (normalizedSeries.length === 0) {
          throw new Error(`No valid equity points found for ${system.id}.`);
        }

        return {
          systemId: system.id,
          series: normalizedSeries,
          profitableTrades: tradeStats.profitableTrades,
          closedTrades: tradeStats.closedTrades,
          grossProfit: tradeStats.grossProfit,
          grossLoss: tradeStats.grossLoss,
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

    let normalizedDisplayEquity = 0;

    return unifiedDateAxis
      .map((axisPoint, index) => {
        let totalEquity = 0;
        let activeSystems = 0;
        let stepReturnSum = 0;
        let stepReturnCount = 0;

        filledSeriesCollection.forEach((entry) => {
          const point = entry.series[index];
          if (point && Number.isFinite(point.equity)) {
            totalEquity += point.equity;
            activeSystems += 1;
          }

          if (index > 0) {
            const previousPoint = entry.series[index - 1];
            const previousEquity = Number(previousPoint?.equity);
            const currentEquity = Number(point?.equity);

            if (
              Number.isFinite(previousEquity) &&
              Number.isFinite(currentEquity) &&
              previousEquity > 0
            ) {
              stepReturnSum += currentEquity / previousEquity - 1;
              stepReturnCount += 1;
            }
          }
        });

        if (index === 0) {
          normalizedDisplayEquity = totalEquity;
        } else if (stepReturnCount > 0) {
          normalizedDisplayEquity *= 1 + stepReturnSum / stepReturnCount;
        }

        return {
          date: axisPoint.date,
          timestamp: axisPoint.timestamp,
          equity: totalEquity,
          displayEquity: normalizedDisplayEquity,
          activeSystems,
        };
      })
      .filter((point) => point.activeSystems > 0);
  }

  function calculateApr(portfolioSeries) {
    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      return null;
    }

    const firstPoint = portfolioSeries[0];
    const lastPoint = portfolioSeries[portfolioSeries.length - 1];
    const startEquity = Number(firstPoint?.equity);
    const endEquity = Number(lastPoint?.equity);
    const elapsedDays =
      (Number(lastPoint?.timestamp) - Number(firstPoint?.timestamp)) /
      (1000 * 60 * 60 * 24);

    if (
      !Number.isFinite(startEquity) ||
      !Number.isFinite(endEquity) ||
      startEquity <= 0 ||
      endEquity <= 0 ||
      elapsedDays <= 0
    ) {
      return null;
    }

    return (Math.pow(endEquity / startEquity, 365.25 / elapsedDays) - 1) * 100;
  }

  function calculateProfitPercent(portfolioSeries) {
    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      return null;
    }

    const startEquity = Number(portfolioSeries[0]?.equity);
    const endEquity = Number(
      portfolioSeries[portfolioSeries.length - 1]?.equity
    );

    if (
      !Number.isFinite(startEquity) ||
      !Number.isFinite(endEquity) ||
      startEquity <= 0
    ) {
      return null;
    }

    return ((endEquity - startEquity) / startEquity) * 100;
  }

  function calculateRunningProfitPercent(startEquity, currentEquity) {
    if (
      !Number.isFinite(Number(startEquity)) ||
      !Number.isFinite(Number(currentEquity)) ||
      Number(startEquity) <= 0
    ) {
      return null;
    }

    return (
      ((Number(currentEquity) - Number(startEquity)) / Number(startEquity)) *
      100
    );
  }

  function calculateMaxDrawdown(portfolioSeries) {
    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      return null;
    }

    let peak = Number(portfolioSeries[0]?.equity);
    let maxDrawdown = 0;

    if (!Number.isFinite(peak) || peak <= 0) {
      return null;
    }

    portfolioSeries.forEach((point) => {
      const equity = Number(point?.equity);
      if (!Number.isFinite(equity) || equity <= 0) {
        return;
      }

      if (equity > peak) {
        peak = equity;
      }

      const drawdown = ((equity - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  }

  function calculateMaxDrawdownSegment(portfolioSeries) {
    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      return null;
    }

    let peak = Number(portfolioSeries[0]?.equity);
    let peakIndex = 0;
    let maxDrawdown = 0;
    let bestSegment = null;

    if (!Number.isFinite(peak) || peak <= 0) {
      return null;
    }

    portfolioSeries.forEach((point, index) => {
      const equity = Number(point?.equity);
      if (!Number.isFinite(equity) || equity <= 0) {
        return;
      }

      if (equity > peak) {
        peak = equity;
        peakIndex = index;
      }

      const drawdown = ((equity - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
        bestSegment = {
          startIndex: peakIndex,
          endIndex: index,
          drawdown,
        };
      }
    });

    return bestSegment;
  }

  function calculateDrawdownSeries(chartSeries) {
    let peak = Number(chartSeries[0]?.equity);

    return chartSeries.map((point) => {
      const equity = Number(point.equity);

      if (Number.isFinite(equity) && equity > peak) {
        peak = equity;
      }

      const drawdown =
        Number.isFinite(equity) && peak > 0
          ? ((equity - peak) / peak) * 100
          : 0;

      return { ...point, drawdown };
    });
  }

  function calculatePeriodReturns(portfolioSeries) {
    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      return [];
    }

    const returns = [];

    for (let index = 1; index < portfolioSeries.length; index += 1) {
      const previousEquity = Number(portfolioSeries[index - 1]?.equity);
      const currentEquity = Number(portfolioSeries[index]?.equity);

      if (
        !Number.isFinite(previousEquity) ||
        !Number.isFinite(currentEquity) ||
        previousEquity <= 0
      ) {
        continue;
      }

      returns.push(currentEquity / previousEquity - 1);
    }

    return returns;
  }

  function calculateSharpeRatio(portfolioSeries) {
    const returns = calculatePeriodReturns(portfolioSeries);
    if (returns.length < 2) {
      return null;
    }

    const firstPoint = portfolioSeries[0];
    const lastPoint = portfolioSeries[portfolioSeries.length - 1];
    const elapsedDays =
      (Number(lastPoint?.timestamp) - Number(firstPoint?.timestamp)) /
      (1000 * 60 * 60 * 24);

    const meanReturn =
      returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) /
      (returns.length - 1);
    const standardDeviation = Math.sqrt(Math.max(variance, 0));

    if (!Number.isFinite(standardDeviation) || standardDeviation === 0) {
      return null;
    }

    const periodsPerYear =
      Number.isFinite(elapsedDays) && elapsedDays > 0
        ? returns.length / (elapsedDays / 365.25)
        : DEFAULT_PERIODS_PER_YEAR;

    const annualizedVolatilityPercent =
      standardDeviation * Math.sqrt(periodsPerYear) * 100;
    const cagrPercent = calculateApr(portfolioSeries);

    if (
      !Number.isFinite(annualizedVolatilityPercent) ||
      annualizedVolatilityPercent === 0 ||
      !Number.isFinite(cagrPercent)
    ) {
      return null;
    }

    return cagrPercent / annualizedVolatilityPercent;
  }

  function calculateProfitablePeriodsPercent(
    portfolioSeries,
    seriesCollection = []
  ) {
    const closedTrades = seriesCollection.reduce((sum, entry) => {
      const value = Number(entry?.closedTrades);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const profitableTrades = seriesCollection.reduce((sum, entry) => {
      const value = Number(entry?.profitableTrades);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    if (closedTrades > 0) {
      return (profitableTrades / closedTrades) * 100;
    }

    const returns = calculatePeriodReturns(portfolioSeries);
    if (returns.length === 0) {
      return null;
    }

    const profitablePeriods = returns.filter((value) => value > 0).length;
    return (profitablePeriods / returns.length) * 100;
  }

  function calculateProfitFactor(portfolioSeries, seriesCollection = []) {
    const grossProfit = seriesCollection.reduce((sum, entry) => {
      const value = Number(entry?.grossProfit);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const grossLoss = seriesCollection.reduce((sum, entry) => {
      const value = Number(entry?.grossLoss);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    if (grossProfit > 0 && grossLoss > 0) {
      return grossProfit / grossLoss;
    }

    const returns = calculatePeriodReturns(portfolioSeries);
    if (returns.length === 0) {
      return null;
    }

    const positiveReturns = returns
      .filter((value) => value > 0)
      .reduce((sum, value) => sum + value, 0);
    const negativeReturns = Math.abs(
      returns
        .filter((value) => value < 0)
        .reduce((sum, value) => sum + value, 0)
    );

    if (positiveReturns <= 0 || negativeReturns <= 0) {
      return null;
    }

    return positiveReturns / negativeReturns;
  }

  function calculatePortfolioKpis(portfolioSeries, seriesCollection = []) {
    const apr = calculateApr(portfolioSeries);
    const profitPercent = calculateProfitPercent(portfolioSeries);
    const maxDrawdown = calculateMaxDrawdown(portfolioSeries);
    const sharpeRatio = calculateSharpeRatio(portfolioSeries);
    const profitablePercent = calculateProfitablePeriodsPercent(
      portfolioSeries,
      seriesCollection
    );
    const profitFactor = calculateProfitFactor(
      portfolioSeries,
      seriesCollection
    );

    return [
      {
        metricKey: "apr",
        label: "APR/CAGR",
        numericValue: apr,
        formattedValue: formatPercent(apr, 2),
      },
      {
        metricKey: "profitPercent",
        label: "Profit %",
        numericValue: profitPercent,
        formattedValue: formatPercent(profitPercent, 0),
      },
      {
        metricKey: "maxDrawdown",
        label: "Max Drawdown",
        numericValue: maxDrawdown,
        formattedValue: formatPercent(maxDrawdown, 2),
      },
      {
        metricKey: "profitFactor",
        label: "Profit Factor",
        numericValue: profitFactor,
        formattedValue: formatRatio(profitFactor, 2),
      },
      {
        metricKey: "sharpeRatio",
        label: "Sharpe Ratio",
        numericValue: sharpeRatio,
        formattedValue: formatRatio(sharpeRatio, 2),
      },
      {
        metricKey: "profitablePercent",
        label: "Profitable %",
        numericValue: profitablePercent,
        formattedValue: formatPercent(profitablePercent, 2),
      },
    ];
  }

  function createKpiCard(metricKey, label, formattedValue, numericValue) {
    const presentation = getKpiPresentationConfig(metricKey, numericValue);

    return `
      <div class="card">
        <div class="card-label">${escapeHtml(label)}</div>
        <div class="card-value ${escapeHtml(
          presentation.className
        )}">${escapeHtml(formattedValue)}${
      presentation.trophy
        ? ' <span class="kpi-trophy" aria-hidden="true">&#127942;</span>'
        : ""
    }</div>
      </div>
    `;
  }

  function renderPortfolioOverviewCards(containerElement, kpis) {
    if (!containerElement) return;

    if (!Array.isArray(kpis) || kpis.length === 0) {
      renderCardsEmptyState(containerElement, "No KPI data available.");
      return;
    }

    containerElement.innerHTML = kpis
      .map((kpi) =>
        createKpiCard(
          kpi.metricKey,
          kpi.label,
          kpi.formattedValue,
          kpi.numericValue
        )
      )
      .join("");
  }

  function renderEquityOverviewChart(containerElement, portfolioSeries) {
    if (!containerElement) return;

    if (!Array.isArray(portfolioSeries) || portfolioSeries.length < 2) {
      renderChartEmptyState(
        containerElement,
        "No portfolio equity data available."
      );
      return;
    }

    const width = SVG_WIDTH;
    const height = SVG_HEIGHT;
    const margin = CHART_MARGIN;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const minTimestamp = Number(portfolioSeries[0]?.timestamp);
    const maxTimestamp = Number(
      portfolioSeries[portfolioSeries.length - 1]?.timestamp
    );
    const timeRange = Math.max(maxTimestamp - minTimestamp, 1);

    // Kurven-Datenbasis per Config steuerbar: useDisplayEquity = true → Equal-Weight-Kurve, false → Rohsumme
    const useDisplayEquity =
      global.WL_KPI_CONFIG?.display?.useDisplayEquity === true;
    const chartSeries = portfolioSeries.map((item) => ({
      ...item,
      equity: Number(
        useDisplayEquity ? item.displayEquity ?? item.equity : item.equity
      ),
    }));

    const values = chartSeries.map((item) => Math.max(Number(item.equity), 1));
    const logMin = Math.log(Math.min(...values));
    const logMax = Math.log(Math.max(...values));
    const logRange = Math.max(logMax - logMin, 1e-9);

    const points = chartSeries.map((item) => {
      const x =
        margin.left +
        ((Number(item.timestamp) - minTimestamp) / timeRange) * chartWidth;
      const y =
        margin.top +
        ((logMax - Math.log(Math.max(Number(item.equity), 1))) / logRange) *
          chartHeight;

      return {
        x,
        y,
        date: item.date,
        timestamp: item.timestamp,
        equity: item.equity,
      };
    });

    // --- Drawdown-Serie (eigene Y-Skalierung, rechte Achse) ---
    const drawdownSeries = calculateDrawdownSeries(chartSeries);
    const rawDrawdownMin = Math.min(...drawdownSeries.map((p) => p.drawdown));
    // Mindestens -5 % Achsenausdehnung, damit die Achse bei sehr kleinen Drawdowns sinnvoll bleibt
    const drawdownAxisMin = -30;

    const drawdownPoints = drawdownSeries.map((item, index) => {
      const ddRatio =
        drawdownAxisMin !== 0 ? item.drawdown / drawdownAxisMin : 0;
      const ddY = margin.top + Math.max(0, Math.min(1, ddRatio)) * chartHeight;
      return {
        x: points[index].x,
        y: ddY,
        drawdown: item.drawdown,
      };
    });

    const drawdownLinePath = drawdownPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`
      )
      .join(" ");

    function findClosestPointIndex(targetTimestamp) {
      let closestIndex = 0;
      let smallestDiff = Infinity;

      points.forEach((point, index) => {
        const diff = Math.abs(Number(point.timestamp) - targetTimestamp);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = index;
        }
      });

      return closestIndex;
    }

    const linePath = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(
            2
          )}`
      )
      .join(" ");

    const maxDrawdownSegment = calculateMaxDrawdownSegment(chartSeries);
    const drawdownPath = maxDrawdownSegment
      ? points
          .slice(maxDrawdownSegment.startIndex, maxDrawdownSegment.endIndex + 1)
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"}${point.x.toFixed(
                2
              )} ${point.y.toFixed(2)}`
          )
          .join(" ")
      : "";

    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${
      height - margin.bottom
    } L ${points[0].x.toFixed(2)} ${height - margin.bottom} Z`;

    const horizontalGrid = Array.from({ length: 5 }, (_, i) => {
      const y = margin.top + (i / 4) * chartHeight;
      return `<line x1="${margin.left}" y1="${y}" x2="${
        width - margin.right
      }" y2="${y}" />`;
    }).join("");

    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const logValue = logMax - (i / 4) * logRange;
      const value = Math.exp(logValue);
      const y = margin.top + (i / 4) * chartHeight + 4;

      return `<text x="12" y="${y}" fill="#aeb4be" font-size="12">${escapeHtml(
        formatScaledEquityValue(value, 0)
      )}</text>`;
    }).join("");

    // 5%-Schritte: 0%, -5%, -10%, -15%, -20%, -25%, -30%
    const drawdownAxisLabels = Array.from({ length: 7 }, (_, i) => {
      const ddValue = i * (drawdownAxisMin / 6);
      const ratio = i / 6;
      const y = margin.top + ratio * chartHeight + 4;
      const x = width - margin.right + 6;
      return `<text x="${x}" y="${y}" fill="#aeb4be" font-size="11" opacity="0.8" text-anchor="start">${escapeHtml(
        formatPercent(ddValue, 0)
      )}</text>`;
    }).join("");

    const drawdownAxisTitle = (() => {
      const x = width - 12;
      const y = margin.top + chartHeight / 2;
      return `<text x="${x}" y="${y}" fill="#aeb4be" font-size="9" opacity="0.8" text-anchor="middle" transform="rotate(-90, ${x}, ${y})">Max. Drawdown</text>`;
    })();

    const allYears = [
      ...new Set(chartSeries.map((p) => new Date(p.date).getFullYear())),
    ];
    const xLabels = allYears
      .map((year) => {
        const point = chartSeries.find(
          (p) => new Date(p.date).getFullYear() === year
        );
        if (!point) return "";
        const ts = new Date(point.date).getTime();
        const ratio = timeRange > 0 ? (ts - minTimestamp) / timeRange : 0;
        const x = margin.left + ratio * chartWidth;
        const anchor = ratio < 0.08 ? "start" : ratio > 0.92 ? "end" : "middle";
        return `<text x="${x.toFixed(2)}" y="${
          height - 12
        }" text-anchor="${anchor}" fill="#aeb4be" font-size="12">${year}</text>`;
      })
      .join("");

    containerElement.innerHTML = `
      <defs>
        <linearGradient id="portfolioOverviewFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#58c4ff" stop-opacity="0.30"></stop>
          <stop offset="100%" stop-color="#58c4ff" stop-opacity="0.03"></stop>
        </linearGradient>
        <linearGradient id="portfolioOverviewDrawdownStroke" x1="0" y1="0" x2="1" y2="0">
        </linearGradient>
      </defs>
      <g opacity="0.28" stroke="#5a5f67" stroke-width="1">
        ${horizontalGrid}
      </g>
      <path d="${areaPath}" fill="url(#portfolioOverviewFill)"></path>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"></path>
      ${
        // Max-DD-Segment-Overlay auf der Equity-Kurve — kann entfernt werden,
        // sobald die vollständige Drawdown-Kurve unten als ausreichend gilt.
        drawdownPath
          ? `<path d="${drawdownPath}" fill="none" stroke="url(#portfolioOverviewDrawdownStroke)" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"></path>`
          : ""
      }
      <path d="${drawdownLinePath}" fill="none" stroke="#ff8c00" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"></path>
      ${yLabels}
      ${drawdownAxisLabels}
      ${drawdownAxisTitle}
      ${xLabels}
      <g id="portfolioTooltipGroup" style="display:none;">
        <line id="portfolioTooltipLine" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2" opacity="0.35" x1="0" x2="0" y1="${
          margin.top
        }" y2="${height - margin.bottom}"/>
        <circle id="portfolioTooltipDot" r="5" fill="#58c4ff" stroke="#1e1f22" stroke-width="2" cx="0" cy="0"/>
        <rect id="portfolioTooltipBox" rx="8" ry="8" fill="#2c2f34" stroke="#42464d" stroke-width="1" x="0" y="0" width="210" height="83"/>
        <text id="portfolioTooltipDate" fill="#b8bcc4" font-size="12" x="0" y="0"/>
        <text id="portfolioTooltipValue" fill="#e6e6e6" font-size="13" font-weight="600" x="0" y="0"/>
        <text id="portfolioTooltipProfit" fill="#b8bcc4" font-size="12" x="0" y="0"/>
        <text id="portfolioTooltipDrawdown" fill="#ff8c00" font-size="12" x="0" y="0"/>
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
    const tooltipProfitEl = containerElement.querySelector(
      "#portfolioTooltipProfit"
    );
    const tooltipDrawdownEl = containerElement.querySelector(
      "#portfolioTooltipDrawdown"
    );
    const startingEquity = Number(portfolioSeries[0]?.equity);

    overlay.addEventListener("mousemove", (event) => {
      const rect = containerElement.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * width;
      const ratio = Math.max(0, Math.min(1, (svgX - margin.left) / chartWidth));
      const targetTimestamp = minTimestamp + ratio * timeRange;
      const index = findClosestPointIndex(targetTimestamp);
      const point = points[index];
      const ddPoint = drawdownPoints[index];

      if (!point) return;

      tooltipGroup.style.display = "";
      tooltipLine.setAttribute("x1", point.x);
      tooltipLine.setAttribute("x2", point.x);
      tooltipDot.setAttribute("cx", point.x);
      tooltipDot.setAttribute("cy", point.y);

      const boxWidth = 210;
      const boxHeight = 83;
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

      tooltipProfitEl.setAttribute("x", boxX + pad);
      tooltipProfitEl.setAttribute("y", boxY + 54);
      tooltipProfitEl.textContent = `Profit: ${formatPercent(
        calculateRunningProfitPercent(startingEquity, point.equity),
        2
      )}`;

      tooltipDrawdownEl.setAttribute("x", boxX + pad);
      tooltipDrawdownEl.setAttribute("y", boxY + 71);
      tooltipDrawdownEl.textContent = `Max Drawdown: ${formatPercent(
        ddPoint?.drawdown ?? null,
        2
      )}`;
    });

    overlay.addEventListener("mouseleave", () => {
      tooltipGroup.style.display = "none";
    });
  }

  async function initEquityOverviewChart(
    chartContainerElement,
    cardsContainerElement
  ) {
    if (!chartContainerElement) return;

    setStatus("Loading portfolio...");

    try {
      const { systemsTotal, systemsLoaded, seriesCollection } =
        await loadAllSystemEquitySeries();

      if (seriesCollection.length === 0) {
        renderChartEmptyState(
          chartContainerElement,
          "No portfolio equity data available."
        );
        renderCardsEmptyState(cardsContainerElement, "No KPI data available.");
        setStatus("No valid data");
        return;
      }

      const unifiedDateAxis = buildUnifiedDateAxis(seriesCollection);
      const portfolioSeries = aggregatePortfolioSeries(
        seriesCollection,
        unifiedDateAxis
      );

      if (portfolioSeries.length < 2) {
        renderChartEmptyState(
          chartContainerElement,
          "Not enough portfolio history available."
        );
        renderCardsEmptyState(cardsContainerElement, "No KPI data available.");
        setStatus(`${systemsLoaded}/${systemsTotal} systems loaded`);
        return;
      }

      renderEquityOverviewChart(chartContainerElement, portfolioSeries);

      const showKpis =
        global.WL_KPI_CONFIG?.display?.showPortfolioOverviewKpis !== false;
      if (showKpis) {
        // KPI-Datenbasis per Config steuerbar: useDisplayEquity = true → Equal-Weight-Kurve, false → Rohsumme
        const useDisplayEquityForKpis =
          global.WL_KPI_CONFIG?.display?.useDisplayEquity === true;
        const kpiSeries = portfolioSeries.map((point) => ({
          ...point,
          equity: Number(
            useDisplayEquityForKpis
              ? point.displayEquity ?? point.equity
              : point.equity
          ),
        }));
        renderPortfolioOverviewCards(
          cardsContainerElement,
          calculatePortfolioKpis(kpiSeries, seriesCollection)
        );
      } else if (cardsContainerElement) {
        cardsContainerElement.innerHTML = "";
      }

      setStatus(`${systemsLoaded}/${systemsTotal} systems included`);
    } catch (error) {
      console.error("[equity-overview-chart]", error);
      renderChartEmptyState(
        chartContainerElement,
        error?.message || "Portfolio chart could not be rendered."
      );
      renderCardsEmptyState(cardsContainerElement, "No KPI data available.");
      setStatus("Chart unavailable");
    }
  }

  global.initEquityOverviewChart = initEquityOverviewChart;
})(window);
