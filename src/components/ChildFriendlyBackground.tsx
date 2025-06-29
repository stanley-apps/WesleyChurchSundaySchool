import React from 'react'

interface ChildFriendlyBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function ChildFriendlyBackground({ children, className = '' }: ChildFriendlyBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-pink-50 to-blue-100"></div>
        
        {/* Floating bubbles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={`bubble-${i}`}
              className={`absolute rounded-full opacity-20 animate-float-${i % 3}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 40}px`,
                height: `${20 + Math.random() * 40}px`,
                backgroundColor: [
                  '#FFE4E1', '#E1F5FE', '#F3E5F5', '#E8F5E8', 
                  '#FFF3E0', '#F1F8E9', '#FCE4EC', '#E0F2F1'
                ][i % 8],
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Geometric shapes */}
        <div className="absolute inset-0">
          {/* Stars */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-yellow-300 opacity-30 animate-twinkle"
              style={{
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
                fontSize: `${16 + Math.random() * 16}px`,
                animationDelay: `${Math.random() * 3}s`
              }}
            >
              ⭐
            </div>
          ))}

          {/* Hearts */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`heart-${i}`}
              className="absolute text-pink-300 opacity-25 animate-pulse"
              style={{
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
                fontSize: `${12 + Math.random() * 12}px`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              💖
            </div>
          ))}

          {/* Rainbow elements */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`rainbow-${i}`}
              className="absolute text-purple-300 opacity-20 animate-bounce"
              style={{
                left: `${Math.random() * 85}%`,
                top: `${Math.random() * 85}%`,
                fontSize: `${20 + Math.random() * 10}px`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              🌈
            </div>
          ))}
        </div>

        {/* Soft wave patterns */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-20 opacity-20"
          >
            <path
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
              fill="url(#wave-gradient)"
            />
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFB6C1" />
                <stop offset="50%" stopColor="#87CEEB" />
                <stop offset="100%" stopColor="#98FB98" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Top decorative elements */}
        <div className="absolute top-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-16 opacity-15 rotate-180"
          >
            <path
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
              fill="url(#top-wave-gradient)"
            />
            <defs>
              <linearGradient id="top-wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DDA0DD" />
                <stop offset="50%" stopColor="#F0E68C" />
                <stop offset="100%" stopColor="#FFE4B5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}