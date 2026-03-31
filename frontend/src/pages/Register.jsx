import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import PasswordInput from '../components/PasswordInput'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) {
      errs.name = 'Full name is required.'
    }
    if (!formData.email.trim()) {
      errs.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Enter a valid email address.'
    }
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
      await api.post('/accounts/register/', formData)
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const fieldNames = ['name', 'email', 'password', 'confirm_password']
        const fieldErrs = {}
        let general = ''
        Object.entries(data).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val
          if (fieldNames.includes(key)) {
            fieldErrs[key] = msg
          } else {
            general = msg
          }
        })
        if (Object.keys(fieldErrs).length) setErrors(fieldErrs)
        if (general) setApiError(general)
      } else {
        setApiError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Check Your Email!</h2>
          <p className="text-gray-600 text-sm mb-1">We've sent an activation link to</p>
          <p className="text-blue-600 font-semibold mb-4">{formData.email}</p>
          <p className="text-gray-500 text-sm mb-8">
            Click the link in the email to activate your account.
            The link expires in <strong>24 hours</strong>.
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

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0
                   018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 mt-1">Join us — it only takes a minute</p>
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
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password — eye toggle */}
          <PasswordInput
            id="reg-password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            error={errors.password}
          />

          {/* Confirm Password — eye toggle */}
          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            label="Confirm Password"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder="Repeat your password"
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
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
