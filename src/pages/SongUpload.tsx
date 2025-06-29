import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function SongUpload() {
  const [title, setTitle] = useState('')
  const [lyrics, setLyrics] = useState('')
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
            user_id: user.id
          }
        ])

      if (error) throw error

      // Redirect to songs list on success
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
          <div className="mb-6">
            <Link
              to="/dashboard/songs"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Songs
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Upload New Song 🎵</h1>
              <p className="text-gray-700 drop-shadow-sm">
                Add a new song to the Sunday School collection. You can use Markdown formatting in the lyrics.
              </p>
            </div>

            {error && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700 mb-2">
                  Lyrics *
                </label>
                <div className="mb-2 text-sm text-gray-600 bg-blue-50/80 backdrop-blur-sm p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Markdown Tips:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Use **bold text** for emphasis</li>
                    <li>• Use # Heading for verse titles</li>
                    <li>• Use > for chorus indentation</li>
                    <li>• Leave blank lines between verses</li>
                  </ul>
                </div>
                <textarea
                  id="lyrics"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm resize-vertical"
                  placeholder="Enter the song lyrics... You can use Markdown formatting!"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    '🎵 Upload Song'
                  )}
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