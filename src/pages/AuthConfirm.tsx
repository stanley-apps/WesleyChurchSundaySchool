import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';
import { useNotification } from '../contexts/AuthContext';

export function AuthConfirm() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      const params = new URLSearchParams(window.location.hash.substring(1)); // Get params from hash
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type'); // e.g., 'recovery'

      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setMessage('Failed to confirm authentication. Please try again.');
            showNotification('Failed to confirm authentication. Please try again.', 'error');
            navigate('/login'); // Redirect to login on error
            return;
          }

          // If it's a password recovery, set a flag and redirect to update-password
          if (type === 'recovery') {
            sessionStorage.setItem('passwordResetRequested', 'true');
            showNotification('Please set your new password.', 'info');
            navigate('/update-password');
          } else {
            // For other types of auth confirmation (e.g., email verification), redirect to dashboard
            showNotification('Authentication successful!', 'success');
            navigate('/dashboard');
          }
        } catch (err: any) {
          console.error('Unexpected error during auth confirmation:', err);
          setMessage('An unexpected error occurred. Please try again.');
          showNotification('An unexpected error occurred. Please try again.', 'error');
          navigate('/login');
        }
      } else {
        // No tokens found, likely an invalid redirect or direct access
        setMessage('Invalid authentication link or no tokens found.');
        showNotification('Invalid authentication link.', 'error');
        navigate('/login');
      }
      setLoading(false);
    };

    handleAuthConfirmation();
  }, [navigate, showNotification]);

  return (
    <ChildFriendlyBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">{message}</p>
            </>
          ) : (
            <p className="text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  );
}