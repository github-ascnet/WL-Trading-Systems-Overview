# decisions.md – Wealth-Lab Meta-Portfolio

| Eigenschaft | Wert |
|---|---|
| Dokumenttyp | SDD – Entscheidungsregister |
| Modus | INIT (Reverse-Dokumentation) |
| Stand | 2026-10-27 |
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
| D-013 | Portfolio als Rohsumme der Systemkurven mit Carry-Forward | Berechnung | Verbindlich (bestätigt 2026-10-27) |
| D-014 | Portfolio-KPIs clientseitig aus Equity- und Positionsdaten | Berechnung | Ist-Zustand |
| D-015 | Anzeige-Skalierung der Beträge durch Divisor | Darstellung | Verbindlich (bestätigt 2026-10-27) |
| D-016 | Zentrale, regelbasierte KPI-Ampel | Darstellung | Ist-Zustand |
| D-017 | Zoom und Pan nur im Portfolio-Chart | Darstellung | Ist-Zustand |
| D-018 | Risk-Regime-Daten in eigenem Ordner, Panel auf Landing-Seite | Daten / Darstellung | Ist-Zustand |
| D-019 | Dark Theme mit CSS-Variablen, zwei getrennte Stylesheets | Darstellung | Ist-Zustand |
| D-020 | Responsive Breakpoints und Mobile-Navigation | Darstellung | Ist-Zustand |
| D-021 | Tooltips über Info-Symbol und `data-tooltip` | Bedienung | Ist-Zustand |
| D-022 | Sprache und Formatierung (UI Englisch, `en-GB`, ohne Tausendertrenner) | Darstellung | Ist-Zustand |
| D-023 | Datenaktualisierung über automatisierte Commits | Betrieb | Verbindlich (bestätigt 2026-10-27) |
| D-024 | Keine automatisierten Tests und keine CI im Repository | Qualität | Ist-Zustand |
| D-025 | Skript-Ladeverfahren je Seite | Architektur | Ist-Zustand; Dashboard-Teil ersetzt durch D-029 (2026-10-26) |
| D-026 | Motion: Einlaufanimationen nur mit CSS und `requestAnimationFrame` | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-027 | Atmosphäre und Mikro-Interaktionen (Hintergrund, Regime-Tint, Tab-Indikator, Heatmap, Tabellen) | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-028 | Kachel-Choreografie, Sparklines und Seitenübergang | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-029 | Dashboard lädt Skripte dynamisch und nacheinander | Architektur | Verbindlich (2026-10-26, Folge von D-028) |
| D-030 | Loader als animierter Mini-Chart (reines CSS) | Darstellung | Verbindlich (Auftrag 2026-10-26); Animationstechnik ersetzt durch D-032 |
| D-031 | Visuelles Theme "Aurora" (Future State), umschaltbar | Darstellung / Architektur | Verbindlich (Auftrag 2026-10-26) |
| D-032 | Loader-Animation nur mit Compositor-Eigenschaften | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-033 | Aurora auf den System-Detailseiten (Regime-Färbung, Hero-Kurve, lebendige Flächen) | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-034 | Risk-Regime-Panel der Landing-Seite per Schalter ausblendbar | Darstellung / Konfiguration | Verbindlich (Auftrag 2026-10-26) |
| D-035 | Offene Positionen je Datum fortlaufend zählen (Ladezeit) | Berechnung / Leistung | Verbindlich (Auftrag 2026-10-26) |
| D-036 | Mobile Darstellung: Grid-Spalte begrenzen, Charts mit eigenem schmalen Koordinatenraum | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-037 | Dashboard öffnet nur registrierte Systeme | Dashboard / Sicherheit | Verbindlich (Auftrag 2026-10-26) |
| D-038 | Regime-Panel folgt Zoom und Pan des Portfolio-Charts | Darstellung | Verbindlich (Auftrag 2026-10-26) |
| D-039 | Touch-Gesten der Charts: ein Finger Tooltip, zwei Finger Zoom/Pan | Bedienung | Verbindlich (Auftrag 2026-10-26) |
| D-040 | `wl-signals.json` bleibt als Reserve, keine Anzeige | Daten | Verbindlich (Auftrag 2026-10-27) |

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
| **Konsequenz** | Die Landing-Seite und das Portfolio umfassen genau die registrierten Systeme. Seit D-037 (2026-10-26) ist die Registrierung auch die Freigabeliste für das Dashboard (zuvor kein Zugriffsschutz, INC-07, OP-10). Die README nennt seit BP-028 alle registrierten Systeme (INC-01 behoben). |

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
| **Status** | Verbindlich (Ist-Zustand, vom Auftraggeber bestätigt 2026-10-27, OP-12) |
| **Entscheidung** | Die Portfolio-Equity ist die Summe der Equity-Werte aller geladenen Systeme auf einer gemeinsamen Datumsachse. Fehlende Tage werden vorwärts aufgefüllt, Tage vor dem Systemstart mit dem ersten Wert. Eine Equal-Weight-Alternative (`displayEquity`) wird berechnet, aber über `useDisplayEquity = false` nicht verwendet. |
| **Begründung** | Die Gewichtung der Systeme legt der Auftraggeber in Wealth-Lab 9 fest; das Dashboard summiert nur (Auftraggeber 2026-10-27). |
| **Quelle** | `equity-overview-chart.js` (`aggregatePortfolioSeries`), `kpi-config.js` |
| **Konsequenz** | Jedes System geht mit seinem eigenen Kapital (derzeit je 100 000) ein. Ein später startendes System trägt vor seinem Start sein Startkapital bei. Verbindlich ist die Rohsumme; `useDisplayEquity` bleibt `false`. |

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
| **Status** | Verbindlich (Ist-Zustand, vom Auftraggeber bestätigt 2026-10-27, OP-06) |
| **Entscheidung** | Dargestellte Equity-Beträge werden durch `equityDivisor` (50) geteilt, das Starting Capital im Dashboard durch `startingCapitalDivisor` (50); bis 2026-10-27 je 100, vom Auftraggeber geändert. Berechnungen und KPIs verwenden unskalierte Werte. |
| **Begründung** | Im Dashboard sollen keine Millionenbeträge erscheinen (Auftraggeber 2026-10-27). Code-Kommentar: KPIs rechnen auf Rohwerten, nur die Anzeige wird skaliert; `startingCapitalDivisor` wird im Portfolio-Chart bewusst nicht angewendet. |
| **Quelle** | `kpi-config.js`, `main.js`, `equity-overview-chart.js`, `equity-system-chart.js` |
| **Konsequenz** | Angezeigte Beträge entsprechen nicht den Rohwerten in den JSON-Dateien. Die Divisoren dürfen nur gemeinsam mit dieser Entscheidung geändert werden. |

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
| **Status** | Verbindlich (Ist-Zustand, vom Auftraggeber bestätigt 2026-10-27, OP-01, OP-02) |
| **Entscheidung** | Die JSON-Daten werden in Wealth-Lab 9 über den Strategy Monitor exportiert und über die Git-CLI mit der Nachricht `Auto update trading dashboard <Zeitstempel>` auf `main` committet und nach GitHub gepusht. Cloudflare übernimmt den Stand aus GitHub und liefert die Seite aus. |
| **Begründung** | Angabe des Auftraggebers (2026-10-27) |
| **Quelle** | Git-Historie (1 400 Commits, Muster seit mindestens 2026-10-22 mehrfach täglich) |
| **Konsequenz** | Der Code muss mit jedem Exportstand lauffähig bleiben (siehe D-007, D-009). Händische Änderungen an `systems/**` können durch den nächsten Export überschrieben werden. Der Push umfasst den gesamten lokalen `main`; lokale, noch nicht gepushte Commits gehen beim nächsten Export mit online. |

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
| **Status** | Ist-Zustand; **Dashboard-Teil ersetzt** durch D-029 am 2026-10-26 (Grund: Seitenübergang, siehe D-029). Der Landing-Teil gilt unverändert. |
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
| **Konsequenz** | D-025: `motion.js` kommt in beide Skriptlisten (nach `kpi-config.js`). D-019: ein zusätzliches, geteiltes Stylesheet `css/motion.css` nur für Motion. D-006 und D-016 bleiben unverändert. Der Vorschlag 2 (Kachel-Choreografie, Sparklines, Seitenübergang) ist mit D-028 beauftragt, der Vorschlag 3 mit D-027. |

