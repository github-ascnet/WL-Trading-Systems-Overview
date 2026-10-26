# decisions.md – Wealth-Lab Meta-Portfolio

| Eigenschaft | Wert |
|---|---|
| Dokumenttyp | SDD – Entscheidungsregister |
| Modus | INIT (Reverse-Dokumentation) |
| Stand | 2026-10-26 |
| Bezug | `project_plan.md`, `build_plan.md`, `agents.md` |

## Lesehinweise

### Statuswerte

| Status | Bedeutung |
|---|---|
| **Verbindlich** | Ausdrücklich in `README.md` festgehalten. Darf nur über CHANGE geändert werden. |
| **Ist-Zustand** | Aus dem Code abgeleitet und nachträglich dokumentiert. Der Code zeigt, dass so gebaut wurde, aber nicht, dass es so gewollt ist. Gilt als Arbeitsgrundlage, bis der Auftraggeber bestätigt oder ändert. |
| **Ersetzt / Verworfen** | Nur nach CHANGE; mit Verweis auf die Nachfolgeentscheidung. Aktuell keine. |

Die Spalte "Begründung" enthält nur Gründe, die im Projekt belegt sind. Ist keiner belegt, steht dort "nicht dokumentiert". Es werden keine Gründe nachträglich erfunden.

### Änderungsregel

Eine Entscheidung wird nicht überschrieben oder gelöscht. Bei einer Änderung bleibt der alte Eintrag stehen, erhält den Status "Ersetzt" mit Datum, Grund und Verweis, und eine neue Entscheidung mit neuer ID wird ergänzt.

---

## Übersicht

| ID | Titel | Bereich | Status |
|---|---|---|---|
| D-001 | Reines HTML/CSS/Vanilla-JavaScript ohne Build und Abhängigkeiten | Technologie | Verbindlich |
| D-002 | Statische, rein clientseitige Anwendung | Architektur | Verbindlich |
| D-003 | Zwei Einstiegsseiten mit gemeinsamem Code | Architektur | Verbindlich |
| D-004 | Datenablage ausschliesslich unter `systems/<slug>/` mit vier Dateien | Daten | Verbindlich |
| D-005 | Systemregistrierung über `js/systems.js` | Daten | Verbindlich |
| D-006 | Trennung von Datenladen und Rendering | Architektur | Verbindlich |
| D-007 | Defensive Feld-Fallbacks | Daten | Verbindlich |
| D-008 | System-Auswahl per URL-Parameter mit Slug-Validierung | Dashboard | Ist-Zustand |
| D-009 | NaN-Bereinigung beim JSON-Parsen | Daten | Ist-Zustand |
| D-010 | Kein Browser-Caching der Daten | Betrieb | Ist-Zustand |
| D-011 | Charts als handgeschriebenes Inline-SVG | Darstellung | Ist-Zustand |
| D-012 | Logarithmische Equity-Achse, Drawdown auf rechter Achse | Darstellung | Ist-Zustand |
| D-013 | Portfolio als Rohsumme der Systemkurven mit Carry-Forward | Berechnung | Ist-Zustand |
| D-014 | Portfolio-KPIs clientseitig aus Equity- und Positionsdaten | Berechnung | Ist-Zustand |
| D-015 | Anzeige-Skalierung der Beträge durch Divisor | Darstellung | Ist-Zustand |
| D-016 | Zentrale, regelbasierte KPI-Ampel | Darstellung | Ist-Zustand |
| D-017 | Zoom und Pan nur im Portfolio-Chart | Darstellung | Ist-Zustand |
| D-018 | Risk-Regime-Daten in eigenem Ordner, Panel auf Landing-Seite | Daten / Darstellung | Ist-Zustand |
| D-019 | Dark Theme mit CSS-Variablen, zwei getrennte Stylesheets | Darstellung | Ist-Zustand |
| D-020 | Responsive Breakpoints und Mobile-Navigation | Darstellung | Ist-Zustand |
| D-021 | Tooltips über Info-Symbol und `data-tooltip` | Bedienung | Ist-Zustand |
| D-022 | Sprache und Formatierung (UI Englisch, `en-GB`, ohne Tausendertrenner) | Darstellung | Ist-Zustand |
| D-023 | Datenaktualisierung über automatisierte Commits | Betrieb | Ist-Zustand |
| D-024 | Keine automatisierten Tests und keine CI im Repository | Qualität | Ist-Zustand |
| D-025 | Skript-Ladeverfahren je Seite | Architektur | Ist-Zustand |
| D-026 | Motion: Einlaufanimationen nur mit CSS und `requestAnimationFrame` | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-027 | Atmosphäre und Mikro-Interaktionen (Hintergrund, Regime-Tint, Tab-Indikator, Heatmap, Tabellen) | Darstellung | Verbindlich (Auftrag 2026-10-26) |

