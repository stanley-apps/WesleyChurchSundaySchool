import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'
import { useAuth, useNotification } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

// Define the Song type (assuming it's already defined in supabase.ts, but good for local clarity)
type Song = {
  id: string
  title: string
  lyrics: string
  user_id: string
  created_at: string
}

export function Songs() {
  const { } = useAuth() 
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  
  // Voice search states
  const [isListening, setIsListening] = useState(false)
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null)
  const [isSpeechRecognitionAvailable, setIsSpeechRecognitionAvailable] = useState(false) // New state
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { showNotification } = useNotification() // Use notification hook

  // Initialize Fuse.js with fuzzy search options
  const fuse = useMemo(() => {
    return new Fuse(songs, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'lyrics', weight: 0.3 }
      ],
      includeScore: true,
      threshold: 0.3, // Lower threshold = more strict matching
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2,
    })
  }, [songs])

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, songs, fuse])

  // Effect to handle scroll event for "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) { // Show button after scrolling 300px down
        setShowScrollToTop(true)
      } else {
        setShowScrollToTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize SpeechRecognition on component mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionAvailable(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one utterance
      recognition.interimResults = false; // Only return final results
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
        setVoiceSearchError(null); // Clear any previous runtime error
        showNotification('Voice search complete!', 'info');
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Voice search failed.';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMessage = 'Microphone access denied. Please enable it in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try again.';
        } else if (event.error === 'network') {
          errorMessage = 'Network error during speech recognition. Please check your internet connection, ensure microphone access is allowed in browser settings, and try again. You might also try a different browser.';
        }
        setVoiceSearchError(errorMessage); // Set runtime error
        showNotification(errorMessage, 'error');
        setIsListening(false);
        recognitionRef.current?.stop(); // Ensure recognition stops on error
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechRecognitionAvailable(false);
      // No need to set voiceSearchError here, as the button won't render.
      // The user will see a message if the button is not there.
      showNotification('Speech Recognition is not supported in this browser. Voice search will not be available.', 'info');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [showNotification]);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setSongs(data || [])
      setFilteredSongs(data || [])
    } catch (err: any) {
      setError(err.message)
      showNotification('Error loading songs: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredSongs(songs)
      return
    }
    const results = fuse.search(query).map((result) => result.item)
    setFilteredSongs(results)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setVoiceSearchError(null);
      setIsListening(true);
      recognitionRef.current.start();
      showNotification('Listening for voice input...', 'info');
    } else if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      showNotification('Voice input stopped.', 'info');
    } else {
      // This case should ideally not be reached if isSpeechRecognitionAvailable is false
      showNotification('Microphone not ready or already listening.', 'info');
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    )
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Smooth scroll animation
    })
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
              Error loading songs: {error}
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
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Songs 🎵</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Browse and search our collection of Sunday school songs
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
              to="/dashboard/songs/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
            >
              ➕ Upload New Song
            </Link>
          </div>

          {/* Search Input with Voice Search Button */}
          <div className="mb-6">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search songs by title or lyrics... 🔍"
                className="w-full px-3 py-2 pl-10 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-10 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {isSpeechRecognitionAvailable ? (
                <button
                  onClick={startVoiceSearch}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isListening ? 'text-red-500 animate-pulse-microphone' : 'text-gray-500 hover:text-blue-600'} transition-colors duration-200`}
                  title={isListening ? 'Stop voice search' : 'Start voice search'}
                  disabled={isListening} // Only disable if currently listening
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3.53-2.64 6.4-6.3 6.4S5.7 14.53 5.7 11H4c0 3.98 3.44 7.19 7.8 7.94V22h3.2v-3.06c4.36-.75 7.8-3.96 7.8-7.94h-1.7z"/>
                  </svg>
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-not-allowed" title="Voice search is not supported in this browser.">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3.53-2.64 6.4-6.3 6.4S5.7 14.53 5.7 11H4c0 3.98 3.44 7.19 7.8 7.94V22h3.2v-3.06c4.36-.75 7.8-3.96 7.8-7.94h-1.7z"/>
                  </svg>
                </div>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50/80 backdrop-blur-sm p-2 rounded-lg">
                💡 <strong>Smart Search:</strong> Try partial words, typos, or phrases - our fuzzy search will find matches!
              </div>
            )}
            {voiceSearchError && ( // Only show runtime errors
              <div className="mt-2 text-sm bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-2 rounded-lg">
                ⚠️ {voiceSearchError}
              </div>
            )}
            {!isSpeechRecognitionAvailable && ( // Show unsupported message if button is not rendered
              <div className="mt-2 text-sm bg-blue-50/80 backdrop-blur-sm p-2 rounded-lg text-gray-600">
                ℹ️ Voice search is not available in this browser. It typically works on Chrome for Android and desktop browsers, but not on iOS Safari or some other mobile browsers.
              </div>
            )}
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 drop-shadow-sm">
                {searchTerm ? 'No songs found' : 'No songs available'}
              </h3>
              <p className="text-gray-700 mb-4">
                {searchTerm 
                  ? (
                      <>
                        No matches for "<strong>{searchTerm}</strong>". 
                        <br />
                        Try different keywords or check for typos.
                      </>
                    )
                  : 'Start building your song collection by uploading your first song!'
                }
              </p>
              {!searchTerm && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/dashboard/songs/upload"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    ➕ Upload First Song
                  </Link>
                </div>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🔄 Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 drop-shadow-sm">
                        {searchTerm ? highlightSearchTerm(song.title, searchTerm) : song.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {searchTerm 
                          ? highlightSearchTerm(truncateText(song.lyrics), searchTerm)
                          : truncateText(song.lyrics)
                        }
                      </p>
                      <div className="text-xs text-gray-500">
                        Added {new Date(song.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        to={`/dashboard/songs/${song.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-center whitespace-nowrap"
                      >
                        👁️ View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && filteredSongs.length > 0 && (
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-700 drop-shadow-sm bg-white/80 backdrop-blur-sm p-3 rounded-lg inline-block">
                🎯 Found <strong>{filteredSongs.length}</strong> of <strong>{songs.length}</strong> songs matching "<strong>{searchTerm}</strong>"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-3 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 lg:bottom-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-40 animate-bounce-once"
          title="Scroll to top"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="sr-only">Scroll to top</span>
        </button>
      )}
    </ChildFriendlyBackground>
  )
}