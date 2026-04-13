(function dashboardLoader() {
  const SLUG_PATTERN = /^[a-z0-9-]+$/;

  function getSystemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("system") || "";
  }

  function isValidSlug(value) {
    return SLUG_PATTERN.test(value);
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load file: ${path} (${response.status})`);
    }
    return response.json();
  }

  function renderLoaderError(message) {
    const strategyTitle = document.getElementById("strategyTitle");
    const strategyDescription = document.getElementById("strategyDescription");
    const strategyInfo = document.getElementById("strategyInfo");
    const badge = document.getElementById("lastUpdateBadge");
    const overviewSubtitle = document.getElementById("overviewSubtitle");

    if (strategyTitle) {
      strategyTitle.textContent = "System loading failed";
    }
    if (strategyDescription) {
      strategyDescription.textContent = "";
    }
    if (strategyInfo) {
      strategyInfo.dataset.tooltip = message;
      strategyInfo.hidden = false;
    }
    if (overviewSubtitle) {
      overviewSubtitle.textContent = "";
    }
    if (badge) {
      badge.textContent = "No valid system loaded";
    }
  }

  function renderLocalPanelFallback(message) {
    const safeMessage = String(message);

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

  function renderGlobalError(message) {
    const error = new Error(String(message));
    renderLoaderError(error.message);
    renderLocalPanelFallback(error.message);
    if (typeof window.renderError === "function") {
      window.renderError(error);
    }
  }

  async function loadSystemData(systemId) {
    const basePath = `../systems/${systemId}`;

    const [currentState, equity, positions, signals] = await Promise.all([
      fetchJson(`${basePath}/wl-current-state.json`),
      fetchJson(`${basePath}/wl-equity.json`),
      fetchJson(`${basePath}/wl-positions.json`),
      fetchJson(`${basePath}/wl-signals.json`),
    ]);

    return { systemId, currentState, equity, positions, signals };
  }

  async function bootFromUrl() {
    const systemId = getSystemIdFromUrl().trim();
    if (!systemId) {
      renderGlobalError(
        "Missing URL parameter 'system'. Example: ?system=strong-volume-trend"
      );
      return;
    }

    if (!isValidSlug(systemId)) {
      renderGlobalError(
        "Invalid system slug. Only lowercase letters, digits, and hyphens are allowed."
      );
      return;
    }

    try {
      const payload = await loadSystemData(systemId);
      if (typeof window.bootDashboard !== "function") {
        throw new Error(
          "Dashboard renderer is unavailable (bootDashboard missing)."
        );
      }
      window.bootDashboard(payload);
    } catch (error) {
      console.error(error);
      renderGlobalError(error.message || "Unknown loading error");
    }
  }

  bootFromUrl();
})();
