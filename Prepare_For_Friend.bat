@echo off
title FinanceHub für Freunde vorbereiten
color 0E

echo ===================================================
echo   Vorbereitung zum Teilen des Dashboards...
echo ===================================================
echo.
echo WARNUNG: Dieser Prozess loescht Ihre lokale Datenbank "database.sqlite" !
echo Bitte stellen Sie sicher, dass Sie vorher unter "Einstellungen" 
echo ein Backup exportiert haben, falls Sie Ihre Daten behalten wollen.
echo.
pause

echo.
echo Loesche Datenbank...
del /Q database.sqlite

echo Bereinige temporaere Dateien und Node_Modules (um die ZIP-Datei klein zu halten)...
rmdir /S /Q node_modules
rmdir /S /Q .next
del /Q package-lock.json

echo.
echo ===================================================
echo FERTIG! 
echo Der Ordner "Dashboard_3" ist jetzt sauber.
echo Sie koennen den gesamten Ordner als .zip verpacken 
echo und an Ihren Freund senden.
echo.
echo Ihr Freund muss lediglich:
echo 1. Node.js installieren (https://nodejs.org/)
echo 2. "npm install" in der Konsole ausfuehren
echo 3. Die "Start_Dashboard.bat" doppelklicken.
echo ===================================================
pause
exit
