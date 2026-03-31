import { useState } from 'react'

// Eye-open icon
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

// Eye-off icon
function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
           M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29
           m7.532 7.532l3.29 3.29M3 3l3.59 3.59
           m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
           a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

/**
 * Reusable password field with show/hide toggle.
 *
 * Props:
 *   name         – input name attribute
 *   value        – controlled value
 *   onChange     – change handler
 *   placeholder  – placeholder text
 *   error        – validation error string (shown in red below the input)
 *   label        – label text (optional)
 *   id           – id for <label htmlFor> linking (defaults to name)
 */
export default function PasswordInput({
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  error,
  label,
  id,
}) {
  const [visible, setVisible] = useState(false)
  const inputId = id || name

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === 'confirm_password' ? 'new-password' : name === 'password' ? 'current-password' : 'off'}
          className={`w-full px-4 py-3 pr-12 rounded-lg border text-sm transition
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
            hover:text-gray-600 focus:outline-none transition"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
