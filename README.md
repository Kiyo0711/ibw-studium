# IBW Studium

Mein Studien-Dashboard für **Internationale Betriebswirtschaft (B.A.) an der Hochschule Aalen**.

**Website öffnen:** https://kiyo0711.github.io/ibw-studium/

## Was drin ist

- **Heute**: nächste Vorlesungen, offene To-dos, nächste Prüfungen, Studienfortschritt
- **Kalender**: Stundenplan aus dem sPlan der Hochschule, eigene Termine, Prüfungen und Fristen (Woche, Monat, Liste)
- **To-dos**: mit Fach, Fälligkeit und Priorität
- **Klausurenplan**: Datum, Raum, Hilfsmittel, Anmeldung, Countdown
- **Module & Noten**: alle 7 Semester nach Studienverlaufsplan (210 CP), Notenschnitt nach CP gewichtet
- **Lernzettel**: pro Fach, mit Vorlagen, Karteikarten-Modus und Druck/PDF

Oben wählst du das Semester (1–7). Alles richtet sich danach.

## Wo liegen meine Daten?

To-dos, Noten, Prüfungen und Lernzettel werden **nur im Browser auf deinem Gerät** gespeichert, nicht in diesem Repository.
Unter *Einstellungen → Sicherung* lädst du alles als Datei herunter und spielst es auf einem anderen Gerät wieder ein.

## Stundenplan für ein neues Semester

1. Im [sPlan](https://vorlesungen.htw-aalen.de/splan/) den iCal-Link für dein neues Semester kopieren.
2. In [`stundenplan-url.txt`](stundenplan-url.txt) als neue Zeile einfügen und speichern.
3. Fertig. GitHub lädt den Plan sofort und danach jede Nacht neu (*Actions → Stundenplan aktualisieren*).

Falls GitHub den automatischen Abruf nach längerer Inaktivität pausiert: unter *Actions* einmal auf „Enable workflow“ klicken.

## Anpassen

- Module, CP und Namen: direkt auf der Website unter *Module & Noten → Bearbeiten*
- Grundgerüst des Curriculums: `assets/data.js`
- Farben und Schrift: `assets/style.css`

Keine Build-Tools nötig, es sind einfache HTML-, CSS- und JavaScript-Dateien.