## D-027 – Atmosphäre und Mikro-Interaktionen

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26, Vorschlag 3 "Lebendige Atmosphäre und modernes Dashboard", Arbeitspaket BP-014) |
| **Entscheidung** | Die Regeln aus D-026 gelten unverändert (Klasse `wl-motion`, statischer Endzustand, keine Bibliothek). Zusätzlich: 1. **Hintergrund-Drift:** Die vorhandenen unscharfen Flächen `body::before/::after` driften langsam (50 bis 65 s, `alternate`) allein über `transform`; kein zusätzlicher Filter. 2. **Regime-Tint (nur Landing):** Der letzte Zustand der Composite-Serie setzt `data-wl-regime` an `<html>`; eine feste Ebene `.wl-ambient` färbt den Hintergrund weich über (2,4 s). Zuordnung: `StrongRiskOn` stark grün, `RiskOn` schwach grün, `Caution` schwach bernsteinfarben, `RiskOff` rot, `Neutral` keine Färbung. Rein visuell, keine Handelsaussage. 3. Drift und Regime-Tint nur ab 701 px Breite. 4. **Tab-Indikator (Dashboard):** Eine gleitende Markierung folgt dem aktiven Tab, nur ab 769 px (im Hamburger-Menü entfällt sie). 5. **Heatmap Monthly Returns:** Zellhintergrund mit Intensität proportional zum Betrag der Monatsrendite, skaliert auf das 95. Perzentil der Beträge; Klassen `positive`/`negative` und Zahlenwerte bleiben. Die Heatmap ist statisch und gilt auch bei Reduced-Motion; nur das gestaffelte Einblenden ist Motion. 6. **Positions:** Die ersten 20 Zeilen blenden gestaffelt ein, beim Öffnen des Tabs und nach jedem Sortieren. 7. `panelFadeIn` wird von 800 ms auf 350 ms verkürzt. |
| **Begründung** | Auftrag des Auftraggebers. Die Begrenzung auf 20 Zeilen folgt aus bis zu 1 609 Positionen je System; die Begrenzung ab 701 bzw. 769 px aus Leistung und Platz auf Mobilgeräten. |
| **Abweichung vom Vorschlag** | a) `Caution` erhält eine schwache Färbung (im Vorschlag "neutral sonst"), weil der aktuelle Zustand `Caution` ist und der Effekt sonst nicht sichtbar wäre. b) Das Sortieren blendet die Zeilen neu ein statt sie umzuordnen (FLIP); Positionen haben keinen eindeutigen Schlüssel. |
| **Quelle** | Auftrag 2026-10-26 |
| **Konsequenz** | D-019: `styles.css` erhält die Heatmap-Regeln und die verkürzte `panelFadeIn`-Dauer. `motion.js` erhält `setRegime` und `initTabIndicator`; `motion.css` die zugehörigen Regeln. Der Zusammenhang Zeitraum/Regime auf der Landing-Seite (INC-09) bleibt unverändert. |

