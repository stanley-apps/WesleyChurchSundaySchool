import { useState, useEffect } from 'react'
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
      setEditedLyrics(data.lyrics)
      setEditedTitle(data.title)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    if (song && user && song.user_id === user.id) {
      setIsEditing(true)
    } else if (!user) {
      alert('You must be logged in to edit songs')
    } else {
      alert('You can only edit songs you created')
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
        .eq('user_id', user.id)

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
    setIsFullscreen(!isFullscreen)
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

  const canEdit = user && song.user_id === user.id

  return (
    <ChildFriendlyBackground>
      <div className="px-4 sm:px-8 py-6 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto">
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
                🎬 Fullscreen View
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
              >
                🏠 Dashboard
              </Link>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
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
            {/* Lyrics Section remains unchanged */}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}
