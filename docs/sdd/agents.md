# agents.md – Arbeitsregeln für KI-Agenten und Entwickler

| Eigenschaft | Wert |
|---|---|
| Dokumenttyp | SDD – Arbeitsregeln |
| Modus | INIT (Reverse-Dokumentation) |
| Stand | 2026-10-26 |
| Bezug | `project_plan.md`, `decisions.md`, `build_plan.md` |

Dieses Dokument enthält nur Regeln, die aus dem Projekt selbst hervorgehen (README, Code-Konventionen, Git-Verhalten) oder aus dem Auftrag. Es definiert keine zusätzlichen Technologien oder Prozesse. Regeln mit **[Ist]** sind aus dem vorhandenen Code abgeleitet; sie gelten, solange der Auftraggeber sie nicht ändert.

Rangfolge bei Konflikten: `project_plan.md` → `decisions.md` → `build_plan.md` → `agents.md` → Code. Diese Datei darf fachliche und architektonische Vorgaben nicht überschreiben.

---

## 1. Grundhaltung

1. Vor jeder Änderung `project_plan.md`, `decisions.md` und `build_plan.md` lesen, mindestens die betroffenen Kapitel.
2. Nur den beauftragten Scope bearbeiten. Nicht erfinden, nicht ausweiten.
3. Widersprüche zwischen Dokumenten und Code benennen, nicht eigenmächtig auflösen.
4. Entscheidungen mit Status "Ist-Zustand" sind Arbeitsgrundlage, aber keine Freigabe für Änderungen am Verhalten.
5. Änderungskandidaten aus `build_plan.md` Kapitel 4 nur nach ausdrücklicher Entscheidung umsetzen.

---

## 2. Technische Leitplanken

| Regel | Quelle |
|---|---|
| Nur HTML, CSS, Vanilla-JavaScript. Keine Frameworks, keine UI- oder Chart-Bibliotheken, keine npm-Abhängigkeiten, keine Build-Tools, kein Bundler, kein Transpiler. | D-001 |
| Kein Backend, keine API, keine Datenbank. | D-002 |
| Kein zweites Dashboard pro System; Unterschiede nur über Daten. | D-003 |
| Kein Root-Ordner `data/`, kein projektindividuelles `config.json`. | D-004 |
| Neue Charts als Inline-SVG im bestehenden Stil. | D-011 |
| Berechnungen im Browser; JSON-Dateien unter `systems/**` nicht von Hand ändern (werden vom Export überschrieben). | D-002, D-023 |
| Keine Tests, kein Testframework, keine CI ergänzen, ausser ausdrücklich beauftragt. | D-024 |

---

## 3. Dateistruktur und Verantwortlichkeiten

| Pfad | Zweck | Nicht hineingehören |
|---|---|---|
| `index.html`, `css/landing.css`, `js/landing.js`, `js/equity-overview-chart.js`, `js/regime-engine-chart.js` | Landing-Seite | Dashboard-Rendering |
| `dashboard/index.html`, `css/styles.css`, `js/dashboard-loader.js`, `js/main.js`, `js/monthly-returns.js`, `js/equity-system-chart.js` | Dashboard | Landing-Logik |
| `js/systems.js` | Systemregister (nur `id`, `dataPath`) | Berechnungen, Texte |
| `js/kpi-config.js` | Schwellen, Farben, Anzeigeschalter | Render-Code |
| `js/motion.js`, `css/motion.css` | Einlaufanimationen (D-026) | Berechnungen, Datenzugriff |
| `systems/<slug>/` | Systemdaten (vier Dateien) | zusätzliche Dateien ohne Entscheidung (Ausnahme im Ist: `FlagFile.txt`, OP-04) |
| `systems/risk-regime/` | Regime-Daten | Handelssystem-Daten |
| `docs/sdd/` | SDD-Dokumente | Quellcode |

Regeln:

- Die Trennung Laden (`dashboard-loader.js`) und Rendering (`main.js`) bleibt. Der Vertrag `bootDashboard({ systemId, currentState, equity, positions, signals })` darf nur über CHANGE geändert werden (D-006).
- Schwellenwerte und Farben für Kennzahlen werden nur in `kpi-config.js` geändert (D-016).
- Anzeige-Divisoren nur gemeinsam mit D-015 ändern.