## D-028 – Kachel-Choreografie, Sparklines und Seitenübergang

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26, Vorschlag 2 "Choreografie der Landing-Seite und Seitenübergang", Arbeitspaket BP-015) |
| **Entscheidung** | Die Regeln aus D-026 gelten unverändert. Zusätzlich: 1. **Gestaffelter Eintritt:** Systemkacheln steigen beim ersten Sichtbarwerden auf (`IntersectionObserver`, 60 ms Versatz je gleichzeitig sichtbar werdender Kachel); oberhalb des Falzes nach dem Loader. Ohne `IntersectionObserver` erscheinen sie sofort. 2. **Sparkline je Kachel:** Kleine, logarithmische Equity-Kurve (höchstens ca. 120 Punkte). Die Daten stammen aus dem bereits geladenen Portfolio-Datensatz (`window._wlSystemEquitySeries`, gesetzt in `equity-overview-chart.js`); es gibt **keinen** zusätzlichen Abruf. Fehlen die Daten, entfällt die Sparkline, die Kachel bleibt. Die Sparkline ist Inhalt und erscheint auch bei Reduced-Motion; nur das Einzeichnen ist Motion. 3. **Seitenübergang:** Cross-Document View Transition (`@view-transition { navigation: auto; }`) zwischen Landing und Dashboard in beide Richtungen als weiche Überblendung; nur bei `prefers-reduced-motion: no-preference`. Browser ohne Unterstützung navigieren wie bisher. |
| **Begründung** | Auftrag des Auftraggebers. Kein zweiter Abruf, um die Ladezeit nicht zu erhöhen (D-010 lädt ohne Cache). |
| **Abweichung vom Vorschlag** | a) **Kein Puls** eines Kennzahl-Farbpunkts: ein solcher Punkt existiert nicht; der Auftraggeber hat am 2026-10-26 entschieden, ihn wegzulassen. b) **Loader-Fade:** bereits vorhanden (Übergang von `opacity` und `visibility` in `landing.css` und `styles.css`); keine Änderung. c) **Kein gemeinsames Titel-Element** im Seitenübergang (`view-transition-name`): Der Dashboard-Titel wird erst nach dem Laden der Daten gesetzt und ist beim ersten Bild leer; deshalb nur eine Überblendung der ganzen Seite. |
| **Quelle** | Auftrag 2026-10-26; Rückfrage zum Puls am 2026-10-26 |
| **Konsequenz** | `equity-overview-chart.js` stellt die Serien bereit (analog `window._wlPortfolioTimeRange`). `landing.js` hängt die Sparklines nach dem gemeinsamen Laden an. `motion.js` erhält `revealOnScroll`, `motion.css` die Kachel- und Übergangsregeln; `landing.css` die Darstellung der Sparkline. Der Tilt-Effekt und der rotierende Rand bleiben unverändert; während des Aufstiegs (600 ms) wirkt der Tilt nicht. Für den Übergang zum Dashboard ist D-029 nötig. |

