import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function StoriesList() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    // In a real implementation, you would filter stories here
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Stories 📖</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Engaging Bible stories for children
                </p>
              </div>
              <Link
                to="/dashboard/lessons"
                className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
              >
                ⬅️ Back to Lessons Hub
              </Link>
            </div>
            <div className="bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg text-center whitespace-nowrap opacity-70 cursor-not-allowed">
              Coming Soon!
            </div>
          </div>

          {/* Search Input (placeholder functionality) */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories... 🔍 (Coming Soon)"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                value={searchTerm}
                onChange={handleSearchChange}
                disabled // Disable search until functionality is implemented
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600 bg-blue-50/80 backdrop-blur-sm p-2 rounded-lg">
              💡 Search functionality for stories is under development.
            </div>
          </div>

          {/* Stories List - Placeholder */}
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="text-gray-400 text-6xl mb-4">✨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
              Stories section is under development!
            </h3>
            <p className="text-gray-700 mb-4">
              Check back soon for a collection of inspiring Bible stories.
            </p>
          </div>

        </div>
      </div>
    </ChildFriendlyBackground>
  )
}