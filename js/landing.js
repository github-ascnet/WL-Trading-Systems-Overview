(function landingApp() {
  const LOADER_MIN_VISIBLE_MS = 300;

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function setLoadingState(isLoading, message = "Loading dashboard...") {
    const loader = document.getElementById("pageLoader");
    const loaderText = document.getElementById("pageLoaderText");

    if (loaderText) {
      loaderText.textContent = message;
    }

    if (loader) {
      loader.classList.toggle("hidden", !isLoading);
    }
  }

  function safeGet(obj, keys, fallback = null) {
    for (const key of keys) {
      if (
        obj &&
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ""
      ) {
        return obj[key];
      }
    }
    return fallback;
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
      // Some upstream exports may contain bare NaN values, which are invalid JSON.
      const sanitizedText = rawText.replace(
        /(:\s*)NaN(?=\s*[,}\]])/g,
        "$1null"
      );

      if (sanitizedText !== rawText) {
        try {
          return JSON.parse(sanitizedText);
        } catch {
          // Fall through to a friendly message below.
        }
      }

      const error = new Error(
        "Data file is invalid or contains unsupported values."
      );
      error.cause = parseError;
      throw error;
    }
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

  function formatPercent(value, decimals = 2) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return `${formatNumber(value, decimals)}%`;
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getKpiConfig(metricKey, value) {
    if (typeof window.getKpiPresentation !== "function") {
      return { className: "", suffix: "" };
    }

    const result = window.getKpiPresentation(metricKey, value, "landing");
    return {
      className: result.className || "",
      suffix: result.trophy
        ? ' <span class="kpi-trophy" aria-hidden="true">&#127942;</span>'
        : "",
    };
  }

  function createCardHtml(systemId, currentState) {
    const strategyName = safeGet(
      currentState,
      ["strategyName", "name"],
      systemId
    );
    const strategyDescription = safeGet(
      currentState,
      ["strategyDescription", "description"],
      ""
    );
    const symbolUniverse = safeGet(
      currentState,
      ["symbolUniverse", "universeName"],
      "-"
    );
    const apr = safeGet(currentState, ["apr", "cagr", "totalReturnCagr"], null);
    const profitPercent = safeGet(currentState, ["profitPercent"], null);
    const profitablePercent = safeGet(
      currentState,
      ["profitablePercent"],
      null
    );
    const sharpeRatio = safeGet(currentState, ["sharpeRatio"], null);
    const maxDrawdown = safeGet(
      currentState,
      ["maxDrawdown", "maxDd", "drawdown"],
      null
    );
    const lastUpdated = safeGet(
      currentState,
      ["lastUpdated", "generatedAt", "updatedAt", "lastUpdate"],
      null
    );

    const aprConfig = getKpiConfig("apr", apr);
    const sharpeConfig = getKpiConfig("sharpeRatio", sharpeRatio);
    const profitableConfig = getKpiConfig(
      "profitablePercent",
      profitablePercent
    );
    const maxDrawdownConfig = getKpiConfig("maxDrawdown", maxDrawdown);

    return `
      <a class="system-card" href="./dashboard/index.html?system=${encodeURIComponent(
        systemId
      )}">
        <div class="system-card-gloss" aria-hidden="true"></div>
        <div class="system-card-head">
          <h2>${escapeHtml(strategyName)}</h2>
        </div>
        ${
          strategyDescription
            ? `<p class="system-description">${escapeHtml(
                strategyDescription
              )}</p>`
            : ""
        }
        <dl class="system-meta">
          <div><dt>Universe</dt><dd>${escapeHtml(symbolUniverse)}</dd></div>
          <div><dt>APR/CAGR</dt><dd class="${aprConfig.className}">${escapeHtml(
      formatPercent(apr)
    )}</dd></div>
          <div><dt>Profit %</dt><dd>${escapeHtml(
            formatPercent(profitPercent, 0)
          )}</dd></div>
          <div><dt>Profitable %</dt><dd class="${
            profitableConfig.className
          }">${escapeHtml(formatPercent(profitablePercent))}${
      profitableConfig.suffix
    }</dd></div>
          <div><dt>Sharpe Ratio</dt><dd class="${
            sharpeConfig.className
          }">${escapeHtml(formatNumber(sharpeRatio))}${
      sharpeConfig.suffix
    }</dd></div>
          <div><dt>Max Drawdown</dt><dd class="${
            maxDrawdownConfig.className
          }">${escapeHtml(formatPercent(maxDrawdown))}</dd></div>
          <div><dt>Last Updated</dt><dd>${escapeHtml(
            formatDate(lastUpdated)
          )}</dd></div>
        </dl>
      </a>
    `;
  }

  function createErrorCardHtml(systemId, message) {
    return `
      <article class="system-card system-card-error">
        <div class="system-card-head">
          <h2>${escapeHtml(systemId)}</h2>
        </div>
        <p class="system-description">${escapeHtml(message)}</p>
      </article>
    `;
  }

  async function loadCardData(system) {
    const basePath =
      typeof system.dataPath === "string" && system.dataPath.trim()
        ? system.dataPath
        : `./systems/${system.id}`;
    const currentStatePath = `${basePath}/wl-current-state.json`;
    return fetchJson(currentStatePath);
  }

  async function renderSystems() {
    const grid = document.getElementById("systemsGrid");
    if (!grid) return;

    const systems = Array.isArray(window.SYSTEMS) ? window.SYSTEMS : [];
    if (systems.length === 0) {
      grid.innerHTML = `<article class="system-card system-card-error"><p>No systems defined in js/systems.js.</p></article>`;
      return;
    }

    const cards = await Promise.all(
      systems.map(async (system) => {
        try {
          const currentState = await loadCardData(system);
          return createCardHtml(system.id, currentState);
        } catch (error) {
          console.error(`Failed to render system card '${system.id}':`, error);
          return createErrorCardHtml(
            system.id,
            "Data currently unavailable. Please check the system export."
          );
        }
      })
    );

    grid.innerHTML = cards.join("");
    if (window.matchMedia("(min-width: 701px)").matches) {
      attachCardTiltEffects(grid);
    }
  }

  function attachCardTiltEffects(grid) {
    let activeCard = null;

    function resetCard(card) {
      if (!card) return;
      card.style.transform = "";
      const gloss = card.querySelector(".system-card-gloss");
      if (gloss) gloss.style.background = "";
    }

    grid.addEventListener("mousemove", (e) => {
      const card = e.target.closest(".system-card");
      if (card !== activeCard) {
        resetCard(activeCard);
        activeCard = card;
      }
      if (!card || card.classList.contains("system-card-error")) return;
      const rect = card.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((e.clientY - rect.top - cy) / cy) * 7;
      const ry = ((cx - (e.clientX - rect.left)) / cx) * 7;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px) scale(1.03)`;
      const gloss = card.querySelector(".system-card-gloss");
      if (gloss) {
        const gx = ((e.clientX - rect.left) / rect.width) * 100;
        const gy = ((e.clientY - rect.top) / rect.height) * 100;
        gloss.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.11) 0%, transparent 60%)`;
      }
    });

    grid.addEventListener("mouseleave", () => {
      resetCard(activeCard);
      activeCard = null;
    });
  }

  async function initLandingPage() {
    const chartContainer = document.getElementById("portfolioOverviewChart");
    const cardsContainer = document.getElementById("portfolioOverviewCards");
    const loadingStartedAt = Date.now();

    setLoadingState(true, "Loading dashboard overview...");

    try {
      await Promise.allSettled([
        typeof window.initEquityOverviewChart === "function" && chartContainer
          ? window.initEquityOverviewChart(chartContainer, cardsContainer)
          : Promise.resolve(),
        renderSystems(),
      ]);

      // Regime engine panel — loads its own data, X-axis synced via _wlPortfolioTimeRange
      const regimeContainer = document.getElementById("regimeEngineChart");
      if (
        regimeContainer &&
        typeof window.initRegimeEnginePanel === "function"
      ) {
        const tr = window._wlPortfolioTimeRange;
        window
          .initRegimeEnginePanel(
            regimeContainer,
            tr?.min ?? null,
            tr?.max ?? null
          )
          .catch((err) => console.warn("[landing] Regime panel:", err));
      }
    } finally {
      const elapsed = Date.now() - loadingStartedAt;
      const remaining = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);
      await delay(remaining);
      setLoadingState(false);
    }
  }

  initLandingPage();
})();
