# Qard

Karteikarten mit Leitner-Boxen 1–5, als statische Seite über GitHub Pages.
Läuft als PWA, speichert den Fortschritt lokal und gleicht ihn nach Anmeldung
über Supabase zwischen den Geräten ab.

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | die gesamte App |
| `faecher/index.json` | Liste der eingebundenen Fächer |
| `faecher/*.html` | die Karten, eine Datei je Fach |
| `vorlage.html` | kommentierte Vorlage für ein neues Fach |
| `sw.js` | Service Worker (Offline-Betrieb) |

Ein neues Fach: HTML-Datei nach `faecher/` legen und in `faecher/index.json`
eine Zeile ergänzen.

```json
[ { "datei": "psi.html", "name": "Propulsion System Integration", "kuerzel": "PSI" } ]
```

Das `kuerzel` ist der Schlüssel, unter dem der Lernstand liegt — später nicht
mehr ändern, sonst beginnt der Fortschritt von vorn.

## Karten

Eine Karte ist ein `<article>`. Die erste Überschrift ist die Frage, alles
danach die Antwort.

```html
<article data-id="1" data-kapitel="Grundlagen" data-quelle="Vorlesung" data-ref="Kap. 2.3">
<h1>Wie lautet der erste Hauptsatz für ein geschlossenes System?</h1>
<p>Die Änderung der inneren Energie ist <span class="fx">dU = δQ + δW</span>.</p>
</article>
```

`data-id` muss innerhalb des Fachs eindeutig sein; daran hängt der Lernstand.
Ein `<p class="hinweis">` direkt unter der Überschrift erscheint als kleiner
Zusatz noch vor der Lösung.

## Auswahlfragen (Multiple Choice)

Sobald ein `<article>` eine Liste mit `class="mc"` enthält, wird daraus eine
Auswahlfrage. Bis zu **acht** Antwortmöglichkeiten, in der App als A–H
beschriftet und über die Ziffern 1–8 erreichbar.

```html
<article data-id="3" data-kapitel="Grundlagen">
<h1>Welche Größe bleibt bei einer isentropen Zustandsänderung konstant?</h1>

<ul class="mc" data-mischen>
<li data-richtig>Die Entropie
  <span class="begruendung">Isentrop heißt „gleiche Entropie“: reversibel und adiabat.</span></li>
<li data-begruendung="Konstant bleibt sie beim isothermen Verlauf.">Die Temperatur</li>
<li data-begruendung="Das wäre isobar.">Der Druck</li>
</ul>

<p>Alles außerhalb der Liste erscheint als allgemeine Begründung unter dem Ergebnis.</p>
</article>
```

**Am `<li>`**

| Attribut | Wirkung |
|---|---|
| `data-richtig` | markiert eine richtige Antwort (auch `class="richtig"`) |
| `class="begruendung"` | Begründung zu dieser Antwort, als Element im `<li>` |
| `data-begruendung="…"` | dasselbe als Attribut, für kurze Sätze |

**An der Liste oder am `<article>`**

| Attribut | Wirkung |
|---|---|
| `data-mehrfach` | erzwingt Mehrfachauswahl, auch bei nur einer richtigen Antwort |
| `data-mischen` | mischt die Antworten bei jedem Aufruf |

Sind mehrere `<li>` als richtig markiert, schaltet die App von selbst auf
Mehrfachauswahl. Sie nennt dann die Zahl der richtigen Antworten über der
Liste — wer das nicht will, markiert nur eine Antwort und setzt zusätzlich
`data-mehrfach`.

**Bedienung**

* Eine richtige Antwort: Tippen wertet sofort aus.
* Mehrfachauswahl: erst alle Antworten wählen, dann „Antwort prüfen“ (Enter).
* Richtig gilt nur, wenn die Auswahl genau stimmt — keine fehlt, keine zu viel.
* Nach dem Prüfen erscheinen alle hinterlegten Begründungen, richtige Antworten
  grün, falsch gewählte rot, übersehene grün gestrichelt.
* Die Bewertung für die Leitner-Box wird vorgeschlagen und bleibt änderbar,
  falls geraten wurde. Enter übernimmt den Vorschlag.

Vollständige Beispiele stehen in `vorlage.html`.

## Tastatur

| Taste | Wirkung |
|---|---|
| `Leertaste` | Lösung zeigen (freie Karten) |
| `1` … `8` | Antwort wählen (Auswahlfragen) |
| `Enter` | prüfen, danach Bewertung übernehmen |
| `1` / `←` | nicht gewusst |
| `2` / `→` | gewusst |
| `N` | nächste Karte |
| `Esc` | Menü oder Zeichnung schließen |

Am Handy: nach links wischen für „nicht gewusst“, nach rechts für „gewusst“.
