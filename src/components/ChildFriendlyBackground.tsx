import React from 'react'

interface ChildFriendlyBackgroundProps {
  children: React.ReactNode
  className?: string
}

const colors = [
  '#FFE4E1', '#E1F5FE', '#F3E5F5', '#E8F5E8',
  '#FFF3E0', '#F1F8E9', '#FCE4EC', '#E0F2F1'
]

const bubbles = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 23 + 7) % 100}%`,
  top: `${(i * 37 + 11) % 100}%`,
  size: `${20 + ((i * 17) % 40)}px`,
  backgroundColor: colors[i % colors.length],
  animationDelay: `${(i * 0.4) % 5}s`,
  animationDuration: `${8 + (i % 4)}s`,
}))

const stars = Array.from({ length: 8 }, (_, i) => ({
  left: `${(i * 29 + 5) % 90}%`,
  top: `${(i * 31 + 13) % 90}%`,
  fontSize: `${16 + ((i * 5) % 16)}px`,
  animationDelay: `${(i * 0.35) % 3}s`,
}))

const hearts = Array.from({ length: 6 }, (_, i) => ({
  left: `${(i * 34 + 9) % 90}%`,
  top: `${(i * 27 + 19) % 90}%`,
  fontSize: `${12 + ((i * 4) % 12)}px`,
  animationDelay: `${(i * 0.3) % 2}s`,
}))

const rainbows = Array.from({ length: 4 }, (_, i) => ({
  left: `${(i * 33 + 17) % 85}%`,
  top: `${(i * 28 + 21) % 85}%`,
  fontSize: `${20 + ((i * 3) % 10)}px`,
  animationDelay: `${i}s`,
  animationDuration: `${3 + (i % 2)}s`,
}))

export function ChildFriendlyBackground({ children, className = '' }: ChildFriendlyBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-pink-50 to-blue-100"></div>
        
        {/* Floating bubbles */}
        <div className="absolute inset-0">
          {bubbles.map((bubble, i) => (
            <div
              key={`bubble-${i}`}
              className={`absolute rounded-full opacity-20 animate-float-${i % 3}`}
              style={{
                left: bubble.left,
                top: bubble.top,
                width: bubble.size,
                height: bubble.size,
                backgroundColor: bubble.backgroundColor,
                animationDelay: bubble.animationDelay,
                animationDuration: bubble.animationDuration,
              }}
            />
          ))}
        </div>

        {/* Geometric shapes */}
        <div className="absolute inset-0">
          {/* Stars */}
          {stars.map((star, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-yellow-300 opacity-30 animate-twinkle"
              style={{
                left: star.left,
                top: star.top,
                fontSize: star.fontSize,
                animationDelay: star.animationDelay,
              }}
            >
              ⭐
            </div>
          ))}

          {/* Hearts */}
          {hearts.map((heart, i) => (
            <div
              key={`heart-${i}`}
              className="absolute text-pink-300 opacity-25 animate-pulse"
              style={{
                left: heart.left,
                top: heart.top,
                fontSize: heart.fontSize,
                animationDelay: heart.animationDelay,
              }}
            >
              💖
            </div>
          ))}

          {/* Rainbow elements */}
          {rainbows.map((rainbow, i) => (
            <div
              key={`rainbow-${i}`}
              className="absolute text-purple-300 opacity-20 animate-bounce"
              style={{
                left: rainbow.left,
                top: rainbow.top,
                fontSize: rainbow.fontSize,
                animationDelay: rainbow.animationDelay,
                animationDuration: rainbow.animationDuration,
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
