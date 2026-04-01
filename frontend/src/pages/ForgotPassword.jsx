import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

// Response codes sent by the backend for differentiated handling
const CODE_NOT_FOUND = 'account_not_found'
const CODE_INACTIVE  = 'account_inactive'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail]           = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError]     = useState('')
  const [apiCode, setApiCode]       = useState('')   // backend 'code' field
  const [success, setSuccess]       = useState(false)
  const [loading, setLoading]       = useState(false)

  // ── Client-side validation ──────────────────────────────────────────────────
  const validate = () => {
    if (!email.trim())                   return 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(email))     return 'Invalid email address.'
    return ''
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (emailError) setEmailError('')
    if (apiError)   setApiError('')
    if (apiCode)    setApiCode('')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErr = validate()
    if (validationErr) { setEmailError(validationErr); return }

    setLoading(true)
    try {
      await api.post('/accounts/forgot-password/', { email })
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data ?? {}
      setApiError(data.error || 'Something went wrong. Please try again.')
      setApiCode(data.code  || '')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0
                   00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Check Your Email</h2>
          <p className="text-gray-600 text-sm mb-2">We sent a password reset link to</p>
          <p className="text-blue-600 font-semibold mb-4">{email}</p>
          <p className="text-gray-500 text-sm mb-8">
            Click the link in the email to reset your password.
            The link expires in <strong>1 hour</strong>.
            <span className="block mt-1 text-xs">Didn't receive it? Check your spam folder.</span>
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold
              px-8 py-3 rounded-lg transition text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  // ── Account-not-found screen ────────────────────────────────────────────────
  // Shown when the backend returns code === 'account_not_found' (HTTP 404).
  if (apiCode === CODE_NOT_FOUND) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0
                   001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Not Found</h2>

          {/* Email badge */}
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200
            rounded-lg px-4 py-2 mb-4">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0
                   00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600 font-medium">{email}</span>
          </div>

          <p className="text-gray-500 text-sm mb-8">
            No account is registered with this email address.
            <br />
            Would you like to create a new account?
          </p>

          <div className="flex flex-col gap-3">
            {/* Primary CTA — go register */}
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold
                py-3 rounded-lg transition text-sm"
            >
              Create an Account
            </button>

            {/* Secondary — try a different email */}
            <button
              onClick={() => { setApiCode(''); setApiError(''); setEmail('') }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold
                py-3 rounded-lg transition text-sm"
            >
              Try a Different Email
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            Already have an account?{' '}
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0
                   01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Forgot Password?</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* API error banner — generic errors (not account_not_found) */}
        {apiError && apiCode !== CODE_NOT_FOUND && (
          <div className={`flex items-start gap-2 px-4 py-3 rounded-lg mb-6 text-sm border
            ${apiCode === CODE_INACTIVE
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012
                   0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            <span>
              {apiError}
              {/* If account is inactive, nudge them toward their inbox */}
              {apiCode === CODE_INACTIVE && (
                <span className="block mt-1 text-xs">
                  Check your spam folder if you can't find the activation email.
                </span>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${emailError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>

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
                Sending reset link…
              </span>
            ) : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Create one
            </Link>
          </p>
          <p>
            Remember your password?{' '}
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