---

## 4. Neues System hinzufügen (verbindlich laut README, D-004, D-005)

1. Ordner `systems/<slug>/` anlegen. Der Slug besteht nur aus `a-z`, `0-9`, `-` (D-008).
2. Genau vier Dateien ablegen: `wl-current-state.json`, `wl-equity.json`, `wl-positions.json`, `wl-signals.json`.
3. In `js/systems.js` den Eintrag `{ id: "<slug>", dataPath: "./systems/<slug>" }` ergänzen.
4. Keine weitere Codeänderung: Kachel, Portfolio-Aggregation und Dashboard laden datengetrieben.

Prüfen nach dem Hinzufügen: Kachel erscheint, Portfolio-Statuszeile zählt hoch (`x/y systems included`), Dashboard über `?system=<slug>` öffnet alle fünf Tabs.

---

## 5. Daten- und Schnittstellenregeln

- Das Format der vier Dateien ist ein Vertrag mit dem externen Export (`project_plan.md` Kapitel 5). Felder nicht umbenennen oder entfernen.
- Neue Datenfelder werden **mit Fallback** gelesen (`safeGet`, "-" bei fehlendem Wert) (D-007).
- Position gilt als offen bei `isOpen === true`, leerem/`null` `exitDate` oder `"open"`.
- Bare `NaN` kann in den Exportdateien vorkommen (D-009). Neuer Ladecode muss damit umgehen oder die Lücke dokumentieren (INC-08).
- `lastUpdate` hat das Format `YYYY-MM-DD HH:mm:ss`.
- Alle `fetch`-Aufrufe verwenden `cache: "no-store"` (D-010).
- Datenpfade: Landing `./systems/<slug>` (aus Register), Dashboard `../systems/<slug>` (fest).

---

## 6. Code-Konventionen **[Ist]**

### 6.1 JavaScript

- Ältere Dateien (`main.js`, `monthly-returns.js`) definieren **globale Funktionen**; Seitenmodule (`landing.js`, `dashboard-loader.js`) und Chart-Module sind **IIFE**. Chart-Module hängen ihre API an `window` (`window.initEquityOverviewChart`, …). Neue Funktionen im Stil der jeweiligen Datei ergänzen.
- Namen: `camelCase` für Funktionen und Variablen, `UPPER_SNAKE_CASE` für Konstanten (`SVG_WIDTH`, `LOADER_MIN_VISIBLE_MS`), DOM-IDs in `camelCase`, CSS-Klassen in `kebab-case`, Dateinamen in `kebab-case`.
- Globale Schnittstellen: `window.SYSTEMS`, `window.WL_KPI_CONFIG`, `window.getKpiPresentation`, `window.bootDashboard`, `window.renderError`, `window.initEquityOverviewChart`, `window.initRegimeEnginePanel`, `window._wlPortfolioTimeRange`, `window.mountSystemEquityChart`, `window.renderSystemEquityChart`. Nicht umbenennen.
- Daten, die in HTML gelangen, mit `escapeHtml` maskieren (Q-05). Neue `innerHTML`-Stellen mit Datenwerten nicht ohne Maskierung ergänzen (INC-16 ist kein Vorbild).
- Zahlen- und Datumsformatierung über die vorhandenen Funktionen (`formatNumber`, `formatPercent`, `formatDate`, `formatDateLong`) beziehungsweise dieselbe `Intl`-Konfiguration (`en-GB`, `useGrouping: false`) (D-022).
- Asynchrones Laden mit `fetch` und `async`/`await`; Teilausfälle mit `Promise.allSettled` abfangen, wo ein Teilergebnis genügt (Landing). `Promise.all` nur, wo alle Dateien zwingend sind (Dashboard).
- Event-Listener auf wiederverwendeten Elementen mit `dataset.bound`-Marker beziehungsweise `AbortController` absichern, wie im Ist-Code.
- Kommentare knapp, überwiegend Englisch.

### 6.2 Skript-Reihenfolge (D-025)

