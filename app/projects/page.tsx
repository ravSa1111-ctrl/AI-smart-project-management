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
        return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-400'
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-6">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">View Projects</h1>
          </div>
          <div className="card bg-red-50 border-red-200 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block transition-colors">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">View Projects</h1>
              <p className="text-gray-600">
                Overview of all projects. Click a card to view details.
              </p>
            </div>
            <Link
              href="/projects/create"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first project.</p>
              <Link
                href="/projects/create"
                className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Create Your First Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleCardClick(project.id)}
                className="card card-hover p-6 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(project.id)
                  }
                }}
              >
                {/* Project Name and Status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                    {project.name}
                  </h3>
                  <span
                    className={`badge flex-shrink-0 ${getStatusColor(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed min-h-[3.5rem]">
                  {project.description}
                </p>

                {/* Timeline Summary */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-gray-500">Timeline:</span>
                    <span className="text-gray-700 font-medium">
                      {getTimelineSummary(project)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100">
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
