import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [songCount, setSongCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    fetchSongCount()
    fetchDisplayName()
    // eslint-disable-next-line
  }, [user])

  const fetchSongCount = async () => {
    try {
      const { count, error } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })

      if (error) throw error

      setSongCount(count || 0)
    } catch (err) {
      console.error('Error fetching song count:', err)
      setSongCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Fetch displayName from profiles table
  const fetchDisplayName = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
      if (error) throw error
      if (data?.display_name) {
        setDisplayName(data.display_name)
      }
    } catch (err) {
      console.error('Error fetching display name:', err)
    }
  }

  const features = [
    {
      icon: '🎵',
      title: 'Songs',
      description: 'Browse and search Sunday school songs',
      href: '/dashboard/songs',
      available: true
    },
    {
      icon: '📚',
      title: 'Lessons',
      description: 'Interactive Bible lessons',
      href: '#',
      available: false
    },
    {
      icon: '🎮',
      title: 'Games',
      description: 'Fun educational games',
      href: '#',
      available: false
    },
    {
      icon: '🎥',
      title: 'Videos',
      description: 'Educational video content',
      href: '#',
      available: false
    }
  ]

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">
              Welcome to Wesley Church Sunday School Hub
            </h1>
            <p className="text-lg text-gray-700 drop-shadow-sm">
              Hello, {displayName || user?.email}! Ready to explore? 🌟
            </p>
          </div>

          {/* Logout Button - Prominent placement */}
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  signOut()
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Link
                to={feature.available ? feature.href : "#"}
                key={idx}
                className={`block rounded-lg shadow-md p-6 bg-white hover:bg-blue-50 transition-colors duration-200 border-2 ${feature.available ? "border-blue-300" : "border-gray-200 opacity-50 pointer-events-none"}`}
                tabIndex={feature.available ? 0 : -1}
                aria-disabled={!feature.available}
              >
                <div className="text-4xl mb-2">{feature.icon}</div>
                <h2 className="text-xl font-semibold mb-1">{feature.title}</h2>
                <p className="text-gray-600">{feature.description}</p>
                {!feature.available && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded">Coming Soon</span>
                )}
                {feature.title === 'Songs' && (
                  <span className="block mt-4 text-blue-700 font-bold">
                    {loading ? 'Loading…' : `${songCount} songs`}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}