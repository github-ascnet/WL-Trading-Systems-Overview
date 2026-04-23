(function registerKpiConfig(global) {
  const WL_KPI_CONFIG = {
    colors: {
      positive: {
        label: "green",
        hex: "#6ee7a8",
        landingClass: "kpi-positive",
        dashboardClass: "positive",
      },
      warning: {
        label: "yellow",
        hex: "#ffd166",
        landingClass: "kpi-warning",
        dashboardClass: "neutral",
      },
      danger: {
        label: "red",
        hex: "#ff7b7b",
        landingClass: "kpi-danger",
        dashboardClass: "negative",
      },
      neutral: {
        label: "neutral",
        hex: "#a8b4cd",
        landingClass: "",
        dashboardClass: "neutral",
      },
    },
    display: {
      startingCapitalDivisor: 100,
      equityDivisor: 100,
      showPortfolioOverviewKpis: true,
      // true  → Kurven und KPIs basieren auf der normalisierten Equal-Weight-Kurve (displayEquity)
      // false → Kurven und KPIs basieren auf der rohen Dollarsumme (equity)
      useDisplayEquity: false,
    },
    metrics: {
      apr: {
        label: "APR/CAGR",
        rules: [
          { op: ">=", value: 85, color: "danger" },
          { op: ">=", value: 50, color: "positive", trophy: true },
          { op: ">=", value: 20, color: "positive" },
          { op: ">=", value: 10, color: "warning" },
          { color: "danger" },
        ],
      },
      sharpeRatio: {
        label: "Sharpe Ratio",
        rules: [
          { op: ">=", value: 2, color: "positive", trophy: true },
          { op: ">=", value: 1, color: "positive" },
          { color: "danger" },
        ],
      },
      riskReturnMetaScore: {
        label: "Risk-Return Score",
        rules: [
          { op: ">=", value: 80, color: "positive", trophy: true },
          { op: ">=", value: 50, color: "positive" },
          { op: ">=", value: 35, color: "warning" },
          { color: "danger" },
        ],
      },
      profitablePercent: {
        label: "Profitable %",
        rules: [
          { op: ">=", value: 70, color: "positive", trophy: true },
          { op: ">=", value: 50, color: "positive" },
          { op: ">=", value: 35, color: "warning" },
          { color: "danger" },
        ],
      },
      maxDrawdown: {
        label: "Max Drawdown",
        rules: [
          { op: "<=", value: -30, color: "danger" },
          { op: "<=", value: -20, color: "warning" },
          { color: "positive" },
        ],
      },
      profitFactor: {
        label: "Profit Factor",
        rules: [
          { op: ">=", value: 2.5, color: "positive", trophy: true },
          { op: ">=", value: 1.75, color: "positive" },
          { op: ">=", value: 1, color: "warning" },
          { color: "danger" },
        ],
      },
    },
  };

  function matchesRule(value, rule) {
    if (!rule || !rule.op) {
      return true;
    }

    switch (rule.op) {
      case ">=":
        return value >= rule.value;
      case ">":
        return value > rule.value;
      case "<=":
        return value <= rule.value;
      case "<":
        return value < rule.value;
      case "===":
        return value === rule.value;
      default:
        return false;
    }
  }

  function getKpiPresentation(metricKey, value, surface = "landing") {
    const metric = WL_KPI_CONFIG.metrics[metricKey];
    const numericValue = Number(value);

    if (!metric || Number.isNaN(numericValue)) {
      return {
        tone: "neutral",
        className: "",
        trophy: false,
        color: WL_KPI_CONFIG.colors.neutral.label,
        hex: WL_KPI_CONFIG.colors.neutral.hex,
      };
    }

    const matchedRule =
      metric.rules.find((rule) => matchesRule(numericValue, rule)) ||
      metric.rules[metric.rules.length - 1];

    const colorConfig =
      WL_KPI_CONFIG.colors[matchedRule.color] || WL_KPI_CONFIG.colors.neutral;

    return {
      tone: matchedRule.color,
      className:
        surface === "dashboard"
          ? colorConfig.dashboardClass
          : colorConfig.landingClass,
      trophy: Boolean(matchedRule.trophy),
      color: colorConfig.label,
      hex: colorConfig.hex,
    };
  }

  global.WL_KPI_CONFIG = WL_KPI_CONFIG;
  global.getKpiPresentation = getKpiPresentation;
})(window);
