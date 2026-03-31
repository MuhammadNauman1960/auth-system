import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import PasswordInput from '../components/PasswordInput'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  // Token validity check (same StrictMode guard as ActivatePage)
  const validationAttempted = useRef(false)
  const [tokenState, setTokenState] = useState('validating') // validating | valid | invalid
  const [tokenError, setTokenError] = useState('')

  // Form state
  const [formData, setFormData] = useState({ password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Validate token on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (validationAttempted.current) return
    validationAttempted.current = true

    const check = async () => {
      try {
        await api.get(`/accounts/validate-reset-token/${token}/`)
        setTokenState('valid')
      } catch (err) {
        setTokenError(
          err.response?.data?.error || 'Invalid or expired reset link.'
        )
        setTokenState('invalid')
      }
    }
    check()
  }, [token])

  // ── Form helpers ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!formData.password) {
      errs.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    }
    if (!formData.confirm_password) {
      errs.confirm_password = 'Please confirm your password.'
    } else if (formData.password !== formData.confirm_password) {
      errs.confirm_password = 'Passwords do not match.'
    }
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await api.post(`/accounts/reset-password/${token}/`, formData)
      setSuccess(true)
    } catch (err) {
      setApiError(
        err.response?.data?.error || 'Failed to reset password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Validating token (loading) ──────────────────────────────────────────────
  if (tokenState === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Verifying reset link…</h2>
          <p className="text-gray-400 text-sm mt-2">Please wait a moment.</p>
        </div>
      </div>
    )
  }

  // ── Invalid / expired token ─────────────────────────────────────────────────
  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Link Invalid or Expired</h2>
          <p className="text-gray-600 text-sm mb-8">{tokenError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/forgot-password"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold
                px-6 py-3 rounded-lg transition text-sm"
            >
              Request New Link
            </Link>
            <Link
              to="/"
              className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold
                px-6 py-3 rounded-lg transition text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Password Reset!</h2>
          <p className="text-gray-600 text-sm mb-8">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold
              px-8 py-3 rounded-lg transition text-sm"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // ── Reset password form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0
                   00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Set New Password</h1>
          <p className="text-gray-500 mt-1 text-sm">Must be at least 8 characters.</p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700
            px-4 py-3 rounded-lg mb-6 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1
                   0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <PasswordInput
            id="new-password"
            name="password"
            label="New Password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            error={errors.password}
          />

          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            label="Confirm New Password"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder="Repeat new password"
            error={errors.confirm_password}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg
              transition duration-200 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Resetting password…
              </span>
            ) : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
