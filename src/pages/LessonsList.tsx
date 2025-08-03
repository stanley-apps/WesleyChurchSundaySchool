import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Lesson } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useNotification, useAuth } from '../contexts/AuthContext' // For notifications and user check

export function LessonsList() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showNotification } = useNotification()
  const { user } = useAuth() // Get current user to check for edit/delete permissions

  useEffect(() => {
    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setLessons(data || [])
    } catch (err: any) {
      setError(err.message)
      showNotification('Error loading lessons: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string, fileUrl: string) => {
    if (!user) {
      showNotification('You must be logged in to delete lessons.', 'error')
      return
    }

    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      // Extract file path from the public URL
      // The file path is typically everything after the bucket name in the URL
      const bucketName = 'lesson_pdfs'
      const urlParts = fileUrl.split(`/${bucketName}/`)
      const filePath = urlParts.length > 1 ? urlParts[1] : null

      if (!filePath) {
        throw new Error('Could not determine file path from URL.')
      }

      // 1. Delete file from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (storageError) {
        // If file not found in storage, proceed to delete database record
        // This handles cases where the file might have been manually deleted or never uploaded correctly
        if (storageError.message.includes('The resource was not found')) {
          console.warn(`File not found in storage for lesson ${lessonId}, proceeding with database deletion.`)
        } else {
          throw storageError
        }
      }

      // 2. Delete lesson record from the 'lessons' table
      const { error: dbError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('user_id', user.id) // Ensure only the owner can delete

      if (dbError) throw dbError

      // Update local state
      setLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId))
      showNotification('Lesson deleted successfully! 🗑️', 'success')
    } catch (err: any) {
      console.error('Delete error:', err)
      showNotification('Error deleting lesson: ' + err.message, 'error')
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
              Error loading lessons: {error}
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
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Lessons 📚</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Browse and download Sunday school lesson PDFs
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
              to="/dashboard/lessons/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
            >
              ➕ Upload New Lesson
            </Link>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                No lessons available
              </h3>
              <p className="text-gray-700 mb-4">
                Start building your lesson collection by uploading your first PDF!
              </p>
              <Link
                to="/dashboard/lessons/upload"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                ➕ Upload First Lesson
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                      {lesson.class_level && (
                        <div className="text-xs text-gray-600 mb-2">
                          Class Level: <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{lesson.class_level}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Added {new Date(lesson.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <a
                        href={lesson.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                      >
                        ⬇️ View PDF
                      </a>
                      {user && user.id === lesson.user_id && ( // Only show edit/delete if current user is the owner
                        <>
                          <Link
                            to={`/dashboard/lessons/${lesson.id}/edit`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id, lesson.file_url)}
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