(function equityOverviewChartModule(global) {
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 340;
  const CHART_MARGIN = { top: 20, right: 58, bottom: 40, left: 72 };
  const DEFAULT_EQUITY_DIVISOR = 100;
  const DEFAULT_PERIODS_PER_YEAR = 252;
  const NARROW_CHART_MAX_WIDTH = 600;

  /**
   * Chart geometry for the current rendered width (D-036). Desktop keeps the
   * 1000 × 340 space; narrow containers (smartphones) get a taller space with
   * larger type instead of a scaled-down desktop chart. Render, tooltip and
   * zoom/touch conversion all use the same geometry.
   */
  function getChartGeometry(svgElement) {
    const renderedWidth =
      svgElement?.getBoundingClientRect().width || SVG_WIDTH;

    if (renderedWidth >= NARROW_CHART_MAX_WIDTH) {
      return {
        isNarrow: false,
        width: SVG_WIDTH,
        height: SVG_HEIGHT,
        margin: CHART_MARGIN,
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
      };
    }

    return {
      isNarrow: true,
      width: 600,
      height: 420,
      margin: { top: 24, right: 64, bottom: 46, left: 86 },
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
    };
  }

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
    const rawText = await response.text();

    try {
      return JSON.parse(rawText);
    } catch (parseError) {
      // Some upstream exports may contain bare NaN values, which are invalid JSON (D-009).
      const sanitizedText = rawText.replace(
        /(:\s*)NaN(?=\s*[,}\]])/g,
        "$1null"
      );
      if (sanitizedText !== rawText) {
        return JSON.parse(sanitizedText);
      }
      throw parseError;
    }
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
          rawPositions: Array.isArray(rawPositions) ? rawPositions : [],
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

  /**
   * Counts the open positions of all systems per date (D-035).
   * A position is considered open on date D when:
   *   entryDate <= D  AND  (isOpen === true  OR  no exitDate  OR  exitDate > D)
   * Entry and exit timestamps are sorted once; two pointers then count
   * "entries <= D" minus "exits <= D" while the dates ascend. This replaces a
   * loop over all positions per date (INC-21).
   *
   * @param   {Array<Array>} positionLists – raw positions per system
   * @returns {function}     openPositionsAt(timestamp), timestamps must ascend
   */
  function createOpenPositionCounter(positionLists) {
    const entries = [];
    const exits = [];

    positionLists.forEach((rawPositions) => {
      if (!Array.isArray(rawPositions)) return;

      rawPositions.forEach((pos) => {
        const entryTs = Date.parse(String(pos?.entryDate ?? ""));
        if (!Number.isFinite(entryTs)) return;

        const exitRaw = String(pos?.exitDate ?? "")
          .trim()
          .toLowerCase();
        const isOpen = pos?.isOpen === true || !exitRaw || exitRaw === "open";
        const exitTs = isOpen ? Infinity : Date.parse(exitRaw);

        // Invalid exit or exit not after entry: never open on any date (as before)
        if (!(exitTs > entryTs)) return;

        entries.push(entryTs);
        if (exitTs !== Infinity) exits.push(exitTs);
      });
    });

    entries.sort((a, b) => a - b);
    exits.sort((a, b) => a - b);

    let entryIndex = 0;
    let exitIndex = 0;

    return function openPositionsAt(targetTimestamp) {
      while (
        entryIndex < entries.length &&
        entries[entryIndex] <= targetTimestamp
      ) {
        entryIndex += 1;
      }
      while (exitIndex < exits.length && exits[exitIndex] <= targetTimestamp) {
        exitIndex += 1;
      }
      return entryIndex - exitIndex;
    };
  }

  function aggregatePortfolioSeries(seriesCollection, unifiedDateAxis) {
    const filledSeriesCollection = seriesCollection.map((entry) => ({
      systemId: entry.systemId,
      series: carryForwardMissingValues(unifiedDateAxis, entry.series),
      rawPositions: entry.rawPositions ?? [],
    }));

    // Pre-sort closed positions per system by exitDate for O(n+m) profit factor accumulation
    const sortedClosedPositions = filledSeriesCollection.map((entry) =>
      entry.rawPositions
        .filter((pos) => {
          const exitRaw = String(pos?.exitDate ?? "")
            .trim()
            .toLowerCase();
          return pos?.isOpen !== true && exitRaw && exitRaw !== "open";
        })
        .map((pos) => ({
          exitTs: Date.parse(String(pos.exitDate)),
          pl: Number(pos.pl),
        }))
        .filter((p) => Number.isFinite(p.exitTs) && Number.isFinite(p.pl))
        .sort((a, b) => a.exitTs - b.exitTs)
    );
    const posPointers = sortedClosedPositions.map(() => 0);
    const openPositionsAt = createOpenPositionCounter(
      filledSeriesCollection.map((entry) => entry.rawPositions)
    );
    let cumulativeGrossProfit = 0;
    let cumulativeGrossLoss = 0;
    let cumulativeClosedTrades = 0;
    let cumulativeProfitableTrades = 0;

    // Running Sharpe accumulators (O(1) per point via online variance)
    let firstPortfolioEquity = null;
    let firstPortfolioTimestamp = null;
    let prevPortfolioEquity = null;
    let sharpeN = 0;
    let sharpeSumR = 0;
    let sharpeSumR2 = 0;

    let normalizedDisplayEquity = 0;

    return unifiedDateAxis
      .map((axisPoint, index) => {
        let totalEquity = 0;
        let activeSystems = 0;
        let stepReturnSum = 0;
        let stepReturnCount = 0;
        const totalOpenPositions = openPositionsAt(axisPoint.timestamp);

        // Advance profit factor accumulators for trades closed up to this date
        sortedClosedPositions.forEach((positions, sysIdx) => {
          while (
            posPointers[sysIdx] < positions.length &&
            positions[posPointers[sysIdx]].exitTs <= axisPoint.timestamp
          ) {
            const pl = positions[posPointers[sysIdx]].pl;
            if (pl > 0) {
              cumulativeGrossProfit += pl;
              cumulativeProfitableTrades++;
            } else if (pl < 0) cumulativeGrossLoss += Math.abs(pl);
            cumulativeClosedTrades++;
            posPointers[sysIdx]++;
          }
        });
        const pointProfitFactor =
          cumulativeGrossProfit > 0 && cumulativeGrossLoss > 0
            ? cumulativeGrossProfit / cumulativeGrossLoss
            : null;
        const pointProfitablePercent =
          cumulativeClosedTrades > 0
            ? (cumulativeProfitableTrades / cumulativeClosedTrades) * 100
            : null;

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
          firstPortfolioEquity = totalEquity;
          firstPortfolioTimestamp = axisPoint.timestamp;
        } else if (stepReturnCount > 0) {
          normalizedDisplayEquity *= 1 + stepReturnSum / stepReturnCount;
        }

        // Accumulate portfolio-level step return for running Sharpe
        if (
          prevPortfolioEquity !== null &&
          prevPortfolioEquity > 0 &&
          totalEquity > 0
        ) {
          const r = totalEquity / prevPortfolioEquity - 1;
          sharpeN++;
          sharpeSumR += r;
          sharpeSumR2 += r * r;
        }
        prevPortfolioEquity = totalEquity;

        let pointSharpe = null;
        if (
          sharpeN >= 2 &&
          firstPortfolioEquity > 0 &&
          firstPortfolioTimestamp !== null
        ) {
          const mean = sharpeSumR / sharpeN;
          const variance =
            (sharpeSumR2 - sharpeN * mean * mean) / (sharpeN - 1);
          const std = Math.sqrt(Math.max(variance, 0));
          if (std > 0) {
            const elapsedDays =
              (axisPoint.timestamp - firstPortfolioTimestamp) /
              (1000 * 60 * 60 * 24);
            const periodsPerYear =
              elapsedDays > 0 ? sharpeN / (elapsedDays / 365.25) : 252;
            const annualizedVol = std * Math.sqrt(periodsPerYear) * 100;
            const runningCagr =
              elapsedDays > 1 && totalEquity > 0
                ? (Math.pow(
                    totalEquity / firstPortfolioEquity,
                    365.25 / elapsedDays
                  ) -
                    1) *
                  100
                : null;
            if (annualizedVol > 0 && runningCagr !== null) {
              pointSharpe = runningCagr / annualizedVol;
            }
          }
        }

        return {
          date: axisPoint.date,
          timestamp: axisPoint.timestamp,
          equity: totalEquity,
          displayEquity: normalizedDisplayEquity,
          activeSystems,
          openPositions: totalOpenPositions,
          profitFactor: pointProfitFactor,
          sharpeRatio: pointSharpe,
          profitablePercent: pointProfitablePercent,
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
        )}"><span class="wl-count">${escapeHtml(formattedValue)}</span>${
      presentation.trophy
        ? ' <span class="kpi-trophy wl-trophy-pop" aria-hidden="true">&#127942;</span>'
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

    global.WL_MOTION?.countUp(containerElement);
  }

  function renderEquityOverviewChart(
    containerElement,
    portfolioSeries,
    zoomedSeries
  ) {
    if (!containerElement) return;

    // Einlaufanimation nur beim ersten Rendern; Zoom/Pan übergibt zoomedSeries
    const animate = !zoomedSeries;

    // class-Attribut: Theme-Klasse (wl-c-*) plus beim ersten Rendern die Motion-Klasse
    function classAttrs(themeClass, motionClass, delayMs, motionExtra = "") {
      return animate
        ? ` class="${themeClass} ${motionClass}"${motionExtra} style="--wl-delay:${delayMs}ms"`
        : ` class="${themeClass}"`;
    }

    const activeSeries =
      Array.isArray(zoomedSeries) && zoomedSeries.length >= 2
        ? zoomedSeries
        : portfolioSeries;

    if (!Array.isArray(activeSeries) || activeSeries.length < 2) {
      renderChartEmptyState(
        containerElement,
        "No portfolio equity data available."
      );
      return;
    }

    // Preserve the all-time start equity BEFORE portfolioSeries is replaced by the zoomed slice
    const allTimeStartEquity = Number(portfolioSeries[0]?.equity);
    const allTimeStartTimestamp = Number(portfolioSeries[0]?.timestamp);

    // Replace portfolioSeries references inside this function with activeSeries
    portfolioSeries = activeSeries;

    const geometry = getChartGeometry(containerElement);
    const { width, height, margin } = geometry;
    containerElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
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
        openPositions: item.openPositions ?? 0,
        profitFactor: item.profitFactor ?? null,
        sharpeRatio: item.sharpeRatio ?? null,
        profitablePercent: item.profitablePercent ?? null,
      };
    });

    // --- Drawdown-Serie (eigene Y-Skalierung, rechte Achse) ---
    const drawdownSeries = calculateDrawdownSeries(chartSeries);
    const rawDrawdownMin = Math.min(...drawdownSeries.map((p) => p.drawdown));
    // Mindestens -30 %; tiefere Drawdowns erweitern die Achse auf das nächste 10-%-Raster (höchstens -100 %)
    const drawdownAxisMin = Number.isFinite(rawDrawdownMin)
      ? Math.max(-100, Math.min(-30, Math.floor(rawDrawdownMin / 10) * 10))
      : -30;
    // Bis -30 % in 5-%-Schritten, darüber in 10-%-Schritten
    const drawdownAxisStep = drawdownAxisMin >= -30 ? 5 : 10;
    const drawdownAxisSteps = Math.round(-drawdownAxisMin / drawdownAxisStep);

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
      const y = margin.top + (i / 4) * chartHeight + geometry.labelDy;

      return `<text x="12" y="${y}" class="wl-c-axis" fill="#aeb4be" font-size="${
        geometry.axisFont
      }">${escapeHtml(
        formatScaledEquityValue(value, 0)
      )}</text>`;
    }).join("");

    // Standard 0 % bis -30 % in 5-%-Schritten; bei tieferen Drawdowns 10-%-Schritte
    const drawdownAxisLabels = Array.from({ length: drawdownAxisSteps + 1 }, (_, i) => {
      const ddValue = -i * drawdownAxisStep;
      const ratio = i / drawdownAxisSteps;
      const y = margin.top + ratio * chartHeight + geometry.labelDy;
      const x = width - margin.right + 6;
      return `<text x="${x}" y="${y}" class="wl-c-axis" fill="#aeb4be" font-size="${
        geometry.ddFont
      }" opacity="0.8" text-anchor="start">${escapeHtml(
        formatPercent(ddValue, 0)
      )}</text>`;
    }).join("");

    // Auf schmalen Charts fehlt der Platz für den gedrehten Achsentitel
    const drawdownAxisTitle = (() => {
      if (geometry.isNarrow) return "";
      const x = width - 12;
      const y = margin.top + chartHeight / 2;
      return `<text x="${x}" y="${y}" class="wl-c-axis" fill="#aeb4be" font-size="9" opacity="0.8" text-anchor="middle" transform="rotate(-90, ${x}, ${y})">Max. Drawdown</text>`;
    })();

    const allYears = [
      ...new Set(chartSeries.map((p) => new Date(p.date).getFullYear())),
    ];
    // Schmale Charts: nur jedes zweite Jahr, sonst überlappen die Labels
    const labelYears = geometry.isNarrow
      ? allYears.filter((_, index) => index % 2 === 0)
      : allYears;
    const xLabels = labelYears
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
          height - geometry.xLabelInset
        }" text-anchor="${anchor}" class="wl-c-axis" fill="#aeb4be" font-size="${
          geometry.axisFont
        }">${year}</text>`;
      })
      .join("");

    const tipHeight =
      geometry.tipFirstY + geometry.tipValueGap + geometry.tipLine * 7 + 12;

    containerElement.innerHTML = `
      <defs>
        <linearGradient id="portfolioOverviewFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#58c4ff" stop-opacity="0.30"></stop>
          <stop offset="100%" stop-color="#58c4ff" stop-opacity="0.03"></stop>
        </linearGradient>
        <linearGradient id="wlAuroraLine" gradientUnits="userSpaceOnUse" x1="${
          margin.left
        }" y1="0" x2="${width - margin.right}" y2="0">
          <stop offset="0%" stop-color="#58c4ff"></stop>
          <stop offset="55%" stop-color="#2de2c4"></stop>
          <stop offset="100%" stop-color="#6ee7a8"></stop>
        </linearGradient>
        <linearGradient id="wlAuroraArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2de2c4" stop-opacity="0.26"></stop>
          <stop offset="100%" stop-color="#2de2c4" stop-opacity="0"></stop>
        </linearGradient>
        <linearGradient id="wlAuroraTip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#58c4ff" stop-opacity="0.9"></stop>
          <stop offset="100%" stop-color="#2de2c4" stop-opacity="0.45"></stop>
        </linearGradient>
      </defs>
      <g class="wl-c-grid" opacity="0.28" stroke="#5a5f67" stroke-width="1">
        ${horizontalGrid}
      </g>
      ${
        global.WL_THEME
          ? global.WL_THEME.createStarfieldSvg({
              x: margin.left,
              y: margin.top,
              width: chartWidth,
              height: chartHeight,
              count: 70,
              seed: 7,
            })
          : ""
      }
      <path d="${areaPath}" fill="url(#portfolioOverviewFill)"${classAttrs(
      "wl-c-area",
      "wl-fade-in",
      900
    )}></path>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="${
        geometry.glowWide
      }" stroke-opacity="0.07" stroke-linejoin="round" stroke-linecap="round" visibility="hidden"${classAttrs(
      "wl-c-glow",
      "wl-fade-in",
      900
    )}></path>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="${
        geometry.glowMid
      }" stroke-opacity="0.16" stroke-linejoin="round" stroke-linecap="round" visibility="hidden"${classAttrs(
      "wl-c-glow",
      "wl-fade-in",
      900
    )}></path>
      <path d="${linePath}" fill="none" stroke="#58c4ff" stroke-width="${
        geometry.lineWidth
      }" stroke-linejoin="round" stroke-linecap="round"${classAttrs(
      "wl-c-equity",
      "wl-draw-line",
      200,
      ' pathLength="1"'
    )}></path>
      <path d="${drawdownLinePath}" fill="none" stroke="#ff8c00" stroke-width="${
        geometry.ddGlow
      }" stroke-opacity="0.1" stroke-linejoin="round" stroke-linecap="round" visibility="hidden"${classAttrs(
      "wl-c-drawdown-glow",
      "wl-fade-in",
      700
    )}></path>
      <path d="${drawdownLinePath}" fill="none" stroke="#ff8c00" stroke-width="${
        geometry.ddWidth
      }" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"${classAttrs(
      "wl-c-drawdown",
      "wl-fade-in",
      700
    )}></path>
      ${yLabels}
      ${drawdownAxisLabels}
      ${drawdownAxisTitle}
      ${xLabels}
      <g id="portfolioTooltipGroup" style="display:none;">
        <line id="portfolioTooltipLine" class="wl-c-crosshair" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2" opacity="0.35" x1="0" x2="0" y1="${
          margin.top
        }" y2="${height - margin.bottom}"/>
        <circle id="portfolioTooltipOrbit" class="wl-c-orbit" r="${
          geometry.orbitRadius
        }" fill="none" stroke="#2de2c4" stroke-width="1.2" visibility="hidden" cx="0" cy="0"/>
        <circle id="portfolioTooltipDot" class="wl-c-dot" r="${
          geometry.dotRadius
        }" fill="#58c4ff" stroke="#1e1f22" stroke-width="2" cx="0" cy="0"/>
        <rect id="portfolioTooltipBox" class="wl-c-tip-box" rx="8" ry="8" fill="#2c2f34" stroke="#42464d" stroke-width="1" x="0" y="0" width="${
          geometry.tipWidth
        }" height="${tipHeight}"/>
        <path id="portfolioTooltipCorners" class="wl-c-tip-corners" fill="none" stroke="#2de2c4" stroke-width="1.5" visibility="hidden" d=""/>
        <text id="portfolioTooltipDate" class="wl-c-tip-date" fill="#b8bcc4" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipValue" class="wl-c-tip-value" fill="#e6e6e6" font-size="${
          geometry.tipValueFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipProfit" class="wl-c-tip-text" fill="#b8bcc4" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipDrawdown" class="wl-c-tip-dd" fill="#ff8c00" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipOpenPos" class="wl-c-tip-text" fill="#9aa7bf" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipApr" class="wl-c-tip-text" fill="#9aa7bf" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipPF" class="wl-c-tip-text" fill="#9aa7bf" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipSharpe" class="wl-c-tip-text" fill="#9aa7bf" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
        <text id="portfolioTooltipProfitable" class="wl-c-tip-text" fill="#9aa7bf" font-size="${
          geometry.tipFont
        }" x="0" y="0"/>
      </g>
      <rect id="portfolioChartOverlay" x="${margin.left}" y="${
      margin.top
    }" width="${chartWidth}" height="${chartHeight}" fill="transparent" style="cursor:crosshair;touch-action:pan-y;"/>
    `;

    const overlay = containerElement.querySelector("#portfolioChartOverlay");
    const tooltipGroup = containerElement.querySelector(
      "#portfolioTooltipGroup"
    );
    const tooltipLine = containerElement.querySelector("#portfolioTooltipLine");
    const tooltipDot = containerElement.querySelector("#portfolioTooltipDot");
    const tooltipOrbit = containerElement.querySelector(
      "#portfolioTooltipOrbit"
    );
    const tooltipBox = containerElement.querySelector("#portfolioTooltipBox");
    const tooltipCorners = containerElement.querySelector(
      "#portfolioTooltipCorners"
    );
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
    const tooltipOpenPosEl = containerElement.querySelector(
      "#portfolioTooltipOpenPos"
    );
    const tooltipAprEl = containerElement.querySelector("#portfolioTooltipApr");
    const tooltipPFEl = containerElement.querySelector("#portfolioTooltipPF");
    const tooltipSharpeEl = containerElement.querySelector(
      "#portfolioTooltipSharpe"
    );
    const tooltipProfitableEl = containerElement.querySelector(
      "#portfolioTooltipProfitable"
    );
    const startingEquity = allTimeStartEquity;

    // Tooltip an einer Bildschirm-x-Position (Maus und Touch, D-039)
    function showTooltipAt(clientX) {
      const rect = containerElement.getBoundingClientRect();
      const svgX = ((clientX - rect.left) / rect.width) * width;
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
      tooltipOrbit.setAttribute("cx", point.x);
      tooltipOrbit.setAttribute("cy", point.y);

      const boxWidth = geometry.tipWidth;
      const boxHeight = tipHeight;
      const pad = geometry.isNarrow ? 14 : 10;
      let boxX = point.x + 12;
      if (boxX + boxWidth > width - margin.right) {
        boxX = point.x - boxWidth - 12;
      }
      // Schmale Charts: Box nicht über den linken Rand hinaus schieben
      boxX = Math.max(4, boxX);
      // Zeile k der Kennzahlen unter Datum und Portfolio-Wert
      const valueY = boxY0 => boxY0 + geometry.tipFirstY + geometry.tipValueGap;
      const lineY = (boxY0, k) => valueY(boxY0) + geometry.tipLine * k;

      const boxY = Math.max(
        margin.top,
        Math.min(point.y - boxHeight / 2, height - margin.bottom - boxHeight)
      );

      tooltipBox.setAttribute("x", boxX);
      tooltipBox.setAttribute("y", boxY);
      if (global.WL_THEME) {
        tooltipCorners.setAttribute(
          "d",
          global.WL_THEME.hudCornersPath(boxX, boxY, boxWidth, boxHeight)
        );
      }

      tooltipDateEl.setAttribute("x", boxX + pad);
      tooltipDateEl.setAttribute("y", boxY + geometry.tipFirstY);
      tooltipDateEl.textContent = formatDateLabel(point.date);

      tooltipValueEl.setAttribute("x", boxX + pad);
      tooltipValueEl.setAttribute("y", valueY(boxY));
      tooltipValueEl.textContent = `Portfolio Value: ${formatScaledEquityValue(
        point.equity,
        0
      )}`;

      tooltipOpenPosEl.setAttribute("x", boxX + pad);
      tooltipOpenPosEl.setAttribute("y", lineY(boxY, 1));
      tooltipOpenPosEl.textContent = `Open Positions: ${
        point.openPositions ?? 0
      }`;

      const elapsedDays =
        (Number(point.timestamp) - allTimeStartTimestamp) /
        (1000 * 60 * 60 * 24);
      const runningApr =
        elapsedDays > 1 && startingEquity > 0 && point.equity > 0
          ? (Math.pow(point.equity / startingEquity, 365.25 / elapsedDays) -
              1) *
            100
          : null;
      tooltipAprEl.setAttribute("x", boxX + pad);
      tooltipAprEl.setAttribute("y", lineY(boxY, 2));
      tooltipAprEl.textContent = `APR/CAGR: ${formatPercent(runningApr, 2)}`;

      tooltipProfitEl.setAttribute("x", boxX + pad);
      tooltipProfitEl.setAttribute("y", lineY(boxY, 3));
      tooltipProfitEl.textContent = `Profit: ${formatPercent(
        calculateRunningProfitPercent(startingEquity, point.equity),
        0
      )}`;

      tooltipDrawdownEl.setAttribute("x", boxX + pad);
      tooltipDrawdownEl.setAttribute("y", lineY(boxY, 4));
      tooltipDrawdownEl.textContent = `Drawdown: ${formatPercent(
        ddPoint?.drawdown ?? null,
        2
      )}`;

      tooltipPFEl.setAttribute("x", boxX + pad);
      tooltipPFEl.setAttribute("y", lineY(boxY, 5));
      tooltipPFEl.textContent = `Profit Factor: ${formatRatio(
        point.profitFactor ?? null,
        2
      )}`;

      tooltipSharpeEl.setAttribute("x", boxX + pad);
      tooltipSharpeEl.setAttribute("y", lineY(boxY, 6));
      tooltipSharpeEl.textContent = `Sharpe Ratio: ${formatRatio(
        point.sharpeRatio ?? null,
        2
      )}`;

      tooltipProfitableEl.setAttribute("x", boxX + pad);
      tooltipProfitableEl.setAttribute("y", lineY(boxY, 7));
      tooltipProfitableEl.textContent = `Profitable: ${formatPercent(
        point.profitablePercent ?? null,
        1
      )}`;
    }

    overlay.addEventListener("mousemove", (event) => showTooltipAt(event.clientX));
    // Für die Touch-Gesten in initEquityOverviewChart (das Overlay wird je Rendern ersetzt)
    containerElement._wlShowTooltipAt = showTooltipAt;

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

      // Serien je System für die Sparklines der Systemkacheln (landing.js), ohne zweiten Abruf
      global._wlSystemEquitySeries = Object.fromEntries(
        seriesCollection.map((entry) => [entry.systemId, entry.series])
      );

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

      // ── Zoom / Pan State ──────────────────────────────────────────────────
      const fullMin = portfolioSeries[0].timestamp;
      const fullMax = portfolioSeries[portfolioSeries.length - 1].timestamp;
      // Expose time range so the regime engine panel can synchronise its X-axis
      global._wlPortfolioTimeRange = { min: fullMin, max: fullMax };
      const zoomState = { min: fullMin, max: fullMax };
      let isDragging = false;
      let dragStartX = null;
      let dragStartMin = null;
      let dragStartMax = null;

      function getZoomedSeries() {
        return portfolioSeries.filter(
          (p) => p.timestamp >= zoomState.min && p.timestamp <= zoomState.max
        );
      }

      // AbortController to cleanly remove overlay-level listeners on each re-render
      let overlayAbortController = new AbortController();

      function applyZoom() {
        const zoomed = getZoomedSeries();
        if (zoomed.length >= 2) {
          overlayAbortController.abort(); // remove previous overlay listeners
          overlayAbortController = new AbortController();
          renderEquityOverviewChart(
            chartContainerElement,
            portfolioSeries,
            zoomed
          );
          attachOverlayEvents();
          // Sichtbaren Zeitraum melden, damit das Regime-Panel folgt (D-038)
          document.dispatchEvent(
            new CustomEvent("wl:portfolio-range", {
              detail: { min: zoomState.min, max: zoomState.max },
            })
          );
        }
      }

      function clampZoom() {
        const MIN_RANGE_MS = 30 * 24 * 3600 * 1000; // min 30 days
        const range = zoomState.max - zoomState.min;
        if (range < MIN_RANGE_MS) {
          const center = (zoomState.min + zoomState.max) / 2;
          zoomState.min = center - MIN_RANGE_MS / 2;
          zoomState.max = center + MIN_RANGE_MS / 2;
        }
        zoomState.min = Math.max(zoomState.min, fullMin);
        zoomState.max = Math.min(zoomState.max, fullMax);
      }

      // window-level handlers attached exactly ONCE
      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const svgEl = chartContainerElement;
        const rect = svgEl.getBoundingClientRect();
        const g = getChartGeometry(svgEl);
        const chartWidth = g.width - g.margin.left - g.margin.right;
        const dxPx = (dragStartX - e.clientX) * (g.width / rect.width);
        const range = dragStartMax - dragStartMin;
        const dxMs = dxPx / (chartWidth / range);
        zoomState.min = Math.max(
          fullMin,
          Math.min(dragStartMin + dxMs, fullMax - range)
        );
        zoomState.max = zoomState.min + range;
        applyZoom();
      });

      window.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          const overlayEl = chartContainerElement.querySelector(
            "#portfolioChartOverlay"
          );
          if (overlayEl) overlayEl.style.cursor = "crosshair";
        }
      });

      function attachOverlayEvents() {
        const svgEl = chartContainerElement;
        const overlayEl = svgEl.querySelector("#portfolioChartOverlay");
        if (!overlayEl) return;
        const signal = overlayAbortController.signal;
        // Dieselbe Geometrie wie beim Rendern (Desktop oder schmaler Raum, D-036)
        const g = getChartGeometry(svgEl);
        const chartWidth = g.width - g.margin.left - g.margin.right;

        overlayEl.addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();
            const rect = svgEl.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const chartRelX = Math.max(
              0,
              Math.min(1, (relX * g.width - g.margin.left) / chartWidth)
            );
            const pivotTs =
              zoomState.min + chartRelX * (zoomState.max - zoomState.min);
            const zoomFactor = e.deltaY > 0 ? 1.25 : 0.8;
            const newRange = (zoomState.max - zoomState.min) * zoomFactor;
            zoomState.min = pivotTs - chartRelX * newRange;
            zoomState.max = pivotTs + (1 - chartRelX) * newRange;
            clampZoom();
            applyZoom();
          },
          { passive: false, signal }
        );

        overlayEl.addEventListener(
          "mousedown",
          (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartMin = zoomState.min;
            dragStartMax = zoomState.max;
            overlayEl.style.cursor = "grabbing";
          },
          { signal }
        );

        overlayEl.addEventListener(
          "dblclick",
          () => {
            zoomState.min = fullMin;
            zoomState.max = fullMax;
            applyZoom();
          },
          { signal }
        );

      }

      attachOverlayEvents();

      // ── Touch (D-039) ────────────────────────────────────────────────────
      // Pointer-Events auf dem dauerhaften SVG-Element mit Pointer-Capture: Die Geste
      // bleibt erhalten, auch wenn das Overlay beim Neuzeichnen ersetzt wird.
      // Ein Finger führt den Tooltip, zwei Finger zoomen und verschieben, Doppeltippen
      // setzt zurück. Senkrechtes Scrollen bleibt über touch-action: pan-y möglich.
      const TAP_MOVE_TOLERANCE_PX = 8;
      const DOUBLE_TAP_MS = 300;
      const touchPointers = new Map();
      let pinchStart = null;
      let touchMoved = false;
      let touchStartX = 0;
      let lastTapAt = 0;
      chartContainerElement.style.touchAction = "pan-y";

      chartContainerElement.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        if (!e.target.closest?.("#portfolioChartOverlay")) return;
        e.preventDefault();
        chartContainerElement.setPointerCapture(e.pointerId);
        touchPointers.set(e.pointerId, e.clientX);

        if (touchPointers.size === 1) {
          touchMoved = false;
          touchStartX = e.clientX;
          chartContainerElement._wlShowTooltipAt?.(e.clientX);
        } else if (touchPointers.size === 2) {
          const [a, b] = [...touchPointers.values()];
          pinchStart = { dist: Math.max(Math.abs(a - b), 1), mid: (a + b) / 2 };
          touchMoved = true;
        }
      });

      chartContainerElement.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "touch" || !touchPointers.has(e.pointerId)) return;
        touchPointers.set(e.pointerId, e.clientX);

        if (touchPointers.size === 1) {
          if (Math.abs(e.clientX - touchStartX) > TAP_MOVE_TOLERANCE_PX) {
            touchMoved = true;
          }
          chartContainerElement._wlShowTooltipAt?.(e.clientX);
          return;
        }

        if (touchPointers.size === 2 && pinchStart) {
          const [a, b] = [...touchPointers.values()];
          const dist = Math.max(Math.abs(a - b), 1);
          const mid = (a + b) / 2;
          const rect = chartContainerElement.getBoundingClientRect();
          const g = getChartGeometry(chartContainerElement);
          const chartW = g.width - g.margin.left - g.margin.right;
          const pxToSvg = g.width / rect.width;
          const ratio = Math.max(
            0,
            Math.min(1, (((mid - rect.left) * pxToSvg) - g.margin.left) / chartW)
          );

          // Zoom um den Mittelpunkt der beiden Finger
          const range = zoomState.max - zoomState.min;
          const pivotTs = zoomState.min + ratio * range;
          const newRange = range * (pinchStart.dist / dist);
          zoomState.min = pivotTs - ratio * newRange;
          zoomState.max = pivotTs + (1 - ratio) * newRange;
          clampZoom();

          // Verschieben mit dem Mittelpunkt
          const currentRange = zoomState.max - zoomState.min;
          const dxMs = (pinchStart.mid - mid) * pxToSvg * (currentRange / chartW);
          zoomState.min = Math.max(
            fullMin,
            Math.min(zoomState.min + dxMs, fullMax - currentRange)
          );
          zoomState.max = zoomState.min + currentRange;

          pinchStart = { dist, mid };
          applyZoom();
        }
      });

      function endTouchPointer(e) {
        if (!touchPointers.has(e.pointerId)) return;
        touchPointers.delete(e.pointerId);
        if (touchPointers.size < 2) pinchStart = null;
        if (e.type !== "pointerup" || touchPointers.size > 0 || touchMoved) return;

        // Doppeltippen setzt den Zoom zurück (der Reset-Button ist auf dem Handy ausgeblendet)
        const now = Date.now();
        if (now - lastTapAt < DOUBLE_TAP_MS) {
          zoomState.min = fullMin;
          zoomState.max = fullMax;
          applyZoom();
          lastTapAt = 0;
        } else {
          lastTapAt = now;
        }
      }

      chartContainerElement.addEventListener("pointerup", endTouchPointer);
      chartContainerElement.addEventListener("pointercancel", endTouchPointer);

      // Reset-Button
      const chartWrap = chartContainerElement.closest(
        ".portfolio-overview-chart-wrap"
      );
      if (chartWrap && !chartWrap.querySelector(".chart-zoom-reset")) {
        const resetBtn = document.createElement("button");
        resetBtn.className = "chart-zoom-reset";
        resetBtn.title = "Reset zoom";
        resetBtn.textContent = "⊙";
        resetBtn.addEventListener("click", () => {
          zoomState.min = fullMin;
          zoomState.max = fullMax;
          applyZoom();
        });
        chartWrap.appendChild(resetBtn);
      }
      // ── End Zoom / Pan ────────────────────────────────────────────────────

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
