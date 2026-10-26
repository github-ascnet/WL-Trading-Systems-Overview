function buildMonthlyMatrix(equityData) {
  const monthEndMap = new Map();

  equityData.forEach((item) => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    monthEndMap.set(key, item.equity);
  });

  const entries = Array.from(monthEndMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const matrix = {};
  for (let i = 1; i < entries.length; i += 1) {
    const [key, currentEquity] = entries[i];
    const [, previousEquity] = entries[i - 1];
    if (!previousEquity) continue;

    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const percent = (currentEquity / previousEquity - 1) * 100;

    if (!matrix[year]) matrix[year] = {};
    matrix[year][month] = percent;
  }

  return matrix;
}

function calcAnnual(monthlyData) {
  let compounded = 1;
  for (const pct of Object.values(monthlyData)) {
    compounded *= 1 + pct / 100;
  }
  return (compounded - 1) * 100;
}

function renderMonthlyReturns(equityData, currentState) {
  const container = document.getElementById("monthlyReturnsGrid");
  if (!container) return;

  const matrix = buildMonthlyMatrix(equityData);
  const years = Object.keys(matrix)
    .map(Number)
    .sort((a, b) => a - b);

  if (years.length === 0) {
    container.innerHTML =
      '<div class="empty">Not enough equity data for monthly returns.</div>';
    return;
  }

  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const allValues = years.flatMap((y) => Object.values(matrix[y]));

  // Heatmap: volle Intensität ab dem 95. Perzentil der Beträge, damit Ausreisser
  // die übrigen Monate nicht verblassen lassen
  const sortedAbs = allValues.map(Math.abs).sort((a, b) => a - b);
  const heatScale =
    sortedAbs.length > 0
      ? sortedAbs[Math.min(sortedAbs.length - 1, Math.floor(sortedAbs.length * 0.95))]
      : 0;
  const avgMonthly = allValues.length
    ? allValues.reduce((a, b) => a + b, 0) / allValues.length
    : 0;
  const avgMonthlyClass = getValueClass(avgMonthly);

  const numMonths = allValues.length;
  const avgTrades =
    currentState && currentState.positionCount && numMonths > 0
      ? currentState.positionCount / numMonths
      : null;

  const headerCells = MONTH_NAMES.map((m) => `<th>${m}</th>`).join("");

  const rows = years
    .map((year, yearIndex) => {
      const yearData = matrix[year];
      const annual = calcAnnual(yearData);
      const annualClass = getValueClass(annual);

      const cells = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        if (yearData[m] !== undefined) {
          const cls = getValueClass(yearData[m]);
          const heat =
            heatScale > 0
              ? 0.1 + 0.9 * Math.min(1, Math.abs(yearData[m]) / heatScale)
              : 0;
          const delay = (yearIndex + m) * 24;
          return `<td class="mr-cell wl-stagger-in ${escapeHtml(
            cls
          )}" style="--mr-i:${heat.toFixed(2)};--wl-delay:${delay}ms">${escapeHtml(
            formatPercent(yearData[m])
          )}</td>`;
        }
        return `<td class="mr-cell"></td>`;
      }).join("");

      return `<tr>
        <td class="mr-year">${escapeHtml(String(year))}</td>
        ${cells}
        <td class="mr-cell mr-annual ${escapeHtml(annualClass)}">${escapeHtml(
        formatPercent(annual)
      )}</td>
      </tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="mr-summary">
      <span>Average Monthly Return:&nbsp;
        <span class="${escapeHtml(avgMonthlyClass)}">${escapeHtml(
    formatPercent(avgMonthly)
  )}</span>
      </span>
      ${
        avgTrades !== null
          ? `<span>Average Trades per Month:&nbsp;<span class="neutral-text">${escapeHtml(
              formatNumber(avgTrades)
            )}</span></span>`
          : ""
      }
    </div>
    <div class="mr-table-wrap">
      <table class="mr-table">
        <thead>
          <tr>
            <th>Year</th>${headerCells}<th>Annual</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