---

## D-001 – Reines HTML/CSS/Vanilla-JavaScript ohne Build und Abhängigkeiten

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | Die Lösung besteht aus HTML, CSS und Vanilla-JavaScript. Es gibt keine Build-Tools, keine Frameworks, keine npm-Abhängigkeiten. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `README.md`, Abschnitt "Hinweise" |
| **Konsequenz** | Keine Bibliotheken für Charts, UI, Datum oder Formatierung. Neue Funktionen werden in vorhandenem Stil mit Browser-APIs (`fetch`, `Intl`, SVG, `ResizeObserver`) umgesetzt. |

## D-002 – Statische, rein clientseitige Anwendung

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | "Statische Multi-System-Dashboard-Loesung". Es gibt kein Backend, keine API, keine Datenbank. Daten werden per `fetch` aus statischen JSON-Dateien gelesen. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `README.md` Zeile 3; Code: alle Datenzugriffe sind relative `fetch`-Aufrufe |
| **Konsequenz** | Alle Berechnungen (Portfolio-Aggregation, KPIs, Monatsrenditen) laufen im Browser. Datenänderungen erfolgen durch Austausch der JSON-Dateien. |

## D-003 – Zwei Einstiegsseiten mit gemeinsamem Code

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | Root-Landing `index.html` und ein **gemeinsames** Dashboard `dashboard/index.html` für alle Systeme. Es gibt kein Dashboard pro System. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `README.md`, Abschnitt "Architektur" |
| **Konsequenz** | Systemspezifische Unterschiede sind ausschliesslich datengetrieben (`wl-current-state.json`). Systemspezifische Seiten oder Konfigurationsdateien sind nicht vorgesehen. |

## D-004 – Datenablage ausschliesslich unter `systems/<slug>/` mit vier Dateien

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | Pro System genau vier Dateien unter `systems/<slug>/`: `wl-current-state.json`, `wl-equity.json`, `wl-positions.json`, `wl-signals.json`. Kein Root-Ordner `data/`, kein projektindividuelles `config.json`. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `README.md`, Abschnitte "Architektur", "Neues System hinzufuegen", "Hinweise" |
| **Konsequenz** | Das Dashboard lädt immer alle vier Dateien; fehlt eine, scheitert der Aufruf. Der Ordner `systems/risk-regime/` ist eine Ausnahme der Konvention (zwei andere Dateien) und wird nur vom Regime-Panel gelesen, siehe D-018. |

## D-005 – Systemregistrierung über `js/systems.js`

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | Ein System wird auf der Landing-Seite durch einen Eintrag `{ id, dataPath }` in `js/systems.js` bekannt gemacht. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `README.md`, Abschnitt "Neues System hinzufuegen" |
| **Konsequenz** | Die Landing-Seite und das Portfolio umfassen genau die registrierten Systeme. Die Registrierung ist **kein** Zugriffsschutz für das Dashboard (siehe INC-07, OP-10). Der Ist-Zustand weicht von der README ab, die nur ein System nennt (INC-01). |

