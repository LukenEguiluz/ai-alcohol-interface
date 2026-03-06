# Ejecutar con Docker (PostgreSQL)

La base de datos y los archivos subidos se guardan en **volúmenes**. Aunque cambies el código o reconstruyas los contenedores, los datos no se pierden.

**Puertos** (sin usar 8080 ni 5000 para no chocar con ERP Next u otras apps):

| Servicio    | Puerto en el host | Uso                          |
|------------|-------------------|------------------------------|
| **App** (front + API) | **3000**     | Interfaz en `/`, API en `/api/`, media en `/media/` |
| PostgreSQL | **5433**          | Conexión externa opcional    |

Todo va por el mismo puerto: `http://servidor:3000` es la app y `http://servidor:3000/api/` es la API.

## Requisitos

- Docker y Docker Compose instalados.

## Uso

1. **Levantar toda la app** (PostgreSQL + backend + frontend):

   ```bash
   docker compose up -d --build
   ```

2. **Abrir la interfaz** en el navegador:

   - En el mismo servidor: http://localhost:3000  
   - Desde otra máquina: http://IP_DEL_SERVIDOR:3000  

   La primera vez se ejecutan las migraciones en el backend. Todo (API + media) se sirve a través del puerto 3000.

3. **Opcional**: contraseña de PostgreSQL, secret de Django y CORS:

   Crea un archivo `.env` en la raíz del proyecto:

   ```env
   POSTGRES_PASSWORD=tu_password_seguro
   DJANGO_SECRET_KEY=tu_secret_key
   # Si accedes por otro dominio/IP, añade orígenes permitidos (separados por coma):
   # CORS_ORIGINS=http://192.168.1.10:3000,https://midominio.com
   ```

4. **Conectar a la base desde fuera** (cliente SQL, DBeaver, etc.):

   - Host: `localhost` (o IP del servidor)  
   - Puerto: **5433**  
   - Base: `ai_alcohol`  
   - Usuario: `ai_alcohol`  
   - Contraseña: la de `POSTGRES_PASSWORD`

## Volúmenes (datos persistentes)

- `postgres_data`: base de datos PostgreSQL.
- `media_data`: archivos subidos (vídeos/audios).

Para borrar todo y empezar de cero:

```bash
docker compose down -v
```

## Desarrollo local (sin Docker del frontend)

Si quieres levantar solo base + backend en Docker y el frontend en tu máquina:

- Comenta o quita el servicio `frontend` en `docker-compose.yml` y expón el backend: `ports: ["8000:8000"]`.
- Ejecuta `cd frontend && npm run dev` y abre http://localhost:5173.

## Descargar copia de seguridad

En la app, como **administrador**, abre el menú (icono de engranaje) y elige **"Descargar copia de seguridad (.zip)"**. Se descargará un .zip con:

- Dump de la base (PostgreSQL: `backup.sql`; SQLite: `db.sqlite3`).
- Carpeta `media/` con todos los archivos subidos.
