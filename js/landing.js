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
          <div><dt>APR/CAGR</dt><dd>${escapeHtml(formatPercent(apr))}</dd></div>
          <div><dt>Profit %</dt><dd>${escapeHtml(
            formatPercent(profitPercent)
          )}</dd></div>
          <div><dt>Sharpe Ratio</dt><dd>${escapeHtml(
            formatNumber(sharpeRatio)
          )}</dd></div>
          <div><dt>Risk-Return Score</dt><dd>${escapeHtml(
            formatNumber(riskReturnMetaScore)
          )}</dd></div>
          <div><dt>Max Drawdown</dt><dd>${escapeHtml(
            formatPercent(maxDrawdown)
          )}</dd></div>
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
