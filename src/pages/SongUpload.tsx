import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function SongUpload() {
  const [title, setTitle] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [category, setCategory] = useState<'sunday_school' | 'vbs'>('sunday_school')
  const [vbsDay, setVbsDay] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to upload songs')
      return
    }

    if (!title.trim() || !lyrics.trim()) {
      setError('Please fill in both title and lyrics')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('songs')
        .insert([
          {
            title: title.trim(),
            lyrics: lyrics.trim(),
            user_id: user.id,
            category,
            vbs_day: category === 'vbs' ? vbsDay : null
          }
        ])

      if (error) throw error

      navigate('/dashboard/songs')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/songs"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Songs
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Upload New Song 🎵</h1>
              <p className="text-gray-700 drop-shadow-sm">
                Add a new song to the collection.
              </p>
            </div>

            {error && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                    placeholder="Enter the song title..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'sunday_school' | 'vbs')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  >
                    <option value="sunday_school">Sunday School</option>
                    <option value="vbs">VBS</option>
                  </select>
                </div>
              </div>

              {category === 'vbs' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label htmlFor="vbsDay" className="block text-sm font-medium text-gray-700 mb-2">
                    VBS Day (1-10)
                  </label>
                  <input
                    type="number"
                    id="vbsDay"
                    min="1"
                    max="10"
                    value={vbsDay}
                    onChange={(e) => setVbsDay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  />
                </motion.div>
              )}

              <div>
                <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700 mb-2">
                  Lyrics *
                </label>
                <textarea
                  id="lyrics"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm resize-vertical"
                  placeholder="Enter the song lyrics..."
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : '🎵 Upload Song'}
                </button>
                <Link
                  to="/dashboard/songs"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}