## D-006 – Trennung von Datenladen und Rendering

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | `js/dashboard-loader.js` lädt Daten, `js/main.js` rendert über `bootDashboard({ systemId, currentState, equity, positions, signals })`. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `README.md`, Abschnitt "Architektur" und "Dashboard-Aufruf per URL-Parameter" |
| **Konsequenz** | Die Schnittstelle `bootDashboard` mit diesem Payload ist ein stabiler Vertrag. Der Loader kennt keine Renderdetails, `main.js` kennt keine URL. Fehleranzeige: `renderError` wird vom Loader aufgerufen, falls vorhanden. |

## D-007 – Defensive Feld-Fallbacks

| | |
|---|---|
| **Status** | Verbindlich |
| **Entscheidung** | Landing und Dashboard sind defensiv gegen fehlende Felder. Die README nennt Alias-Ketten (Name, Beschreibung, Universe, Benchmark, APR, Max Drawdown, Open Positions, Signals, Last Updated). |
| **Begründung** | nicht dokumentiert (Zweck erkennbar: tolerante Verarbeitung verschiedener Exportstände) |
| **Quelle** | `README.md`, Abschnitt "Fallbacks"; Code: `safeGet`, `normalizeCurrentState` |
| **Konsequenz** | Neue Felder werden mit Fallback eingeführt. Fehlende Werte erscheinen als "-". Die Alias-Reihenfolge ist Teil des Vertrags. Der README-Fallback "Universe: `symbolUniverse \|\| universeName \|\| '-'`" wird im Dashboard zusätzlich in Universe und Datasource am `;` getrennt, bei fehlendem Teil "Unknown". |

## D-008 – System-Auswahl per URL-Parameter mit Slug-Validierung

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Das Dashboard liest `?system=<slug>`. Gültig sind nur Slugs gemäss `^[a-z0-9-]+$`; der Datenpfad ist fest `../systems/<slug>/`. |
| **Begründung** | nicht dokumentiert (Wirkung: verhindert Pfadmanipulation über den Parameter) |
| **Quelle** | `README.md` (Parameter), `js/dashboard-loader.js` (Regex) |
| **Konsequenz** | Ordnernamen unter `systems/` müssen dieses Muster erfüllen. Gross-/Sonderzeichen und Unterstriche sind nicht zulässig. |

## D-009 – NaN-Bereinigung beim JSON-Parsen

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Schlägt `JSON.parse` fehl, werden bare `NaN`-Werte (`: NaN` vor `,`, `}` oder `]`) durch `null` ersetzt und erneut geparst. |
| **Begründung** | Code-Kommentar: "Some upstream exports may contain bare NaN values, which are invalid JSON." |
| **Quelle** | `js/dashboard-loader.js`, `js/landing.js` |
| **Konsequenz** | Der Export (Wealth-Lab) kann `NaN` erzeugen. Die Bereinigung gilt **nicht** in `equity-overview-chart.js` und `regime-engine-chart.js` (INC-08). |

## D-010 – Kein Browser-Caching der Daten

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Alle `fetch`-Aufrufe verwenden `cache: "no-store"`. Die Landing-Seite lädt ihre Skripte mit `?v=<Date.now()>`. |
| **Begründung** | nicht dokumentiert (Zweck erkennbar: Daten werden häufig aktualisiert, siehe D-023) |
| **Quelle** | `js/*.js`, `index.html` |
| **Konsequenz** | Jeder Seitenaufruf überträgt alle benötigten JSON-Dateien neu. Die Landing-Seite lädt zwei Dateien je System (Equity, Positionen) plus je eine `current-state` und die Regime-Dateien. |

