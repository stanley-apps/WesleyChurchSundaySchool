import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom' // Added useNavigate
import { useAuth, useNotification } from '../contexts/AuthContext' // Import useNotification

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [localError, setLocalError] = useState('') // Renamed to avoid conflict with location.state.error
  const [loading, setLoading] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { user, signIn, signUp, resetPassword } = useAuth()
  const { showNotification } = useNotification()
  const location = useLocation() // Get location object
  const navigate = useNavigate() // Initialized useNavigate

  // Effect to check for errors passed via navigation state
  useEffect(() => {
    const state = location.state as { error?: string, details?: string } | undefined;
    if (state?.error) {
      console.error('Login Page received error from navigation state:', state.error, state.details);
      setLocalError(state.error); // Set local error state
      showNotification(state.error + (state.details ? ` Details: ${state.details}` : ''), 'error');
      // Clear the state so the error doesn't persist on subsequent visits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, showNotification, navigate]); // Added navigate to dependency array


  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('') // Clear local error before new submission
    setLoading(true)

    if (showForgotPassword) {
      const { error } = await resetPassword(email);
      if (error) {
        setLocalError(error.message);
        showNotification('Error sending reset link: ' + error.message, 'error');
      } else {
        showNotification('Password reset link sent to your email!', 'success');
        setShowForgotPassword(false); // Hide form on success
        setEmail(''); // Clear email
      }
    } else if (showSignup) {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        setLocalError(error.message);
        showNotification('Error creating account: ' + error.message, 'error');
      } else {
        showNotification('Account created successfully! Please sign in.', 'success');
        setShowSignup(false);
        setEmail('');
        setPassword('');
        setDisplayName('');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setLocalError(error.message);
        showNotification('Error signing in: ' + error.message, 'error');
      }
    }
    
    setLoading(false)
  }

  const toggleForm = (formType: 'login' | 'signup' | 'forgotPassword') => {
    setLocalError(''); // Clear errors when switching forms
    setEmail('');
    setPassword('');
    setDisplayName('');
    setShowSignup(formType === 'signup');
    setShowForgotPassword(formType === 'forgotPassword');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
           Wesley Church Sunday School Hub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showForgotPassword ? 'Enter your email to reset password' : (showSignup ? 'Create your account' : 'Sign in to access your dashboard')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {showSignup && !showForgotPassword && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className="input-field mt-1"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
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
            
            {!showForgotPassword && (
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
            )}
          </div>

          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {localError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (showForgotPassword ? 'Sending...' : (showSignup ? 'Creating...' : 'Signing in...')) : (showForgotPassword ? 'Send Reset Link' : (showSignup ? 'Create Account' : 'Sign In'))}
            </button>
          </div>

          <div className="text-center text-sm">
            {!showForgotPassword && (
              <>
                <button
                  type="button"
                  onClick={() => toggleForm(showSignup ? 'login' : 'signup')}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {showSignup ? 'Already have an account? Sign in' : 'Need to create an account? Sign up'}
                </button>
                <br />
              </>
            )}
            <button
              type="button"
              onClick={() => toggleForm(showForgotPassword ? 'login' : 'forgotPassword')}
              className="font-medium text-blue-600 hover:text-blue-800 mt-2"
            >
              {showForgotPassword ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
          </div>
          
          {/*          <div className="text-center"> 
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium">Demo Credentials:</p>
              <p>Email: demo@example.com</p>
              <p>Password: password123</p> 
            </div>
          </div> */}
        </form>
      </div>
    </div>
  )
}