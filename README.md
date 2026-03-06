# AI Alcohol

Interfaz para el proyecto **AI Alcohol**: registro de pacientes (nombre, apellidos, edad, saludable, cirrosis, EHM) y subida de videos para procesamiento. Incluye login y API REST con Django + React.

## Stack

- **Backend:** Django 4.x, Django REST Framework, JWT (Simple JWT), SQLite
- **Frontend:** React (Vite), React Router

## Requisitos

- Python 3.10+
- Node.js 18+

## Backend (Django)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

El API quedará en **http://127.0.0.1:8000**.  
Para crear un usuario por consola: `python manage.py createsuperuser` (o usar Registrarse en la app).

## Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

La app quedará en **http://localhost:5173**.

## Uso

1. Abre http://localhost:5173.
2. **Registrarse** o **Iniciar sesión**.
3. En el panel podrás:
   - Añadir pacientes (nombre, apellidos, edad, Saludable / Cirrosis / EHM).
   - Editar y eliminar pacientes.
   - Subir un video por paciente (el video se asocia al paciente y queda en estado "pendiente" para procesamiento).

## API (resumen)

- `POST /api/auth/register/` — Registro (username, password, email opcional).
- `POST /api/auth/login/` — Login (username, password). Devuelve `access`, `refresh` y `user`.
- `GET/POST /api/pacientes/` — Listar y crear pacientes (requiere JWT).
- `GET/PATCH/DELETE /api/pacientes/:id/` — Detalle, editar y eliminar paciente.
- `GET /api/videos/` — Listar videos del usuario.
- `POST /api/videos/` — Subir video (form-data: `paciente`, `archivo`, `notas` opcional).

Token JWT: header `Authorization: Bearer <access>`.

## Base de datos

Por defecto se usa **SQLite** (`backend/db.sqlite3`). Los medios (videos) se guardan en `backend/media/`.

Para usar PostgreSQL u otro motor, cambia `DATABASES` en `backend/config/settings.py` y crea el usuario/DB correspondiente.