## D-011 – Charts als handgeschriebenes Inline-SVG

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Alle drei Charts (Portfolio, System, Regime) werden in JavaScript als SVG-Markup erzeugt. Virtuelle Koordinaten: Portfolio und System 1000 × 340, Regime 1000 × 160; `preserveAspectRatio="xMidYMid meet"`. |
| **Begründung** | nicht dokumentiert (Folge von D-001) |
| **Quelle** | `equity-overview-chart.js`, `equity-system-chart.js`, `regime-engine-chart.js` |
| **Konsequenz** | Interaktion (Crosshair, Zoom) wird per SVG-Overlay-Rechteck und Maus-/Touch-Events umgesetzt. Beim Neuzeichnen werden Elemente über `innerHTML` ersetzt. |

## D-012 – Logarithmische Equity-Achse, Drawdown auf rechter Achse

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Equity wird logarithmisch dargestellt (Werte unter 1 auf 1 begrenzt). Der Drawdown (orange) liegt auf einer eigenen rechten Achse, die nach unten verläuft. Portfolio-Chart: fest 0 bis −30 % in 5-%-Schritten; System-Chart: dynamisch. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `equity-overview-chart.js`, `equity-system-chart.js` |
| **Konsequenz** | Drawdowns tiefer als −30 % werden im Portfolio-Chart am Rand abgeschnitten (INC-14). |

## D-013 – Portfolio als Rohsumme der Systemkurven mit Carry-Forward

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Die Portfolio-Equity ist die Summe der Equity-Werte aller geladenen Systeme auf einer gemeinsamen Datumsachse. Fehlende Tage werden vorwärts aufgefüllt, Tage vor dem Systemstart mit dem ersten Wert. Eine Equal-Weight-Alternative (`displayEquity`) wird berechnet, aber über `useDisplayEquity = false` nicht verwendet. |
| **Begründung** | nicht dokumentiert; Konfigurationskommentar beschreibt die zwei Varianten |
| **Quelle** | `equity-overview-chart.js` (`aggregatePortfolioSeries`), `kpi-config.js` |
| **Konsequenz** | Jedes System geht mit seinem eigenen Kapital (derzeit je 100 000) ein. Ein später startendes System trägt vor seinem Start sein Startkapital bei. Die Wahl der Variante ist offen (OP-12). |

## D-014 – Portfolio-KPIs clientseitig aus Equity- und Positionsdaten

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | APR/CAGR, Profit %, Max Drawdown, Sharpe Ratio, Profit Factor und Profitable % des Portfolios werden im Browser berechnet. Formeln siehe `project_plan.md` 8.2 und 8.3. Die Sharpe Ratio verwendet keinen risikofreien Zins und setzt CAGR ins Verhältnis zur annualisierten Volatilität. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `equity-overview-chart.js` |
| **Konsequenz** | Die Portfolio-Sharpe-Ratio ist nicht mit der Sharpe Ratio je System aus Wealth-Lab (`wl-current-state.json`) methodisch gleichgesetzt. Eine Gleichwertigkeit ist nicht belegt. |

## D-015 – Anzeige-Skalierung der Beträge durch Divisor

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Dargestellte Equity-Beträge werden durch `equityDivisor` (100) geteilt, das Starting Capital im Dashboard durch `startingCapitalDivisor` (100). Berechnungen und KPIs verwenden unskalierte Werte. |
| **Begründung** | nicht dokumentiert (Code-Kommentar: KPIs rechnen auf Rohwerten, nur die Anzeige wird skaliert; `startingCapitalDivisor` wird im Portfolio-Chart bewusst nicht angewendet) |
| **Quelle** | `kpi-config.js`, `main.js`, `equity-overview-chart.js`, `equity-system-chart.js` |
| **Konsequenz** | Angezeigte Beträge entsprechen nicht den Rohwerten in den JSON-Dateien. Der Grund ist offen (OP-06). Die Divisoren dürfen nur gemeinsam mit dieser Entscheidung geändert werden. |

