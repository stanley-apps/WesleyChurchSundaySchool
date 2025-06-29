import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Sunday School Hub</h1>
          <p className="mt-2 text-gray-600">
            Hello, {user?.phone || user?.email}! Ready to explore?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎵</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Songs</h3>
                <p className="text-gray-600">Browse and search Sunday school songs</p>
              </div>
            </div>
          </div>

          <div className="card opacity-60">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📚</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
                <p className="text-gray-600">Interactive Bible lessons</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          <div className="card opacity-60">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎮</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Games</h3>
                <p className="text-gray-600">Fun educational games</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          <div className="card opacity-60">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎬</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Videos</h3>
                <p className="text-gray-600">Educational video content</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">Songs Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Videos Watched</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}