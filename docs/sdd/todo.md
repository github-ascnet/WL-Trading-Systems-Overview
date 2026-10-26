# todo.md – Befunde aus der SDD-Initialisierung

| Eigenschaft | Wert |
|---|---|
| Stand | 2026-10-26 |
| Herkunft | Zusammenfassung "Wichtigste Befunde" aus INIT, Details in `project_plan.md` Kapitel 14 |
| Status aller Punkte | **offen, nicht freigegeben** |

Die Liste ist eine Merkliste, kein Auftrag. Gemäss SDD wird kein Punkt umgesetzt, bevor der Auftraggeber entschieden hat. Der Weg ist: Entscheidung → `CHANGE` → neues Arbeitspaket (BP-013 ff.) → `IMPLEMENT`. Die Kandidaten C-xx sind in `build_plan.md` Kapitel 4 beschrieben.

## Befunde

| # | Status | Befund | Bezug | Entscheidung erforderlich |
|---|---|---|---|---|
| 1 | [ ] offen | README veraltet: nennt ein System statt zehn, Beispiel `?system=alpha-picks` existiert nicht, Dateiliste unvollständig. | INC-01, INC-02, INC-03, C-01 | README anpassen: ja/nein |
| 2 | [ ] offen | Zwei Systemordner nicht registriert und mit veralteten Daten: `monday-anchor-reversion-500k-cap` (2026-10-07), `multifactor-edge` (2026-04-20). | INC-06, OP-03, C-03 | registrieren, aktualisieren oder entfernen |
| 3 | [ ] offen | Dashboard prüft nur das Slug-Muster, nicht das Register; nicht registrierte Systeme sind per URL aufrufbar. | INC-07, OP-10, C-05 | auf registrierte Systeme beschränken: ja/nein |
| 4 | [ ] offen | NaN-Bereinigung fehlt in `equity-overview-chart.js` und `regime-engine-chart.js`; ein `NaN` lässt ein System im Portfolio-Chart still entfallen. | INC-08, C-06 | in allen Ladepfaden ergänzen: ja/nein |
| 5 | [ ] offen | Regime-Panel folgt dem Zoom des Portfolio-Charts nicht; Loader wartet nicht auf das Panel. | INC-09, C-07 | synchronisieren: ja/nein |
| 6 | [ ] offen | `wl-signals.json` wird geladen, aber nirgends angezeigt. | INC-12, OP-05, C-04 | Anzeige einführen oder Datei aus der Konvention entfernen |
| 7 | [ ] offen | Max-Drawdown-Overlay im Portfolio-Chart nutzt einen Farbverlauf ohne Stopps und ist vermutlich unsichtbar. | INC-13, C-08 | Verlauf definieren oder Overlay entfernen |
| 8 | [ ] offen | Fehlende Information: Datenexport aus Wealth-Lab, Hosting und Zweck der Skalierung durch 100 sind aus dem Repo nicht belegbar. | OP-01, OP-02, OP-06, C-11 | Angaben liefern, danach dokumentieren |

## Nicht in der Kurzliste enthalten

Die übrigen Inkonsistenzen (INC-04, INC-05, INC-10, INC-11, INC-14 bis INC-19) und offenen Punkte (OP-04, OP-07 bis OP-09, OP-11, OP-12) stehen in `project_plan.md` Kapitel 14.
