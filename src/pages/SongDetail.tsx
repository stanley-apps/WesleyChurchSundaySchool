import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase, Song } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function SongDetail() {
  const { id } = useParams<{ id: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchSong(id)
    }
  }, [id])

  const fetchSong = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

      if (error) throw error
      
      setSong(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyLyrics = async () => {
    if (song) {
      try {
        await navigator.clipboard.writeText(song.lyrics)
        alert('Lyrics copied to clipboard! 📋')
      } catch (err) {
        console.error('Failed to copy lyrics:', err)
        alert('Failed to copy lyrics')
      }
    }
  }

  const shareSong = async () => {
    if (song && navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Check out this song: ${song.title}`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Failed to share:', err)
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Song link copied to clipboard! 🔗')
      } catch (err) {
        console.error('Failed to copy URL:', err)
        alert('Failed to share song')
      }
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

  if (error || !song) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error || 'Song not found'}
            </div>
            <Link 
              to="/dashboard/songs" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Songs
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/songs"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Songs
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 drop-shadow-sm">{song.title}</h1>
              <div className="text-sm text-gray-600">
                Added {new Date(song.created_at).toLocaleDateString()} at {new Date(song.created_at).toLocaleTimeString()}
              </div>
            </div>

            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 drop-shadow-sm">Lyrics 📝</h2>
              <div className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-lg border border-gray-200/50">
                <ReactMarkdown 
                  className="song-lyrics"
                  components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>,
                    p: ({children}) => <p className="text-gray-800 mb-4 leading-loose whitespace-pre-line">{children}</p>,
                    strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                    em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-blue-300 pl-6 py-2 my-4 bg-blue-50/50 rounded-r-lg">
                        <div className="text-gray-700 italic leading-loose">{children}</div>
                      </blockquote>
                    ),
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-800">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-800">{children}</ol>,
                    li: ({children}) => <li className="text-gray-800 leading-loose">{children}</li>,
                    code: ({children}) => (
                      <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                    pre: ({children}) => (
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 whitespace-pre-wrap">
                        <code className="text-sm font-mono text-gray-800">{children}</code>
                      </pre>
                    ),
                  }}
                >
                  {song.lyrics}
                </ReactMarkdown>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={copyLyrics}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                📋 Copy Lyrics
              </button>
              <button 
                onClick={shareSong}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                📤 Share Song
              </button>
              <Link
                to="/dashboard/songs/upload"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center"
              >
                ➕ Add Another Song
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}