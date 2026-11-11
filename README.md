# IBW Studium

Mein Studien-Dashboard für **Internationale Betriebswirtschaft (B.A.) an der Hochschule Aalen**.

**Website öffnen:** https://kiyo0711.github.io/ibw-studium/

## Was drin ist

- **Heute**: nächste Vorlesungen, Termine der Hochschule, Lernzeit, To-dos, Prüfungen, Studienfortschritt
- **Kalender**: Stundenplan aus dem sPlan, offizielle Hochschultermine, eigene Termine, Prüfungen und Fristen. Fremde Übungsgruppen lassen sich ausblenden.
- **To-dos**: mit Fach, Fälligkeit und Priorität
- **Klausurenplan**: Datum, Raum, Hilfsmittel, Anmeldung, Countdown und automatischer Lernplan
- **Module & Noten**: alle 7 Semester (210 CP), Kontakt zu Dozent:innen, Notenschnitt und Wunschschnitt-Rechner
- **Lernzettel**: pro Fach, mit Vorlagen, Karteikarten-Modus, Vorlesungsmitschriften und Druck/PDF
- **Planung**: Praxissemester (Bewerbungen), Auslandssemester (Partnerhochschulen), Bachelorthesis, jeweils mit Checkliste
- **Lern-Timer**: Fokus- und Pausenphasen, zählt die Lernzeit pro Fach
- **Erinnerungen**: Prüfungen, To-dos und Fristen in den Handy-Kalender übertragen
- **Offline nutzbar** und als App auf dem Home-Bildschirm

Oben wählst du das Semester (1–7). Alles richtet sich danach.

## Wo liegen meine Daten?

Im Browser auf deinem Gerät, nicht in diesem Repository.
Unter *Einstellungen → Handy und Laptop abgleichen* kannst du deine Geräte verbinden. Dann liegt zusätzlich eine Kopie in einem **privaten Gist** in deinem GitHub-Konto (`ibw-studium-daten.json`), über den sich die Geräte abgleichen. Den Gist bitte nicht löschen.
Unter *Einstellungen → Sicherung* lädst du außerdem jederzeit alles als Datei herunter.

## Hochschultermine aktualisieren

Die offiziellen Termine stehen in `assets/data.js` unter `TERMS`. Sobald die Hochschule den Terminplan für das nächste Semester veröffentlicht, dort neue Zeilen ergänzen.

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
