'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  requirements: string
  status: 'draft' | 'analyzing' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  analysis?: {
    timeline?: {
      estimatedWeeks?: number
    }
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'analyzing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'analyzing':
        return 'Analyzing'
      case 'rejected':
        return 'Rejected'
      case 'draft':
      default:
        return 'Draft'
    }
  }

  const getTimelineSummary = (project: Project) => {
    if (project.analysis?.timeline?.estimatedWeeks) {
      return `${project.analysis.timeline.estimatedWeeks} weeks`
    }
    return 'Not estimated'
  }

  const handleCardClick = (projectId: string) => {
    router.push(`/projects/analyze?id=${projectId}&view=summary`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-6">
            <Link href="/" className="text-sm text-blue-600 mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">View Projects</h1>
          </div>
          <div className="bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 mb-4 inline-block">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">View Projects</h1>
              <p className="text-gray-600">
                Overview of all projects. Click a card to view details.
              </p>
            </div>
            <Link
              href="/projects/create"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">No projects found.</p>
            <Link
              href="/projects/create"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleCardClick(project.id)}
                className="bg-white border border-gray-200 p-6 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(project.id)
                  }
                }}
              >
                {/* Project Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Timeline Summary */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">Timeline:</span>
                  <span className="text-xs text-gray-600">
                    {getTimelineSummary(project)}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
