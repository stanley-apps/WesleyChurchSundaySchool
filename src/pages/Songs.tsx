import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { GripVertical, Eye } from 'lucide-react'
import { supabase, Song } from '../lib/supabase'
import { useAuth, useNotification } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

type ViewState = 'sunday_school' | 'vbs'
const SHOW_VBS_STORAGE_KEY = 'songs-show-vbs'
const DUPLICATE_MATCH_THRESHOLD = 0.9

type BigramProfile = {
  text: string
  counts: Map<string, number>
  length: number
}

type PreparedSong = {
  song: Song
  title: BigramProfile
  lyrics: BigramProfile
}

function normalizeSongText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function createBigramProfile(value: string): BigramProfile {
  const text = normalizeSongText(value)
  const counts = new Map<string, number>()

  for (let i = 0; i < text.length - 1; i++) {
    const pair = text.slice(i, i + 2)
    counts.set(pair, (counts.get(pair) || 0) + 1)
  }

  return {
    text,
    counts,
    length: Math.max(0, text.length - 1),
  }
}

function diceSimilarity(a: BigramProfile, b: BigramProfile) {
  if (a.text === b.text) return 1
  if (!a.text || !b.text) return 0
  if (a.text.length < 2 || b.text.length < 2) return a.text === b.text ? 1 : 0

  const maxPossible = (2 * Math.min(a.length, b.length)) / (a.length + b.length)
  if (maxPossible < DUPLICATE_MATCH_THRESHOLD) return 0

  let matches = 0
  const smaller = a.counts.size <= b.counts.size ? a.counts : b.counts
  const larger = smaller === a.counts ? b.counts : a.counts

  for (const [pair, count] of smaller) {
    matches += Math.min(count, larger.get(pair) || 0)
  }

  return (2 * matches) / (a.length + b.length)
}

function areLikelyDuplicateSongs(a: PreparedSong, b: PreparedSong) {
  const titleSimilarity = diceSimilarity(a.title, b.title)
  if (titleSimilarity >= DUPLICATE_MATCH_THRESHOLD) return true

  const lyricsSimilarity = diceSimilarity(a.lyrics, b.lyrics)
  return lyricsSimilarity >= DUPLICATE_MATCH_THRESHOLD
}

function findDuplicateGroups(songs: Song[]) {
  const preparedSongs: PreparedSong[] = songs.map((song) => ({
    song,
    title: createBigramProfile(song.title),
    lyrics: createBigramProfile(song.lyrics),
  }))

  const parent = new Map<string, string>()
  for (const { song } of preparedSongs) {
    parent.set(song.id, song.id)
  }

  const find = (id: string): string => {
    const currentParent = parent.get(id) || id
    if (currentParent === id) return id
    const root = find(currentParent)
    parent.set(id, root)
    return root
  }

  const union = (a: string, b: string) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootB, rootA)
  }

  for (let i = 0; i < preparedSongs.length; i++) {
    for (let j = i + 1; j < preparedSongs.length; j++) {
      if (areLikelyDuplicateSongs(preparedSongs[i], preparedSongs[j])) {
        union(preparedSongs[i].song.id, preparedSongs[j].song.id)
      }
    }
  }

  const groups = new Map<string, Song[]>()
  for (const { song } of preparedSongs) {
    const root = find(song.id)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(song)
  }

  return Array.from(groups.values())
    .filter((group) => group.length > 1)
    .map((group) =>
      [...group].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    )
    .sort((a, b) => a[0].title.localeCompare(b[0].title))
}

function sortSongsForDisplay(songs: Song[]) {
  return [...songs].sort((a, b) => {
    return a.title.localeCompare(b.title)
  })
}

