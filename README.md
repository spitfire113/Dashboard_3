# Finanz-Dashboard

Ein modernes, lokales Web-Dashboard zur Analyse persönlicher Finanzen. Entwickelt mit **Next.js 15**, **React**, und **SQLite**.

Dieses Dashboard wurde primär dafür entwickelt, Bankauszüge (insbesondere Sparkasse/Volksbank CSV-Exporte) sowie PayPal-Exporte lokal zu importieren, zu kategorisieren und auszuwerten – komplett ohne Cloud-Zwang. Alle sensiblen Finanzdaten verbleiben in einer lokalen, durch SQLite angetriebenen Datenbankdatei auf deinem eigenen Rechner.

## 🚀 Features

*   **Lokale Datenbank:** Alle Transaktionen, Kategorien und KI-Zuweisungseinstellungen werden in einer lokalen `database.sqlite` Datei gespeichert. Keine Daten verlassen deinen PC.
*   **Intuitive Analysen:** Interaktive Chart.js Graphen für Einnahmen, Top-Ausgaben und zeitliche Trends der Cashflow-Entwicklung.
*   **CSV-Import:** Komfortabler Upload von Bank-CSV-Dateien. Intelligentes Parsing von Datums-, Betrags- und Textfeldern.
*   **KI-gestützte Kategorisierung:** Eine lokale Ähnlichkeits-Berechnung vergleicht neue Buchungstexte mit deinen historischen Umbenennungen. Das System lernt mit und kategorisiert wiederkehrende Zahlungen (z.B. Supermarkt, Miete, Strom) beim Import automatisch.
*   **Import-Aktivität:** Ein dezidierter Bereich "Abarbeiten", in dem alle neuen, noch undefinierten Transaktionen als To-Do-Liste landen.
*   **Filter & Flexibilität:** Excel-artige Spalten-Suche für Auftraggeber/Verwendungszwecke und Multi-Select für Kategorien. Datums-Dropdowns basieren stets intelligent auf der echten Datenverfügbarkeit in der DB.
*   **Fix & Variabel:** Kategorien lassen sich als "Fixe Kosten" markieren, um die monatlichen Fixausgaben sauber vom variablen Freizeitbudget in den Analysen zu trennen.

## 🛠️ Installation

Stelle sicher, dass **Node.js** installiert ist.

1.  Repository klonen oder herunterladen und in den Ordner wechseln:
    ```bash
    cd Dashboard_3
    ```

2.  Abhängigkeiten installieren:
    ```bash
    npm install
    ```

3.  Dashboard starten:
    ```bash
    npm run dev
    ```

4.  Das Dashboard ist nun unter [http://localhost:3000](http://localhost:3000) im Browser erreichbar.
5.  *Beim ersten Start wird automatisch eine leere `database.sqlite` Datenbank im Hauptverzeichnis angelegt.*

## 💡 Nutzung & Workflow

*   **1. Daten importieren:** Lade deine Kontoauszüge als .csv über den Button oben rechts hoch. Das System versucht bekannte Datenstrukturen (wie PayPal) automatisch zu formatieren.
*   **2. Kategorisieren:** Gehe zum Menüpunkt "Import-Aktivität (To-Do)". Teile den ungeordneten Transaktionen Kategorien zu.
*   **3. Einstellungen anpassen:** Unter "Einstellungen" (Zahnrad) kannst du die Sensibilität der Auto-Kategorisierung einstellen.
*   **4. Backup:** Ebenfalls in den "Einstellungen" kannst du die gesamte Datenbank jederzeit als sichere Backup-Datei (`json`) exportieren.

## 🏗️ Tech Stack

*   **Framework:** Next.js (App Router)
*   **Styling:** Vanilla CSS Modules (Glassmorphism & Dark Mode)
*   **Icons:** Lucide-React
*   **Charts:** Chart.js & react-chartjs-2
*   **Datenbank:** better-sqlite3
*   **CSV Parsing:** PapaParse

---
*Privatsphäre-Hinweis: Die lokale Datenbank `database.sqlite` wird über die `.gitignore` strikt ignoriert und niemals auf GitHub hochgeladen.*
