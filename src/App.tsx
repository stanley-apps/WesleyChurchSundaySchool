import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Songs = lazy(() => import('./pages/Songs').then((module) => ({ default: module.Songs })))
const SongDetail = lazy(() => import('./pages/SongDetail').then((module) => ({ default: module.SongDetail })))
const SongUpload = lazy(() => import('./pages/SongUpload').then((module) => ({ default: module.SongUpload })))
const LessonsList = lazy(() => import('./pages/LessonsList').then((module) => ({ default: module.LessonsList })))
const SyllabusesList = lazy(() => import('./pages/SyllabusesList').then((module) => ({ default: module.SyllabusesList })))
const LessonUpload = lazy(() => import('./pages/LessonUpload').then((module) => ({ default: module.LessonUpload })))
const LessonEdit = lazy(() => import('./pages/LessonEdit').then((module) => ({ default: module.LessonEdit })))
const MemoryVersesList = lazy(() => import('./pages/MemoryVersesList').then((module) => ({ default: module.MemoryVersesList })))
const MemoryVerseUpload = lazy(() => import('./pages/MemoryVerseUpload').then((module) => ({ default: module.MemoryVerseUpload })))
const MemoryVerseDetail = lazy(() => import('./pages/MemoryVerseDetail').then((module) => ({ default: module.MemoryVerseDetail })))
const MemoryVerseEdit = lazy(() => import('./pages/MemoryVerseEdit').then((module) => ({ default: module.MemoryVerseEdit })))
const StoriesList = lazy(() => import('./pages/StoriesList').then((module) => ({ default: module.StoriesList })))
const StoryUpload = lazy(() => import('./pages/StoryUpload').then((module) => ({ default: module.StoryUpload })))
const StoryDetail = lazy(() => import('./pages/StoryDetail').then((module) => ({ default: module.StoryDetail })))
const StoryEdit = lazy(() => import('./pages/StoryEdit').then((module) => ({ default: module.StoryEdit })))
const QuizGenerator = lazy(() => import('./pages/QuizGenerator').then((module) => ({ default: module.QuizGenerator })))
const QuizDetail = lazy(() => import('./pages/QuizDetail').then((module) => ({ default: module.QuizDetail })))
const QuizPlay = lazy(() => import('./pages/QuizPlay').then((module) => ({ default: module.QuizPlay })))
const Timer = lazy(() => import('./pages/Timer').then((module) => ({ default: module.Timer })))
const GamesList = lazy(() => import('./pages/GamesList').then((module) => ({ default: module.GamesList })))
const MemoryMatch = lazy(() => import('./pages/MemoryMatch').then((module) => ({ default: module.MemoryMatch })))
const UpdatePassword = lazy(() => import('./pages/UpdatePassword').then((module) => ({ default: module.UpdatePassword })))
const AuthConfirm = lazy(() => import('./pages/AuthConfirm').then((module) => ({ default: module.AuthConfirm })))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/confirm" element={<AuthConfirm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="songs" element={<Songs />} />
              <Route path="songs/upload" element={<SongUpload />} />
              <Route path="songs/:id" element={<SongDetail />} />
              
              {/* Lessons Hub */}
              <Route path="lessons" element={<LessonsList />} /> 
              
              {/* Syllabuses Section */}
              <Route path="syllabuses" element={<SyllabusesList />} />
              <Route path="syllabuses/upload" element={<LessonUpload />} />
              <Route path="syllabuses/:id/edit" element={<LessonEdit />} />

              {/* Memory Verses Section */}
              <Route path="memory-verses" element={<MemoryVersesList />} />
              <Route path="memory-verses/upload" element={<MemoryVerseUpload />} />
              <Route path="memory-verses/:id" element={<MemoryVerseDetail />} />
              <Route path="memory-verses/:id/edit" element={<MemoryVerseEdit />} />

              {/* Stories Section */}
              <Route path="stories" element={<StoriesList />} />
              <Route path="stories/upload" element={<StoryUpload />} />
              <Route path="stories/:id" element={<StoryDetail />} />
              <Route path="stories/:id/edit" element={<StoryEdit />} />

              {/* Games Section */}
              <Route path="games" element={<GamesList />} />
              <Route path="games/bible-quiz" element={<QuizGenerator />} />
              <Route path="games/emoji-quiz" element={<Navigate to="/dashboard/games/bible-quiz" replace />} />
              <Route path="games/timer" element={<Timer />} />
              <Route path="games/memory-match" element={<MemoryMatch />} />
              <Route path="quizzes/:id/play" element={<QuizPlay />} />
              <Route path="quizzes/:id" element={<QuizDetail />} />
            </Route>
            <Route 
              path="/update-password" 
              element={
                <ProtectedRoute>
                  <UpdatePassword />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App
