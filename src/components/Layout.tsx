import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Songs', href: '/dashboard/songs', icon: '🎵' },
    { name: 'Lessons', href: '#', icon: '📚', disabled: true },
    { name: 'Games', href: '#', icon: '🎮', disabled: true },
    { name: 'Videos', href: '#', icon: '🎥', disabled: true },
  ]

  const handleSignOut = async () => {
    await signOut()
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
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            🔓 Sign Out
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
                  const isActive = location.pathname === item.href
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
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="ml-3 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    🔓 Sign Out
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
            const isActive = location.pathname === item.href
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
    </div>
  )
}