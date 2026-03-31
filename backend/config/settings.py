"""
Django settings — development + production.

All environment-specific values are read from environment variables so the
same codebase runs locally (with .env defaults) and on Render without any
code changes.

Quick reference — env vars you MUST set on Render:
  SECRET_KEY            → any long random string
  DEBUG                 → False
  ALLOWED_HOSTS         → your-app.onrender.com
  CORS_ALLOWED_ORIGINS  → https://your-app.vercel.app
  FRONTEND_URL          → https://your-app.vercel.app
  EMAIL_HOST_USER       → your-gmail@gmail.com
  EMAIL_HOST_PASSWORD   → your-gmail-app-password
"""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


# ── Security ──────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-dev-only-key-REPLACE-BEFORE-DEPLOYING-xyz123',
)

# Set DEBUG=False on Render. Defaults to True for local dev.
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Comma-separated list of allowed hostnames.
# Local default: localhost + 127.0.0.1
# Render: set to "your-app.onrender.com" (no scheme, no trailing slash)
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if h.strip()
]


# ── HTTPS / Security Headers (auto-enabled when DEBUG=False) ──────────────────
# Render terminates SSL at its load balancer and forwards requests over HTTP,
# so we trust the X-Forwarded-Proto header it injects.

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000          # 1 year
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
# Order matters:
#   1. CorsMiddleware  — must be before CommonMiddleware
#   2. SecurityMiddleware — must be first Django middleware
#   3. WhiteNoiseMiddleware — right after SecurityMiddleware to serve static files

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
# SQLite is fine for development and demos.
#
# ⚠️  RENDER FREE TIER WARNING: Render's free web services use an ephemeral
# filesystem — the SQLite file is WIPED on every deploy or restart.
# To persist data on Render you have two options:
#   Option A (easy):  Add a Render Disk (free tier: 1 GB) mounted at /data,
#                     then set: 'NAME': '/data/db.sqlite3'
#   Option B (recommended for production):
#                     Use Render's managed PostgreSQL and dj-database-url.

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


# ── Django REST Framework ────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins.
# Local default: Vite dev server
# Render env var: https://your-app.vercel.app
#
# Example for multiple origins:
#   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com

_cors_origins = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]


# ── Static Files (served by WhiteNoise) ───────────────────────────────────────
# WhiteNoise compresses and fingerprints static files so Django can serve them
# directly from Render without a separate CDN or S3 bucket.

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Django 4.2+ uses STORAGES dict instead of STATICFILES_STORAGE setting.
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}


# ── Internationalisation ──────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ── Email (Gmail SMTP) ────────────────────────────────────────────────────────
# For local dev you can temporarily switch to the console backend:
#   EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
#
# In production, set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD on Render.
# Gmail requires a 16-character App Password (not your account password).
# Generate one at: https://myaccount.google.com/apppasswords

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')

# Gmail SMTP requires From == authenticated account address.
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# ── Frontend URL (used in email links) ───────────────────────────────────────
# This is the URL that appears in activation / password-reset emails.
# Local default: Vite dev server
# Render env var: https://your-app.vercel.app  (no trailing slash)

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
