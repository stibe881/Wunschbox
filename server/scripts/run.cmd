@echo off
REM Startet den Alarmserver und startet ihn nach einer Aktualisierung neu.
REM Der Server beendet sich nach einem erfolgreichen Update; diese Schleife
REM startet ihn dann mit dem neuen Stand wieder.
cd /d "%~dp0.."
:schleife
node dist\index.js
echo [run] Server beendet - Neustart in 5 Sekunden.
timeout /t 5 /nobreak >nul
goto schleife
