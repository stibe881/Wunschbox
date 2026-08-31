#!/usr/bin/env bash
# Startet den Alarmserver und startet ihn nach einer Aktualisierung neu.
# Der Server beendet sich nach einem erfolgreichen Update mit Code 0; diese
# Schleife startet ihn dann mit dem neuen Stand wieder.
set -u
cd "$(dirname "$0")/.."

while true; do
  node dist/index.js
  code=$?
  if [ $code -ne 0 ]; then
    echo "[run] Server mit Code $code beendet - Neustart in 5 Sekunden."
    sleep 5
  else
    echo "[run] Neustart nach Aktualisierung."
    sleep 1
  fi
done