export function Songs() {
  const { user } = useAuth()
  const [view, setView] = useState<ViewState>('sunday_school')
  const [showVbs, setShowVbs] = useState(() => localStorage.getItem(SHOW_VBS_STORAGE_KEY) !== 'false')
  const [songs, setSongs] = useState<Song[]>([])
  const [displaySongs, setDisplaySongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingDuplicates, setDeletingDuplicates] = useState(false)
  const [findingDuplicates, setFindingDuplicates] = useState(false)
  const [showDuplicateManager, setShowDuplicateManager] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<Song[][]>([])
  const [duplicateScanComplete, setDuplicateScanComplete] = useState(false)
  const [selectedDuplicateIds, setSelectedDuplicateIds] = useState<Set<string>>(new Set())
  const [activeVbsDay, setActiveVbsDay] = useState(1)
  const [fullscreenSong, setFullscreenSong] = useState<Song | null>(null)
  
  const [fontScale, setFontScale] = useState(5)
  
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const { showNotification } = useNotification()

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    localStorage.setItem(SHOW_VBS_STORAGE_KEY, String(showVbs))
    if (!showVbs && view === 'vbs') {
      setView('sunday_school')
      setSearchTerm('')
    }
  }, [showVbs, view])

  useEffect(() => {
    // 1. Filter by category first
    let categoryFiltered = songs;
    if (view === 'sunday_school') {
      categoryFiltered = songs.filter(s => s.category === 'sunday_school' || !s.category);
    } else if (showVbs) {
      categoryFiltered = songs.filter(s => s.category === 'vbs');
    }

    // 2. Apply search or day filter
    let finalFiltered = categoryFiltered;
    
    if (searchTerm.trim()) {
      // If searching, search across the entire category (ignore day)
      const fuse = new Fuse(categoryFiltered, {
        keys: ['title'],
        threshold: 0.3,
      })
      const searchResults = fuse.search(searchTerm).map(r => r.item);
      finalFiltered = searchResults;
    } else if (view === 'vbs') {
      // If not searching and in VBS, filter by day
      finalFiltered = categoryFiltered.filter(s => s.vbs_day === activeVbsDay);
    }

    setDisplaySongs(finalFiltered);
  }, [songs, view, showVbs, activeVbsDay, searchTerm])

  const fetchSongs = async () => {
    setLoading(true)
    try {
      let { data, error } = await supabase
        .from('songs')
        .select('id,title,user_id,created_at,category,vbs_day')
        .order('title', { ascending: true })

      if (error) {
        const fallback = await supabase
          .from('songs')
          .select('id,title,user_id,created_at,category,vbs_day')
          .order('title', { ascending: true })
        
        if (fallback.error) throw fallback.error
        data = fallback.data
      }

      setSongs(sortSongsForDisplay((data || []).map((song) => ({ ...song, lyrics: '' }))))
    } catch (err: any) {
      showNotification('Error loading songs: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const openDuplicateManager = () => {
    setShowDuplicateManager(true)
    setFindingDuplicates(true)
    setDuplicateScanComplete(false)
    setSelectedDuplicateIds(new Set())

    window.setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('title', { ascending: true })

        if (error) throw error

        const fullSongs = sortSongsForDisplay(data || [])
        setSongs(fullSongs)
        const groups = findDuplicateGroups(fullSongs)
        setDuplicateGroups(groups)
        setSelectedDuplicateIds(new Set(groups.flatMap((group) => group.slice(1).map((song) => song.id))))
        setDuplicateScanComplete(true)
      } catch (err: any) {
        console.error('Find duplicate songs error:', err)
        showNotification('Error finding duplicates: ' + err.message, 'error')
      } finally {
        setFindingDuplicates(false)
      }
    }, 0)
  }

  const toggleDuplicateSelection = (songId: string) => {
    setSelectedDuplicateIds((current) => {
      const next = new Set(current)
      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
      }
      return next
    })
  }

  const handleDeleteSelectedDuplicates = async () => {
    if (!user) {
      showNotification('You must be logged in to delete songs.', 'error')
      return
    }

    const idsToDelete = Array.from(selectedDuplicateIds)
    if (idsToDelete.length === 0) {
      showNotification('Select at least one duplicate to delete.', 'info')
      return
    }

    const confirmed = window.confirm(
      `Delete ${idsToDelete.length} duplicate song${idsToDelete.length === 1 ? '' : 's'}? This action cannot be undone.`
    )

    if (!confirmed) return

    setDeletingDuplicates(true)
    try {
      const { data: deletedSongs, error } = await supabase
        .from('songs')
        .delete()
        .in('id', idsToDelete)
        .select('id')

      if (error) throw error

      const deletedIds = new Set((deletedSongs || []).map((song) => song.id))
      if (deletedIds.size === 0) {
        showNotification(
          'No songs were deleted. Apply the song delete RLS migration, then try again.',
          'error'
        )
        return
      }

      setSongs((current) => current.filter((song) => !deletedIds.has(song.id)))
      setDisplaySongs((current) => current.filter((song) => !deletedIds.has(song.id)))
      setDuplicateGroups((current) =>
        current
          .map((group) => group.filter((song) => !deletedIds.has(song.id)))
          .filter((group) => group.length > 1)
      )
      setSelectedDuplicateIds(new Set())
      if (deletedIds.size < idsToDelete.length) {
        showNotification(
          `Deleted ${deletedIds.size} of ${idsToDelete.length} selected duplicates. Some rows may be blocked by RLS.`,
          'info'
        )
      } else {
        showNotification('Duplicate songs deleted successfully! 🗑️', 'success')
      }
    } catch (err: any) {
      console.error('Delete duplicate songs error:', err)
      showNotification('Error deleting duplicates: ' + err.message, 'error')
    } finally {
      setDeletingDuplicates(false)
    }
  }

  const handleReorder = (newOrder: Song[]) => {
    // Reordering is only allowed when not searching
    if (searchTerm.trim()) return;

    setDisplaySongs(newOrder)
    
    const newOrderIds = new Set(newOrder.map((song) => song.id))
    const updatedSongs = [
      ...newOrder,
      ...songs.filter((song) => !newOrderIds.has(song.id)),
    ]
    setSongs(updatedSongs)
  }

  const handleSongClick = async (song: Song) => {
    let selectedSong = song

    if (!selectedSong.lyrics) {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', song.id)
        .single()

      if (error) {
        showNotification('Error loading song lyrics: ' + error.message, 'error')
        return
      }

      selectedSong = data
      setSongs((current) => current.map((item) => (item.id === data.id ? data : item)))
      setDisplaySongs((current) => current.map((item) => (item.id === data.id ? data : item)))
    }

    setFullscreenSong(selectedSong)
    setTimeout(() => {
      if (fullscreenRef.current) {
        fullscreenRef.current.requestFullscreen().catch(err => {
          console.error('Fullscreen error:', err)
        })
      }
    }, 100)
  }

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenSong(null)
        // Unlock orientation when exiting full-screen
        if (window.screen?.orientation?.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch (e) {
            console.warn('Orientation unlock failed', e);
          }
        }
      } else {
        // Lock orientation to landscape when entering full-screen on mobile
        if (window.screen?.orientation?.lock) {
          window.screen.orientation.lock('landscape').catch(err => {
            console.warn('Orientation lock failed (this is normal on desktop):', err);
          });
        }
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const selectView = (nextView: ViewState) => {
    setView(nextView)
    setSearchTerm('')
  }

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
              {view === 'sunday_school' ? 'Sunday School Songs 🎵' : `VBS Day ${activeVbsDay} ☀️`}
            </h1>
          </div>
          <Link
            to="/dashboard/songs/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-md"
          >
            ➕ Upload New Song
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => selectView('sunday_school')}
            className={`px-5 py-2 rounded-full font-bold transition-colors ${
              view === 'sunday_school'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-blue-700 border-2 border-blue-100 hover:bg-blue-50'
            }`}
          >
            Sunday School
          </button>
          {showVbs && (
            <button
              onClick={() => selectView('vbs')}
              className={`px-5 py-2 rounded-full font-bold transition-colors ${
                view === 'vbs'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-orange-700 border-2 border-orange-100 hover:bg-orange-50'
              }`}
            >
              VBS
            </button>
          )}
          <button
            onClick={() => setShowVbs((current) => !current)}
            className="ml-auto px-4 py-2 rounded-full bg-white/90 text-gray-700 border border-gray-200 hover:bg-gray-50 font-medium shadow-sm"
          >
            {showVbs ? 'Hide VBS' : 'Show VBS'}
          </button>
          <button
            onClick={openDuplicateManager}
            disabled={findingDuplicates}
            className="px-4 py-2 rounded-full bg-white/90 text-gray-700 border border-gray-200 hover:bg-gray-50 font-medium shadow-sm"
          >
            {findingDuplicates
              ? 'Finding Duplicates...'
              : duplicateScanComplete
                ? `Duplicates (${duplicateGroups.length})`
                : 'Find Duplicates'}
          </button>
        </div>

        {showDuplicateManager && (
          <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Duplicate Songs</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Songs are matched globally when either title or lyrics are at least 90% similar. The oldest copy in each group is marked to keep.
                </p>
              </div>
              <button
                onClick={() => setShowDuplicateManager(false)}
                className="self-start text-gray-500 hover:text-gray-800 font-medium"
              >
                Close
              </button>
            </div>

            {findingDuplicates ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 font-medium">
                Scanning songs for 90% title or lyric matches...
              </div>
            ) : duplicateGroups.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 font-medium">
                {duplicateScanComplete ? 'No duplicate songs found.' : 'Click Find Duplicates to scan the song list.'}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {duplicateGroups.map((group) => (
                    <div key={group.map((song) => song.id).join('-')} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900">{group[0].title}</h3>
                          <p className="text-sm text-gray-600">{group.length} matching copies</p>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {group.map((song, index) => {
                          const isKeepCopy = index === 0
                          return (
                            <label key={song.id} className="flex items-start gap-3 px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedDuplicateIds.has(song.id)}
                                disabled={isKeepCopy || deletingDuplicates}
                                onChange={() => toggleDuplicateSelection(song.id)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">{song.title}</span>
                                  {isKeepCopy ? (
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Keep</span>
                                  ) : (
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Delete candidate</span>
                                  )}
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    {song.category === 'vbs' ? `VBS Day ${song.vbs_day}` : 'Sunday School'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Added {new Date(song.created_at).toLocaleString()}
                                </p>
                              </div>
                              <Link
                                to={`/dashboard/songs/${song.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View
                              </Link>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedDuplicateIds.size} song{selectedDuplicateIds.size === 1 ? '' : 's'} selected for deletion.
                  </p>
                  <button
                    onClick={handleDeleteSelectedDuplicates}
                    disabled={deletingDuplicates || selectedDuplicateIds.size === 0}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    {deletingDuplicates ? 'Deleting...' : 'Delete Selected Duplicates'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
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
                {fullscreenSong.category === 'vbs' ? `VBS Day ${fullscreenSong.vbs_day}` : 'Sunday School'} • Wesley Church Sunday School
              </div>
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}
