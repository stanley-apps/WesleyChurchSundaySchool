import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from './ChildFriendlyBackground'

interface SubItem {
  name: string;
  href: string;
  icon: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  disabled?: boolean;
  subItems?: SubItem[];
}

export function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Songs', href: '/dashboard/songs', icon: '🎵' },
    { name: 'Lessons Hub', href: '/dashboard/lessons', icon: '📚', disabled: false },
    { 
      name: 'Games', 
      href: '/dashboard/games', 
      icon: '🎮', 
      disabled: false,
      subItems: [
        { name: 'Emoji Quiz', href: '/dashboard/games/emoji-quiz', icon: '🧩' },
        { name: 'EventBell Timer', href: '/dashboard/games/timer', icon: '⏱️' },
        { name: 'Memory Match', href: '/dashboard/games/memory-match', icon: '🃏' },
      ]
    },
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

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard'
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
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
            <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
              <Link to="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Sunday School Hub
              </Link>
            </div>
            
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
                          Soon
                        </span>
                      </div>
                    )
                  }
                  
                  return (
                    <div key={item.name}>
                      <Link
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
                      {item.subItems && (isActive || item.subItems.some(si => isActiveRoute(si.href))) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubItemActive = isActiveRoute(subItem.href);
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                  isSubItemActive
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                              >
                                <span className="mr-3 text-lg">{subItem.icon}</span>
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
              
              <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      👤 {user?.email?.split('@')[0]}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="ml-3 p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <ChildFriendlyBackground>
              <Outlet />
            </ChildFriendlyBackground>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <nav className="flex">
          {navigation.slice(0, 4).map((item) => {
            const isActive = isActiveRoute(item.href) || (item.subItems && item.subItems.some(si => isActiveRoute(si.href)))
            const isDisabled = item.disabled
            
            if (isDisabled) return null;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors min-h-[60px] ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sign Out?</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <button onClick={cancelSignOut} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmSignOut} disabled={isLoggingOut} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}