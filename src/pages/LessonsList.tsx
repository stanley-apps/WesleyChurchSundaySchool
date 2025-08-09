import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Lesson, MemoryVerse } from '../lib/supabase' // Import MemoryVerse
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useNotification, useAuth } from '../contexts/AuthContext'

export function LessonsList() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [memoryVerses, setMemoryVerses] = useState<MemoryVerse[]>([]) // New state for memory verses
  const [loadingLessons, setLoadingLessons] = useState(true)
  const [loadingVerses, setLoadingVerses] = useState(true)
  const [errorLessons, setErrorLessons] = useState('')
  const [errorVerses, setErrorVerses] = useState('')
  const { showNotification } = useNotification()
  const { user } = useAuth()

  useEffect(() => {
    fetchLessons()
    fetchMemoryVerses()
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
      setErrorLessons(err.message)
      showNotification('Error loading lessons: ' + err.message, 'error')
    } finally {
      setLoadingLessons(false)
    }
  }

  const fetchMemoryVerses = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_verses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setMemoryVerses(data || [])
    } catch (err: any) {
      setErrorVerses(err.message)
      showNotification('Error loading memory verses: ' + err.message, 'error')
    } finally {
      setLoadingVerses(false)
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

    setLoadingLessons(true)
    try {
      const bucketName = 'lesson_pdfs'
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
          console.warn(`File not found in storage for lesson ${lessonId}, proceeding with database deletion.`)
        } else {
          throw storageError
        }
      }

      const { error: dbError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('user_id', user.id)

      if (dbError) throw dbError

      setLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId))
      showNotification('Lesson deleted successfully! 🗑️', 'success')
    } catch (err: any) {
      console.error('Delete lesson error:', err)
      showNotification('Error deleting lesson: ' + err.message, 'error')
    } finally {
      setLoadingLessons(false)
    }
  }

  const handleDeleteMemoryVerse = async (verseId: string) => {
    if (!user) {
      showNotification('You must be logged in to delete memory verses.', 'error')
      return
    }

    if (!window.confirm('Are you sure you want to delete this memory verse? This action cannot be undone.')) {
      return
    }

    setLoadingVerses(true)
    try {
      const { error: dbError } = await supabase
        .from('memory_verses')
        .delete()
        .eq('id', verseId)
        .eq('user_id', user.id) // Ensure only the owner can delete

      if (dbError) throw dbError

      setMemoryVerses(prevVerses => prevVerses.filter(verse => verse.id !== verseId))
      showNotification('Memory verse deleted successfully! 🗑️', 'success')
    } catch (err: any) {
      console.error('Delete memory verse error:', err)
      showNotification('Error deleting memory verse: ' + err.message, 'error')
    } finally {
      setLoadingVerses(false)
    }
  }

  if (loadingLessons || loadingVerses) {
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
          {/* Header for Lessons */}
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

          {/* Lessons List */}
          {errorLessons ? (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              Error loading lessons: {errorLessons}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 mb-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
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
            <div className="grid gap-4 mb-12">
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
                      {user && user.id === lesson.user_id && (
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

          {/* Header for Memory Verses */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Memory Verses 📖</h2>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Memorize and share inspiring Bible verses
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/memory-verses/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
            >
              ➕ Add New Verse
            </Link>
          </div>

          {/* Memory Verses List */}
          {errorVerses ? (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              Error loading memory verses: {errorVerses}
            </div>
          ) : memoryVerses.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
              <div className="text-gray-400 text-6xl mb-4">📖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                No memory verses added yet
              </h3>
              <p className="text-gray-700 mb-4">
                Start building your collection of inspiring Bible verses!
              </p>
              <Link
                to="/dashboard/memory-verses/upload"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                ➕ Add First Verse
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {memoryVerses.map((verse) => (
                <div
                  key={verse.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800 text-base mb-2 leading-relaxed font-serif italic">
                        "{verse.verse_text}"
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        - {verse.reference}
                      </h3>
                      <div className="text-xs text-gray-500">
                        Added {new Date(verse.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {user && user.id === verse.user_id && (
                      <div className="ml-4 flex flex-col gap-2">
                        {/* Edit functionality for memory verses can be added later if needed */}
                        <button
                          onClick={() => handleDeleteMemoryVerse(verse.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap flex items-center justify-center gap-1"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
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