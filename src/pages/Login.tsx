import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const { user, signIn, signUp } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = showSignup 
      ? await signUp(email, password)
      : await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else if (showSignup) {
      setError('')
      alert('Demo user created successfully! You can now sign in.')
      setShowSignup(false)
      setEmail('')
      setPassword('')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sunday School Hub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showSignup ? 'Create demo user account' : 'Sign in to access your dashboard'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field mt-1"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field mt-1"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (showSignup ? 'Creating...' : 'Signing in...') : (showSignup ? 'Create Demo User' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowSignup(!showSignup)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSignup ? 'Already have an account? Sign in' : 'Need to create demo user? Click here'}
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium">Demo Credentials:</p>
              <p>Email: demo@example.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}