## D-016 – Zentrale, regelbasierte KPI-Ampel

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Farbe und Trophäe einer Kennzahl werden zentral in `WL_KPI_CONFIG.metrics` über geordnete Regeln definiert (erste zutreffende Regel gewinnt) und über `getKpiPresentation(metricKey, value, surface)` abgefragt. Oberflächen: `landing` und `dashboard`. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `js/kpi-config.js` |
| **Konsequenz** | Schwellenwerte werden ausschliesslich dort geändert, nicht in Render-Code. Aufrufer liefern einen Fallback, falls die Funktion fehlt. Regeltabelle siehe `project_plan.md` Kapitel 9. |

## D-017 – Zoom und Pan nur im Portfolio-Chart

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Das Portfolio-Chart bietet Zoom (Mausrad, Pinch), Pan (Ziehen, Wischen), Reset (Doppelklick, Reset-Button) bei einer Mindestspanne von 30 Tagen. Das System-Chart und das Regime-Panel bieten nur Tooltips. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `equity-overview-chart.js` |
| **Konsequenz** | Zoom ist nicht mit dem Regime-Panel synchronisiert (INC-09). |

## D-018 – Risk-Regime-Daten in eigenem Ordner, Panel auf Landing-Seite

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Die Regime-Daten liegen in `systems/risk-regime/` (`wl-regime-composite.json`, `wl-stretch-score.json`), sind kein Handelssystem, stehen nicht in `systems.js` und werden mit festem Pfad `./systems/risk-regime/…` geladen. Der Stretch Score ist über `showRegimeStretchScore` ausgeblendet. Als Hintergrund sind nur `StrongRiskOn` und `RiskOff` sichtbar. |
| **Begründung** | Beschreibungstext auf der Landing-Seite: Der Composite Score ist ein Indikator zur Portfolio-Exposure-Steuerung, nicht zum Trade-Timing. Gründe für die Ausblendung und die transparenten Zustände sind nicht dokumentiert. |
| **Quelle** | `regime-engine-chart.js`, `kpi-config.js`, `index.html` |
| **Konsequenz** | Das Panel ist ausschliesslich auf der Landing-Seite vorhanden. Der letzte Commit ("Update Regime-Filter", 2026-10-26) betrifft diese Daten und zeigt, dass sie laufend gepflegt werden. |

## D-019 – Dark Theme mit CSS-Variablen, zwei getrennte Stylesheets

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Die Anwendung ist durchgängig dunkel gestaltet. Farben, Abstände, Radien und Zeiten liegen als Variablen in `:root`. `css/landing.css` gehört zur Landing-Seite, `css/styles.css` zum Dashboard; beide definieren eigene `:root`-Blöcke. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `css/styles.css`, `css/landing.css` |
| **Konsequenz** | Änderungen an Variablen müssen in beiden Dateien nachgezogen werden, wenn sie beide Seiten betreffen. Es gibt kein Light Theme. |

## D-020 – Responsive Breakpoints und Mobile-Navigation

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Landing: Breakpoints 700 px und 1280 px. Dashboard: 768 px, dort Tabs als Hamburger-Dropdown und Ausblenden der Preisspalten (`col-hide-mobile`). Das System-Chart wechselt bei Containerbreite < 480 px in ein schmales Layout. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `css/*.css`, `equity-system-chart.js`, `landing.js` |
| **Konsequenz** | Der Tilt-Effekt der Kacheln wird beim Rendern mit `matchMedia("(min-width: 701px)")` einmalig aktiviert und reagiert nicht auf spätere Grössenänderungen. |

## D-021 – Tooltips über Info-Symbol und `data-tooltip`

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Erklärungen erscheinen über ein "!"-Symbol. Landing: reines CSS-Hover (`.portfolio-info-box`, `.regime-info-box`). Dashboard: ein gemeinsamer Tooltip (`#cardTooltip`), der über `data-tooltip` an Hover und Fokus gebunden ist. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `index.html`, `dashboard/index.html`, `main.js` |
| **Konsequenz** | Landing-Tooltips sind per Tastatur nicht erreichbar (kein `tabindex`, nur Hover). Dies ist ein belegter Ist-Befund, keine Anforderung. |

