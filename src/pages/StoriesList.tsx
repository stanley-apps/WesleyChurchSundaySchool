import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase, Story } from '../lib/supabase'
// import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground' // Removed import
import { useNotification, useAuth } from '../contexts/AuthContext'

export function StoriesList() {
  const [stories, setStories] = useState<Story[]>([])
  const [filteredStories, setFilteredStories] = useState<Story[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showNotification } = useNotification()
  const { user } = useAuth()

  // Initialize Fuse.js with fuzzy search options
  const fuse = useMemo(() => {
    return new Fuse(stories, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.2 },
        { name: 'class_level', weight: 0.1 }
      ],
      includeScore: true,
      threshold: 0.3, // Lower threshold = more strict matching
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2,
    })
  }, [stories])

  useEffect(() => {
    fetchStories()
  }, [])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, stories, fuse])

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setStories(data || [])
      setFilteredStories(data || [])
    } catch (err: any) {
      setError(err.message)
      showNotification('Error loading stories: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredStories(stories)
      return
    }
    const results = fuse.search(query).map((result) => result.item)
    setFilteredStories(results)
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
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    )
  }

  const handleDeleteStory = async (storyId: string, fileUrl: string) => {
    if (!user) {
      showNotification('You must be logged in to delete stories.', 'error')
      return
    }

    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const bucketName = 'story_files'
      const urlParts = fileUrl.split(`/${bucketName}/`)
      const filePath = urlParts.length > 1 ? urlParts[1] : null

      if (!filePath) {
        throw new Error('Could not determine file path from URL.')
      }

      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (storageError) {
        if (storageError.message.includes('The resource was not found')) {
          console.warn(`File not found in storage for story ${storyId}, proceeding with database deletion.`)
        } else {
          throw storageError
        }
      }

      const { error: dbError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id)

      if (dbError) throw dbError

      setStories(prevStories => prevStories.filter(story => story.id !== storyId))
      setFilteredStories(prevFiltered => prevFiltered.filter(story => story.id !== storyId))
      showNotification('Story deleted successfully! 🗑️', 'success')
    } catch (err: any) {
      console.error('Delete story error:', err)
      showNotification('Error deleting story: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      // <ChildFriendlyBackground> Removed wrapper
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      // </ChildFriendlyBackground> Removed wrapper
    )
  }

  return (
    // <ChildFriendlyBackground> Removed wrapper
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Stories 📖</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Browse and search our collection of engaging Bible stories
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
              to="/dashboard/stories/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
            >
              ➕ Upload New Story
            </Link>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories by title, description, or class level... 🔍"
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

          {/* Stories List */}
          {error ? (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              Error loading stories: {error}
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
              <div className="text-gray-400 text-6xl mb-4">📖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                {searchTerm ? 'No stories found' : 'No stories available'}
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
                  : 'Start building your story collection by uploading your first document!'
                }
              </p>
              {!searchTerm && (
                <Link
                  to="/dashboard/stories/upload"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  ➕ Upload First Story
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
              {filteredStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        {searchTerm ? highlightSearchTerm(story.title, searchTerm) : story.title}
                      </h3>
                      {story.description && (
                        <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                          {searchTerm ? highlightSearchTerm(truncateText(story.description), searchTerm) : truncateText(story.description)}
                        </p>
                      )}
                      {story.class_level && (
                        <div className="text-xs text-gray-600 mb-2">
                          Class Level: <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {searchTerm ? highlightSearchTerm(story.class_level, searchTerm) : story.class_level}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Added {new Date(story.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        to={`/dashboard/stories/${story.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                      >
                        👁️ View
                      </Link>
                      {user && user.id === story.user_id && (
                        <>
                          <Link
                            to={`/dashboard/stories/${story.id}/edit`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteStory(story.id, story.file_url)}
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

          {searchTerm && filteredStories.length > 0 && (
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-700 drop-shadow-sm bg-white/80 backdrop-blur-sm p-3 rounded-lg inline-block">
                🎯 Found <strong>{filteredStories.length}</strong> of <strong>{stories.length}</strong> stories matching "<strong>{searchTerm}</strong>"
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
    // </ChildFriendlyBackground> Removed wrapper
  )
}