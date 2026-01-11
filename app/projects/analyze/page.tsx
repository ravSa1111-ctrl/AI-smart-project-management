'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { analyzeProject, reviseProjectPlan, generateExecutionPlan, extendExecutionPlan, generateRevisionChangeLog } from '@/lib/services/aiDeliveryManager'
import type { Project, ProjectAnalysis, Phase, CostBreakdown, TeamMember, Risk } from '@/lib/data/mockStorage'
import type { ExecutionPlan } from '@/lib/services/aiDeliveryManager'

export default function AnalyzeProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')

  const [project, setProject] = useState<Project | null>(null)
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Edit state for each section
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [managerAdjusted, setManagerAdjusted] = useState<Set<string>>(new Set())
  
  // Temporary edit state for each section
  const [editTimeline, setEditTimeline] = useState<ProjectAnalysis['timeline'] | null>(null)
  const [editCost, setEditCost] = useState<ProjectAnalysis['cost'] | null>(null)
  const [editTeam, setEditTeam] = useState<ProjectAnalysis['team'] | null>(null)
  const [editRisks, setEditRisks] = useState<Risk[] | null>(null)
  const [editRecommendations, setEditRecommendations] = useState<string[] | null>(null)
  
  // Selected recommendations state
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set())
  
  // Execution plan state
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  // Define displayProject early for use in handlers
  const displayProject = project || {
    name: 'Project Analysis',
    description: 'No project found. You can still analyze project requirements below.',
    requirements: '',
    status: 'draft' as const,
    id: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    } else {
      loadAllProjects()
    }
  }, [projectId])

  const loadProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) {
        setProject(null)
        setLoading(false)
        return
      }
      const data = await response.json()
      setProject(data.project)
      if (data.project.analysis) {
        setAnalysis(data.project.analysis)
      }
    } catch (err) {
      setProject(null)
    } finally {
      setLoading(false)
    }
  }

  const loadAllProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        setLoading(false)
        return
      }
      const data = await response.json()
      if (data.projects.length > 0) {
        setProject(data.projects[0])
        if (data.projects[0].analysis) {
          setAnalysis(data.projects[0].analysis)
        }
      }
    } catch (err) {
      // Continue without project
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError('')

    try {
      const projectData = project || {
        name: 'New Project Analysis',
        description: 'Analyzing project requirements',
        requirements: 'No project selected. Please provide project details for analysis.',
      }

      const analysisResponse = await analyzeProject({
        name: projectData.name,
        description: projectData.description,
        requirements: projectData.requirements,
      })

      setAnalysis(analysisResponse.analysis)
      setManagerAdjusted(new Set()) // Reset adjusted flags for new analysis
      setSelectedRecommendations(new Set()) // Reset selected recommendations

      if (project?.id) {
        try {
          await fetch(`/api/projects/${project.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'analyzing',
              analysis: analysisResponse.analysis,
            }),
          })
        } catch (saveError) {
          console.error('Failed to save analysis:', saveError)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze project')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApprove = async () => {
    if (!project) return

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      })

      if (!response.ok) throw new Error('Failed to approve project')
      const data = await response.json()
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve project')
    }
  }

  const handleReject = async () => {
    if (!project) return

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      })

      if (!response.ok) throw new Error('Failed to reject project')
      const data = await response.json()
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject project')
    }
  }

  const handleCreateExecutionPlan = async () => {
    if (!analysis) return

    setIsGeneratingPlan(true)
    setError('')

    try {
      const plan = await generateExecutionPlan({
        requirements: displayProject.requirements || '',
        analysis,
        selectedSuggestions: analysis.revisedBasedOn || [],
      })

      setExecutionPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate execution plan')
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const handleExtendExecutionPlan = async () => {
    if (!analysis || !executionPlan) return

    setIsGeneratingPlan(true)
    setError('')

    try {
      const extendedPlan = await extendExecutionPlan({
        existingPlan: executionPlan,
        requirements: displayProject.requirements || '',
        analysis,
        selectedSuggestions: analysis.revisedBasedOn || [],
      })

      setExecutionPlan(extendedPlan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend execution plan')
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Edit handlers
  const startEdit = (section: string) => {
    if (!analysis) return
    setEditingSection(section)
    
    switch (section) {
      case 'timeline':
        setEditTimeline({ ...analysis.timeline })
        break
      case 'cost':
        setEditCost({ ...analysis.cost })
        break
      case 'team':
        setEditTeam({ ...analysis.team })
        break
      case 'risks':
        setEditRisks([...analysis.risks])
        break
      case 'recommendations':
        setEditRecommendations([...analysis.recommendations])
        break
    }
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setEditTimeline(null)
    setEditCost(null)
    setEditTeam(null)
    setEditRisks(null)
    setEditRecommendations(null)
  }

  const saveEdit = (section: string) => {
    if (!analysis) return

    let updatedAnalysis = { ...analysis }

    switch (section) {
      case 'timeline':
        if (editTimeline) {
          updatedAnalysis.timeline = editTimeline
        }
        break
      case 'cost':
        if (editCost) {
          updatedAnalysis.cost = editCost
        }
        break
      case 'team':
        if (editTeam) {
          updatedAnalysis.team = editTeam
        }
        break
      case 'risks':
        if (editRisks) {
          updatedAnalysis.risks = editRisks
        }
        break
      case 'recommendations':
        if (editRecommendations) {
          updatedAnalysis.recommendations = editRecommendations
        }
        break
    }

    setAnalysis(updatedAnalysis)
    const updatedAdjusted = new Set(managerAdjusted)
    updatedAdjusted.add(section)
    setManagerAdjusted(updatedAdjusted)
    cancelEdit()

    // Optionally save to project
    if (project?.id) {
      fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: updatedAnalysis }),
      }).catch(console.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                {displayProject.name}
              </h1>
              <p className="text-gray-600">Project Analysis & Planning</p>
            </div>
            {project && (
              <div className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs font-medium text-gray-700">
                {project.status.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {!project && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              No project found. You can still analyze project requirements below or create a new project.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Project Details</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">{displayProject.description}</p>
              {displayProject.requirements && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Requirements</h4>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-4">
                    {displayProject.requirements}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              {!analysis && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Project'}
                </button>
              )}
              {analysis && project && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={project.status === 'approved'}
                    className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={project.status === 'rejected'}
                    className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                  {project.status === 'approved' && (
                    <button
                      onClick={handleCreateExecutionPlan}
                      disabled={isGeneratingPlan}
                      className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPlan ? 'Generating...' : 'Create Execution Plan'}
                    </button>
                  )}
                </>
              )}
              {analysis && !project && (
                <Link
                  href="/projects/create"
                  className="block w-full px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium text-center"
                >
                  Create Project from Analysis
                </Link>
              )}
              <Link
                href="/projects/create"
                className="block w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium text-center"
              >
                New Project
              </Link>
            </div>
          </div>

          {project && (
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Project Info</h3>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Sections */}
        {analysis && (
          <div className="space-y-6">
            {/* Timeline Section */}
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Timeline Estimate</h2>
                  {managerAdjusted.has('timeline') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1">Manager Adjusted</span>
                  )}
                </div>
                {editingSection !== 'timeline' && (
                  <button
                    onClick={() => startEdit('timeline')}
                    className="text-xs px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {editingSection === 'timeline' && editTimeline ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Weeks
                      </label>
                      <input
                        type="number"
                        value={editTimeline.estimatedWeeks}
                        onChange={(e) => setEditTimeline({
                          ...editTimeline,
                          estimatedWeeks: parseInt(e.target.value) || 0,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                      />
                    </div>
                    {editTimeline.phases.map((phase, index) => (
                      <div key={index} className="border border-gray-200 p-4 space-y-3">
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => {
                            const newPhases = [...editTimeline.phases]
                            newPhases[index] = { ...phase, name: e.target.value }
                            setEditTimeline({ ...editTimeline, phases: newPhases })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 text-sm font-semibold"
                          placeholder="Phase name"
                        />
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Duration (weeks)</label>
                            <input
                              type="number"
                              value={phase.durationWeeks}
                              onChange={(e) => {
                                const newPhases = [...editTimeline.phases]
                                newPhases[index] = { ...phase, durationWeeks: parseInt(e.target.value) || 0 }
                                setEditTimeline({ ...editTimeline, phases: newPhases })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 text-sm"
                            />
                          </div>
                        </div>
                        <textarea
                          value={phase.description}
                          onChange={(e) => {
                            const newPhases = [...editTimeline.phases]
                            newPhases[index] = { ...phase, description: e.target.value }
                            setEditTimeline({ ...editTimeline, phases: newPhases })
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          placeholder="Description"
                        />
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Deliverables (one per line)</label>
                          <textarea
                            value={phase.deliverables.join('\n')}
                            onChange={(e) => {
                              const newPhases = [...editTimeline.phases]
                              newPhases[index] = {
                                ...phase,
                                deliverables: e.target.value.split('\n').filter(d => d.trim()),
                              }
                              setEditTimeline({ ...editTimeline, phases: newPhases })
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 text-sm"
                            placeholder="Deliverable 1&#10;Deliverable 2"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit('timeline')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-2xl font-semibold text-gray-900">
                        {analysis.timeline.estimatedWeeks} weeks
                      </p>
                    </div>
                    <div className="space-y-4">
                      {analysis.timeline.phases.map((phase, index) => (
                        <div key={index} className="border-l-2 border-blue-600 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">{phase.name}</h3>
                            <span className="text-xs text-gray-600">
                              {phase.durationWeeks} week{phase.durationWeeks !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{phase.description}</p>
                          <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
                            {phase.deliverables.map((deliverable, i) => (
                              <li key={i}>{deliverable}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cost Section */}
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Cost Estimate</h2>
                  {managerAdjusted.has('cost') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1">Manager Adjusted</span>
                  )}
                </div>
                {editingSection !== 'cost' && (
                  <button
                    onClick={() => startEdit('cost')}
                    className="text-xs px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {editingSection === 'cost' && editCost ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
                        <input
                          type="number"
                          value={editCost.estimatedTotal}
                          onChange={(e) => setEditCost({
                            ...editCost,
                            estimatedTotal: parseFloat(e.target.value) || 0,
                          })}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <input
                          type="text"
                          value={editCost.currency}
                          onChange={(e) => setEditCost({
                            ...editCost,
                            currency: e.target.value,
                          })}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cost Breakdown</label>
                      {editCost.breakdown.map((item, index) => (
                        <div key={index} className="border border-gray-200 p-4 mb-3 space-y-2">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => {
                              const newBreakdown = [...editCost.breakdown]
                              newBreakdown[index] = { ...item, category: e.target.value }
                              setEditCost({ ...editCost, breakdown: newBreakdown })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 text-sm font-medium"
                            placeholder="Category"
                          />
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const newBreakdown = [...editCost.breakdown]
                              newBreakdown[index] = { ...item, description: e.target.value }
                              setEditCost({ ...editCost, breakdown: newBreakdown })
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 text-sm"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const newBreakdown = [...editCost.breakdown]
                              newBreakdown[index] = { ...item, amount: parseFloat(e.target.value) || 0 }
                              setEditCost({ ...editCost, breakdown: newBreakdown })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 text-sm"
                            placeholder="Amount"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit('cost')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-2xl font-semibold text-gray-900">
                        ${analysis.cost.estimatedTotal.toLocaleString()} {analysis.cost.currency}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {analysis.cost.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.category}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            ${item.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Team Section */}
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Team Composition</h2>
                  {managerAdjusted.has('team') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1">Manager Adjusted</span>
                  )}
                </div>
                {editingSection !== 'team' && (
                  <button
                    onClick={() => startEdit('team')}
                    className="text-xs px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {editingSection === 'team' && editTeam ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Members</label>
                      <input
                        type="number"
                        value={editTeam.totalMembers}
                        onChange={(e) => setEditTeam({
                          ...editTeam,
                          totalMembers: parseInt(e.target.value) || 0,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                      {editTeam.composition.map((member, index) => (
                        <div key={index} className="border border-gray-200 p-4 mb-3 space-y-2">
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => {
                              const newComposition = [...editTeam.composition]
                              newComposition[index] = { ...member, role: e.target.value }
                              setEditTeam({ ...editTeam, composition: newComposition })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 text-sm font-semibold"
                            placeholder="Role"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Count</label>
                              <input
                                type="number"
                                value={member.count}
                                onChange={(e) => {
                                  const newComposition = [...editTeam.composition]
                                  newComposition[index] = { ...member, count: parseInt(e.target.value) || 0 }
                                  setEditTeam({ ...editTeam, composition: newComposition })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Level</label>
                              <select
                                value={member.level}
                                onChange={(e) => {
                                  const newComposition = [...editTeam.composition]
                                  newComposition[index] = { ...member, level: e.target.value as 'junior' | 'mid' | 'senior' }
                                  setEditTeam({ ...editTeam, composition: newComposition })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 text-sm"
                              >
                                <option value="junior">Junior</option>
                                <option value="mid">Mid</option>
                                <option value="senior">Senior</option>
                              </select>
                            </div>
                          </div>
                          <textarea
                            value={member.description}
                            onChange={(e) => {
                              const newComposition = [...editTeam.composition]
                              newComposition[index] = { ...member, description: e.target.value }
                              setEditTeam({ ...editTeam, composition: newComposition })
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 text-sm"
                            placeholder="Description"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit('team')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-semibold text-gray-900">{analysis.team.totalMembers} members</span>
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {analysis.team.composition.map((member, index) => (
                        <div key={index} className="border border-gray-200 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">{member.role}</h3>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                              {member.count}x {member.level}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{member.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Risks Section */}
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Risk Assessment</h2>
                  {managerAdjusted.has('risks') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1">Manager Adjusted</span>
                  )}
                </div>
                {editingSection !== 'risks' && (
                  <button
                    onClick={() => startEdit('risks')}
                    className="text-xs px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {editingSection === 'risks' && editRisks ? (
                  <div className="space-y-4">
                    {editRisks.map((risk, index) => (
                      <div key={index} className="border border-gray-200 p-4 space-y-2">
                        <select
                          value={risk.level}
                          onChange={(e) => {
                            const newRisks = [...editRisks]
                            newRisks[index] = { ...risk, level: e.target.value as 'low' | 'medium' | 'high' }
                            setEditRisks(newRisks)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <textarea
                          value={risk.description}
                          onChange={(e) => {
                            const newRisks = [...editRisks]
                            newRisks[index] = { ...risk, description: e.target.value }
                            setEditRisks(newRisks)
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          placeholder="Risk description"
                        />
                        <textarea
                          value={risk.mitigation}
                          onChange={(e) => {
                            const newRisks = [...editRisks]
                            newRisks[index] = { ...risk, mitigation: e.target.value }
                            setEditRisks(newRisks)
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          placeholder="Mitigation strategy"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit('risks')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysis.risks.map((risk, index) => (
                      <div key={index} className="border-l-2 border-red-600 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-1 ${
                            risk.level === 'high' ? 'bg-red-100 text-red-800' :
                            risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {risk.level.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{risk.description}</p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Mitigation:</span> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
                  {managerAdjusted.has('recommendations') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1">Manager Adjusted</span>
                  )}
                </div>
                {editingSection !== 'recommendations' && (
                  <button
                    onClick={() => startEdit('recommendations')}
                    className="text-xs px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {editingSection === 'recommendations' && editRecommendations ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recommendations (one per line)
                      </label>
                      <textarea
                        value={editRecommendations.join('\n')}
                        onChange={(e) => setEditRecommendations(
                          e.target.value.split('\n').filter(r => r.trim())
                        )}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        placeholder="Recommendation 1&#10;Recommendation 2"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveEdit('recommendations')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedRecommendations.has(index)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRecommendations)
                              if (e.target.checked) {
                                newSelected.add(index)
                              } else {
                                newSelected.delete(index)
                              }
                              setSelectedRecommendations(newSelected)
                            }}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300"
                          />
                          <p className="text-sm text-gray-700 flex-1">{recommendation}</p>
                        </li>
                      ))}
                    </ul>
                    {selectedRecommendations.size > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={async () => {
                            if (!analysis) return
                            
                            const selected = Array.from(selectedRecommendations).map(
                              index => analysis.recommendations[index]
                            )
                            
                            try {
                              const originalAnalysis = analysis
                              const revisedAnalysis = await reviseProjectPlan({
                                originalAnalysis: analysis,
                                selectedRecommendations: selected,
                                originalRequirements: displayProject.requirements || '',
                              })
                              
                              setAnalysis(revisedAnalysis)
                              setSelectedRecommendations(new Set())
                              
                              // Add change log entry to execution plan if it exists
                              if (executionPlan) {
                                const changeLogEntry = generateRevisionChangeLog(
                                  originalAnalysis,
                                  revisedAnalysis,
                                  selected
                                )
                                setExecutionPlan({
                                  ...executionPlan,
                                  changeLog: [...(executionPlan.changeLog || []), changeLogEntry],
                                })
                              }
                              
                              // Optionally save to project
                              if (project?.id) {
                                await fetch(`/api/projects/${project.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ analysis: revisedAnalysis }),
                                })
                              }
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to revise project plan')
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                        >
                          Add Suggestions to Project ({selectedRecommendations.size})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!analysis && (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">
              {project 
                ? "This project hasn't been analyzed yet."
                : "No project selected. You can still analyze project requirements."
              }
            </p>
            <p className="text-sm text-gray-500">
              Click "Analyze Project" to generate a comprehensive plan.
            </p>
          </div>
        )}

        {/* Execution Plan Section */}
        {executionPlan && (
          <div className="mt-6">
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Execution Plan</h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {executionPlan.durationWeeks} weeks plan starting {new Date(executionPlan.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={handleExtendExecutionPlan}
                    disabled={isGeneratingPlan}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPlan ? 'Extending...' : 'Plan Next Month'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {executionPlan.phases.map((phase, phaseIndex) => (
                    <div key={phaseIndex} className="border border-gray-200">
                      <button
                        onClick={() => toggleSection(`phase-${phaseIndex}`)}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center"
                      >
                        <h3 className="text-sm font-semibold text-gray-900">{phase.name}</h3>
                        <span className="text-xs text-gray-500">
                          {expandedSections.has(`phase-${phaseIndex}`) ? '▼' : '▶'}
                        </span>
                      </button>
                      {expandedSections.has(`phase-${phaseIndex}`) && (
                        <div className="p-4 space-y-4">
                          {phase.sprints.map((sprint, sprintIndex) => (
                            <div key={sprintIndex} className="border border-gray-200 bg-white">
                              <button
                                onClick={() => toggleSection(`sprint-${phaseIndex}-${sprintIndex}`)}
                                className="w-full p-3 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center"
                              >
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Sprint {sprint.sprintNumber}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {expandedSections.has(`sprint-${phaseIndex}-${sprintIndex}`) ? '▼' : '▶'}
                                </span>
                              </button>
                              {expandedSections.has(`sprint-${phaseIndex}-${sprintIndex}`) && (
                                <div className="p-4 space-y-3">
                                  {sprint.features.map((feature, featureIndex) => (
                                    <div key={featureIndex} className="border border-gray-200 bg-white">
                                      <button
                                        onClick={() => toggleSection(`feature-${phaseIndex}-${sprintIndex}-${featureIndex}`)}
                                        className="w-full p-3 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center"
                                      >
                                        <div>
                                          <h5 className="text-xs font-medium text-gray-900">{feature.name}</h5>
                                          <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {expandedSections.has(`feature-${phaseIndex}-${sprintIndex}-${featureIndex}`) ? '▼' : '▶'}
                                        </span>
                                      </button>
                                      {expandedSections.has(`feature-${phaseIndex}-${sprintIndex}-${featureIndex}`) && (
                                        <div className="p-4">
                                          <h6 className="text-xs font-medium text-gray-700 mb-2">Tickets</h6>
                                          <div className="space-y-2">
                                            {feature.tickets.map((ticket, ticketIndex) => (
                                              <div key={ticketIndex} className="border-l-2 border-blue-600 pl-3 py-2">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <p className="text-xs font-medium text-gray-900">{ticket.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                      Day {ticket.day} - {new Date(ticket.date).toLocaleDateString()}
                                                    </p>
                                                    <span className={`text-xs px-2 py-1 mt-1 inline-block ${
                                                      ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                      ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                      'bg-gray-100 text-gray-800'
                                                    }`}>
                                                      {ticket.status}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Log Section */}
        {executionPlan && executionPlan.changeLog && executionPlan.changeLog.length > 0 && (
          <div className="mt-6">
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Change Log</h2>
                <p className="text-xs text-gray-600 mt-1">
                  History of plan revisions and extensions
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {executionPlan.changeLog.slice().reverse().map((entry, index) => (
                    <div key={index} className="border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 ${
                            entry.type === 'revision' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {entry.type === 'revision' ? 'Revision' : 'Extension'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-gray-900">What Changed:</span>
                          <p className="text-gray-700 mt-1">{entry.whatChanged}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Why:</span>
                          <p className="text-gray-700 mt-1">{entry.whyChanged}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Timeline Impact:</span>
                          <p className="text-gray-700 mt-1">{entry.timelineImpact}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Cost Impact:</span>
                          <p className="text-gray-700 mt-1">{entry.costImpact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
