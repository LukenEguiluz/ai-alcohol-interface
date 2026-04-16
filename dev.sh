#!/usr/bin/env bash
# Uso:
#   ./dev.sh [setup]   Crea/usa venv, deps, migraciones, npm install y build (no deja servidores).
#   ./dev.sh dev|start Igual preparación sin build; arranca Django :8000 y Vite :5173. Ctrl+C o ./stop.sh
#   ./dev.sh help      Muestra esta ayuda.
#   ./stop.sh          Mata lo que escuche en 8000 y 5173.
#
# Requisitos: python3, node 18+, npm.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
VENV="$BACKEND/venv"
RAW_MODE="${1:-setup}"
MODE="$RAW_MODE"
[[ "$MODE" == "start" ]] && MODE="dev"

if [[ "$MODE" == "help" || "$MODE" == "-h" || "$MODE" == "--help" ]]; then
  sed -n '2,/^# Requisitos/p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

if [[ ! -d "$BACKEND" || ! -d "$FRONTEND" ]]; then
  echo "Error: ejecuta este script desde la raíz del repo (deben existir backend/ y frontend/)." >&2
  exit 1
fi

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "Creando entorno virtual en $VENV ..."
  python3 -m venv "$VENV"
fi

# shellcheck source=/dev/null
source "$VENV/bin/activate"

echo "Instalando dependencias Python..."
python -m pip install -q --upgrade pip
pip install -q -r "$BACKEND/requirements.txt"

echo "Aplicando migraciones..."
(cd "$BACKEND" && python manage.py migrate --noinput)

echo "Instalando dependencias npm..."
(cd "$FRONTEND" && npm install)

if [[ "$MODE" == "dev" ]]; then
  echo "Modo desarrollo: Django http://127.0.0.1:8000 y Vite http://127.0.0.1:5173"
  echo "(Para parar: Ctrl+C en esta terminal, o en otra: ./stop.sh)"
  cleanup() {
    [[ -n "${DJ_PID:-}" ]] && kill "$DJ_PID" 2>/dev/null || true
    [[ -n "${FE_PID:-}" ]] && kill "$FE_PID" 2>/dev/null || true
    wait "$DJ_PID" 2>/dev/null || true
    wait "$FE_PID" 2>/dev/null || true
    echo "Servidores detenidos."
  }
  trap cleanup INT TERM EXIT

  (cd "$BACKEND" && exec python manage.py runserver 0.0.0.0:8000) &
  DJ_PID=$!

  (cd "$FRONTEND" && exec npm run dev -- --host 127.0.0.1) &
  FE_PID=$!

  while kill -0 "$DJ_PID" 2>/dev/null || kill -0 "$FE_PID" 2>/dev/null; do
    sleep 0.5
  done
  wait "$DJ_PID" 2>/dev/null || true
  wait "$FE_PID" 2>/dev/null || true
  trap - INT TERM EXIT
  exit 0
fi

if [[ "$MODE" != "setup" ]]; then
  echo "Modo desconocido: $RAW_MODE" >&2
  echo "Usa: $0 [setup|dev|start|help]" >&2
  exit 1
fi

echo "Compilando frontend (producción)..."
(cd "$FRONTEND" && npm run build)

echo ""
echo "=== Setup terminado (no hay servidores en marcha) ==="
echo "  Desarrollo con recarga:  ./dev.sh dev   (o ./dev.sh start)"
echo "  Backend manual:          cd backend && source venv/bin/activate && python manage.py runserver"
echo "  Frontend estático:       frontend/dist  |  preview: cd frontend && npm run preview"
