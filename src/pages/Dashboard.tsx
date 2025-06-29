import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function Dashboard() {
  const { user } = useAuth()

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
              Hello, {user?.email}! Ready to explore? 🌟
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
            {features.map((feature) => {
              if (feature.available) {
                return (
                  <Link
                    key={feature.title}
                    to={feature.href}
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer hover:bg-white/95"
                  >
                    <div className="flex items-center">
                      <div className="text-4xl mr-4 drop-shadow-sm">{feature.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-gray-700">{feature.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              }

              return (
                <div
                  key={feature.title}
                  className="bg-white/60 backdrop-blur-sm rounded-xl shadow-md p-6 border border-white/30 opacity-70 cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <div className="text-4xl mr-4 grayscale">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600 mb-2">{feature.description}</p>
                      <span className="inline-block text-xs bg-gray-100 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Stats */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 drop-shadow-sm">Quick Stats 📊</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1 drop-shadow-sm">3</div>
                <div className="text-sm text-gray-700">Songs Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1 drop-shadow-sm">0</div>
                <div className="text-sm text-gray-700">Lessons Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1 drop-shadow-sm">0</div>
                <div className="text-sm text-gray-700">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1 drop-shadow-sm">0</div>
                <div className="text-sm text-gray-700">Videos Watched</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}