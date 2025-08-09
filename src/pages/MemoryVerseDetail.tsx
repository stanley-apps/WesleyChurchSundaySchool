import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, MemoryVerse } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function MemoryVerseDetail() {
  const { id } = useParams<{ id: string }>()
  const [verse, setVerse] = useState<MemoryVerse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchMemoryVerse(id)
    }
  }, [id])

  const fetchMemoryVerse = async (verseId: string) => {
    try {
      const { data, error } = await supabase
        .from('memory_verses')
        .select('*')
        .eq('id', verseId)
        .single()

      if (error) throw error

      setVerse(data)
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
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  if (error || !verse) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error || 'Memory verse not found'}
            </div>
            <Link 
              to="/dashboard/memory-verses" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Memory Verses
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  return (
    <ChildFriendlyBackground>
      <div className="px-4 sm:px-8 py-6 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/memory-verses"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Memory Verses
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="px-6 py-6 border-b border-gray-200/50">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center drop-shadow-sm">
                {verse.reference}
              </h1>
              <div className="text-sm text-gray-600 text-center">
                Added on {new Date(verse.created_at).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })} at {new Date(verse.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit', hour12: true
                })}
              </div>
            </div>

            <div className="p-6">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg border border-gray-200/50 shadow-sm">
                <p className="text-gray-800 text-lg mb-4 leading-relaxed font-serif italic text-center">
                  "{verse.verse_text}"
                </p>
                {verse.hashtags && verse.hashtags.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600 text-center">
                    {verse.hashtags.map((tag, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mr-1 mb-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-6 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigator.clipboard.writeText(`"${verse.verse_text}" - ${verse.reference}`)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  📋 Copy Verse
                </button>
                <Link
                  to="/dashboard/memory-verses/upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center flex items-center justify-center gap-2"
                >
                  ➕ Add Another Verse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}