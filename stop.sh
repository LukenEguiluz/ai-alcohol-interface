#!/usr/bin/env sh
# Detiene Django (runserver) y Vite del proyecto en los puertos por defecto.
# Uso: ./stop.sh

set -eu

kill_port() {
  port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti:"${port}" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "${pids}" ]; then
      # shellcheck disable=SC2086
      kill ${pids} 2>/dev/null || true
    fi
  else
    echo "Instala fuser (paquete psmisc) o lsof para liberar el puerto ${port}." >&2
  fi
}

echo "Liberando puertos 8000 (Django) y 5173 (Vite)..."
kill_port 8000
kill_port 5173

echo "Hecho."
