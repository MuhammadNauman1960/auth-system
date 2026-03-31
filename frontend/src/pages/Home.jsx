import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-10 text-center">

        {/* Avatar */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-500 mb-1">{user?.email}</p>
        <p className="text-gray-400 text-sm mb-10">You are successfully logged in.</p>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-left">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Account Info</p>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white
            font-semibold px-8 py-3 rounded-lg transition duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}
