# Ejecutar con Docker (PostgreSQL)

La base de datos y los archivos subidos se guardan en **volúmenes**. Aunque cambies el código o reconstruyas los contenedores, los datos no se pierden.

## Requisitos

- Docker y Docker Compose instalados.

## Uso

1. **Levantar servicios** (PostgreSQL + backend):

   ```bash
   docker compose up -d --build
   ```

2. **Backend** queda en http://127.0.0.1:8000  
   La primera vez se ejecutan las migraciones automáticamente.

3. **Frontend** en local (para poder cambiar código sin tocar la base):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Abre http://localhost:5173. El frontend hablará con el backend en el puerto 8000.

4. **Opcional**: contraseña de PostgreSQL y secret de Django:

   Crea un archivo `.env` en la raíz del proyecto:

   ```env
   POSTGRES_PASSWORD=tu_password_seguro
   DJANGO_SECRET_KEY=tu_secret_key
   ```

## Volúmenes (datos persistentes)

- `postgres_data`: base de datos PostgreSQL.
- `media_data`: archivos subidos (vídeos/audios).

Para borrar todo y empezar de cero:

```bash
docker compose down -v
```

## Descargar copia de seguridad

En la app, como **administrador**, abre el menú (icono de engranaje) y elige **"Descargar copia de seguridad (.zip)"**. Se descargará un .zip con:

- Dump de la base (PostgreSQL: `backup.sql`; SQLite: `db.sqlite3`).
- Carpeta `media/` con todos los archivos subidos.
