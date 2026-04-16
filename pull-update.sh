#!/usr/bin/env bash
# Actualiza el repo (pull --rebase), respalda BD SQLite y carpeta media antes,
# aplica migraciones y opcionalmente reconstruye el frontend.
#
# Uso (desde la raíz del repositorio):
#   ./pull-update.sh
#   AUTO_STASH=1 ./pull-update.sh    si tienes cambios locales sin commitear (stash antes del pull)
#   SKIP_FRONTEND=1 ./pull-update.sh no ejecuta npm en frontend
#   KEEP_BACKUPS=8 ./pull-update.sh  conserva solo los 8 respaldos .deploy-backups más recientes
#
# Nota: db.sqlite3 y backend/media/ están en .gitignore; git pull no los borra.
#       El respaldo protege ante git clean, errores humanos o rollback manual.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="$ROOT/.deploy-backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="${BACKUP_ROOT}/${STAMP}"
KEEP_BACKUPS="${KEEP_BACKUPS:-12}"
STASHED=0

die() { echo "Error: $*" >&2; exit 1; }

[[ -d "$ROOT/.git" ]] || die "no hay .git en $ROOT (¿estás en la raíz del repo?)"

mkdir -p "$BK"

echo "=== Respaldo previo → $BK ==="
if [[ -f "$ROOT/backend/db.sqlite3" ]]; then
  cp -a "$ROOT/backend/db.sqlite3" "$BK/db.sqlite3"
  echo "  ✓ db.sqlite3"
else
  echo "  (sin backend/db.sqlite3; si usas PostgreSQL en Docker, respalda el volumen aparte)"
fi

if [[ -d "$ROOT/backend/media" ]] && compgen -G "$ROOT/backend/media/*" >/dev/null; then
  echo "  Empaquetando media/ (puede tardar)…"
  tar -C "$ROOT/backend" -czf "$BK/media.tar.gz" media
  echo "  ✓ media.tar.gz"
else
  echo "  (sin archivos en backend/media/)"
fi

echo "=== Git pull --rebase ==="
cd "$ROOT"

if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  if [[ "${AUTO_STASH:-0}" == "1" ]]; then
    echo "  Árbol sucio → git stash (sin -u: no toca ignorados como media/)"
    git stash push -m "pull-update-${STAMP}"
    STASHED=1
  else
    die "hay cambios sin commitear. Haz commit, git stash, o ejecuta: AUTO_STASH=1 $0"
  fi
fi

git pull --rebase

if [[ "$STASHED" == "1" ]]; then
  echo "=== git stash pop ==="
  git stash pop || echo "Advertencia: resuelve conflictos del stash si los hay (git stash list)."
fi

echo "=== Backend (venv si existe) ==="
VENV="$ROOT/backend/venv"
if [[ -x "$VENV/bin/python" ]]; then
  # shellcheck source=/dev/null
  source "$VENV/bin/activate"
  pip install -q -r "$ROOT/backend/requirements.txt"
  (cd "$ROOT/backend" && python manage.py migrate --noinput)
  echo "  ✓ pip + migrate"
elif command -v python3 >/dev/null 2>&1; then
  (cd "$ROOT/backend" && python3 manage.py migrate --noinput)
  echo "  ✓ migrate (sin venv; usa el python3 del sistema)"
else
  echo "  (sin venv ni python3; omite migraciones locales)"
fi

if [[ "${SKIP_FRONTEND:-0}" != "1" ]] && [[ -f "$ROOT/frontend/package.json" ]]; then
  echo "=== Frontend ==="
  if [[ -d "$ROOT/frontend/node_modules" ]]; then
    (cd "$ROOT/frontend" && (npm ci 2>/dev/null || npm install) && npm run build)
  else
    (cd "$ROOT/frontend" && npm install && npm run build)
  fi
  echo "  ✓ npm + build"
else
  echo "=== Frontend omitido (SKIP_FRONTEND=1 o sin package.json) ==="
fi

echo "=== Rotación de respaldos (mantener $KEEP_BACKUPS más recientes) ==="
mkdir -p "$BACKUP_ROOT"
# ls -t: nombres YYYYMMDD-HHMMSS ordenan igual que por tiempo
if ls -1t "$BACKUP_ROOT" 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | grep -q .; then
  ls -1t "$BACKUP_ROOT" 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | while read -r name; do
    [[ -n "$name" && -d "${BACKUP_ROOT}/${name}" ]] || continue
    rm -rf "${BACKUP_ROOT}/${name}"
    echo "  eliminado respaldo antiguo: ${name}"
  done
fi

echo ""
echo "=== Listo ==="
echo "  Respaldo: $BK"
echo "  Con Docker además: docker compose build && docker compose up -d"
