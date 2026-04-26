import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase, Song } from '../lib/supabase'
import { useAuth, useNotification } from '../contexts/AuthContext'
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
  const [editedCategory, setEditedCategory] = useState<'sunday_school' | 'vbs'>('sunday_school')
  const [editedVbsDay, setEditedVbsDay] = useState<number>(1)
  const [saving, setSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(20)
  const { showNotification } = useNotification()

  const lyricsDisplayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      fetchSong(id)
    }
  }, [id])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
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
      setEditedCategory(data.category || 'sunday_school')
      setEditedVbsDay(data.vbs_day || 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!song || !user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('songs')
        .update({ 
          lyrics: editedLyrics.trim(), 
          title: editedTitle.trim(),
          category: editedCategory,
          vbs_day: editedCategory === 'vbs' ? editedVbsDay : null
        })
        .eq('id', song.id)

      if (error) throw error

      setSong({ 
        ...song, 
        lyrics: editedLyrics.trim(), 
        title: editedTitle.trim(),
        category: editedCategory,
        vbs_day: editedCategory === 'vbs' ? editedVbsDay : null
      })
      setIsEditing(false)
      showNotification('Song updated successfully! ✅', 'success')
    } catch (err: any) {
      showNotification('Failed to update song: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedLyrics(song?.lyrics || '')
    setEditedTitle(song?.title || '')
    setEditedCategory(song?.category || 'sunday_school')
    setEditedVbsDay(song?.vbs_day || 1)
    setIsEditing(false)
  }

  const toggleFullscreen = () => {
    if (lyricsDisplayRef.current) {
      if (!document.fullscreenElement) {
        lyricsDisplayRef.current.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
  }

  if (loading) {
    return (
      <ChildFriendlyBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  if (error || !song) {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error || 'Song not found'}
          </div>
          <Link to="/dashboard/songs" className="text-blue-600 hover:underline">Back to Songs</Link>
        </div>
      </ChildFriendlyBackground>
    )
  }

  return (
    <ChildFriendlyBackground>
      <div className="px-4 sm:px-8 py-6 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto">
          {!isFullscreen && (
            <div className="mb-6 flex items-center justify-between">
              <Link to="/dashboard/songs" className="text-blue-600 hover:underline flex items-center gap-1">
                ⬅️ Back to Songs
              </Link>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleFullscreen}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🎬 Fullscreen View
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
            {!isFullscreen && (
              <div className="px-6 py-6 border-b border-gray-200/50">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
                    />
                    <div className="flex gap-4">
                      <select
                        value={editedCategory}
                        onChange={(e) => setEditedCategory(e.target.value as 'sunday_school' | 'vbs')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sunday_school">Sunday School</option>
                        <option value="vbs">VBS Summer Camp</option>
                      </select>
                      {editedCategory === 'vbs' && (
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editedVbsDay}
                          onChange={(e) => setEditedVbsDay(parseInt(e.target.value))}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{song.title}</h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {song.category === 'vbs' ? `VBS Day ${song.vbs_day}` : 'Sunday School'}
                      </span>
                      <span>•</span>
                      <span>Added {new Date(song.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editedLyrics}
                    onChange={(e) => setEditedLyrics(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical font-serif text-lg"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : '✅ Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  ref={lyricsDisplayRef} 
                  className={`bg-white/90 backdrop-blur-sm p-8 rounded-lg border border-gray-200/50 shadow-sm ${isFullscreen ? 'fullscreen-active' : ''}`}
                >
                  {isFullscreen && (
                    <div className="absolute top-4 right-4 flex gap-2 z-50">
                      <button onClick={() => setFontSize(s => Math.max(16, s - 2))} className="bg-gray-700 text-white p-2 rounded-full">A-</button>
                      <button onClick={() => setFontSize(s => Math.min(60, s + 2))} className="bg-gray-700 text-white p-2 rounded-full">A+</button>
                      <button onClick={() => document.exitFullscreen()} className="bg-red-600 text-white p-2 rounded-full">✕</button>
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

            {!isEditing && !isFullscreen && user && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200/50 flex justify-center">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  📝 Edit Song Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}