- Landing: `systems.js` → `kpi-config.js` → `motion.js` → `equity-overview-chart.js` → `regime-engine-chart.js` → `landing.js`, geladen über das Inline-Skript in `index.html`. Neue Skripte in diese Liste eintragen.
- Dashboard: `monthly-returns.js` → `kpi-config.js` → `motion.js` → `equity-system-chart.js` → `main.js` → `dashboard-loader.js`, geladen über das Inline-Skript in `dashboard/index.html` (D-029). Keine statischen `<script src>`-Tags im Dashboard ergänzen; sie verhindern den Seitenübergang. `dashboard-loader.js` bleibt zuletzt, da es beim Laden sofort startet.

### 6.2a Motion (D-026)

- Animationen nur über die Klassen `wl-draw-line`, `wl-fade-in`, `wl-trophy-pop` und `WL_MOTION.countUp`. Keine Animationsbibliothek.
- Der statische Zustand ist der Endzustand. CSS animiert nur den Startzustand (`from`, `backwards`); eine neue Animation darf ohne `html.wl-motion` nichts verstecken.
- Einlauf nur beim ersten Rendern. Neuzeichnen bei Zoom oder Resize erzeugt die Elemente ohne Motion-Klassen.
- Hochzählen verändert den angezeigten Endtext nicht; Formatierung bleibt Sache der bestehenden Formatierfunktionen.
- Loader (D-032): nur `transform` und `opacity` animieren, keine Filter auf animierten Ebenen. Der Loader läuft, während der Main-Thread lädt; Main-Thread-Eigenschaften wie `stroke-dashoffset` oder `background-position` frieren dann ein.

### 6.2b Visuelles Theme (D-031)

- Theme umschalten nur über `WL_VISUAL_THEME` in `js/theme.js` (`"aurora"` oder `"classic"`). `theme.js` bleibt synchron im `<head>` beider Seiten.
- Aurora-Regeln nur in `css/theme-aurora.css` und nur unter `html[data-theme="aurora"]`; keine Aurora-Farben in `landing.css`, `styles.css` oder im Chart-JavaScript.
- Neue Chart-Elemente erhalten eine Klasse nach dem Muster `wl-c-*`. Die Farben im Markup bleiben die classic-Farben; zusätzliche Aurora-Elemente tragen `visibility="hidden"`.
- Keine SVG-Filter auf Pfaden, die beim Zoom neu gezeichnet werden; Glow über zusätzliche breite Pfade.
- Nach jeder Änderung prüfen, dass `classic` pixelgleich bleibt (Referenzbilder, Reduced-Motion, feste Fenstergrösse).

### 6.3 CSS

- Farben, Abstände, Radien über die `:root`-Variablen verwenden; keine neuen Hartwerte, wo eine Variable existiert (D-019).
- Änderungen auf den betroffenen Bereich begrenzen. Wirkt eine Änderung auf beide Seiten, in beiden Stylesheets nachziehen.
- Breakpoints beibehalten (700, 768, 1280 px) (D-020).
- Dark Theme beibehalten; kein Light Theme ohne Auftrag.

### 6.4 HTML

- Bestehende IDs nicht ändern: JavaScript greift per `getElementById`/`querySelector` darauf zu (u. a. `pageLoader`, `pageLoaderText`, `systemsGrid`, `portfolioOverviewChart`, `portfolioOverviewCards`, `portfolioOverviewStatus`, `regimeEngineChart`, `regimeLegendStretch`, `strategyTitle`, `strategyInfo`, `overviewCards`, `overviewTableBody`, `metricsTableBody`, `monthlyReturnsGrid`, `positionsTableBody`, `equityChart`, `cardTooltip`, `hamburgerBtn`, `mainNav`, `activeTabLabel`, `lastUpdateBadge`, `overviewSubtitle`).
- Tabs: `data-tab` muss der ID des Panels entsprechen.
- Barrierefreiheitsattribute (`role`, `aria-*`, `tabindex`) erhalten.

---

## 7. Änderungsregeln

Nicht ohne ausdrücklichen Auftrag:

