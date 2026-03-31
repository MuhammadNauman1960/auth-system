#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Render build script — runs once before the web service starts.
# Render executes this as:  bash build.sh
# ─────────────────────────────────────────────────────────────────────────────
set -o errexit   # exit immediately on any error

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --no-input

echo "==> Applying database migrations..."
python manage.py migrate

echo "==> Build complete."
