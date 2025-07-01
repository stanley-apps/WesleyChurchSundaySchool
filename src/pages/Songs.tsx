import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase, Song } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

interface SongResult {
  title: string
  lyrics: string
  source: string
  url: string
}

interface AISearchResponse {
  query: string
  results: SongResult[]
}

export function Songs() {
  const { user } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // AI Search states
  const [aiQuery, setAiQuery] = useState('')
  const [aiResults, setAiResults] = useState<SongResult[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiError, setAiError] = useState('')
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null)
  const [aiAvailable, setAiAvailable] = useState(true)

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

  const handleAIRequest = async () => {
    if (!aiQuery.trim()) {
      setAiError('Please enter a song name to search for')
      return
    }

    setAiLoading(true)
    setAiError('')
    setAiResults([])
    setSelectedSong(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-song-search`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: aiQuery.trim() }),
      })

      if (response.status === 404) {
        setAiAvailable(false)
        setAiError('AI search is currently unavailable. The service is being deployed. Please try again in a few minutes or use manual upload.')
        return
      }

      const data: AISearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI search failed')
      }

      setAiResults(data.results)
      if (data.results.length === 0) {
        setAiError('No lyrics found for this song. Try a different song name or check spelling.')
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setAiAvailable(false)
        setAiError('AI search service is currently unavailable. Please try again later or use manual upload.')
      } else {
        setAiError(err.message || 'Failed to search for song lyrics')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleSelectSong = (song: SongResult) => {
    setSelectedSong(song)
  }

  const handleSaveSong = async () => {
    if (!selectedSong || !user) {
      setAiError('Unable to save song. Please try again.')
      return
    }

    setAiSaving(true)
    setAiError('')

    try {
      const { error } = await supabase
        .from('songs')
        .insert([
          {
            title: selectedSong.title,
            lyrics: selectedSong.lyrics,
            user_id: user.id
          }
        ])

      if (error) throw error

      // Refresh the songs list
      await fetchSongs()
      
      // Clear AI search results
      setAiResults([])
      setSelectedSong(null)
      setAiQuery('')
      
      alert('🎵 Song added to your library successfully!')
    } catch (err: any) {
      setAiError(err.message || 'Failed to save song to library')
    } finally {
      setAiSaving(false)
    }
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

          {/* AI Song Finder Section */}
          <div className="bg-white/90 backdrop-blur-sm shadow-lg p-6 rounded-xl border border-white/50 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 drop-shadow-sm">🎤 Can't find a song? Ask AI</h2>
            <p className="text-gray-700 mb-4 text-sm">
              Use AI to search for Christian song lyrics from across the web. We'll find multiple versions for you to choose from!
            </p>
            
            {!aiAvailable && (
              <div className="bg-yellow-200 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
                ⚠️ <strong>AI Search Temporarily Unavailable:</strong> The AI search service is currently being deployed. 
                Please try again in a few minutes or use the manual upload option below.
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="e.g., Way Maker, Amazing Grace, How Great Thou Art..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !aiLoading && aiAvailable && handleAIRequest()}
                  disabled={!aiAvailable}
                />
                <button
                  onClick={handleAIRequest}
                  disabled={aiLoading || !aiQuery.trim() || !aiAvailable}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {aiLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </span>
                  ) : (
                    '🔍 Ask AI'
                  )}
                </button>
              </div>

              {aiError && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {aiError}
                </div>
              )}

              {aiResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Found {aiResults.length} result{aiResults.length !== 1 ? 's' : ''} for "{aiQuery}":
                  </h3>
                  
                  <div className="grid gap-4">
                    {aiResults.map((song, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedSong === song
                            ? 'border-blue-500 bg-blue-50/90 backdrop-blur-sm'
                            : 'border-gray-300 bg-white/80 backdrop-blur-sm hover:border-gray-400 hover:bg-white/90'
                        }`}
                        onClick={() => handleSelectSong(song)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{song.title}</h4>
                            <p className="text-xs text-gray-600">Source: {song.source}</p>
                          </div>
                          <div className="flex items-center">
                            {selectedSong === song && (
                              <span className="text-blue-600 text-sm font-medium mr-2">✓ Selected</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(song.url, '_blank')
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="View original source"
                            >
                              🔗 Source
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded p-3 max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-xs font-serif text-gray-700 leading-relaxed">
                            {truncateText(song.lyrics, 300)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSong && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveSong}
                        disabled={aiSaving}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                      >
                        {aiSaving ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          '💾 Save Selected Song to Library'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAiResults([])
                          setSelectedSong(null)
                          setAiQuery('')
                          setAiError('')
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        🔄 Search Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Regular Search */}
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
                        Try different keywords, check for typos, or use the AI search above!
                      </>
                    )
                  : 'Start building your song collection by uploading your first song or using AI search!'
                }
              </p>
              {!searchTerm && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/dashboard/songs/upload"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    ➕ Upload First Song
                  </Link>
                  {aiAvailable && (
                    <button
                      onClick={() => {
                        setAiQuery('Amazing Grace')
                        handleAIRequest()
                      }}
                      className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      🤖 Try AI Search
                    </button>
                  )}
                </div>
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