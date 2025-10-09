import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground';
import { useNotification } from '../contexts/AuthContext';

export function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying authentication...');

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type'); // Should be 'recovery' for password resets

      console.log('AuthConfirm: Received params:', { token_hash, type });

      if (!token_hash || !type) {
        console.error('AuthConfirm: Missing token_hash or type in URL.');
        setMessage('Invalid authentication link. Please try again from the "Forgot Password" link.');
        showNotification('Invalid authentication link.', 'error');
        setLoading(false);
        navigate('/login', { state: { error: 'Invalid authentication link: Missing token or type.' } });
        return;
      }

      if (type !== 'recovery') {
        console.warn('AuthConfirm: Unexpected authentication type:', type);
        setMessage('Unsupported authentication type. Redirecting to dashboard.');
        showNotification('Authentication successful!', 'success');
        setLoading(false);
        navigate('/dashboard'); // Or handle other types if needed
        return;
      }

      try {
        // Use verifyOtp for 'recovery' type
        const { error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: token_hash,
        });

        if (error) {
          console.error('AuthConfirm: Supabase verifyOtp error:', error);
          setMessage('Failed to verify password reset link. Please try again.');
          showNotification('Failed to verify password reset link: ' + error.message, 'error');
          setLoading(false);
          navigate('/login', { state: { error: 'Password reset verification failed.', details: error.message } });
          return;
        }

        // If verification is successful, set the flag and redirect to update-password
        sessionStorage.setItem('passwordResetRequested', 'true');
        showNotification('Please set your new password.', 'info');
        setLoading(false);
        navigate('/update-password');

      } catch (err: any) {
        console.error('AuthConfirm: Unexpected error during verification:', err);
        setMessage('An unexpected error occurred during verification. Please try again.');
        showNotification('An unexpected error occurred: ' + err.message, 'error');
        setLoading(false);
        navigate('/login', { state: { error: 'An unexpected error occurred during verification.', details: err.message } });
      }
    };

    handleAuthConfirmation();
  }, [searchParams, navigate, showNotification]);

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