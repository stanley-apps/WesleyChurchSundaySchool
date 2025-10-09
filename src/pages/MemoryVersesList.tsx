import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase, MemoryVerse } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useNotification, useAuth } from '../contexts/AuthContext'

export function MemoryVersesList() {
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([])
  const [filteredMemoryVerses, setFilteredMemoryVerses] = useState<MemoryVerse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showNotification } = useNotification()
  const { user } = useAuth()

  // Initialize Fuse.js with fuzzy search options
  const fuse = useMemo(() => {
    return new Fuse(memoryVerses, {
      keys: [
        { name: 'verse_text', weight: 0.6 },
        { name: 'reference', weight: 0.3 },
        { name: 'hashtags', weight: 0.1 } // Add hashtags to search keys
      ],
      includeScore: true,
      threshold: 0.3, // Lower threshold = more strict matching
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2,
    })
  }, [memoryVerses])

  useEffect(() => {
    fetchMemoryVerses()
  }, [])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, memoryVerses, fuse])

  const fetchMemoryVerses = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_verses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setMemoryVerses(data || [])
      setFilteredMemoryVerses(data || [])
    } catch (err: any) {
      setError(err.message)
      showNotification('Error loading memory verses: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredMemoryVerses(memoryVerses)
      return
    }
    const results = fuse.search(query).map((result) => result.item)
    setFilteredMemoryVerses(results)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    )
  }

  const handleDeleteMemoryVerse = async (verseId: string) => {
    if (!user) {
      showNotification('You must be logged in to delete memory verses.', 'error')
      return
    }

    if (!window.confirm('Are you sure you want to delete this memory verse? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const { error: dbError } = await supabase
        .from('memory_verses')
        .delete()
        .eq('id', verseId)
        .eq('user_id', user.id) // Ensure only the owner can delete

      if (dbError) throw dbError

      setMemoryVerses(prevVerses => prevVerses.filter(verse => verse.id !== verseId))
      setFilteredMemoryVerses(prevFiltered => prevFiltered.filter(verse => verse.id !== verseId))
      showNotification('Memory verse deleted successfully! 🗑️', 'success')
    } catch (err: any) {
      console.error('Delete memory verse error:', err)
      showNotification('Error deleting memory verse: ' + err.message, 'error')
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

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Memory Verses 📖</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Memorize and search inspiring Bible verses
                </p>
              </div>
              <Link
                to="/dashboard/lessons"
                className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
              >
                ⬅️ Back to Lessons Hub
              </Link>
            </div>
            <Link
              to="/dashboard/memory-verses/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
            >
              ➕ Add New Verse
            </Link>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search verses by text, reference, or hashtags... 🔍"
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

          {/* Memory Verses List */}
          {error ? (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              Error loading memory verses: {error}
            </div>
          ) : filteredMemoryVerses.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
              <div className="text-gray-400 text-6xl mb-4">📖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                {searchTerm ? 'No memory verses found' : 'No memory verses added yet'}
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
                  : 'Start building your collection of inspiring Bible verses!'
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/dashboard/memory-verses/upload"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  ➕ Add First Verse
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
              {filteredMemoryVerses.map((verse) => (
                <div
                  key={verse.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800 text-base mb-2 leading-relaxed font-serif italic">
                        "{searchTerm ? highlightSearchTerm(verse.verse_text, searchTerm) : verse.verse_text}"
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        - {searchTerm ? highlightSearchTerm(verse.reference, searchTerm) : verse.reference}
                      </h3>
                      {verse.hashtags && verse.hashtags.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {verse.hashtags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mr-1 mb-1">
                              #{searchTerm ? highlightSearchTerm(tag, searchTerm) : tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Added {new Date(verse.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        to={`/dashboard/memory-verses/${verse.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                      >
                        👁️ View
                      </Link>
                      {user && (
                        <>
                          <Link
                            to={`/dashboard/memory-verses/${verse.id}/edit`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteMemoryVerse(verse.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}