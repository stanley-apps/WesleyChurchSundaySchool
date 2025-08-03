import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Lesson } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useNotification } from '../contexts/AuthContext' // For notifications

export function LessonsList() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showNotification } = useNotification()

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