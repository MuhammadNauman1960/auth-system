import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

export default function ActivatePage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [state, setState] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(3)

  // ─── FIX: React 18 StrictMode mounts → unmounts → remounts every component
  // in development, causing useEffect to fire TWICE.
  // Call #1 activates the account and deletes the token from the DB.
  // Call #2 can't find the token → returns 400 → frontend shows "Failed".
  // The ref persists across the simulated remount, so we use it as a one-shot guard.
  const activationAttempted = useRef(false)

  useEffect(() => {
    if (activationAttempted.current) return // already called — skip second invocation
    activationAttempted.current = true

    const activate = async () => {
      try {
        const { data } = await api.get(`/accounts/activate/${token}/`)
        setMessage(data.message)
        setState('success')
      } catch (err) {
        setMessage(
          err.response?.data?.error || 'Activation failed. Please try again.'
        )
        setState('error')
      }
    }

    activate()
  }, [token])

  // Auto-redirect to login 3 s after successful activation
  useEffect(() => {
    if (state !== 'success') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">

        {/* ── Loading ── */}
        {state === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">Activating your account…</h2>
            <p className="text-gray-400 text-sm mt-2">Please wait a moment.</p>
          </>
        )}

        {/* ── Success ── */}
        {state === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Activated!</h2>
            <p className="text-gray-600 text-sm mb-1">{message}</p>
            <p className="text-gray-400 text-xs mb-6">
              Redirecting to login in{' '}
              <span className="font-semibold text-blue-600">{countdown}s</span>…
            </p>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              />
            </div>

            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold
                px-8 py-3 rounded-lg transition text-sm"
            >
              Go to Login Now
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Activation Failed</h2>
            <p className="text-gray-600 text-sm mb-8">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold
                  px-6 py-3 rounded-lg transition text-sm"
              >
                Register Again
              </Link>
              <Link
                to="/"
                className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold
                  px-6 py-3 rounded-lg transition text-sm"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
