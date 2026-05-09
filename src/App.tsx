import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Songs } from './pages/Songs'
import { SongDetail } from './pages/SongDetail'
import { SongUpload } from './pages/SongUpload'
import { LessonsList } from './pages/LessonsList'
import { SyllabusesList } from './pages/SyllabusesList'
import { LessonUpload } from './pages/LessonUpload'
import { LessonEdit } from './pages/LessonEdit'
import { MemoryVersesList } from './pages/MemoryVersesList'
import { MemoryVerseUpload } from './pages/MemoryVerseUpload'
import { MemoryVerseDetail } from './pages/MemoryVerseDetail'
import { MemoryVerseEdit } from './pages/MemoryVerseEdit'
import { StoriesList } from './pages/StoriesList'
import { StoryUpload } from './pages/StoryUpload'
import { StoryDetail } from './pages/StoryDetail'
import { StoryEdit } from './pages/StoryEdit'
import { QuizGenerator } from './pages/QuizGenerator'
import { QuizDetail } from './pages/QuizDetail'
import { Timer } from './pages/Timer'
import { GamesList } from './pages/GamesList'
import { MemoryMatch } from './pages/MemoryMatch'
import { UpdatePassword } from './pages/UpdatePassword'
import { AuthConfirm } from './pages/AuthConfirm'

function App() {
  return (
    <AuthProvider>
      <Router>
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
            <Route path="games/emoji-quiz" element={<QuizGenerator />} />
            <Route path="games/timer" element={<Timer />} />
            <Route path="games/memory-match" element={<MemoryMatch />} />
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
      </Router>
    </AuthProvider>
  )
}

export default App