import axios from 'axios'

// ── Build the API base URL ────────────────────────────────────────────────────
//
// ROOT-CAUSE FIX:
// Previously, baseURL was used EXACTLY as provided by the env var, with no
// normalisation.  This caused two production bugs:
//
// Bug 1 — Missing /api suffix:
//   VITE_API_BASE_URL was set on Vercel as "https://backend.onrender.com"
//   (without /api), so requests went to /accounts/register/ instead of
//   /api/accounts/register/.
//
// Bug 2 — Trailing-slash duplication:
//   If the env var ended with "/" and the request path started with "/", the
//   URL had a double slash in the middle, which some servers reject.
//
// FIX: strip any trailing slashes from the base URL, then ensure it ends
// with /api. All request paths in the codebase already start with "/accounts/…"
// so the final URL becomes: https://backend.onrender.com/api/accounts/register/

let rawBase = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
).replace(/\/+$/, '')  // strip trailing slashes

// If someone sets just the domain without /api, append it automatically
if (!rawBase.endsWith('/api')) {
  rawBase += '/api'
}

const api = axios.create({
  baseURL: rawBase,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT access token to every outgoing request when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