## D-029 – Dashboard lädt Skripte dynamisch und nacheinander

| | |
|---|---|
| **Status** | Verbindlich (2026-10-26); ersetzt den Dashboard-Teil von D-025 |
| **Entscheidung** | `dashboard/index.html` lädt seine sechs Skripte nicht mehr über statische `<script src>`-Tags, sondern über ein Inline-Skript, das sie nacheinander anhängt (je nächstes im `onload`), im selben Muster wie `index.html`. Reihenfolge unverändert: `monthly-returns.js` → `kpi-config.js` → `motion.js` → `equity-system-chart.js` → `main.js` → `dashboard-loader.js`. Kein Cache-Buster (wie bisher im Dashboard). Ladefehler werden mit `console.error` gemeldet und stoppen die Kette (wie auf der Landing-Seite). |
| **Begründung** | Gemessen am 2026-10-26 (Chrome headless, je Navigation Landing → Dashboard): Mit statischen Skripten rendert das Dashboard oft schon während des Parsens zum ersten Mal (`readyState: loading`, 25 bis 600 ms), und Chrome bricht den Seitenübergang mit "ViewTransition opt-in disabled" ab (Erfolg 2 von 5). Varianten: `defer` 1 von 5, `@view-transition` ohne `@media` 1 von 5, Render-Blocking bis Body-Ende (`<link rel="expect" blocking="render">`) 15 von 16, dynamisches Laden 13 von 13. Gewählt wurde die zuverlässigste Variante, die zudem dem bestehenden Muster der Landing-Seite entspricht. |
| **Quelle** | Messungen im Rahmen von BP-015 |
| **Konsequenz** | Die Skripte werden seriell statt parallel geladen; das Dashboard startet geringfügig später (wie die Landing-Seite). `dashboard-loader.js` bleibt zuletzt und startet beim Laden. Neue Dashboard-Skripte kommen in die Liste im Inline-Skript (`agents.md` 6.2). |

## D-030 – Loader als animierter Mini-Chart (reines CSS)

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26, Arbeitspaket BP-016). **Animationstechnik ersetzt** durch D-032 am 2026-10-26: Die Linie wird aufgedeckt statt über `stroke-dashoffset` gezeichnet; der Titel-Schimmer ist durch ein Atmen über `opacity` ersetzt. Gestaltung im Übrigen, Ausnahme zu D-026 und Regeln 1 bis 3 gelten weiter. |
| **Entscheidung** | Der Spinner im Loader beider Seiten wird durch ein Inline-SVG `.page-loader-chart` ersetzt: Raster, gestaffelt wachsende Volumenbalken, eine Equity-Linie, die sich in einer Schleife (2,4 s) einzeichnet, Flächenverlauf, pulsierender Punkt an der Spitze. Der Titel erhält einen laufenden Schimmer, die Karte schrumpft beim Ausblenden leicht. Die Regeln stehen in `css/motion.css`. |
| **Ausnahme zu D-026** | Der Loader ist vor `motion.js` sichtbar. Seine Animation hängt deshalb **nicht** an `html.wl-motion` und nicht am Loader-Ende, sondern läuft ab dem ersten Bild. Reduced-Motion wird über `@media (prefers-reduced-motion: reduce)` behandelt: statischer, vollständig gezeichneter Chart und normaler Titel. |
| **Regeln** | 1. Reines CSS, kein JavaScript; `landing.js` und `dashboard-loader.js` bleiben unverändert (nur die Klasse `hidden` steuert das Ausblenden). 2. Der statische Zustand ist der vollständige Chart. 3. Ist der Loader ausgeblendet, werden die Endlos-Animationen pausiert, damit sie keine Last erzeugen. |
| **Begründung** | Auftrag des Auftraggebers ("Loader aufpeppen"). Thematisch passend zur Anwendung (Equity-Kurve statt neutralem Spinner). |
| **Quelle** | Auftrag 2026-10-26 |
| **Konsequenz** | Markup in `index.html` und `dashboard/index.html` geändert (gleiches SVG). Die nicht mehr verwendeten Regeln `.page-loader-spinner` und `@keyframes page-loader-spin` werden aus `landing.css` und `styles.css` entfernt. |

