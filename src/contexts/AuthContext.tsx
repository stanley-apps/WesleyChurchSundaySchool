import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }> // New: Reset password function
}

// Add notification context for logout messages
interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // TRIGGER+UPDATE: Do not insert, only update the display_name after signup
  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error || !data?.user) {
      return { error }
    }

    // Update the display_name for the new user's profile (created by trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('user_id', data.user.id)

    // Prefer to return the profile error if user was created
    return { error: profileError || error }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      // Clear any local storage or session storage if needed
      // Removed manual clearing of local/session storage, relying on Supabase's signOut and onAuthStateChange.
      
      // Show success notification
      showNotification('Successfully logged out! 👋', 'success')
    } catch (error: any) {
      console.error('Logout error:', error)
      showNotification('Error during logout. Please try again.', 'error')
    }
  }

  // New: Reset password function
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`, // Redirect to dashboard after password reset
    });
    return { error };
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type })
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword, // Include new function in context value
  }

  const notificationValue = {
    showNotification,
  }

  return (
    <AuthContext.Provider value={value}>
      <NotificationContext.Provider value={notificationValue}>
        {children}
        {/* Global Notification Component */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className={`px-6 py-3 rounded-lg shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </NotificationContext.Provider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}