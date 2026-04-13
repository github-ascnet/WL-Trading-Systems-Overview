# Wealth-Lab-Meta-Systems

Statische Multi-System-Dashboard-Loesung auf Basis eines gemeinsamen HTML/CSS/JS-Codes.

## Projektstruktur

```text
Wealth-Lab-Meta-Systems/
|- index.html
|- dashboard/
|  |- index.html
|- css/
|  |- styles.css
|  |- landing.css
|- js/
|  |- main.js
|  |- monthly-returns.js
|  |- dashboard-loader.js
|  |- landing.js
|  |- systems.js
|- systems/
|  |- strong-volume-trend/
|     |- wl-current-state.json
|     |- wl-equity.json
|     |- wl-positions.json
|     |- wl-signals.json
|- README.md
```

## Architektur

- Root-Landing: `index.html`
- Gemeinsames Dashboard: `dashboard/index.html`
- Dashboard-Datenquelle: `systems/<slug>/`
- Kein projektindividuelles `config.json`
- Datenladen und Rendering sind getrennt:
  - `js/dashboard-loader.js` laedt Daten
  - `js/main.js` rendert ueber `bootDashboard(...)`

## Neues System hinzufuegen

1. Neuen Ordner anlegen: `systems/<slug>/`
2. Genau diese 4 Dateien ablegen:
   - `wl-current-state.json`
   - `wl-equity.json`
   - `wl-positions.json`
   - `wl-signals.json`
3. In `js/systems.js` einen Eintrag ergaenzen:

```js
{
  id: "<slug>",
  dataPath: "./systems/<slug>"
}
```

Aktuell ist ein System eingetragen:

- `strong-volume-trend`

## Dashboard-Aufruf per URL-Parameter

Beispiel:

- `./dashboard/index.html?system=strong-volume-trend`
- `./dashboard/index.html?system=alpha-picks`

`js/dashboard-loader.js` liest `system` aus der URL und laedt parallel:

- `wl-current-state.json`
- `wl-equity.json`
- `wl-positions.json`
- `wl-signals.json`

Danach wird `window.bootDashboard({ systemId, currentState, equity, positions, signals })` aufgerufen.

## Fallbacks

Sowohl Landing als auch Dashboard sind defensiv gegen fehlende Felder umgesetzt. Beispiele:

- Name: `strategyName || name || systemId`
- Beschreibung: `strategyDescription || description || ""`
- Universe: `symbolUniverse || universeName || "-"`
- Benchmark: `benchmark || "-"`
- APR/CAGR: `apr || cagr || totalReturnCagr || null`
- Max Drawdown: `maxDrawdown || maxDd || drawdown || null`
- Open Positions: `openPositions || positionsCount || (aus wl-positions.json abgeleitet)`
- Signals: `signalCount || signalsCount || (aus wl-signals.json abgeleitet)`
- Last Updated: `lastUpdated || generatedAt || updatedAt || lastUpdate || null`

## Hinweise

- Reines HTML/CSS/Vanilla JS
- Keine Build-Tools, keine Frameworks, keine npm-Abhaengigkeiten
- Kein Root-Ordner `data/` in der finalen Architektur
- Die vier System-JSON-Dateien liegen ausschliesslich unter `systems/<slug>/`
