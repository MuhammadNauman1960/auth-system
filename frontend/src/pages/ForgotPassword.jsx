import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email.trim()) return 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email address.'
    return ''
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (emailError) setEmailError('')
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setEmailError(err)
      return
    }
    setLoading(true)
    try {
      await api.post('/accounts/forgot-password/', { email })
      setSuccess(true)
    } catch (err) {
      // Even on server-level errors we show a generic message to prevent enumeration
      setApiError(
        err.response?.data?.error || 'Something went wrong. Please try again.'
      )
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0
                   002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Check Your Email</h2>
          <p className="text-gray-600 text-sm mb-2">We sent a reset link to</p>
          <p className="text-blue-600 font-semibold mb-4">{email}</p>
          <p className="text-gray-500 text-sm mb-8">
            Click the link in the email to reset your password.
            The link expires in <strong>1 hour</strong>.
            <br />
            <span className="text-xs mt-1 block">
              Didn't receive it? Check your spam folder.
            </span>
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

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1
                   1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Forgot Password?</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
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

        <p className="text-center text-gray-500 text-sm mt-6">
          Remember your password?{' '}
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
