import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, Story } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useAuth, useNotification } from '../contexts/AuthContext'

export function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showNotification } = useNotification()

  useEffect(() => {
    if (id) {
      fetchStory(id)
    }
  }, [id])

  const fetchStory = async (storyId: string) => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (error) throw error
      if (!data) {
        setError('Story not found.')
        showNotification('Story not found.', 'error')
        return
      }

      setStory(data as Story)
    } catch (err: any) {
      console.error('Error fetching story:', err)
      setError(err.message)
      showNotification('Error fetching story: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (story) {
      try {
        await navigator.clipboard.writeText(window.location.href)
        showNotification('Story link copied to clipboard! 🔗', 'success')
      } catch (err) {
        console.error('Failed to copy link:', err)
        showNotification('Failed to copy link.', 'error')
      }
    }
  }

  const shareStory = async () => {
    if (story && navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: `Check out this Bible story: ${story.title}`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Failed to share:', err)
      }
    } else {
      copyLink() // Fallback to copy link if Web Share API is not available
    }
  }

  const renderFile = (fileUrl: string, fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <img 
          src={fileUrl} 
          alt={story?.title || 'Story image'} 
          className="max-w-full h-auto rounded-lg shadow-md mx-auto" 
        />
      )
    } else if (fileType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl}
          title={story?.title || 'Story PDF'}
          className="w-full h-[70vh] rounded-lg shadow-md border border-gray-200"
          style={{ minHeight: '500px' }}
        >
          This browser does not support PDFs. Please <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">download the PDF</a> to view it.
        </iframe>
      )
    } else {
      return (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-700">Unsupported file type: {fileType}</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 block">
            Download File
          </a>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  if (error || !story) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error || 'Story not found'}
            </div>
            <Link 
              to="/dashboard/stories" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Stories
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  const canEdit = user && user.id === story.user_id

  return (
    <ChildFriendlyBackground>
      <div className="px-4 sm:px-8 py-6 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/stories"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Stories
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="px-6 py-6 border-b border-gray-200/50 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">
                {story.title}
              </h1>
              {story.class_level && (
                <div className="text-sm text-gray-600 mb-2">
                  Class Level: <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {story.class_level}
                  </span>
                </div>
              )}
              {story.description && (
                <p className="text-gray-700 text-md mb-3 leading-relaxed">{story.description}</p>
              )}
              <div className="text-sm text-gray-600">
                Added on {new Date(story.created_at).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>

            <div className="p-6">
              {renderFile(story.file_url, story.file_type)}
            </div>

            <div className="px-6 py-6 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={copyLink}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  🔗 Copy Link
                </button>
                <button 
                  onClick={shareStory}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  📤 Share Story
                </button>
                {canEdit && (
                  <Link
                    to={`/dashboard/stories/${story.id}/edit`}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center flex items-center justify-center gap-2"
                  >
                    ✏️ Edit Story
                  </Link>
                )}
                <Link
                  to="/dashboard/stories/upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center flex items-center justify-center gap-2"
                >
                  ➕ Add Another Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}