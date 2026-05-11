import { Link } from 'react-router-dom'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function GamesList() {
  const games = [
    {
      title: 'Bible Quiz Builder',
      description: 'Create Bible quizzes from a topic or document, then play them with the class.',
      icon: '🧩',
      link: '/dashboard/games/bible-quiz',
      available: true,
      color: 'bg-purple-100 border-purple-200 text-purple-800'
    },
    {
      title: 'EventBell Timer',
      description: 'A professional countdown timer with audible alerts for activities.',
      icon: '⏱️',
      link: '/dashboard/games/timer',
      available: true,
      color: 'bg-blue-100 border-blue-200 text-blue-800'
    },
    {
      title: 'Memory Match',
      description: 'Match Bible verses and characters in this classic card game.',
      icon: '🃏',
      link: '/dashboard/games/memory-match',
      available: true,
      color: 'bg-green-100 border-green-200 text-green-800'
    }
  ]

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Games & Activities 🎮</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Interactive ways to learn and manage Sunday School sessions.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
              >
                🏠 Dashboard
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game, index) => (
              <Link
                key={index}
                to={game.available ? game.link : '#'}
                className={`block rounded-2xl shadow-lg p-8 bg-white/90 backdrop-blur-sm border-2 transition-all duration-300 
                  ${game.available 
                    ? 'hover:shadow-xl hover:scale-[1.02] border-white/50 hover:border-blue-300' 
                    : 'opacity-60 cursor-not-allowed border-gray-100'
                  }`}
              >
                <div className="flex items-start gap-6">
                  <div className={`text-5xl p-4 rounded-2xl ${game.color.split(' ')[0]}`}>
                    {game.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 drop-shadow-sm">
                      {game.title}
                    </h2>
                    <p className="text-gray-700 mb-4">{game.description}</p>
                    {!game.available ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
                        Coming Soon
                      </span>
                    ) : (
                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                        Play Now ➔
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}
