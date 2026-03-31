# Deployment Guide

Full-stack Django + React authentication system.
- **Backend** → [Render.com](https://render.com) (free tier)
- **Frontend** → [Vercel](https://vercel.com) (free tier)

---

## Prerequisites

| Tool | Why needed |
|------|-----------|
| GitHub account | Both Render and Vercel deploy from GitHub |
| Render account | Hosts the Django backend |
| Vercel account | Hosts the React frontend |
| Gmail App Password | SMTP email sending |

### Generate a Gmail App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sign in → Select app: **Mail** → Select device: **Other** → name it `auth-app`
3. Copy the 16-character password — you'll need it later

---

## Step 1 — Push Code to GitHub

Create **two separate repositories** (one for backend, one for frontend):

```bash
# Backend repo
cd "Complete Authentication system/backend"
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/auth-backend.git
git push -u origin main

# Frontend repo
cd "../frontend"
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/YOUR_USERNAME/auth-frontend.git
git push -u origin main
```

> **Important:** The `frontend/.env` file contains local dev values only.
> Do NOT commit real secrets. Vercel and Render have their own env var UIs.

---

## Step 2 — Deploy Backend on Render

### 2a. Create a Web Service

1. Log in to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub account and select **auth-backend**
4. Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `auth-backend` (or any name) |
| **Region** | Closest to your users |
| **Branch** | `main` |
| **Runtime** | **Python 3** |
| **Build Command** | `bash build.sh` |
| **Start Command** | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| **Plan** | Free |

5. Click **Create Web Service**

Render will attempt the first build. It will **fail** at this point — that is expected because environment variables are not set yet.

### 2b. Copy Your Render URL

After the service is created, copy the URL at the top:
```
https://auth-backend-xxxx.onrender.com
```

### 2c. Set Environment Variables

In the Render dashboard → your service → **Environment** tab, add:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | *(generate a random 50-char string)* | Use [djecrety.ir](https://djecrety.ir) |
| `DEBUG` | `False` | Must be exactly `False` |
| `ALLOWED_HOSTS` | `auth-backend-xxxx.onrender.com` | Your Render URL without `https://` |
| `CORS_ALLOWED_ORIGINS` | `https://auth-frontend.vercel.app` | Set after Step 3 |
| `FRONTEND_URL` | `https://auth-frontend.vercel.app` | Set after Step 3 |
| `EMAIL_HOST_USER` | `your-email@gmail.com` | |
| `EMAIL_HOST_PASSWORD` | `abcd efgh ijkl mnop` | 16-char Gmail App Password |

> After adding env vars, click **Save Changes** → Render auto-redeploys.

### 2d. Verify Backend is Live

Visit:
```
https://auth-backend-xxxx.onrender.com/admin/
```
You should see the Django admin login page. ✅

---

## Step 3 — Deploy Frontend on Vercel

### 3a. Import Project

1. Log in to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import **auth-frontend** from GitHub
4. Vercel auto-detects Vite. Keep default settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or `frontend/` if using a monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3b. Set Environment Variables

Before deploying, click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://auth-backend-xxxx.onrender.com/api` |

> Replace `auth-backend-xxxx` with your actual Render service name.

### 3c. Deploy

Click **Deploy**. After ~1 minute, Vercel gives you a URL:
```
https://auth-frontend.vercel.app
```

### 3d. Update Backend with Vercel URL

Go back to Render → Environment and update:

| Key | Value |
|-----|-------|
| `CORS_ALLOWED_ORIGINS` | `https://auth-frontend.vercel.app` |
| `FRONTEND_URL` | `https://auth-frontend.vercel.app` |

Render will redeploy automatically.

---

## Step 4 — End-to-End Test

1. Open `https://auth-frontend.vercel.app`
2. Register a new account with a real email
3. Check your inbox — activation email should arrive within ~30 seconds
4. Click the activation link → redirected to login ✅
5. Log in → see Home page ✅
6. Test Forgot Password flow ✅

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | ✅ | `django-long-random-string...` | Django secret key |
| `DEBUG` | ✅ | `False` | Must be `False` in production |
| `ALLOWED_HOSTS` | ✅ | `auth-api.onrender.com` | Comma-separated, no `https://` |
| `CORS_ALLOWED_ORIGINS` | ✅ | `https://auth-frontend.vercel.app` | Comma-separated, with `https://` |
| `FRONTEND_URL` | ✅ | `https://auth-frontend.vercel.app` | Used in email activation links |
| `EMAIL_HOST_USER` | ✅ | `you@gmail.com` | Gmail address |
| `EMAIL_HOST_PASSWORD` | ✅ | `abcd efgh ijkl mnop` | Gmail App Password (16 chars) |
| `DB_PATH` | ⚠️ | `/data/db.sqlite3` | Only needed if using a Render Disk |

### Frontend (Vercel)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | ✅ | `https://auth-api.onrender.com/api` | Backend API base URL |

---

## SQLite on Render — Persistence Warning

Render's **free tier uses ephemeral storage**. This means:
- The `db.sqlite3` file is **deleted on every deploy and restart**
- All users/data are lost when the service restarts

### Option A — Render Disk (Recommended for SQLite)

1. Render dashboard → your service → **Disks** → **Add Disk**
2. Mount path: `/data`
3. Size: 1 GB (free)
4. Add env var: `DB_PATH=/data/db.sqlite3`

The disk persists across deploys and restarts.

### Option B — Upgrade to PostgreSQL (Recommended for Production)

1. Render dashboard → **New** → **PostgreSQL**
2. Copy the **Internal Database URL**
3. Add to `requirements.txt`: `dj-database-url==2.1.0` + `psycopg2-binary==2.9.9`
4. In `settings.py`, replace the DATABASES block with:

```python
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', f'sqlite:///{BASE_DIR / "db.sqlite3"}')
    )
}
```

5. Add `DATABASE_URL` env var on Render with the PostgreSQL connection string.

---

## Common Deployment Errors & Fixes

### ❌ `DisallowedHost at /`
```
Invalid HTTP_HOST header: 'auth-backend.onrender.com'
```
**Cause:** `ALLOWED_HOSTS` doesn't include the Render domain.
**Fix:** Set `ALLOWED_HOSTS=auth-backend.onrender.com` in Render env vars.

---

### ❌ `CORS error` in browser console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Cause:** `CORS_ALLOWED_ORIGINS` doesn't include the Vercel frontend URL.
**Fix:** Set `CORS_ALLOWED_ORIGINS=https://your-app.vercel.app` in Render env vars.
Make sure the value includes `https://` and has **no trailing slash**.

---

### ❌ Activation link redirects to `localhost`
```
http://localhost:5173/activate/...   ← appears in email
```
**Cause:** `FRONTEND_URL` env var is not set on Render (defaults to localhost).
**Fix:** Set `FRONTEND_URL=https://your-app.vercel.app` in Render env vars.

---

### ❌ `Page Not Found (404)` on refresh in Vercel
Refreshing `/home` or `/activate/...` returns a 404.
**Cause:** Vercel doesn't know these are React Router paths, not real files.
**Fix:** The `vercel.json` in the frontend repo handles this:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
Make sure this file is committed and deployed.

---

### ❌ `500 Internal Server Error` — Static files
```
ValueError: Missing staticfiles manifest entry for 'admin/...`
```
**Cause:** `collectstatic` was not run or failed silently.
**Fix:** Check Render build logs. Ensure `build.sh` runs `python manage.py collectstatic --no-input`.

---

### ❌ Email not sending — `SMTPAuthenticationError`
**Cause:** Wrong Gmail credentials or 2FA not set up properly.
**Fix:**
1. Make sure **2-Step Verification** is ON for your Google account
2. Generate an **App Password** (not your regular password):
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the 16-character App Password as `EMAIL_HOST_PASSWORD`
4. Use your full Gmail address as `EMAIL_HOST_USER`

---

### ❌ Render free tier spins down after 15 minutes of inactivity
The first request after idle takes ~30 seconds (cold start).
**Fix:** This is a Render free tier limitation. Upgrade to a paid plan, or use
[UptimeRobot](https://uptimerobot.com) to ping your service every 14 minutes.

---

## Final Deployment Checklist

- [ ] Backend repo pushed to GitHub
- [ ] Frontend repo pushed to GitHub
- [ ] Render web service created with correct build + start commands
- [ ] All backend env vars set on Render
- [ ] Vercel project created with `VITE_API_BASE_URL` set
- [ ] `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` updated on Render with Vercel URL
- [ ] Render Disk added (or PostgreSQL) for data persistence
- [ ] End-to-end test: register → email → activate → login → logout ✅
- [ ] Forgot password flow tested ✅
