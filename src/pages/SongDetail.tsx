import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, Song } from '../lib/supabase'

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

  if (loading) {
    return (
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error || 'Song not found'}
          </div>
          <Link to="/dashboard/songs" className="btn-primary">
            Back to Songs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pb-20 lg:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/dashboard/songs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Songs
          </Link>
        </div>

        <div className="card">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{song.title}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {song.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lyrics</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {song.lyrics}
              </pre>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button className="btn-primary">
              🎵 Play Song
            </button>
            <button className="btn-secondary">
              📋 Copy Lyrics
            </button>
            <button className="btn-secondary">
              📤 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}