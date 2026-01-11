'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PromptEntry {
  promptId?: string
  date?: string
  feature?: string
  filesImpacted?: string
  promptContent?: string
  notes?: string
}

export default function PromptsPage() {
  const [promptLog, setPromptLog] = useState<string>('')
  const [parsedEntries, setParsedEntries] = useState<PromptEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPromptLog()
  }, [])

  const loadPromptLog = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch the markdown file via API route
      const response = await fetch('/api/prompts')
      if (!response.ok) {
        throw new Error('Failed to load prompt log')
      }
      
      const text = await response.text()
      setPromptLog(text)
      parsePromptLog(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt log')
    } finally {
      setLoading(false)
    }
  }

  const parsePromptLog = (markdown: string) => {
    const entries: PromptEntry[] = []
    
    // Split by entry separator (---)
    const sections = markdown.split(/\n---\n/)
    
    for (const section of sections) {
      // Skip template and header sections
      if (section.includes('Prompt Template') || section.includes('# Cursor AI Prompt Log')) {
        continue
      }
      
      // Extract prompt entry fields
      const promptIdMatch = section.match(/\*\*Prompt ID:\*\*\s*(.+)/)
      const dateMatch = section.match(/\*\*Date:\*\*\s*(.+)/)
      const featureMatch = section.match(/\*\*Feature \/ Purpose:\*\*\s*(.+)/)
      const filesMatch = section.match(/\*\*Files Impacted:\*\*\s*([\s\S]*?)(?=\*\*Prompt Content:)/)
      const promptContentMatch = section.match(/\*\*Prompt Content:\*\*\s*([\s\S]*?)(?=\*\*Notes)/)
      const notesMatch = section.match(/\*\*Notes \/ Outcome:\*\*\s*([\s\S]*?)$/)
      
      if (promptIdMatch || dateMatch || featureMatch) {
        entries.push({
          promptId: promptIdMatch?.[1]?.trim(),
          date: dateMatch?.[1]?.trim(),
          feature: featureMatch?.[1]?.trim(),
          filesImpacted: filesMatch?.[1]?.trim(),
          promptContent: promptContentMatch?.[1]?.trim(),
          notes: notesMatch?.[1]?.trim(),
        })
      }
    }
    
    setParsedEntries(entries)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">AI Prompt Log</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Developer panel - Read-only view of AI prompts used to build this application
                </p>
              </div>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Back to Home
              </Link>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>Purpose:</strong> This panel provides transparency into how AI decisions were guided during development.
                It helps stakeholders review prompt governance, reproducibility, and decision-making processes.
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Loading prompt log...</p>
          </div>
        )}

        {/* Prompt Entries */}
        {!loading && !error && parsedEntries.length > 0 && (
          <div className="space-y-6">
            {parsedEntries.map((entry, index) => (
              <div key={index} className="bg-white border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {entry.promptId && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 mr-2">
                          {entry.promptId}
                        </span>
                      )}
                      {entry.date && (
                        <span className="text-xs text-gray-500">{entry.date}</span>
                      )}
                    </div>
                  </div>

                  {entry.feature && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Feature / Purpose</h3>
                      <p className="text-sm text-gray-700">{entry.feature}</p>
                    </div>
                  )}

                  {entry.filesImpacted && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Files Impacted</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.filesImpacted}</p>
                    </div>
                  )}

                  {entry.promptContent && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Prompt Content</h3>
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                          {entry.promptContent}
                        </pre>
                      </div>
                    </div>
                  )}

                  {entry.notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Notes / Outcome</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && parsedEntries.length === 0 && (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-2">No prompt entries found</p>
            <p className="text-sm text-gray-500">
              Prompt entries will appear here as they are added to the log file.
            </p>
          </div>
        )}

        {/* Raw Markdown View (Collapsible) */}
        {!loading && !error && promptLog && (
          <div className="mt-8">
            <details className="bg-white border border-gray-200">
              <summary className="p-4 cursor-pointer text-sm font-semibold text-gray-900 hover:bg-gray-50">
                View Raw Markdown
              </summary>
              <div className="p-6 border-t border-gray-200">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                  {promptLog}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
