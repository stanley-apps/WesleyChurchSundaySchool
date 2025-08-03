import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { supabase, Lesson } from '../lib/supabase'
import { useAuth, useNotification } from '../contexts/AuthContext'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'

export function LessonEdit() {
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showNotification } = useNotification()

  const classLevels = ['Beginners', 'Primary', 'Juniors', 'Inters', 'Seniors']

  useEffect(() => {
    if (id) {
      fetchLesson(id)
    }
  }, [id])

  const fetchLesson = async (lessonId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      if (!data) {
        setError('Lesson not found.')
        showNotification('Lesson not found.', 'error')
        return
      }

      // Check if the current user is the owner of the lesson
      if (user && data.user_id !== user.id) {
        setError('You do not have permission to edit this lesson.')
        showNotification('You do not have permission to edit this lesson.', 'error')
        navigate('/dashboard/lessons') // Redirect if not authorized
        return
      }

      setTitle(data.title)
      setDescription(data.description || '')
      setClassLevel(data.class_level || '')
      setCurrentFileUrl(data.file_url)
    } catch (err: any) {
      console.error('Error fetching lesson:', err)
      setError(err.message)
      showNotification('Error fetching lesson: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

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
    
    if (!user || !id) {
      setError('Authentication error or lesson ID missing.')
      showNotification('Authentication error or lesson ID missing.', 'error')
      return
    }

    if (!title.trim()) {
      setError('Please fill in the lesson title.')
      showNotification('Please fill in the lesson title.', 'error')
      return
    }

    if (!selectedFile && !currentFileUrl) {
      setError('Please select a PDF file or ensure a current file exists.')
      showNotification('Please select a PDF file or ensure a current file exists.', 'error')
      return
    }

    setSaving(true)
    setError('')

    let newFileUrl = currentFileUrl

    try {
      // If a new file is selected, upload it and potentially delete the old one
      if (selectedFile) {
        const bucketName = 'lesson_pdfs'
        const fileExtension = selectedFile.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}.${fileExtension}`

        // Delete old file if it exists and is different from the new one
        if (currentFileUrl) {
          const oldUrlParts = currentFileUrl.split(`/${bucketName}/`)
          const oldFilePath = oldUrlParts.length > 1 ? oldUrlParts[1] : null
          if (oldFilePath) {
            const { error: removeError } = await supabase.storage
              .from(bucketName)
              .remove([oldFilePath])
            if (removeError && !removeError.message.includes('The resource was not found')) {
              console.warn('Failed to remove old file:', removeError.message)
              // Don't throw, just log, as we still want to upload the new file
            }
          }
        }

        // Upload new file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uploadData.path)
        
        if (!publicUrlData.publicUrl) {
          throw new Error('Failed to get public URL for the uploaded file.')
        }
        newFileUrl = publicUrlData.publicUrl
      }

      // Update lesson metadata in the 'lessons' table
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          class_level: classLevel || null,
          file_url: newFileUrl, // Use the new URL or the existing one
          user_id: user.id // Ensure user_id is set for RLS
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure only the owner can update

      if (updateError) throw updateError

      showNotification('Lesson updated successfully! ✅', 'success')
      navigate('/dashboard/lessons') // Redirect to lessons list on success
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message)
      showNotification('Error updating lesson: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
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

  if (error && error !== 'You do not have permission to edit this lesson.') { // Display error unless it's a permission error handled by redirect
    return (
      <ChildFriendlyBackground>
        <div className="p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
            <Link 
              to="/dashboard/lessons" 
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Lessons
            </Link>
          </div>
        </div>
      </ChildFriendlyBackground>
    )
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard/lessons"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Lessons
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Edit Lesson 📚</h1>
              <p className="text-gray-700 drop-shadow-sm">
                Update the details or replace the PDF file for this lesson.
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
                  Lesson Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="Enter the lesson title..."
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
                  placeholder="Briefly describe the lesson..."
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
                  Upload New PDF File (Optional)
                </label>
                {currentFileUrl && !selectedFile && (
                  <p className="mb-2 text-sm text-gray-600">
                    Current file: <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Current PDF</a>
                  </p>
                )}
                <input
                  type="file"
                  id="pdfFile"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">New file selected: {selectedFile.name}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    '✅ Save Changes'
                  )}
                </button>
                <Link
                  to="/dashboard/lessons"
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