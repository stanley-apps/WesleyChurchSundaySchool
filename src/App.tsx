import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Songs } from './pages/Songs'
import { SongDetail } from './pages/SongDetail'
import { SongUpload } from './pages/SongUpload'
import { LessonsList } from './pages/LessonsList' // This is now the hub
import { SyllabusesList } from './pages/SyllabusesList' // New
import { LessonUpload } from './pages/LessonUpload' // Renamed to SyllabusUpload conceptually
import { LessonEdit } from './pages/LessonEdit' // Renamed to SyllabusEdit conceptually
import { MemoryVersesList } from './pages/MemoryVersesList' // New
import { MemoryVerseUpload } from './pages/MemoryVerseUpload'
import { StoriesList } from './pages/StoriesList' // New

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
            <Route path="syllabuses/upload" element={<LessonUpload />} /> {/* Re-using LessonUpload for Syllabuses */}
            <Route path="syllabuses/:id/edit" element={<LessonEdit />} /> {/* Re-using LessonEdit for Syllabuses */}

            {/* Memory Verses Section */}
            <Route path="memory-verses" element={<MemoryVersesList />} />
            <Route path="memory-verses/upload" element={<MemoryVerseUpload />} />

            {/* Stories Section */}
            <Route path="stories" element={<StoriesList />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App