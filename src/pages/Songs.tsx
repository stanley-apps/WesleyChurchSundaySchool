import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { GripVertical, Eye } from 'lucide-react'
import { supabase, Song } from '../lib/supabase'
import { useNotification } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

type ViewState = 'selection' | 'sunday_school' | 'vbs'

export function Songs() {
  const [view, setView] = useState<ViewState>('selection')
  const [songs, setSongs] = useState<Song[]>([])
  const [displaySongs, setDisplaySongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeVbsDay, setActiveVbsDay] = useState(1)
  const [fullscreenSong, setFullscreenSong] = useState<Song | null>(null)
  
  const [fontScale, setFontScale] = useState(5)
  
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const { showNotification } = useNotification()

  const fuse = useMemo(() => {
    return new Fuse(songs, {
      keys: ['title', 'lyrics'],
      threshold: 0.3,
    })
  }, [songs])

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    // 1. Filter by category first
    let categoryFiltered = songs;
    if (view === 'sunday_school') {
      categoryFiltered = songs.filter(s => s.category === 'sunday_school' || !s.category);
    } else if (view === 'vbs') {
      categoryFiltered = songs.filter(s => s.category === 'vbs');
    } else {
      categoryFiltered = [];
    }

    // 2. Apply search or day filter
    let finalFiltered = categoryFiltered;
    
    if (searchTerm.trim()) {
      // If searching, search across the entire category (ignore day)
      const searchResults = fuse.search(searchTerm).map(r => r.item);
      // Ensure we only keep results that belong to the current category
      finalFiltered = searchResults.filter(s => categoryFiltered.some(cs => cs.id === s.id));
    } else if (view === 'vbs') {
      // If not searching and in VBS, filter by day
      finalFiltered = categoryFiltered.filter(s => s.vbs_day === activeVbsDay);
    }

    setDisplaySongs(finalFiltered);
  }, [songs, view, activeVbsDay, searchTerm, fuse])

  const fetchSongs = async () => {
    setLoading(true)
    try {
      let { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('display_order', { ascending: true })
        .order('title', { ascending: true })

      if (error) {
        const fallback = await supabase
          .from('songs')
          .select('*')
          .order('title', { ascending: true })
        
        if (fallback.error) throw fallback.error
        data = fallback.data
      }

      setSongs(data || [])
    } catch (err: any) {
      showNotification('Error loading songs: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (newOrder: Song[]) => {
    // Reordering is only allowed when not searching
    if (searchTerm.trim()) return;

    setDisplaySongs(newOrder)
    
    const updatedSongs = songs.map(s => {
      const indexInNewOrder = newOrder.findIndex(nos => nos.id === s.id)
      if (indexInNewOrder !== -1) {
        return { ...s, display_order: indexInNewOrder }
      }
      return s
    }).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    
    setSongs(updatedSongs)
    
    try {
      for (let i = 0; i < newOrder.length; i++) {
        const song = newOrder[i]
        await supabase
          .from('songs')
          .update({ display_order: i })
          .eq('id', song.id)
      }
    } catch (err: any) {
      console.error('Failed to save new order:', err)
      showNotification('Failed to save new order: ' + err.message, 'error')
    }
  }

  const handleSongClick = (song: Song) => {
    if (view === 'vbs') {
      setFullscreenSong(song)
      setTimeout(() => {
        if (fullscreenRef.current) {
          fullscreenRef.current.requestFullscreen().catch(err => {
            console.error('Fullscreen error:', err)
          })
        }
      }, 100)
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenSong(null)
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  if (loading) {
    return (
      <ChildFriendlyBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 drop-shadow-sm">
              {view === 'selection' ? 'Songs Hub 🎵' : view === 'sunday_school' ? 'Sunday School Songs 🎵' : `VBS Day ${activeVbsDay} ☀️`}
            </h1>
            {view !== 'selection' && (
              <button 
                onClick={() => setView('selection')}
                className="text-blue-600 hover:underline mt-1 flex items-center gap-1 font-medium"
              >
                ⬅️ Back to Selection
              </button>
            )}
          </div>
          <Link
            to="/dashboard/songs/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            ➕ Upload New Song
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {view === 'selection' ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"
            >
              <button
                onClick={() => setView('sunday_school')}
                className="group relative overflow-hidden rounded-3xl bg-white p-10 shadow-xl transition-all hover:scale-105 hover:shadow-2xl border-4 border-blue-200 text-left"
              >
                <div className="text-8xl mb-6 group-hover:animate-bounce">🎵</div>
                <h2 className="text-4xl font-bold text-blue-800 mb-2">Sunday School</h2>
                <p className="text-gray-600 text-lg">Browse our regular collection of worship songs</p>
                <div className="absolute bottom-0 right-0 p-4 opacity-10 text-9xl">🎶</div>
              </button>

              <button
                onClick={() => setView('vbs')}
                className="group relative overflow-hidden rounded-3xl bg-white p-10 shadow-xl transition-all hover:scale-105 hover:shadow-2xl border-4 border-orange-200 text-left"
              >
                <div className="text-8xl mb-6 group-hover:animate-spin">☀️</div>
                <h2 className="text-4xl font-bold text-orange-800 mb-2">VBS</h2>
                <p className="text-gray-600 text-lg">Daily songs for our Vacation Bible School</p>
                <div className="absolute bottom-0 right-0 p-4 opacity-10 text-9xl">🏖️</div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${view === 'vbs' ? 'all VBS' : 'Sunday School'} songs... 🔍`}
                  className="w-full px-4 py-4 pl-14 rounded-2xl border-2 border-blue-100 focus:border-blue-400 focus:ring-0 bg-white/80 backdrop-blur-sm shadow-sm text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl">🔍</span>
              </div>

              {view === 'vbs' && (
                <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                  {[...Array(10)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => {
                        setActiveVbsDay(i + 1);
                        setSearchTerm(''); // Clear search when switching days manually
                      }}
                      className={`px-8 py-3 rounded-full font-bold whitespace-nowrap transition-all text-lg ${
                        activeVbsDay === i + 1 
                          ? 'bg-orange-500 text-white shadow-lg scale-110' 
                          : 'bg-white text-orange-600 hover:bg-orange-50 border-2 border-orange-100'
                      }`}
                    >
                      Day {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {!searchTerm && (
                <p className="text-sm text-gray-500 italic px-2">
                  💡 Tip: Drag the handle on the left to reorder songs.
                </p>
              )}

              <Reorder.Group 
                axis="y" 
                values={displaySongs} 
                onReorder={handleReorder}
                className="space-y-3"
              >
                {displaySongs.map((song) => (
                  <Reorder.Item
                    key={song.id}
                    value={song}
                    dragListener={!searchTerm}
                    className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border-2 transition-all flex items-center p-4 group ${
                      searchTerm ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    } ${
                      view === 'vbs' ? 'border-orange-100 hover:border-orange-300' : 'border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    {!searchTerm && (
                      <div className="mr-4 text-gray-400 group-hover:text-gray-600">
                        <GripVertical size={24} />
                      </div>
                    )}
                    
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => handleSongClick(song)}
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {song.title}
                        </h3>
                        {searchTerm && view === 'vbs' && (
                          <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            Day {song.vbs_day}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link 
                        to={`/dashboard/songs/${song.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </Link>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {displaySongs.length === 0 && (
                <div className="text-center py-24 bg-white/50 rounded-3xl border-4 border-dashed border-gray-200">
                  <div className="text-8xl mb-6">🏜️</div>
                  <p className="text-2xl text-gray-500 font-medium">No songs found in this section.</p>
                  <p className="text-gray-400 mt-2">Try a different search or category!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={fullscreenRef}
          className={`fixed inset-0 z-[9999] bg-black text-white overflow-y-auto p-12 flex flex-col items-center ${fullscreenSong ? 'block' : 'hidden'}`}
        >
          {fullscreenSong && (
            <div className="max-w-6xl w-full">
              <div className="flex justify-between items-center mb-16 border-b border-white/20 pb-6">
                <h2 className="text-5xl font-bold text-orange-400">{fullscreenSong.title}</h2>
                <div className="flex gap-6">
                  <button onClick={() => setFontScale(f => Math.max(1, f - 0.5))} className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-3xl transition-colors w-16 h-16 flex items-center justify-center">A-</button>
                  <button onClick={() => setFontScale(f => Math.min(10, f + 0.5))} className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-3xl transition-colors w-16 h-16 flex items-center justify-center">A+</button>
                  <button onClick={() => document.exitFullscreen()} className="bg-red-600 hover:bg-red-700 p-4 rounded-full text-3xl transition-colors w-16 h-16 flex items-center justify-center">✕</button>
                </div>
              </div>
              <div 
                className="prose prose-invert max-w-none text-center" 
                style={{ 
                  fontSize: `${fontScale}vw`,
                  lineHeight: '1.6'
                }}
              >
                <ReactMarkdown className="font-serif whitespace-pre-line">
                  {fullscreenSong.lyrics}
                </ReactMarkdown>
              </div>
              <div className="mt-32 text-center text-white/20 text-lg font-medium tracking-widest uppercase">
                VBS Day {fullscreenSong.vbs_day} • Wesley Church Sunday School
              </div>
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}