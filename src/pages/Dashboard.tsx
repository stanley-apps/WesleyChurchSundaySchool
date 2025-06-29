import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
    <div className="p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Sunday School Hub</h1>
          <p className="mt-2 text-lg text-gray-600">
            Hello, {user?.email}! Ready to explore?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            if (feature.available) {
              return (
                <Link
                  key={feature.title}
                  to={feature.href}
                  className="card hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="text-4xl mr-4">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </Link>
              )
            }

            return (
              <div
                key={feature.title}
                className="card opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center">
                  <div className="text-4xl mr-4">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 mt-1">{feature.description}</p>
                    <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600 mt-1">Songs Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Lessons Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Videos Watched</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}