import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ChildFriendlyBackground } from '../components/ChildFriendlyBackground'
import { useNotification } from '../contexts/AuthContext'

type ConversionResult = {
  markdown: string
  filename: string
  page_count: number
  text_pages: number
  ocr_pages: number
  warnings?: string[]
}

const apiBaseUrl = import.meta.env.VITE_PDF_MARKDOWN_API_URL

function markdownFilename(filename: string) {
  const cleanName = filename.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '')
  return `${cleanName || 'converted-pdf'}.md`
}

export function PdfToMarkdown() {
  const { showNotification } = useNotification()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canConvert = useMemo(() => Boolean(selectedFile && apiBaseUrl && !loading), [selectedFile, loading])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setResult(null)
    setError('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.type !== 'application/pdf') {
      setSelectedFile(null)
      setError('Only PDF files are supported.')
      showNotification('Only PDF files are supported.', 'error')
      return
    }

    setSelectedFile(file)
  }

  const convertPdf = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file.')
      return
    }

    if (!apiBaseUrl) {
      setError('PDF conversion API is not configured. Set VITE_PDF_MARKDOWN_API_URL.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/convert`, {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || `Conversion failed with status ${response.status}`)
      }

      if (!payload?.markdown) {
        throw new Error('Conversion completed without Markdown output.')
      }

      setResult(payload as ConversionResult)
      showNotification('PDF converted to Markdown.', 'success')
    } catch (err: any) {
      const message = err.message || 'Failed to convert PDF.'
      setError(message)
      showNotification('PDF conversion failed: ' + message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyMarkdown = async () => {
    if (!result?.markdown) return

    try {
      await navigator.clipboard.writeText(result.markdown)
      showNotification('Markdown copied to clipboard.', 'success')
    } catch (err: any) {
      showNotification('Could not copy Markdown: ' + (err.message || 'Unknown error'), 'error')
    }
  }

  const downloadMarkdown = () => {
    if (!result?.markdown) return

    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = markdownFilename(result.filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <ChildFriendlyBackground>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link to="/dashboard/lessons" className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium">
              ⬅️ Back to Lessons Hub
            </Link>
            <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 drop-shadow-sm font-medium">
              🏠 Dashboard
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 mb-6">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">PDF to Markdown 📝</h1>
              <p className="text-gray-700 drop-shadow-sm">
                Convert lesson PDFs into clean Markdown with text extraction and OCR for scanned pages.
              </p>
            </div>

            {!apiBaseUrl && (
              <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
                Conversion API is not configured. Set <code className="font-mono">VITE_PDF_MARKDOWN_API_URL</code> in your frontend environment.
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF
                </label>
                <input
                  id="pdfFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={convertPdf}
                disabled={!canConvert}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Converting PDF...' : 'Convert to Markdown'}
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
              <div className="border-b border-gray-200 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Markdown Preview</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {result.page_count} pages • {result.text_pages} text pages • {result.ocr_pages} OCR pages
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={copyMarkdown} className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg">
                    Copy Markdown
                  </button>
                  <button onClick={downloadMarkdown} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                    Download .md
                  </button>
                </div>
              </div>

              {result.warnings && result.warnings.length > 0 && (
                <div className="border-b border-yellow-100 bg-yellow-50 px-5 py-3 text-sm text-yellow-800">
                  {result.warnings.join(' ')}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="border-b lg:border-b-0 lg:border-r border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Rendered</h3>
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {result.markdown}
                  </ReactMarkdown>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Markdown</h3>
                  <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                    {result.markdown}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ChildFriendlyBackground>
  )
}
