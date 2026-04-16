import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-change-in-production-ai-alcohol')

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

# Producción: DJANGO_ALLOWED_HOSTS=ejemplo.com,www.ejemplo.com (evita '*' y reduce superficie de error).
_hosts_env = os.environ.get('DJANGO_ALLOWED_HOSTS', '').strip()
if _hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in _hosts_env.split(',') if h.strip()]
elif DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# HTTPS detrás de nginx / dominio público (admin, formularios, cookies SameSite).
# Ej.: CSRF_TRUSTED_ORIGINS=https://aialcohol.leyluz.com,https://www.leyluz.com
_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '').strip()
CSRF_TRUSTED_ORIGINS = [x.strip() for x in _csrf_origins.split(',') if x.strip()]

from corsheaders.defaults import default_headers

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

_template_ctx = [
    'django.template.context_processors.request',
    'django.contrib.auth.context_processors.auth',
    'django.contrib.messages.context_processors.messages',
]
if DEBUG:
    _template_ctx.insert(0, 'django.template.context_processors.debug')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': _template_ctx,
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

if os.environ.get('POSTGRES_DB'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB'),
            'USER': os.environ.get('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
            'HOST': os.environ.get('POSTGRES_HOST', 'db'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
            'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '60')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'OPTIONS': {
                'timeout': 25,
            },
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'Europe/Madrid'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
# Medios (vídeos): por defecto backend/media. Para guardar en OneDrive, sincroniza una carpeta
# con el cliente de OneDrive y apunta MEDIA_ROOT_PATH a esa ruta absoluta (o un volumen montado).
_media_override = os.environ.get('MEDIA_ROOT_PATH') or os.environ.get('DJANGO_MEDIA_ROOT')
if _media_override:
    MEDIA_ROOT = Path(_media_override).expanduser().resolve()
else:
    MEDIA_ROOT = BASE_DIR / 'media'

# Tamaño máximo de un vídeo por subida (Full HD ~2 min @ 60 Hz con bitrate alto ≈ 50 Mb/s → ~750 MB + margen).
# Ajusta con MAX_VIDEO_UPLOAD_MB. En nginx: client_max_body_size >= mismo valor (ej. 900m).
MAX_VIDEO_UPLOAD_MB = int(os.environ.get('MAX_VIDEO_UPLOAD_MB', '850'))
MAX_VIDEO_UPLOAD_BYTES = max(1, MAX_VIDEO_UPLOAD_MB) * 1024 * 1024

# Por encima de esto el archivo subido va a temporal en disco, no a RAM (ayuda con vídeos grandes).
FILE_UPLOAD_MAX_MEMORY_SIZE = min(12 * 1024 * 1024, MAX_VIDEO_UPLOAD_BYTES)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST + JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.authentication.ViewAsRoleJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# CORS: desarrollo (Vite 5173) y Docker (nginx 3000)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
# En Docker, el navegador puede usar otro host (ej. IP del servidor); añade aquí o usa variable de entorno
if os.environ.get('CORS_ORIGINS'):
    CORS_ALLOWED_ORIGINS.extend(os.environ.get('CORS_ORIGINS', '').split(','))
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-view-as-role',
]

# Menos I/O de logs en producción (DEBUG=False).
if not DEBUG:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'console': {'class': 'logging.StreamHandler'},
        },
        'root': {'handlers': ['console'], 'level': 'WARNING'},
        'loggers': {
            'django.request': {'handlers': ['console'], 'level': 'ERROR', 'propagate': False},
        },
    }