## D-022 – Sprache und Formatierung

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | UI-Texte sind Englisch. Zahlen und Daten werden mit Locale `en-GB` formatiert, Zahlen ohne Tausendertrennzeichen. Code-Kommentare sind überwiegend Englisch, einzelne Deutsch. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `js/*.js`, `*.html` |
| **Konsequenz** | Neue sichtbare Texte erscheinen Englisch; neue Zahlenausgaben nutzen dieselben Formatierfunktionen oder dieselbe `Intl`-Konfiguration. |

## D-023 – Datenaktualisierung über automatisierte Commits

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Die JSON-Daten werden durch einen Prozess ausserhalb des Repositorys erzeugt und mit der Nachricht `Auto update trading dashboard <Zeitstempel>` auf `main` committet. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | Git-Historie (1 400 Commits, Muster seit mindestens 2026-10-22 mehrfach täglich) |
| **Konsequenz** | Der Code muss mit jedem Exportstand lauffähig bleiben (siehe D-007, D-009). Händische Änderungen an `systems/**` können durch den nächsten Export überschrieben werden. Der Prozess selbst ist nicht dokumentiert (OP-01). |

## D-024 – Keine automatisierten Tests und keine CI im Repository

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Das Repository enthält keine Tests, kein Testframework, keine Workflow-Dateien und kein Linting. |
| **Begründung** | nicht dokumentiert (Folge von D-001) |
| **Quelle** | Dateiinventar |
| **Konsequenz** | Gemäss SDD-Regel wird kein Testframework ergänzt, solange es nicht beauftragt ist. Validierung erfolgt über die manuelle Prüfliste in `agents.md`. |

## D-025 – Skript-Ladeverfahren je Seite

| | |
|---|---|
| **Status** | Ist-Zustand |
| **Entscheidung** | Landing: ein Inline-Skript lädt die fünf Module nacheinander (je nächstes im `onload`) mit Cache-Buster; ein Ladefehler wird mit `console.error` gemeldet und stoppt die Kette. Dashboard: statische `<script>`-Tags in fester Reihenfolge. |
| **Begründung** | nicht dokumentiert |
| **Quelle** | `index.html`, `dashboard/index.html` |
| **Konsequenz** | Die Reihenfolge ist Teil der Abhängigkeitsauflösung (`systems.js` und `kpi-config.js` vor den Modulen, `landing.js` zuletzt; im Dashboard `main.js` vor `dashboard-loader.js`, damit `bootDashboard` verfügbar ist). Ein neues Skript muss in beide Listen konsistent einsortiert werden, falls es von beiden Seiten gebraucht wird. |

## D-026 – Motion: Einlaufanimationen nur mit CSS und `requestAnimationFrame`

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26, Vorschlag 1 "Daten zum Leben erwecken", Arbeitspaket BP-013) |
| **Entscheidung** | Die Charts erhalten eine Einlaufanimation (Linie zeichnet sich ein, Flächen blenden ein) und die Kennzahlenkarten zählen hoch. Umsetzung ausschliesslich mit CSS-Keyframes und `requestAnimationFrame`, ohne Bibliothek (D-001). Der Code liegt zentral in `css/motion.css` und `js/motion.js` und wird von beiden Seiten geladen. |
| **Regeln** | 1. Aktiv nur, wenn `js/motion.js` die Klasse `wl-motion` an `<html>` setzt; bei `prefers-reduced-motion: reduce` geschieht das nicht, der Endzustand erscheint sofort. 2. Der statische Zustand ist der Endzustand; CSS animiert nur den Startzustand (`from`, `animation-fill-mode: backwards`). Ohne `motion.js` bleibt die Darstellung wie bisher. 3. Der Start erfolgt erst, wenn der Loader (`#pageLoader`) die Klasse `hidden` erhält (Fallback nach 8 s). 4. Einlauf nur beim **ersten** Rendern; Zoom, Pan und Resize zeichnen nicht neu ein. 5. Das Hochzählen setzt am Ende den ursprünglichen, bereits formatierten Text wieder ein; Werte, Formate und Berechnungen bleiben unverändert. |
| **Begründung** | Auftrag des Auftraggebers: moderner Motion-Graphics-Eindruck. Die Regeln 1 bis 4 folgen aus D-001, D-011 und den Zoom-/Resize-Neuzeichnungen (`innerHTML`). |
| **Quelle** | Auftrag 2026-10-26; Planungsdokument der Sitzung |
| **Konsequenz** | D-025: `motion.js` kommt in beide Skriptlisten (nach `kpi-config.js`). D-019: ein zusätzliches, geteiltes Stylesheet `css/motion.css` nur für Motion. D-006 und D-016 bleiben unverändert. Der Vorschlag 2 (Kachel-Choreografie, Sparklines, Seitenübergang) ist **nicht** beauftragt. Der Vorschlag 3 ist mit D-027 beauftragt. |

