# Wealth-Lab-Meta-Systems

Statisches Multi-System-Dashboard fuer das Wealth-Lab-Meta-Portfolio auf Basis eines gemeinsamen HTML/CSS/JS-Codes.
Die Landing-Seite zeigt das aggregierte Portfolio und eine Kachel je System, das Dashboard die Details eines Systems.

Live: https://wl-trading-systems.ascnet.ch/

## Projektstruktur

```text
Wealth-Lab-Meta-Systems/
|- index.html                    Landing-Seite (Portfolio, Systemkacheln)
|- dashboard/
|  |- index.html                 Gemeinsames Dashboard fuer alle Systeme
|- css/
|  |- landing.css                Landing-Seite
|  |- styles.css                 Dashboard
|  |- motion.css                 Animationen (beide Seiten)
|  |- theme-aurora.css           Visuelles Theme "Aurora" (beide Seiten)
|- js/
|  |- systems.js                 Systemregister (Freigabeliste)
|  |- kpi-config.js              KPI-Farbregeln und Anzeigeoptionen
|  |- theme.js                   Theme-Schalter (aurora | classic)
|  |- motion.js                  Animationshelfer
|  |- landing.js                 Landing-Seite: Kacheln, Sparklines
|  |- equity-overview-chart.js   Portfolio-Chart und Portfolio-KPIs
|  |- regime-engine-chart.js     Risk-Regime-Panel und Regime-Faerbung
|  |- dashboard-loader.js        Dashboard: Daten laden
|  |- main.js                    Dashboard: Rendering (bootDashboard)
|  |- equity-system-chart.js     Dashboard: Equity-Chart des Systems
|  |- monthly-returns.js         Dashboard: Monatsrenditen
|- systems/
|  |- <slug>/                    je System genau vier Dateien
|  |  |- wl-current-state.json
|  |  |- wl-equity.json
|  |  |- wl-positions.json
|  |  |- wl-signals.json
|  |- risk-regime/               Regime-Daten (kein Handelssystem)
|     |- wl-regime-composite.json
|     |- wl-stretch-score.json
|- docs/sdd/                     Projektdokumentation (Spec-Driven Development)
|- README.md
```

## Registrierte Systeme

`js/systems.js` enthaelt aktuell neun Systeme:

- `strong-volume-trend`
- `adaptive-knife-juggler`
- `capitulation-bounce`
- `short-burst-momentum`
- `dip-snapback`
- `multifactor-fusion`
- `volatility-cycle-catcher`
- `fear-2-fear`
- `btc-gold-regime-breakout`

Nur registrierte Systeme erscheinen auf der Landing-Seite, fliessen ins Portfolio ein und lassen sich im Dashboard oeffnen.

## Architektur

- Reines HTML/CSS/Vanilla JS, keine Build-Tools, keine Frameworks, keine npm-Abhaengigkeiten.
- Charts sind Inline-SVG ohne Chart-Bibliothek.
- Kein projektindividuelles `config.json`; Anzeigeoptionen stehen in `js/kpi-config.js`.
- Die Skripte werden je Seite ueber ein Inline-Skript nacheinander geladen. Neue Skripte in diese Liste eintragen.
- Dashboard: Datenladen und Rendering sind getrennt:
  - `js/dashboard-loader.js` laedt die Daten
  - `js/main.js` rendert ueber `bootDashboard(...)`

## Datenfluss und Betrieb

1. Wealth-Lab 9 exportiert die Systemdaten ueber den Strategy Monitor nach `systems/<slug>/`.
2. Die Git-CLI committet und pusht den Stand nach GitHub (Commit-Nachricht `Auto update trading dashboard <Zeitstempel>`).
3. Cloudflare uebernimmt den Stand aus GitHub und stellt die Seite unter der Live-Adresse bereit.

Der Export pusht den gesamten lokalen `main`-Branch. Lokale, noch nicht gepushte Commits gehen damit beim naechsten Export ebenfalls online.

## Neues System hinzufuegen

1. In Wealth-Lab 9 den Export nach `systems/<slug>/` einrichten. Der Ordner enthaelt genau diese vier Dateien:
   - `wl-current-state.json`
   - `wl-equity.json`
   - `wl-positions.json`
   - `wl-signals.json`
2. In `js/systems.js` einen Eintrag ergaenzen:

```js
{
  id: "<slug>",
  dataPath: "./systems/<slug>"
}
```

3. Pruefen: Die Kachel erscheint, die Portfolio-Statuszeile zaehlt hoch (`x/y systems included`), das Dashboard oeffnet alle fuenf Tabs.

`wl-signals.json` wird geladen, aber derzeit nicht angezeigt. Die Datei bleibt Teil der Konvention fuer eine spaetere Anzeige der aktuellen Signale.

## Dashboard-Aufruf per URL-Parameter

Beispiel:

- `./dashboard/index.html?system=strong-volume-trend`

`js/dashboard-loader.js` liest `system` aus der URL, prueft das Slug-Format und ob das System in `js/systems.js` registriert ist, und laedt dann parallel:

- `wl-current-state.json`
- `wl-equity.json`
- `wl-positions.json`
- `wl-signals.json`

Danach wird `window.bootDashboard({ systemId, currentState, equity, positions, signals })` aufgerufen.
Fehlt der Parameter, ist er ungueltig oder ist das System nicht registriert, zeigt das Dashboard eine Fehlermeldung.

## Konfiguration

`js/kpi-config.js`:

- Farbregeln (Ampel) je Kennzahl fuer Kacheln, Dashboard und Portfolio-KPIs.
- `display.equityDivisor`, `display.startingCapitalDivisor` (je 50): Die angezeigten Betraege werden durch diesen Faktor geteilt, damit im Dashboard keine Millionenbetraege erscheinen. Berechnungen bleiben unskaliert.
- `display.useDisplayEquity: false`: Das Portfolio ist die Rohsumme der System-Equities. Die Gewichtung der Systeme wird in Wealth-Lab 9 festgelegt.
- `display.showRiskRegimePanel`: Risk-Regime-Panel auf der Landing-Seite ein- oder ausblenden (Standard aus; die Regime-Faerbung des Hintergrunds bleibt).
- `display.showRegimeStretchScore`: Stretch Score im Regime-Panel ein- oder ausblenden.
- `display.showTrophies`: Trophaeen an den Kennzahlen ein- oder ausblenden (Standard aus).

`js/theme.js`:

- `WL_VISUAL_THEME`: `"aurora"` (Standard) oder `"classic"` (bisheriges Design).

## Lokal starten

Die Seiten laden JSON per `fetch` mit relativen Pfaden und muessen deshalb ueber einen HTTP-Server ausgeliefert werden (ein beliebiger statischer Server im Projektordner). Ein Start per Doppelklick (`file://`) funktioniert nicht.

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

`NaN`-Werte in den Exportdateien werden beim Laden als `null` behandelt.

## Hinweise

- Kein Root-Ordner `data/`; die System-JSON-Dateien liegen ausschliesslich unter `systems/<slug>/`.
- Die Projektdokumentation (Anforderungen, Entscheidungen, Arbeitspakete, Arbeitsregeln) liegt in `docs/sdd/`.
