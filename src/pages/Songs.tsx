import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Song } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function Songs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSongs(songs)
    } else {
      const filtered = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredSongs(filtered)
    }
  }, [searchTerm, songs])

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title')

      if (error) throw error
      
      setSongs(data || [])
      setFilteredSongs(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  if (error) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error loading songs: {error}
            </div>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Songs 🎵</h1>
            <p className="mt-2 text-gray-700 drop-shadow-sm">
              Browse and search our collection of Sunday school songs
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search songs by title, lyrics, or tags... 🔍"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                {searchTerm ? 'No songs found' : 'No songs available'}
              </h3>
              <p className="text-gray-700">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Songs will appear here once they are added to the database'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSongs.map((song) => (
                <Link
                  key={song.id}
                  to={`/dashboard/songs/${song.id}`}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 cursor-pointer hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        {song.title}
                      </h3>
                      <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                        {song.lyrics.substring(0, 150)}...
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {song.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100/80 text-blue-800 text-xs px-2 py-1 rounded-full backdrop-blur-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 text-gray-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {searchTerm && (
            <div className="mt-6 text-center text-sm text-gray-700 drop-shadow-sm">
              Showing {filteredSongs.length} of {songs.length} songs
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}