'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requirements: '',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Mock PDF extraction - in production, use pdf-parse or similar library
    // For demo purposes, return a placeholder text
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real implementation, you would use:
        // import pdf from 'pdf-parse'
        // const dataBuffer = await file.arrayBuffer()
        // const data = await pdf(Buffer.from(dataBuffer))
        // resolve(data.text)
        resolve('[PDF Text Extraction - Mock]\n\nThis is a placeholder for extracted PDF text. In production, this would use a PDF parsing library like pdf-parse to extract actual text content from the uploaded PDF file.')
      }, 1000)
    })
  }

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    // Mock DOCX extraction - in production, use mammoth or similar library
    // For demo purposes, extract as plain text using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          // In real implementation, you would use:
          // import mammoth from 'mammoth'
          // const arrayBuffer = e.target?.result as ArrayBuffer
          // const result = await mammoth.extractRawText({ arrayBuffer })
          // resolve(result.value)
          
          // For demo: Try to read as text (won't work well for DOCX, but shows the pattern)
          // DOCX files are ZIP archives, so FileReader won't extract text properly
          // This is a mock implementation
          const text = e.target?.result as string || ''
          if (text.length > 0 && text.length < 1000) {
            // Likely plain text, return it
            resolve(text)
          } else {
            // Mock extracted text for DOCX
            resolve('[DOCX Text Extraction - Mock]\n\nThis is a placeholder for extracted DOCX text. In production, this would use a DOCX parsing library like mammoth to extract actual text content from the uploaded DOCX file.')
          }
        } catch (err) {
          reject(new Error('Failed to extract text from DOCX file'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Failed to read DOCX file'))
      }
      // Try reading as text (works for some cases, but DOCX needs proper parsing)
      reader.readAsText(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]
      const validExtensions = ['.pdf', '.docx', '.doc']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setError('Please upload a PDF or DOCX file')
        return
      }
      
      setUploadedFile(file)
      setError('')
      setExtractedText('')
      // Clear text requirements when file is uploaded
      setFormData({ ...formData, requirements: '' })

      // Extract text from the file
      setIsExtracting(true)
      try {
        let text = ''
        if (file.type === 'application/pdf' || fileExtension === '.pdf') {
          text = await extractTextFromPDF(file)
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword' ||
          fileExtension === '.docx' ||
          fileExtension === '.doc'
        ) {
          text = await extractTextFromDOCX(file)
        }

        setExtractedText(text)
        // Auto-populate requirements with extracted text
        setFormData({ ...formData, requirements: text })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to extract text from document'
        setError(`${errorMessage}. You can enter requirements manually below.`)
        // Don't clear the file - allow user to try manual input
      } finally {
        setIsExtracting(false)
      }
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setExtractedText('')
    const fileInput = document.getElementById('document-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Please fill in name and description')
      setIsSubmitting(false)
      return
    }

    if (!formData.requirements.trim() && !uploadedFile) {
      setError('Please provide requirements either as text or upload a document')
      setIsSubmitting(false)
      return
    }

    try {
      // Use extracted text if available, otherwise use manual input
      const requirementsText = extractedText.trim() || formData.requirements.trim()
      // Determine source: if we have extracted text and uploaded file, it's from document, otherwise manual
      const requirementsSource = uploadedFile && extractedText.trim() ? 'document' : 'manual'

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          requirements: requirementsText,
          requirementsSource,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const data = await response.json()
      router.push(`/projects/analyze?id=${data.project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setFormData({
      ...formData,
      [e.target.name]: newValue,
    })
    // Clear file when text is entered
    if (e.target.name === 'requirements' && uploadedFile && newValue.trim()) {
      handleRemoveFile()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Create New Project
          </h1>
          <p className="text-gray-600">
            Provide project details. The AI delivery manager will analyze and create a comprehensive plan.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Project Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm"
                  placeholder="e.g., E-commerce Platform"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm"
                  placeholder="Brief overview of the project..."
                />
              </div>

              {/* Requirements */}
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Provide requirements as text below, or upload a document (PDF or DOCX)
                </p>
                
                {/* File Upload Option */}
                <div className="mb-4">
                  <label
                    htmlFor="document-upload"
                    className={`inline-block px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 ${isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isExtracting ? 'Extracting Text...' : uploadedFile ? 'Change Document' : 'Upload Document (PDF/DOCX)'}
                  </label>
                  <input
                    id="document-upload"
                    type="file"
                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isExtracting}
                  />
                  {uploadedFile && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          File: <span className="font-medium">{uploadedFile.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({(uploadedFile.size / 1024).toFixed(2)} KB)
                          </span>
                        </span>
                        {!isExtracting && (
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {isExtracting && (
                        <p className="text-xs text-blue-600 mt-1">
                          Extracting text from document...
                        </p>
                      )}
                      {extractedText && !isExtracting && (
                        <p className="text-xs text-green-600 mt-1">
                          Text extracted successfully ({extractedText.length} characters)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Text Input Option */}
                <div className={uploadedFile ? 'opacity-50' : ''}>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm font-mono"
                    placeholder={uploadedFile ? 'Document uploaded. Remove document to enter text requirements.' : 'Detailed requirements, features, and specifications...'}
                    disabled={!!uploadedFile}
                    required={!uploadedFile}
                  />
                  {!uploadedFile && (
                    <p className="mt-2 text-xs text-gray-500">
                      Include technology stack, features, integrations, performance needs, etc.
                    </p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isExtracting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
