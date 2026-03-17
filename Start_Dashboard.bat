@echo off
title FinanceHub Dashboard Server
color 0A

echo ===================================================
echo   FinanceHub Dashboard wird gestartet...
echo   Bitte haben Sie einen Moment Geduld.
echo ===================================================

:: Wechsle in das Verzeichnis, in dem sich die Batch-Datei befindet
cd /d "%~dp0"

:: Pruefe, ob node_modules existiert, sonst installiere Abhaengigkeiten automatisch
if not exist "node_modules\" (
    echo Erstmaliger Start erkannt!
    echo Lade benoetigte Bibliotheken ^(React, Next.js, SQLite^) herunter...
    echo Das kann 1-2 Minuten dauern. Bitte warten...
    echo.
    call npm install
    echo.
    echo Installation abgeschlossen!
)

:: Starte den Next.js Server in einem neuen Fenster
start "FinanceHub Server (Bitte geoeffnet lassen)" cmd /k "npm run dev"

:: Warte 6 Sekunden, damit der Server Zeit zum Hochfahren hat
echo.
echo Warte auf Server-Start...
timeout /t 6 /nobreak > NUL

:: Oeffne den Standard-Browser mit der lokalen URL
echo Oeffne Browser...
start http://localhost:3000

:: Beende dieses Start-Skript (das Server-Fenster bleibt offen)
exit