## D-031 – Visuelles Theme "Aurora" (Future State), umschaltbar

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26; Farbwelt "Aurora" und Umschaltbarkeit vom Auftraggeber gewählt; Arbeitspakete BP-017 bis BP-019) |
| **Entscheidung** | 1. **Schalter:** `js/theme.js` setzt `<html data-theme="aurora">` oder `"classic"` aus der Konstanten `WL_VISUAL_THEME`. Die Datei wird **synchron im `<head>`** beider Seiten geladen, damit das Theme ab dem ersten Bild gilt. 2. **Stylesheet:** `css/theme-aurora.css` enthält alle Aurora-Regeln, ausschliesslich unter `html[data-theme="aurora"]`. 3. **Charts:** SVG-Elemente erhalten Klassen (`wl-c-*`); die bisherigen Farben bleiben als Präsentationsattribute im Markup (= classic) und werden im Aurora-Theme per CSS überschrieben. Zusätzliche Elemente (Glow-Pfade, Sternenfeld, HUD-Eckmarken, Orbit-Ring, Plakette) tragen `visibility="hidden"` und werden nur im Aurora-Theme sichtbar. 4. **Palette:** Nachtblau `#03060b` bis `#071420`, Cyan `#58c4ff`, Teal `#2de2c4`, Grün `#6ee7a8`, Rosé `#ff6fa3` für Drawdown. KPI-Ampelfarben (D-016) und Heatmap-Farben bleiben. |
| **Regeln** | a) Mit `classic` ist die Darstellung pixelgleich zum Stand vor D-031. b) Glow ohne SVG-Filter (zusätzliche breite Pfade mit niedriger Deckkraft), weil die Charts bei Zoom neu zeichnen. c) Kein zusätzliches `backdrop-filter`. d) Sternenfeld mit festem Zufalls-Seed (beim Neuzeichnen identisch); höchstens 8 funkelnde Sterne je Chart, aus bei Reduced-Motion. e) Keine externe Schrift (D-001). |
| **Begründung** | Auftrag "Future State, galaktischer". Synchroner Head-Schalter, weil `kpi-config.js` erst nach dem ersten Bild geladen wird (D-025, D-029) und sonst kurz das alte Design erschiene. |
| **Verhältnis zu D-025 / D-029** | Ergänzung, keine Ersetzung: Die Skriptlisten bleiben; `theme.js` kommt zusätzlich in den Head. D-029 hat gezeigt, dass Skripte im Body den Seitenübergang stören; ein Head-Skript läuft vor dem Parsen des Body und muss im Rahmen von BP-017 gegen den Seitenübergang geprüft werden. |
| **Quelle** | Auftrag und Rückfragen 2026-10-26 |
| **Konsequenz** | D-019: drittes, themenbezogenes Stylesheet. Neue Chart-Elemente müssen Klassen nach dem Muster `wl-c-*` erhalten, damit das Theme sie erfasst. |

