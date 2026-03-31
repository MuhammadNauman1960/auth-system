import axios from 'axios'

// Read base URL from .env  →  VITE_API_BASE_URL=http://localhost:8000/api
// Falls back to localhost for development if the variable is not set.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
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
