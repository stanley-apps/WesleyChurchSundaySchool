import { Link, useLocation, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Songs', href: '/dashboard/songs', icon: '🎵' },
    { name: 'Lessons', href: '/dashboard/lessons', icon: '📚', disabled: false }, // Enabled Lessons
    { name: 'Games', href: '#', icon: '🎮', disabled: true },
    { name: 'Videos', href: '#', icon: '🎥', disabled: true },
  ]

  const handleSignOut = () => {
    setShowLogoutConfirm(true)
  }

  const confirmSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } finally {
      setIsLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  const cancelSignOut = () => {
    setShowLogoutConfirm(false)
  }

  // Helper function to determine if a navigation item is active
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      // Dashboard is active only on exact match or when no other nav item matches
      return location.pathname === '/dashboard' || 
             (location.pathname.startsWith('/dashboard') && 
              !navigation.some(nav => nav.href !== '/dashboard' && nav.href !== '#' && location.pathname.startsWith(nav.href)))
    }
    return location.pathname.startsWith(href) && href !== '#'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            Wesley Church Sunday School Hub
          </Link>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-red-600"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing Out...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
            {/* Sidebar Header */}
            <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <Link to="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Wesley Church Sunday School Hub
              </Link>
            </div>
            
            {/* Navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-4 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = isActiveRoute(item.href)
                  const isDisabled = item.disabled
                  
                  if (isDisabled) {
                    return (
                      <div
                        key={item.name}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed rounded-md"
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span className="flex-1">{item.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      </div>
                    )
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              
              {/* User section */}
              <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      👤 {user?.email}
                    </p>
                    <p className="text-xs text-gray-500">Signed in</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="ml-3 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-red-600"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing Out...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <nav className="flex">
          {navigation.slice(0, 4).map((item) => {
            const isActive = isActiveRoute(item.href)
            const isDisabled = item.disabled
            
            if (isDisabled) {
              return (
                <button
                  key={item.name}
                  disabled
                  className="flex-1 flex flex-col items-center py-4 px-2 text-gray-400 cursor-not-allowed min-h-[60px] touch-manipulation"
                >
                  <div className="w-8 h-8 flex items-center justify-center mb-1">
                    <span className="text-2xl leading-none">{item.icon}</span>
                  </div>
                  <span className="text-xs font-medium leading-tight">Soon</span>
                </button>
              )
            }
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex-1 flex flex-col items-center py-4 px-2 transition-colors min-h-[60px] touch-manipulation ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center mb-1">
                  <span className="text-2xl leading-none">{item.icon}</span>
                </div>
                <span className="text-xs font-medium leading-tight">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Sign Out</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelSignOut}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                disabled={isLoggingOut}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing Out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}