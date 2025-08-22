import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Correct import path
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';
import { useNotification } from '../contexts/AuthContext'; // Keep useNotification

export function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetRequested, setIsResetRequested] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const resetRequested = sessionStorage.getItem('passwordResetRequested');
    setIsResetRequested(!!resetRequested);

    // Clean up the flag after checking
    // This ensures the flag is only active for one visit to this page
    // and prevents direct access without a reset flow.
    return () => {
      sessionStorage.removeItem('passwordResetRequested');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isResetRequested) {
      showNotification('Password reset not initiated. Please use the "Forgot Password" link.', 'error');
      navigate('/login');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }
      showNotification('Your password has been updated successfully! ✅', 'success');
      sessionStorage.removeItem('passwordResetRequested'); // Clear flag on success
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message);
      showNotification('Failed to update password: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // If reset was not requested, redirect immediately
  if (!loading && !isResetRequested) {
    // Only redirect if not currently loading (to avoid flicker) and not requested
    // This handles direct access to /update-password without a reset flow
    navigate('/login'); // Redirect to login if no reset was requested
    return null;
  }

  return (
    <ChildFriendlyBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Set New Password 🔑</h1>
            <p className="text-gray-700 drop-shadow-sm">
              Please enter and confirm your new password.
            </p>
          </div>

          {error && (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                placeholder="Enter your new password"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                placeholder="Confirm your new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                '✅ Update Password'
              )}
            </button>
            <Link
              to="/dashboard"
              className="block text-center text-blue-600 hover:text-blue-800 font-medium mt-4"
            >
              Back to Dashboard
            </Link>
          </form>
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}