## D-032 – Loader-Animation nur mit Compositor-Eigenschaften

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26 "Loader läuft nicht flüssig", Arbeitspaket BP-020); ersetzt die Animationstechnik von D-030 |
| **Entscheidung** | Der Loader animiert ausschliesslich `transform` und `opacity`. Die Linie wird nicht mehr über `stroke-dashoffset` gezeichnet, sondern von links nach rechts **aufgedeckt**: zwei verschachtelte HTML-Ebenen verschieben sich gegenläufig per `translateX` (äussere Ebene mit `overflow: hidden`), der Inhalt bleibt dabei stehen. Der Titel-Schimmer (`background-position` mit `background-clip: text`) wird durch ein **"Atmen" des Titels** über `opacity` ersetzt. Der Glow der Linie ist ein breiter, halbtransparenter Strich (`loader-line-glow`) statt `filter: drop-shadow`. Balken, Fläche, Spitze und Puls bleiben wie in D-030. Der Chart besteht aus drei übereinanderliegenden SVG-Ebenen (Raster/Balken, Fläche/Linie, Spitze/Puls). |
| **Verworfene Varianten** | a) Lichtbahn als `::after`-Ebene mit `mix-blend-mode: overlay`: hellt auch den Kartenhintergrund auf und erscheint als sichtbarer Kasten; ein Schimmer nur auf der Schrift ist auf dem Compositor nicht ohne doppelten Text möglich. b) `drop-shadow` auf der Linie in der eigenen Compositor-Ebene: zeigte beim Aufdecken einen hellen Rahmen um die Linie. |
| **Begründung** | Messung 2026-10-26 (Chrome headless mit GPU): Auf der Landing-Seite blockiert ein einzelner Task den Main-Thread fast die gesamte Loader-Zeit (1,26 bis 1,48 s bei normaler CPU, 19,8 bis 24,9 s bei 4-fach gedrosselter CPU; Ursache siehe INC-21). Animationen auf dem Main-Thread stehen dann still. Screencast-Bilder zeigen: Die Linie bleibt halb gezeichnet stehen, während Balken und Fläche (Compositor) weiterlaufen. Compositor-Animationen laufen unabhängig vom Main-Thread. |
| **Quelle** | Messungen im Rahmen von BP-020 |
| **Konsequenz** | Markup des Loaders in beiden Seiten geändert; Klassennamen (`loader-line`, `loader-area`, `loader-bars`, `loader-tip`, `loader-pulse`, `loader-grid`) bleiben, damit `theme-aurora.css` weiter greift. Die eigentliche Ursache der Blockade (INC-21) ist davon unberührt. |

## D-033 – Aurora auf den System-Detailseiten

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26: "die einzelnen Systeme wirken noch sehr statisch"; Auswahl des Auftraggebers: Detailseiten, Regime-Färbung, Hero-Kurve, lebendige Flächen; Arbeitspaket BP-021) |
| **Entscheidung** | 1. **Regime-Färbung:** `dashboard-loader.js` lädt nach dem erfolgreichen Start zusätzlich `systems/risk-regime/wl-regime-composite.json` (nicht blockierend) und übergibt den letzten Zustand an `WL_MOTION.setRegime` (D-027). Nur im Theme `aurora` und nur bei aktiver Motion; sonst kein Abruf. 2. **Hero-Kurve:** `main.js` fügt im Theme `aurora` oben im Overview ein Element `#systemHero` ein; `renderSystemHeroChart` in `equity-system-chart.js` zeichnet eine logarithmische Equity-Linie mit Verlauf, Glow, Fläche, Sternenfeld, pulsierendem Endpunkt, Startdatum und Profit-%. Sie zeichnet sich einmal ein; nach dem Ende der Einlaufanimation werden die Motion-Klassen entfernt, damit ein Tab-Wechsel sie nicht wiederholt. Bei Containerbreite unter 600 px nutzt sie einen höheren Koordinatenraum (600 × 210 statt 1000 × 170) mit grösserer Schrift. 3. **Lebendige Flächen:** reines CSS unter `html[data-theme="aurora"].wl-motion`: langsam wanderndes Aurora-Lichtband im Kopfbereich und in den Panel-Köpfen, gestaffelter Aufstieg der Overview-Karten, gestaffeltes Einblenden der Tabellenzeilen (Overview, Metrics), Glow beim Überfahren. Der Kopfbereich beschneidet das Band mit `overflow-x: clip`, damit die Seite nicht horizontal überläuft und das Mobile-Menü weiter nach unten ausklappen kann. |
| **Regeln** | a) `classic` bleibt unverändert: kein zusätzlicher Abruf, kein zusätzliches DOM-Element, keine Regel ohne Aurora-Bezug. b) Nur `transform` und `opacity` animieren (D-032). c) Reduced-Motion: keine Färbung, keine Lichtbänder, keine Staffelung; die Hero-Kurve erscheint statisch. |
| **Begründung** | Auftrag. Das Laden gehört nach D-006 in den Loader, das Rendern nach `main.js`. |
| **Quelle** | Auftrag und Rückfrage 2026-10-26 |
| **Konsequenz** | Zusätzlicher Abruf von ca. 150 KB je Detailseiten-Aufruf im Theme `aurora`. Das Tabellen-Einblenden wiederholt sich beim erneuten Öffnen eines Tabs (wie BP-014 bei den Positionen). |

