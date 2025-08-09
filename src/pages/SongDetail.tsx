import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase, Song } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function SongDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLyrics, setEditedLyrics] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(20); // Initial font size for lyrics, corresponds to text-xl

  const lyricsDisplayRef = useRef<HTMLDivElement>(null) // Ref for the lyrics container

  useEffect(() => {
    if (id) {
      fetchSong(id)
    }
  }, [id])

  // Listen for fullscreen changes (e.g., if user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange) // For Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)   // For Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)   // For IE/Edge

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const fetchSong = async (songId: string) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

      if (error) throw error

      setSong(data)
      setEditedLyrics(data.lyrics)
      setEditedTitle(data.title)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    if (user) {
      setIsEditing(true)
    } else {
      alert('You must be logged in to edit songs')
    }
  }

  const handleSave = async () => {
    if (!song || !user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('songs')
        .update({ lyrics: editedLyrics.trim(), title: editedTitle.trim() })
        .eq('id', song.id)

      if (error) throw error

      setSong({ ...song, lyrics: editedLyrics.trim(), title: editedTitle.trim() })
      setIsEditing(false)
      alert('Lyrics updated successfully! ✅')
    } catch (err: any) {
      alert('Failed to update lyrics: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedLyrics(song?.lyrics || '')
    setEditedTitle(song?.title || '')
    setIsEditing(false)
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
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Song link copied to clipboard! 🔗')
      } catch (err) {
        console.error('Failed to copy URL:', err)
        alert('Failed to share song')
      }
    }
  }

  const toggleFullscreen = () => {
    if (lyricsDisplayRef.current) {
      if (!document.fullscreenElement) {
        lyricsDisplayRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          alert('Failed to enter fullscreen. Your browser might block it or it requires a user gesture.');
        });
      } else {
        document.exitFullscreen();
      }
    }
  }

  const increaseFontSize = () => {
    setFontSize(prevSize => Math.min(prevSize + 2, 48)); // Max font size 48px
  };

  const decreaseFontSize = () => {
    setFontSize(prevSize => Math.max(prevSize - 2, 16)); // Min font size 16px
  };

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

  if (error || !song) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-3xl mx-auto">
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

  const canEdit = !!user

  return (
    <ChildFriendlyBackground>
      <div className="px-4 sm:px-8 py-6 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Controls and navigation outside the fullscreen element */}
          {!isFullscreen && (
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
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleFullscreen}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  {isFullscreen ? 'Exit Fullscreen' : '🎬 Fullscreen View'}
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
                >
                  🏠 Dashboard
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
            {/* Title and date section - hidden when fullscreen */}
            {!isFullscreen && (
              <div className="px-6 py-6 border-b border-gray-200/50">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full text-3xl font-bold text-gray-900 mb-2 text-center border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center drop-shadow-sm">
                    {song.title}
                  </h1>
                )}
                <div className="text-sm text-gray-600 text-center">
                  Added on {new Date(song.created_at).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })} at {new Date(song.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true
                  })}
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Lyrics section header and edit button - hidden when fullscreen */}
              {!isFullscreen && canEdit && !isEditing && (
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 drop-shadow-sm">Lyrics</h2>
                  <button
                    onClick={handleEditClick}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    title="Edit lyrics"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="ml-1 text-sm">📝</span>
                  </button>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editedLyrics}
                    onChange={(e) => setEditedLyrics(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm resize-vertical font-serif text-lg"
                    placeholder="Enter the song lyrics... You can use Markdown formatting!"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : '✅ Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={lyricsDisplayRef} className={`bg-white/90 backdrop-blur-sm p-8 rounded-lg border border-gray-200/50 shadow-sm ${isFullscreen ? 'fullscreen-active' : ''}`}>
                  {isFullscreen && (
                    <div className="absolute top-4 right-4 flex gap-2 z-50">
                      <button
                        onClick={decreaseFontSize}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-lg"
                        title="Decrease font size"
                      >
                        A-
                      </button>
                      <button
                        onClick={increaseFontSize}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full text-lg"
                        title="Increase font size"
                      >
                        A+
                      </button>
                    </div>
                  )}
                  <div className="prose prose-lg max-w-none text-center" style={{ fontSize: `${fontSize}px` }}>
                    <ReactMarkdown className="font-serif leading-loose whitespace-pre-line">
                      {song.lyrics}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons - hidden when editing or fullscreen */}
            {!isEditing && !isFullscreen && (
              <div className="px-6 py-6 border-t border-gray-200/50">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={copyLyrics}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    📋 Copy Lyrics
                  </button>
                  <button 
                    onClick={shareSong}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    📤 Share Song
                  </button>
                  <Link
                    to="/dashboard/songs/upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center flex items-center justify-center gap-2"
                  >
                    ➕ Add Another Song
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}