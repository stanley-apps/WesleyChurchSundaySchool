import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [songCount, setSongCount] = useState(0)
  const [vbsSongCount, setVbsSongCount] = useState(0)
  const [lessonCount, setLessonCount] = useState(0)
  const [memoryVerseCount, setMemoryVerseCount] = useState(0)
  const [storyCount, setStoryCount] = useState(0)
  const [quizCount, setQuizCount] = useState(0);
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    fetchCountsAndDisplayName()
  }, [user])

  const fetchCountsAndDisplayName = async () => {
    setLoading(true)
    try {
      const { count: songC } = await supabase.from('songs').select('*', { count: 'exact', head: true }).eq('category', 'sunday_school')
      const { count: vbsC } = await supabase.from('songs').select('*', { count: 'exact', head: true }).eq('category', 'vbs')
      const { count: lessonC } = await supabase.from('lessons').select('*', { count: 'exact', head: true })
      const { count: mvC } = await supabase.from('memory_verses').select('*', { count: 'exact', head: true })
      const { count: storyC } = await supabase.from('stories').select('*', { count: 'exact', head: true })
      const { count: qC } = await supabase.from('quizzes').select('*', { count: 'exact', head: true })
      
      setSongCount(songC || 0)
      setVbsSongCount(vbsC || 0)
      setLessonCount(lessonC || 0)
      setMemoryVerseCount(mvC || 0)
      setStoryCount(storyC || 0)
      setQuizCount(qC || 0)
      
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single()
        if (data?.display_name) setDisplayName(data.display_name)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: '🎵',
      title: 'Songs Hub',
      description: `Sunday School (${songCount}) & VBS (${vbsSongCount})`,
      href: '/dashboard/songs',
      available: true,
    },
    {
      icon: '🎓',
      title: 'Lessons Hub',
      description: `Syllabuses (${lessonCount}), Verses (${memoryVerseCount}), Stories (${storyCount})`,
      href: '/dashboard/lessons',
      available: true,
    },
    {
      icon: '🎮',
      title: 'Games',
      description: 'Fun and interactive learning activities',
      href: '/dashboard/games',
      available: true,
      count: quizCount,
      countLabel: 'quizzes'
    },
    {
      icon: '🎥',
      title: 'Videos',
      description: 'Educational video content',
      href: '#',
      available: false
    }
  ]

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">
              Welcome to Wesley Church Sunday School Hub
            </h1>
            <p className="text-lg text-gray-700 drop-shadow-sm">
              Hello, {displayName || user?.email}! Ready to explore? 🌟
            </p>
          </div>

          <div className="mb-8 flex justify-end">
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  await signOut()
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Link
                to={feature.available ? feature.href : "#"}
                key={idx}
                className={`block rounded-lg shadow-md p-6 bg-white hover:bg-blue-50 transition-colors duration-200 border-2 ${feature.available ? "border-blue-300" : "border-gray-200 opacity-50 pointer-events-none"}`}
              >
                <div className="text-4xl mb-2">{feature.icon}</div>
                <h2 className="text-xl font-semibold mb-1">{feature.title}</h2>
                <p className="text-gray-600">{feature.description}</p>
                {feature.countLabel && feature.available && (
                  <span className="block mt-4 text-blue-700 font-bold">
                    {loading ? 'Loading…' : `${feature.count} ${feature.countLabel}`}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}