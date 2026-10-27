# todo.md – Befunde aus der SDD-Initialisierung

| Eigenschaft | Wert |
|---|---|
| Stand | 2026-10-27 |
| Herkunft | Zusammenfassung "Wichtigste Befunde" aus INIT, Details in `project_plan.md` Kapitel 14 |
| Status | Alle acht Punkte erledigt oder entschieden (BP-025, BP-026, BP-028, D-040) |

Die Liste ist eine Merkliste, kein Auftrag. Gemäss SDD wird kein Punkt umgesetzt, bevor der Auftraggeber entschieden hat. Der Weg ist: Entscheidung → `CHANGE` → neues Arbeitspaket (BP-013 ff.) → `IMPLEMENT`. Die Kandidaten C-xx sind in `build_plan.md` Kapitel 4 beschrieben.

## Befunde

| # | Status | Befund | Bezug | Entscheidung |
|---|---|---|---|---|
| 1 | [x] erledigt (BP-028) | README veraltet: nennt ein System statt zehn, Beispiel `?system=alpha-picks` existiert nicht, Dateiliste unvollständig. | INC-01, INC-02, INC-03, C-01 | README aktualisiert |
| 2 | [x] erledigt (BP-028) | Zwei Systemordner nicht registriert und mit veralteten Daten: `monday-anchor-reversion-500k-cap` (2026-10-07), `multifactor-edge` (2026-04-20). | INC-06, OP-03, C-03 | Ordner gelöscht |
| 3 | [x] erledigt (BP-025, D-037) | Dashboard prüft nur das Slug-Muster, nicht das Register; nicht registrierte Systeme sind per URL aufrufbar. | INC-07, OP-10, C-05 | auf registrierte Systeme beschränkt |
| 4 | [x] erledigt (BP-025) | NaN-Bereinigung fehlt in `equity-overview-chart.js` und `regime-engine-chart.js`; ein `NaN` lässt ein System im Portfolio-Chart still entfallen. | INC-08, C-06 | in allen Ladepfaden ergänzt |
| 5 | [x] erledigt (BP-026, D-038) | Regime-Panel folgt dem Zoom des Portfolio-Charts nicht; Loader wartet nicht auf das Panel. | INC-09, C-07 | synchronisiert |
| 6 | [x] entschieden (D-040) | `wl-signals.json` wird geladen, aber nirgends angezeigt. | INC-12, OP-05, C-04 | Datei bleibt als Reserve für eine spätere Signalanzeige, keine Änderung |
| 7 | [x] erledigt (BP-025) | Max-Drawdown-Overlay im Portfolio-Chart nutzt einen Farbverlauf ohne Stopps und ist vermutlich unsichtbar. | INC-13, C-08 | Overlay entfernt |
| 8 | [x] beantwortet (BP-028) | Fehlende Information: Datenexport aus Wealth-Lab, Hosting und Zweck der Skalierung durch 100. | OP-01, OP-02, OP-06, C-11 | WL9 Strategy Monitor → Git-CLI → GitHub → Cloudflare; Divisor gegen Millionenbeträge (D-015, D-023) |

## Zusätzlich erledigt oder entschieden

| Bezug | Erledigt in | Inhalt |
|---|---|---|
| INC-04 | BP-025 | Meta-Description der Landing-Seite ohne feste Systemanzahl. |
| INC-24 | BP-027 (D-039) | Touch: Ein Finger führt den Tooltip, zwei Finger zoomen und verschieben, senkrechtes Scrollen bleibt. |
| OP-04 | 2026-10-27 | `FlagFile.txt` vom Auftraggeber gelöscht. |
| OP-11 | 2026-10-27 | Strategiename auf der Landing-Seite wird nicht gekürzt (INC-11 akzeptiert). |
| OP-12 | 2026-10-27 | Portfolio als Rohsumme; die Gewichtung erfolgt in Wealth-Lab 9 (D-013). |
| INC-10 | BP-029 (D-041) | Keine Trophäen mehr (Schalter `showTrophies: false`). |
| INC-14 | BP-030 (D-042) | Drawdown-Achse des Portfolio-Charts erweitert sich bei Drawdowns tiefer als −30 %. |
| INC-20 | BP-031 (D-043) | Reduced-Motion auch auf der Landing-Seite. |
| INC-25 | BP-031 (D-044) | Tippflächen von ca. 44 × 44 px auf Touch-Geräten. |
| INC-15 bis INC-18 | BP-032 (D-045) | Fehlerzeile, Maskierung, Stretch-Standard, Exportdatum in Safari; Achse "0%". |
| OP-07 bis OP-09 | 2026-10-27 | Begründung APR-Schwelle, keine Start-Anleitung, Zielgruppe (eigene Nutzung auf dem Handy). |

## Weiterhin offen

Nur noch INC-19 (duplizierte Hilfsfunktionen, Refactoring, nicht beauftragt) in `project_plan.md` Kapitel 14.