- Refactoring (auch die Zusammenführung der duplizierten Hilfsfunktionen, INC-19)
- Umbenennung von Dateien, Funktionen, IDs, Klassen
- Austausch oder Ergänzung von Bibliotheken
- zusätzliche Features, Konfiguration, Fehlerbehandlung, Logging, Telemetrie
- Performance-Optimierung
- kosmetische UI-Änderungen
- Änderung von Berechnungsformeln, Schwellenwerten, Divisoren
- Änderung des Datenformats oder der Dateikonvention
- Bereinigung der in `project_plan.md` Kapitel 14 genannten Inkonsistenzen

Bevorzugt wird die kleinste fachlich und technisch vollständige Änderung. Bestehende öffentliche Schnittstellen (globale Funktionen, URL-Parameter, Datenformat) bleiben unverändert.

---

## 8. Dokumentationsregeln

1. Ändert sich Verhalten, wird `project_plan.md` im betroffenen Kapitel aktualisiert.
2. Ändert sich eine Entscheidung, bleibt der alte Eintrag in `decisions.md` mit Status "Ersetzt" stehen; neue Entscheidung mit neuer ID (D-026 ff.).
3. Neue Arbeitspakete erhalten die nächste freie ID (BP-013 ff.) und kommen nicht rückwirkend in den Plan, um bereits erfolgte Änderungen zu legitimieren.
4. Statuswerte im Build-Plan wechseln nur, wenn die Abschlusskriterien geprüft sind.
5. Offene Fragen bleiben als "offen" markiert und werden nicht als entschieden dargestellt.
6. Die `README.md` ist veraltet (INC-01 bis INC-03). Sie wird nur im Rahmen eines beauftragten Pakets aktualisiert.
7. Neue Abweichungen erhalten die nächste freie ID (INC-20 ff., OP-13 ff.).
8. Die Dokumente sind in Schweizer Rechtschreibung (ohne "ß") und im sachlichen Stil der bestehenden SDD-Dateien zu pflegen.

---

## 9. Validierung

Es gibt keine automatisierten Tests (D-024). Vorgehen gemäss SDD: vorhandene Mittel nutzen, nichts erfinden, nicht Prüfbares benennen.

### 9.1 Ausführung

Die Seiten laden JSON per `fetch` mit relativen Pfaden. Sie müssen deshalb über einen HTTP-Server ausgeliefert werden; ein Start per Doppelklick (`file://`) ist dafür nicht vorgesehen. Ein projektspezifisches Startverfahren ist nicht dokumentiert (OP-08). Den Server wählt der Entwickler; es wird kein Werkzeug ins Projekt aufgenommen.

### 9.2 Manuelle Prüfliste

**Landing-Seite (`index.html`)**

1. Loader erscheint und verschwindet.
2. Statuszeile zeigt `<n>/<n> systems included` (n = Anzahl registrierter Systeme).
3. Chart: Kurve, orange Drawdown-Linie, Jahreslabels, Tooltip mit neun Werten.
4. Zoom (Mausrad), Pan (Ziehen), Reset (Doppelklick und Button) funktionieren; Touch auf einem mobilen Gerät oder in der Geräteemulation.
5. Sechs KPI-Karten mit plausibler Einfärbung (Regeln aus Kapitel 9 in `project_plan.md`).
6. Regime-Panel zeigt Kurve, Zustandsbänder und End-Label.
7. Eine Kachel je registriertem System; Klick öffnet das Dashboard mit dem richtigen Parameter.
8. Konsole ohne neue Fehler. Warnungen zu übersprungenen Systemen sind zu prüfen.
9. Motion (D-026): Nach dem Loader zeichnen sich Portfolio-Linie und Regime-Linie ein, die KPI-Karten zählen auf den bisherigen Endwert hoch. Zoom, Pan und Reset zeichnen nicht neu ein. Mit aktivem `prefers-reduced-motion` erscheinen die Endwerte sofort.
10. Motion (D-027): Ab 701 px driftet der Hintergrund und färbt sich nach dem letzten Regime-Zustand; unter 701 px nicht. Beim Prüfen im Headless-Browser GPU-Beschleunigung nicht abschalten, sonst täuscht die Drift eine niedrige Bildrate vor.
11. Motion (D-028): Sichtbare Kacheln steigen nach dem Loader gestaffelt auf, weitere beim Scrollen; jede Kachel zeigt eine Sparkline; der Wechsel zum Dashboard und zurück überblendet (Chrome, Edge).
12. Loader (D-030): Beim Laden zeichnet sich im Loader eine Mini-Equity-Kurve in einer Schleife ein; zum Prüfen das Netzwerk drosseln, sonst ist der Loader nur kurz sichtbar.
13. Theme (D-031): Mit `aurora` Sternenhimmel, Verlaufslinien mit Glow, HUD-Tooltip, Polarlicht-Bänder im Regime-Panel; mit `classic` (in `js/theme.js` umstellen) exakt das bisherige Design.

