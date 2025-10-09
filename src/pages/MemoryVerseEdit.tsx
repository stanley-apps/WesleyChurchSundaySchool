import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase, MemoryVerse } from '../lib/supabase'
import { useAuth, useNotification } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function MemoryVerseEdit() {
  const { id } = useParams<{ id: string }>()
  const [verseText, setVerseText] = useState('')
  const [reference, setReference] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showNotification } = useNotification()

  useEffect(() => {
    if (id) {
      fetchMemoryVerse(id)
    }
  }, [id, user]) // Add user to dependency array to re-fetch if user changes

  const fetchMemoryVerse = async (verseId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('memory_verses')
        .select('*')
        .eq('id', verseId)
        .single()

      if (error) throw error
      if (!data) {
        setError('Memory verse not found.')
        showNotification('Memory verse not found.', 'error')
        return
      }

      const verseData: MemoryVerse = data;

      // Check if the current user is the owner of the verse
      if (user && verseData.user_id !== user.id) {
        setError('You do not have permission to edit this memory verse.')
        showNotification('You do not have permission to edit this memory verse.', 'error')
        navigate('/dashboard/memory-verses') // Redirect if not authorized
        return
      }

      setVerseText(verseData.verse_text)
      setReference(verseData.reference)
      setHashtags(verseData.hashtags ? verseData.hashtags.join(', ') : '')
    } catch (err: any) {
      console.error('Error fetching memory verse:', err)
      setError(err.message)
      showNotification('Error fetching memory verse: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !id) {
      setError('Authentication error or verse ID missing.')
      showNotification('Authentication error or verse ID missing.', 'error')
      return
    }

    if (!verseText.trim() || !reference.trim()) {
      setError('Please fill in both the verse text and reference.')
      showNotification('Please fill in both the verse text and reference.', 'error')
      return
    }

    setSaving(true)
    setError('')

    const processedHashtags = hashtags.split(/[\s,]+/)
                                     .map(tag => tag.trim().toLowerCase())
                                     .filter(tag => tag.length > 0);

    try {
      const { error: updateError } = await supabase
        .from('memory_verses')
        .update({
          verse_text: verseText.trim(),
          reference: reference.trim(),
          hashtags: processedHashtags.length > 0 ? processedHashtags : null,
          user_id: user.id // Ensure user_id is set for RLS
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure only the owner can update

      if (updateError) throw updateError

      showNotification('Memory verse updated successfully! ✅', 'success')
      navigate('/dashboard/memory-verses') // Redirect to memory verses list on success
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message)
      showNotification('Error updating memory verse: ' + err.message, 'error')
    } finally {
      setSaving(false)
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

  if (error && error !== 'You do not have permission to edit this memory verse.') {
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
            <Link 
              to="/dashboard/memory-verses" 
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
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
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
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
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Edit Memory Verse 📖</h1>
              <p className="text-gray-700 drop-shadow-sm">
                Update the text, reference, or hashtags for this memory verse.
              </p>
            </div>

            {error && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="verseText" className="block text-sm font-medium text-gray-700 mb-2">
                  Verse Text *
                </label>
                <textarea
                  id="verseText"
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm resize-vertical"
                  placeholder="Enter the full Bible verse text..."
                  required
                />
              </div>

              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                  Bible Reference *
                </label>
                <input
                  type="text"
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="e.g., John 3:16, Psalm 23:1-3"
                  required
                />
              </div>

              <div>
                <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags (Optional)
                </label>
                <input
                  type="text"
                  id="hashtags"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="e.g., love, faith, hope, salvation (comma or space separated)"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas or spaces.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    '✅ Save Changes'
                  )}
                </button>
                <Link
                  to="/dashboard/memory-verses"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}