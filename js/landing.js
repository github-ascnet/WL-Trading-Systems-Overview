(function landingApp() {
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
    return response.json();
  }

  function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return new Intl.NumberFormat("en-GB", {
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

  function getAprClass(value) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "";
    return numericValue >= 30 ? "kpi-positive" : "kpi-warning";
  }

  function getSharpeConfig(value) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return { className: "", suffix: "" };
    }

    if (numericValue >= 2) {
      return {
        className: "kpi-positive",
        suffix: ' <span class="kpi-trophy" aria-hidden="true">&#127942;</span>',
      };
    }

    if (numericValue >= 1) {
      return { className: "kpi-positive", suffix: "" };
    }

    return { className: "kpi-danger", suffix: "" };
  }

  function getRiskReturnConfig(value) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return { className: "", suffix: "" };
    }

    if (numericValue >= 80) {
      return {
        className: "kpi-positive",
        suffix: ' <span class="kpi-trophy" aria-hidden="true">&#127942;</span>',
      };
    }

    if (numericValue >= 50) {
      return { className: "kpi-positive", suffix: "" };
    }

    if (numericValue >= 35) {
      return { className: "kpi-warning", suffix: "" };
    }

    return { className: "kpi-danger", suffix: "" };
  }

  function getMaxDrawdownClass(value) {
    const numericValue = Math.abs(Number(value));
    if (Number.isNaN(numericValue)) return "";
    return numericValue >= 25 ? "kpi-danger" : "kpi-warning";
  }

  function getProfitableClass(value) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "";
    return numericValue >= 50 ? "kpi-positive" : "kpi-danger";
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
    const riskReturnMetaScore = safeGet(
      currentState,
      ["riskReturnMetaScore"],
      null
    );
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

    const sharpeConfig = getSharpeConfig(sharpeRatio);
    const riskReturnConfig = getRiskReturnConfig(riskReturnMetaScore);

    return `
      <a class="system-card" href="./dashboard/index.html?system=${encodeURIComponent(
        systemId
      )}">
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
          <div><dt>APR/CAGR</dt><dd class="${getAprClass(apr)}">${escapeHtml(
      formatPercent(apr)
    )}</dd></div>
          <div><dt>Profit %</dt><dd>${escapeHtml(
            formatPercent(profitPercent, 0)
          )}</dd></div>
          <div><dt>Profitable %</dt><dd class="${getProfitableClass(
            profitablePercent
          )}">${escapeHtml(formatPercent(profitablePercent))}</dd></div>
          <div><dt>Sharpe Ratio</dt><dd class="${
            sharpeConfig.className
          }">${escapeHtml(formatNumber(sharpeRatio))}${
      sharpeConfig.suffix
    }</dd></div>
          <div><dt>Risk-Return Score</dt><dd class="${
            riskReturnConfig.className
          }">${escapeHtml(formatNumber(riskReturnMetaScore))}${
      riskReturnConfig.suffix
    }</dd></div>
          <div><dt>Max Drawdown</dt><dd class="${getMaxDrawdownClass(
            maxDrawdown
          )}">${escapeHtml(formatPercent(maxDrawdown))}</dd></div>
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
          return createErrorCardHtml(
            system.id,
            error.message || "Unknown error"
          );
        }
      })
    );

    grid.innerHTML = cards.join("");
  }

  renderSystems();
})();