**Dashboard (`dashboard/index.html?system=<slug>`)**

1. Ohne Parameter und mit ungültigem Slug erscheinen die definierten Fehlermeldungen.
2. Alle fünf Tabs lassen sich öffnen; auf schmalem Viewport über das Hamburger-Menü.
3. Overview: neun Karten, 13 Tabellenzeilen, Badge "Updated".
4. Metrics Report: 21 Zeilen.
5. Equity Curve: Kurve, Drawdown, Cash-Zonen (falls vorhanden), Tooltip.
6. Monthly Returns: Matrix, Jahres- und Durchschnittswerte.
7. Positions: Sortierung nach drei Spalten, offene Positionen "Open", Mobile ohne Preisspalten.
8. Info-Symbol im Kopf zeigt die Strategiebeschreibung.
9. Motion (D-026): Die Overview-Karten zählen nach dem Loader hoch; die Equity-Linie zeichnet sich beim ersten Öffnen des Tabs "Equity Curve" ein, nicht bei Resize.
10. Motion (D-027): Der Tab-Indikator gleitet beim Tab-Wechsel (ab 769 px), Monthly Returns zeigt die Heatmap, die ersten 20 Positionszeilen blenden gestaffelt ein, auch nach dem Sortieren.
11. Aurora (D-033): Hero-Kurve oben im Overview zeichnet sich einmal ein (nicht erneut nach Tab-Wechsel), Lichtband im Kopf, gestaffelte Karten und Zeilen, Regime-Färbung; bei 390 px kein horizontales Überlaufen, Mobile-Menü bedienbar.

**Datenprüfung neues oder geändertes System**

1. Alle vier Dateien vorhanden und als JSON (oder mit tolerierbarem `NaN`) lesbar.
2. `wl-equity.json`: aufsteigende Daten, numerische `equity`.
3. `wl-positions.json`: Felder gemäss `project_plan.md` 5.3.
4. `systems.js`-Eintrag vorhanden und `id` entspricht dem Ordnernamen.

### 9.3 Berichten

Im Ergebnis je Prüfpunkt unterscheiden: **erfüllt**, **teilweise erfüllt**, **nicht erfüllt**, **nicht prüfbar**. Nicht prüfbare Punkte (z. B. Hosting, Export, Verhalten in nicht getesteten Browsern) benennen.

---

## 10. Git

- Branch: `main`. Commits mit Attribution gemäss Sitzungsvorgabe nur auf Anforderung des Auftraggebers.
- Das Muster `Auto update trading dashboard <Zeitstempel>` gehört dem automatisierten Export (D-023). Manuelle Commits verwenden eine beschreibende Nachricht.
- Änderungen an `systems/**` nicht manuell committen, ausser ausdrücklich beauftragt; der Export kann sie überschreiben.

---

## 11. Antwortverhalten

- Mit Ergebnis oder Status beginnen.
- Geänderte Dateien nennen.
- Nur notwendige Entscheidungen und Abweichungen erklären.
- Rückfragen nur bei blockierenden Unklarheiten, vorzugsweise mit Verweis auf die betroffene ID (INC-xx, OP-xx, D-xxx).
- Befehle: `INIT`, `PLAN`, `CHANGE`, `IMPLEMENT`, `VALIDATE`, `STATUS`, `SDD-CHECK`, jeweils mit optionaler BP-ID, z. B. `IMPLEMENT BP-004`. Eine unbekannte BP-ID wird nicht erraten.
