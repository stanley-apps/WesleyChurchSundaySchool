import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useNotification } from '../contexts/AuthContext' // For notifications

export function LessonUpload() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showNotification } = useNotification()

  const classLevels = ['Beginners', 'Primary', 'Juniors', 'Inters', 'Seniors']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed.')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to upload lessons.')
      showNotification('You must be logged in to upload lessons.', 'error')
      return
    }

    if (!title.trim() || !selectedFile) {
      setError('Please fill in the title and select a PDF file.')
      showNotification('Please fill in the title and select a PDF file.', 'error')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Upload PDF to Supabase Storage
      const fileExtension = selectedFile.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExtension}` // Unique path for the file

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson_pdfs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('lesson_pdfs')
        .getPublicUrl(uploadData.path)
      
      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file.')
      }

      // 2. Insert lesson metadata into the 'lessons' table
      const { error: insertError } = await supabase
        .from('lessons')
        .insert([
          {
            title: title.trim(),
            description: description.trim() || null,
            class_level: classLevel || null,
            file_url: publicUrlData.publicUrl,
            user_id: user.id
          }
        ])

      if (insertError) throw insertError

      showNotification('Lesson uploaded successfully! ✅', 'success')
      navigate('/dashboard/syllabuses') // Redirect to syllabuses list on success
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message)
      showNotification('Error uploading lesson: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/syllabuses"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Syllabuses
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium"
            >
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Upload New Syllabus 📚</h1>
              <p className="text-gray-700 drop-shadow-sm">
                Add a new syllabus PDF to the Sunday School collection.
              </p>
            </div>

            {error && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Syllabus Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="Enter the syllabus title..."
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm resize-vertical"
                  placeholder="Briefly describe the syllabus..."
                />
              </div>

              <div>
                <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Level (Optional)
                </label>
                <select
                  id="classLevel"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                >
                  <option value="">Select a class level</option>
                  {classLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF File *
                </label>
                <input
                  type="file"
                  id="pdfFile"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                  required
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected file: {selectedFile.name}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    '📚 Upload Syllabus'
                  )}
                </button>
                <Link
                  to="/dashboard/syllabuses"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}