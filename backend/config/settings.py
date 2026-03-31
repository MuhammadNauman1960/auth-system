"""
Django settings — works identically in local development and on Render/production.

HOW ENV VARS ARE LOADED
───────────────────────
• Locally  : create backend/.env (copy from backend/.env.example).
             python-dotenv loads it automatically at startup.
• On Render: set vars directly in the Render dashboard → Environment tab.
             No .env file is needed or used on the server.

REQUIRED ENV VARS ON RENDER
────────────────────────────
  SECRET_KEY            long random string (Render can auto-generate)
  DEBUG                 False
  ALLOWED_HOSTS         auth-system-2-zk0x.onrender.com
  CORS_ALLOWED_ORIGINS  https://auth-system-yp4o.vercel.app
  FRONTEND_URL          https://auth-system-yp4o.vercel.app
  EMAIL_HOST_USER       your-gmail@gmail.com
  EMAIL_HOST_PASSWORD   16-char Gmail App Password
"""

import logging
import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Load .env file for local development ─────────────────────────────────────
# On Render, real env vars are set in the dashboard — this block is a no-op.
# Locally, create backend/.env (see backend/.env.example) with your credentials.
try:
    from dotenv import load_dotenv
    _env_file = BASE_DIR / '.env'
    if _env_file.exists():
        load_dotenv(_env_file)
except ImportError:
    pass   # python-dotenv not installed; rely on real environment variables


# ── Core security ─────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-dev-only-REPLACE-BEFORE-DEPLOYING-xyz123abc',
)

# Locally: True (default).  On Render: set DEBUG=False env var.
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Comma-separated hostnames — no scheme, no trailing slash.
# Local default  : localhost,127.0.0.1
# Render env var : auth-system-2-zk0x.onrender.com
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if h.strip()
]


# ── HTTPS / Security headers (auto-enabled in production) ────────────────────
# Render's load-balancer terminates TLS and forwards plain HTTP with an
# X-Forwarded-Proto: https header — we trust that header here.

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31_536_000        # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ── Installed apps ────────────────────────────────────────────────────────────

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
    'accounts',
]


# ── Middleware ────────────────────────────────────────────────────────────────
# Ordering is critical:
#   CorsMiddleware       — must be FIRST (before any response-generating middleware)
#   SecurityMiddleware   — must be second
#   WhiteNoiseMiddleware — must be directly after SecurityMiddleware

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# ── Database ──────────────────────────────────────────────────────────────────
# ⚠ RENDER FREE TIER: the filesystem is ephemeral — SQLite is wiped on every
#   restart/redeploy. Add a Render Disk (free, 1 GB) mounted at /data and set
#   DB_PATH=/data/db.sqlite3 to persist your data across deploys.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('DB_PATH', str(BASE_DIR / 'db.sqlite3')),
    }
}


# ── Auth ──────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'accounts.CustomUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ── Django REST Framework ─────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # FIX: custom handler converts ANY uncaught exception to a clean JSON
    # response instead of Django's HTML error page.  Without this, SMTP
    # failures (and other unexpected errors) return HTML that the frontend
    # cannot parse, showing a generic "failed" message to the user.
    'EXCEPTION_HANDLER': 'accounts.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated origins WITH scheme, WITHOUT trailing slash.
# Local default   : http://localhost:5173,http://127.0.0.1:5173
# Render env var  : https://auth-system-yp4o.vercel.app

_cors_origins = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]


# ── Static files (WhiteNoise) ─────────────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# FIX: Django 4.2+ requires BOTH 'default' and 'staticfiles' keys in STORAGES.
# Omitting 'default' can raise KeyError when Django accesses the file-storage
# backend (e.g., during middleware init on some Django 5.x minor versions).
STORAGES = {
    'default': {                          # media / upload storage
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {                      # static files → served by WhiteNoise
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}


# ── Localisation ──────────────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ── Email ─────────────────────────────────────────────────────────────────────
# ROOT-CAUSE FIX: the previous code always used SMTP even locally where no
# credentials are set.  That made every register / forgot-password call crash
# with SMTPAuthenticationError → unhandled 500 → HTML response → frontend
# shows "Registration failed".
#
# NEW LOGIC:
#   • If EMAIL_HOST_USER + EMAIL_HOST_PASSWORD are both present → use Gmail SMTP
#   • Otherwise                                                 → use console backend
#     (emails are printed to the Django dev-server terminal; no real email sent)
#
# This means you can develop and test registration/forgot-password locally
# WITHOUT configuring SMTP — the activation link will appear in your terminal.

EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '').strip()
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '').strip()

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    # Production / properly configured local environment
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    # Gmail SMTP requires From address == authenticated account.
    # Using any other address (e.g. noreply@authapp.com) causes rejection.
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
else:
    # No SMTP credentials → fall back to console backend.
    # Activation/reset links are printed to the terminal instead of emailed.
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'noreply@authapp.local'
    logging.warning(
        'EMAIL_HOST_USER / EMAIL_HOST_PASSWORD not set. '
        'Falling back to console email backend — emails will appear in the terminal.'
    )


# ── Frontend URL (used in email links) ───────────────────────────────────────
# Local default   : http://localhost:5173
# Render env var  : https://auth-system-yp4o.vercel.app  (no trailing slash)

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