## D-034 – Risk-Regime-Panel der Landing-Seite per Schalter ausblendbar

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26: "hide im Dashboard den Risk-Regime Composite Score Chart, steuerbar über die kpi-config.js"; Arbeitspaket BP-022) |
| **Entscheidung** | Neuer Schalter `WL_KPI_CONFIG.display.showRiskRegimePanel` in `js/kpi-config.js`, Standard `false`. Bei `false` blendet `landing.js` den Bereich `.regime-engine-wrap` aus (`hidden`) und rendert das Panel nicht. Die Regime-Färbung des Hintergrunds (D-027) bleibt: Dafür lädt `initRegimeTint` in `regime-engine-chart.js` nur die Composite-Datei und übergibt den letzten Zustand an `WL_MOTION.setRegime`. Bei `true` verhält sich die Seite wie bisher. |
| **Begründung** | Auftrag. Die Regime-Färbung ist ein eigenständiger Effekt und wurde nicht abgewählt. |
| **Quelle** | Auftrag 2026-10-26 |
| **Konsequenz** | Ergänzt D-018 (das Panel ist jetzt optional) und D-016/9.1 (neuer Anzeigeschalter). Die Referenzbilder `landing_top` ändern sich mit dem Standardwert `false` gewollt; für den Pixelvergleich von `classic` gilt `showRiskRegimePanel: true`. |

## D-035 – Offene Positionen je Datum fortlaufend zählen

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26 nach Mobile-Prüfung; beantwortet OP-13; Arbeitspaket BP-023) |
| **Entscheidung** | `countOpenPositionsOnDate` (je Datum alle Positionen aller Systeme) wird durch `createOpenPositionCounter` ersetzt: Einstiegs- und Ausstiegszeitpunkte aller Systeme werden einmal sortiert; für die aufsteigende Datumsachse zählen zwei Zeiger fortlaufend `Einstiege ≤ D` minus `Ausstiege ≤ D`. |
| **Regeln** | Das Ergebnis ist identisch zur bisherigen Definition: offen am Datum D, wenn `entryDate ≤ D` und (`isOpen` oder kein `exitDate` oder `"open"` oder `exitDate > D`). Positionen mit ungültigem Einstieg, ungültigem Ausstieg oder Ausstieg nicht nach dem Einstieg zählen wie bisher nie. |
| **Begründung** | INC-21: auf Smartphone-ähnlicher CPU 10 bis 23 s Ladezeit der Landing-Seite. Aufwand sinkt von Datumswerte × Positionen auf Sortieren plus einmaliges Durchlaufen. |
| **Quelle** | Mobile-Prüfung 2026-10-26, Auftrag |
| **Konsequenz** | Keine sichtbare Änderung; Nachweis über identische Tooltip-Werte und KPIs. |

## D-036 – Mobile Darstellung: Grid-Spalte begrenzen, Charts mit schmalem Koordinatenraum

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26 nach Mobile-Prüfung; Arbeitspaket BP-024) |
| **Entscheidung** | 1. `.app` erhält `grid-template-columns: minmax(0, 1fr)`, damit die Grid-Spalte nicht auf die Mindestbreite breiter Tabellen wächst (INC-22). 2. Portfolio-Chart und System-Chart verwenden bei schmalem Container einen eigenen, höheren Koordinatenraum (statt `1000 × 340` zu verkleinern) mit grösserer Achsen- und Tooltip-Schrift, angepassten Rändern und weniger Jahreslabels (INC-23). Die Geometrie wird bei jedem Rendern aus der aktuellen Containerbreite bestimmt; Zoom- und Touch-Umrechnung nutzen dieselbe Geometrie. |
| **Regeln** | Auf Desktop-Breiten bleibt die Darstellung unverändert (Referenzbilder pixelgleich). Werte und Interaktion unverändert. |
| **Begründung** | Mobile-Prüfung: Seite bis 422 px breit bei 390-px-Gerät (Header-Buttons abgeschnitten); Achsentexte 2,7 bis 4 px, Tooltip-Texte 3,5 bis 4,5 px. |
| **Quelle** | Mobile-Prüfung 2026-10-26, Auftrag |
| **Konsequenz** | Das Portfolio-Chart setzt seine `viewBox` selbst; die Angabe in `index.html` gilt nur bis zum ersten Rendern. Die bestehende Mobile-Regel `#equityChart text { font-size: 11px; }` in `styles.css` (sie überschrieb die Schriftgrössen des System-Charts) entfällt. Das System-Chart zeichnet beim `ResizeObserver` nur noch bei geänderter Breite neu; sonst würde der Wechsel vom schmalen Raum (versteckter Tab, Breite 0) in den breiten Raum über die Höhenänderung ein zweites Rendern auslösen und die Einlaufanimation abbrechen. Touch-Wischen über Charts (INC-24) und kleine Tippflächen (INC-25) sind nicht Teil dieser Entscheidung. |

