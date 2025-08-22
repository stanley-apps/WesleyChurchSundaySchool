import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useNotification } from '../contexts/AuthContext';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';

export function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, updateUserPassword } = useAuth(); // Assuming updateUserPassword is added to useAuth
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to update your password. Please try the reset link again.');
      showNotification('Authentication error. Please try the reset link again.', 'error');
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
      const { error: updateError } = await updateUserPassword(newPassword); // Call the new function
      if (updateError) {
        throw updateError;
      }
      showNotification('Your password has been updated successfully! ✅', 'success');
      navigate('/dashboard'); // Redirect to dashboard after successful update
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message);
      showNotification('Failed to update password: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

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