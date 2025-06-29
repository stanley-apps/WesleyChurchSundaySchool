import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase, Song } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function Songs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Initialize Fuse.js with fuzzy search options
  const fuse = useMemo(() => {
    return new Fuse(songs, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'lyrics', weight: 0.3 }
      ],
      includeScore: true,
      threshold: 0.3, // Lower threshold = more strict matching
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2,
    })
  }, [songs])

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, songs, fuse])

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setSongs(data || [])
      setFilteredSongs(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredSongs(songs)
      return
    }

    // Use Fuse.js for fuzzy search
    const results = fuse.search(query).map((result) => result.item)
    setFilteredSongs(results)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Songs 🎵</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Browse and search our collection of Sunday school songs
                </p>
              </div>
              <Link
                to="/dashboard"
                className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
              >
                🏠 Dashboard
              </Link>
            </div>
            <Link
              to="/dashboard/songs/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
            >
              ➕ Upload New Song
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search songs by title or lyrics... 🔍"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                value={searchTerm}
                onChange={handleSearchChange}
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
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50/80 backdrop-blur-sm p-2 rounded-lg">
                💡 <strong>Smart Search:</strong> Try partial words, typos, or phrases - our fuzzy search will find matches!
              </div>
            )}
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                {searchTerm ? 'No songs found' : 'No songs available'}
              </h3>
              <p className="text-gray-700 mb-4">
                {searchTerm 
                  ? (
                      <>
                        No matches for "<strong>{searchTerm}</strong>". 
                        <br />
                        Try different keywords or check for typos.
                      </>
                    )
                  : 'Start building your song collection by uploading your first song!'
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/dashboard/songs/upload"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  ➕ Upload First Song
                </Link>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🔄 Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        {searchTerm ? highlightSearchTerm(song.title, searchTerm) : song.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {searchTerm 
                          ? highlightSearchTerm(truncateText(song.lyrics), searchTerm)
                          : truncateText(song.lyrics)
                        }
                      </p>
                      <div className="text-xs text-gray-500">
                        Added {new Date(song.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        to={`/dashboard/songs/${song.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
                      >
                        👁️ View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && filteredSongs.length > 0 && (
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-700 drop-shadow-sm bg-white/80 backdrop-blur-sm p-3 rounded-lg inline-block">
                🎯 Found <strong>{filteredSongs.length}</strong> of <strong>{songs.length}</strong> songs matching "<strong>{searchTerm}</strong>"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-3 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}