## D-037 – Dashboard öffnet nur registrierte Systeme

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26; beantwortet OP-10; Arbeitspaket BP-025) |
| **Entscheidung** | `dashboard-loader.js` prüft nach der Slug-Prüfung (D-008), ob der Slug in `window.SYSTEMS` enthalten ist. Nicht registrierte Systeme werden nicht geladen; es erscheint die Meldung "Unknown system …". Dafür lädt die Detailseite `js/systems.js` als erstes Skript ihrer Liste (Ergänzung zu D-029). |
| **Begründung** | INC-07: Nicht registrierte Ordner (z. B. veraltete Systeme) waren per URL aufrufbar. Damit wird `systems.js` (D-005) zur alleinigen Freigabeliste. |
| **Konsequenz** | Ein neues System ist erst nach dem Eintrag in `systems.js` auch auf der Detailseite erreichbar (README-Ablauf unverändert). |

## D-038 – Regime-Panel folgt Zoom und Pan des Portfolio-Charts

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26; Arbeitspaket BP-026) |
| **Entscheidung** | Nach jedem Zoom-, Pan- oder Reset-Schritt sendet das Portfolio-Chart das Ereignis `wl:portfolio-range` mit dem sichtbaren Zeitraum. Das Regime-Panel zeichnet sich daraufhin für diesen Zeitraum neu (gebündelt je Bild, ohne Einlaufanimation). Die Landing-Seite wartet beim Laden auf das Panel, bevor der Loader verschwindet. Gilt nur, wenn das Panel eingeblendet ist (D-034). |
| **Begründung** | INC-09: Bei Zoom liefen die Zeitachsen von Portfolio-Chart und Panel auseinander; der Loader verschwand vor dem Panel. |
| **Konsequenz** | Lose Kopplung über ein DOM-Ereignis; keines der beiden Module ruft das andere direkt auf. |

## D-039 – Touch-Gesten der Charts

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-26, Auswahl des Auftraggebers; Arbeitspaket BP-027) |
| **Entscheidung** | Portfolio-Chart und System-Chart: Ein Finger führt den Tooltip mit (Antippen und waagrechtes Wischen). Portfolio-Chart: Zwei Finger zoomen (Pinch) und verschieben den Ausschnitt (Bewegung des Mittelpunkts); das bisherige Verschieben mit einem Finger entfällt. Die Overlays erhalten `touch-action: pan-y`, damit senkrechtes Scrollen der Seite möglich bleibt. |
| **Begründung** | INC-24: Wischen über die Charts scrollte die Seite, statt den Tooltip mitzuführen. |
| **Konsequenz** | Desktop (Maus, Mausrad) unverändert. |

## D-040 – `wl-signals.json` bleibt als Reserve, keine Anzeige

| | |
|---|---|
| **Status** | Verbindlich (Auftrag vom 2026-10-27; beantwortet OP-05; Arbeitspaket BP-028) |
| **Entscheidung** | `wl-signals.json` bleibt Teil der Vier-Dateien-Konvention (D-004) und wird weiterhin geladen, aber nicht angezeigt. Eine Anzeige der aktuellen Signale ist für später vorgesehen und nicht beauftragt. |
| **Begründung** | Der Auftraggeber möchte die Datei für eine spätere Anzeige der jeweils neuen Signale behalten. |
| **Konsequenz** | INC-12 ist akzeptiert; Laden und `signalCount` bleiben unverändert. Die README nennt die Datei als Reserve. |