## D-027 – Atmosphäre und Mikro-Interaktionen

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26, Vorschlag 3 "Lebendige Atmosphäre und modernes Dashboard", Arbeitspaket BP-014) |
| **Entscheidung** | Die Regeln aus D-026 gelten unverändert (Klasse `wl-motion`, statischer Endzustand, keine Bibliothek). Zusätzlich: 1. **Hintergrund-Drift:** Die vorhandenen unscharfen Flächen `body::before/::after` driften langsam (50 bis 65 s, `alternate`) allein über `transform`; kein zusätzlicher Filter. 2. **Regime-Tint (nur Landing):** Der letzte Zustand der Composite-Serie setzt `data-wl-regime` an `<html>`; eine feste Ebene `.wl-ambient` färbt den Hintergrund weich über (2,4 s). Zuordnung: `StrongRiskOn` stark grün, `RiskOn` schwach grün, `Caution` schwach bernsteinfarben, `RiskOff` rot, `Neutral` keine Färbung. Rein visuell, keine Handelsaussage. 3. Drift und Regime-Tint nur ab 701 px Breite. 4. **Tab-Indikator (Dashboard):** Eine gleitende Markierung folgt dem aktiven Tab, nur ab 769 px (im Hamburger-Menü entfällt sie). 5. **Heatmap Monthly Returns:** Zellhintergrund mit Intensität proportional zum Betrag der Monatsrendite, skaliert auf das 95. Perzentil der Beträge; Klassen `positive`/`negative` und Zahlenwerte bleiben. Die Heatmap ist statisch und gilt auch bei Reduced-Motion; nur das gestaffelte Einblenden ist Motion. 6. **Positions:** Die ersten 20 Zeilen blenden gestaffelt ein, beim Öffnen des Tabs und nach jedem Sortieren. 7. `panelFadeIn` wird von 800 ms auf 350 ms verkürzt. |
| **Begründung** | Auftrag des Auftraggebers. Die Begrenzung auf 20 Zeilen folgt aus bis zu 1 609 Positionen je System; die Begrenzung ab 701 bzw. 769 px aus Leistung und Platz auf Mobilgeräten. |
| **Abweichung vom Vorschlag** | a) `Caution` erhält eine schwache Färbung (im Vorschlag "neutral sonst"), weil der aktuelle Zustand `Caution` ist und der Effekt sonst nicht sichtbar wäre. b) Das Sortieren blendet die Zeilen neu ein statt sie umzuordnen (FLIP); Positionen haben keinen eindeutigen Schlüssel. |
| **Quelle** | Auftrag 2026-10-26 |
| **Konsequenz** | D-019: `styles.css` erhält die Heatmap-Regeln und die verkürzte `panelFadeIn`-Dauer. `motion.js` erhält `setRegime` und `initTabIndicator`; `motion.css` die zugehörigen Regeln. Der Zusammenhang Zeitraum/Regime auf der Landing-Seite (INC-09) bleibt unverändert. |
