import { Link } from 'react-router-dom'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function LessonsList() {
  const contentSections = [
    {
      title: 'Syllabuses',
      description: 'Browse and manage Sunday school syllabus PDFs.',
      icon: '📚',
      link: '/dashboard/syllabuses',
      available: true,
    },
    {
      title: 'Memory Verses',
      description: 'Add, memorize, and share inspiring Bible verses.',
      icon: '📖',
      link: '/dashboard/memory-verses',
      available: true,
    },
    {
      title: 'Stories',
      description: 'Engaging Bible stories for children.',
      icon: '✨',
      link: '/dashboard/stories',
      available: false,
    },
  ]

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Lessons Hub 🎓</h1>
                <p className="mt-2 text-gray-700 drop-shadow-sm">
                  Explore different educational resources for Sunday School.
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentSections.map((section, index) => (
              <Link
                key={index}
                to={section.available ? section.link : '#'}
                className={`block rounded-xl shadow-lg p-6 bg-white/90 backdrop-blur-sm border border-white/50 transition-all duration-300 
                  ${section.available 
                    ? 'hover:shadow-xl hover:bg-white/95 hover:scale-[1.02] cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed'
                  }`}
                tabIndex={section.available ? 0 : -1}
                aria-disabled={!section.available}
              >
                <div className="text-5xl mb-4 text-center">{section.icon}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 text-center drop-shadow-sm">
                  {section.title}
                </h2>
                <p className="text-gray-700 text-center mb-4">{section.description}</p>
                {!section.available && (
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}