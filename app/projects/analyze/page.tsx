'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { analyzeProject, reviseProjectPlan, generateExecutionPlan, extendExecutionPlan, generateRevisionChangeLog, analyzeRequirementImpact } from '@/lib/services/aiDeliveryManager'
import type { Project, ProjectAnalysis, Phase, CostBreakdown, TeamMember, Risk } from '@/lib/data/mockStorage'
import type { ExecutionPlan, TicketReferenceImage, RequirementImpactAnalysis, TicketActivity } from '@/lib/services/aiDeliveryManager'

export default function AnalyzeProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  const viewMode = searchParams.get('view') // 'summary' or null (full mode)
  const isSummaryView = viewMode === 'summary'

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
  
  // Selected item state for detail views
  const [selectedSprint, setSelectedSprint] = useState<{ phaseIndex: number; sprintIndex: number } | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<{ phaseIndex: number; sprintIndex: number; featureIndex: number } | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<{ phaseIndex: number; sprintIndex: number; featureIndex: number; ticketIndex: number } | null>(null)
  
  // Image preview modal state
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)
  
  // Change requirements modal state
  const [showChangeRequirementsModal, setShowChangeRequirementsModal] = useState(false)
  const [newRequirements, setNewRequirements] = useState('')
  const [newRequirementsFile, setNewRequirementsFile] = useState<File | null>(null)
  const [extractedNewRequirementsText, setExtractedNewRequirementsText] = useState<string>('')
  const [isExtractingNewRequirements, setIsExtractingNewRequirements] = useState(false)
  const [isAnalyzingImpact, setIsAnalyzingImpact] = useState(false)
  const [impactAnalysis, setImpactAnalysis] = useState<RequirementImpactAnalysis | null>(null)
  
  // Ticket editing state
  const [isEditingTicket, setIsEditingTicket] = useState(false)
  const [editTicketData, setEditTicketData] = useState<{
    title: string
    detailedDescription: string
    estimatedDays: number
    acceptanceCriteria: string[]
    uiReference: string
    referenceImages: TicketReferenceImage[]
    status: 'planned' | 'in-progress' | 'testing' | 'completed' | 'on-hold' | 'rework'
    assignedTo: {
      role: string
      name: string
    } | null
    comments: string[]
  } | null>(null)
  
  // Change log state
  interface ProjectChangeLogEntry {
    id: string
    timestamp: string
    changedBy: string
    itemType: 'sprint' | 'feature' | 'ticket'
    itemPath: string // e.g., "Phase 1 > Sprint 2 > Feature A > Ticket 1"
    changes: string[] // Array of change descriptions
  }
  
  const [changeLog, setChangeLog] = useState<ProjectChangeLogEntry[]>([])
  
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

  // Mock PDF text extraction (same as create page)
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real application, you would use a library like 'pdf-parse'
        resolve(`Mock PDF content for ${file.name}: This is a detailed project requirement document outlining updated requirements for the project.`)
      }, 1000)
    })
  }

  // Mock DOCX text extraction (same as create page)
  const extractTextFromDOCX = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real application, you would use a library like 'mammoth'
        resolve(`Mock DOCX content for ${file.name}: The attached document specifies updated technical requirements for the project.`)
      }, 1000)
    })
  }

  const handleNewRequirementsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setNewRequirementsFile(file)
      setError('')
      setNewRequirements('') // Clear text requirements when file is uploaded
      setExtractedNewRequirementsText('')

      setIsExtractingNewRequirements(true)
      try {
        let text = ''
        if (file.type === 'application/pdf') {
          text = await extractTextFromPDF(file)
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
          text = await extractTextFromDOCX(file)
        }
        setExtractedNewRequirementsText(text)
        setNewRequirements(text) // Auto-populate textarea
        setError('')
      } catch (err) {
        console.error('Error extracting text:', err)
        setError('Failed to extract text from document. Please try manual input or another file.')
        setExtractedNewRequirementsText('')
        setNewRequirementsFile(null)
      } finally {
        setIsExtractingNewRequirements(false)
      }
    }
  }

  const handleRemoveNewRequirementsFile = () => {
    setNewRequirementsFile(null)
    setExtractedNewRequirementsText('')
    const fileInput = document.getElementById('new-requirements-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleChangeRequirements = async () => {
    if (!project) return

    const requirementsText = extractedNewRequirementsText.trim() || newRequirements.trim()
    if (!requirementsText) {
      setError('Please provide new requirements either as text or upload a document')
      return
    }

    setIsAnalyzingImpact(true)
    setError('')

    try {
      // Update project requirements
      const updateResponse = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirements: requirementsText,
          requirementsSource: newRequirementsFile ? 'document' : 'manual',
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update requirements')
      }

      const updateData = await updateResponse.json()
      setProject(updateData.project)

      // Trigger AI requirement impact analysis
      if (analysis) {
        const impactResult = await analyzeRequirementImpact({
          originalRequirements: project.requirements,
          newRequirements: requirementsText,
          originalAnalysis: analysis,
          projectName: project.name,
          projectDescription: project.description,
        })
        
        setImpactAnalysis(impactResult)
        
        // Apply impact to analysis
        const updatedAnalysis = {
          ...analysis,
          timeline: {
            ...analysis.timeline,
            estimatedWeeks: analysis.timeline.estimatedWeeks + impactResult.additionalTimeWeeks,
          },
          cost: {
            ...analysis.cost,
            estimatedTotal: analysis.cost.estimatedTotal + impactResult.additionalCost,
          },
        }
        
        setAnalysis(updatedAnalysis)
        
        // Save updated analysis to project
        await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ analysis: updatedAnalysis }),
        })
      } else {
        // If no existing analysis, run full analysis
        const analysisResult = await analyzeProject({
          name: project.name,
          description: project.description,
          requirements: requirementsText,
        })
        
        setAnalysis(analysisResult.analysis)
        
        // Save analysis to project
        await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ analysis: analysisResult.analysis }),
        })
      }
      
      setShowChangeRequirementsModal(false)
      setNewRequirements('')
      setNewRequirementsFile(null)
      setExtractedNewRequirementsText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change requirements and analyze impact')
    } finally {
      setIsAnalyzingImpact(false)
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

  // Ticket editing handlers
  const startEditTicket = (phaseIndex: number, sprintIndex: number, featureIndex: number, ticketIndex: number) => {
    if (!executionPlan) return
    
    const ticket = executionPlan.phases[phaseIndex].sprints[sprintIndex].features[featureIndex].tickets[ticketIndex]
    setEditTicketData({
      title: ticket.title,
      detailedDescription: ticket.detailedDescription,
      estimatedDays: ticket.estimatedDays,
      acceptanceCriteria: [...ticket.acceptanceCriteria],
      uiReference: ticket.uiReference || '',
      referenceImages: ticket.referenceImages ? [...ticket.referenceImages] : [],
      status: ticket.status,
      assignedTo: ticket.assignedTo ? { ...ticket.assignedTo } : null,
      comments: ticket.comments ? [...ticket.comments] : [],
    })
    setIsEditingTicket(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !editTicketData) return

    const imageFiles = Array.from(files).filter(file => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      const validExtensions = ['.png', '.jpg', '.jpeg']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      return validTypes.includes(file.type) || validExtensions.includes(fileExtension)
    })

    if (imageFiles.length === 0) {
      setError('Please upload PNG or JPG images only')
      return
    }

    // Check if adding these images would exceed the limit
    const currentImageCount = editTicketData.referenceImages.length
    const remainingSlots = 3 - currentImageCount
    
    if (imageFiles.length > remainingSlots) {
      setError(`Maximum 3 images allowed. You can add ${remainingSlots} more image(s).`)
      return
    }

    // Convert images to base64 and add to state
    const imagePromises = imageFiles.map(file => {
      return new Promise<TicketReferenceImage>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string
          resolve({
            name: file.name,
            previewUrl,
          })
        }
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises)
      .then(newImages => {
        setEditTicketData({
          ...editTicketData,
          referenceImages: [...editTicketData.referenceImages, ...newImages],
        })
        setError('')
        // Reset file input
        const fileInput = document.getElementById('ticket-image-upload') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to process images')
      })
  }

  const handleRemoveImage = (index: number) => {
    if (!editTicketData) return
    setEditTicketData({
      ...editTicketData,
      referenceImages: editTicketData.referenceImages.filter((_, i) => i !== index),
    })
  }

  const cancelEditTicket = () => {
    setIsEditingTicket(false)
    setEditTicketData(null)
  }

  // Ticket action handlers
  const handleTicketAction = (
    phaseIndex: number,
    sprintIndex: number,
    featureIndex: number,
    ticketIndex: number,
    action: 'assign' | 'mark-in-progress' | 'send-to-testing' | 'mark-completed' | 'put-on-hold' | 'send-back-rework',
    assigneeRole?: string,
    assigneeName?: string
  ) => {
    if (!executionPlan) return

    const updatedPlan = { ...executionPlan }
    const ticket = updatedPlan.phases[phaseIndex].sprints[sprintIndex].features[featureIndex].tickets[ticketIndex]
    const phase = updatedPlan.phases[phaseIndex]
    const sprint = updatedPlan.phases[phaseIndex].sprints[sprintIndex]
    const feature = updatedPlan.phases[phaseIndex].sprints[sprintIndex].features[featureIndex]

    const oldStatus = ticket.status

    // Workflow validation rules
    if (action === 'send-to-testing' && oldStatus !== 'in-progress') {
      setError(`Cannot send ticket to testing. The ticket must be "In Progress" first. Current status: "${oldStatus}". Please mark the ticket as "In Progress" before sending it to testing.`)
      return
    }

    if (action === 'mark-completed' && oldStatus !== 'testing') {
      setError(`Cannot mark ticket as completed. The ticket must be in "Testing" status first. Current status: "${oldStatus}". Please send the ticket to testing before marking it as completed.`)
      return
    }

    const changes: string[] = []
    const oldAssignedTo = ticket.assignedTo ? `${ticket.assignedTo.role} - ${ticket.assignedTo.name}` : 'Unassigned'

    // Initialize activity log if it doesn't exist
    if (!ticket.activityLog) {
      ticket.activityLog = []
    }

    // Clear any previous errors
    setError('')

    // Update status based on action
    switch (action) {
      case 'assign':
        if (assigneeRole && assigneeName) {
          const newAssignedTo = `${assigneeRole} - ${assigneeName}`
          ticket.assignedTo = { role: assigneeRole, name: assigneeName }
          changes.push(`Assigned to: "${newAssignedTo}"`)
          // Log assignment change
          ticket.activityLog.push({
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'assignment-change',
            action: 'Assigned',
            details: `Ticket assigned to ${assigneeRole} - ${assigneeName}`,
            changedBy: 'Manager',
            oldValue: oldAssignedTo,
            newValue: newAssignedTo,
          })
        }
        break
      case 'mark-in-progress':
        ticket.status = 'in-progress'
        changes.push(`Status: "${oldStatus}" → "in-progress"`)
        // Log status change
        ticket.activityLog.push({
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'status-change',
          action: 'Mark In Progress',
          details: `Status changed from "${oldStatus}" to "in-progress"`,
          changedBy: 'Manager',
          oldValue: oldStatus,
          newValue: 'in-progress',
        })
        if (assigneeRole && assigneeName) {
          const newAssignedTo = `${assigneeRole} - ${assigneeName}`
          ticket.assignedTo = { role: assigneeRole, name: assigneeName }
          changes.push(`Assigned to: "${oldAssignedTo}" → "${newAssignedTo}"`)
          // Log assignment change
          ticket.activityLog.push({
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'assignment-change',
            action: 'Assigned',
            details: `Ticket assigned to ${assigneeRole} - ${assigneeName}`,
            changedBy: 'Manager',
            oldValue: oldAssignedTo,
            newValue: newAssignedTo,
          })
        }
        break
      case 'send-to-testing':
        ticket.status = 'testing'
        changes.push(`Status: "${oldStatus}" → "testing"`)
        // Log status change
        ticket.activityLog.push({
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'status-change',
          action: 'Send to Testing',
          details: `Status changed from "${oldStatus}" to "testing"`,
          changedBy: 'Manager',
          oldValue: oldStatus,
          newValue: 'testing',
        })
        if (assigneeRole && assigneeName) {
          const newAssignedTo = `${assigneeRole} - ${assigneeName}`
          ticket.assignedTo = { role: assigneeRole, name: assigneeName }
          changes.push(`Assigned to: "${oldAssignedTo}" → "${newAssignedTo}"`)
          // Log assignment change
          ticket.activityLog.push({
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'assignment-change',
            action: 'Assigned',
            details: `Ticket assigned to ${assigneeRole} - ${assigneeName}`,
            changedBy: 'Manager',
            oldValue: oldAssignedTo,
            newValue: newAssignedTo,
          })
        }
        break
      case 'mark-completed':
        ticket.status = 'completed'
        changes.push(`Status: "${oldStatus}" → "completed"`)
        // Log status change
        ticket.activityLog.push({
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'status-change',
          action: 'Mark Completed',
          details: `Status changed from "${oldStatus}" to "completed"`,
          changedBy: 'Manager',
          oldValue: oldStatus,
          newValue: 'completed',
        })
        break
      case 'put-on-hold':
        ticket.status = 'on-hold'
        changes.push(`Status: "${oldStatus}" → "on-hold"`)
        // Log status change
        ticket.activityLog.push({
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'status-change',
          action: 'Put On Hold',
          details: `Status changed from "${oldStatus}" to "on-hold"`,
          changedBy: 'Manager',
          oldValue: oldStatus,
          newValue: 'on-hold',
        })
        break
      case 'send-back-rework':
        ticket.status = 'rework'
        changes.push(`Status: "${oldStatus}" → "rework"`)
        // Log status change
        ticket.activityLog.push({
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type: 'status-change',
          action: 'Send Back for Rework',
          details: `Status changed from "${oldStatus}" to "rework"`,
          changedBy: 'Manager',
          oldValue: oldStatus,
          newValue: 'rework',
        })
        if (assigneeRole && assigneeName) {
          const newAssignedTo = `${assigneeRole} - ${assigneeName}`
          ticket.assignedTo = { role: assigneeRole, name: assigneeName }
          changes.push(`Assigned to: "${oldAssignedTo}" → "${newAssignedTo}"`)
          // Log assignment change
          ticket.activityLog.push({
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'assignment-change',
            action: 'Assigned',
            details: `Ticket assigned to ${assigneeRole} - ${assigneeName}`,
            changedBy: 'Manager',
            oldValue: oldAssignedTo,
            newValue: newAssignedTo,
          })
        }
        break
    }

    ticket.lastUpdated = new Date().toISOString()

    // Add change log entry
    if (changes.length > 0) {
      const itemPath = `${phase.name} > Sprint ${sprint.sprintNumber} > ${feature.name} > ${ticket.title}`
      const actionLabels: Record<string, string> = {
        'assign': 'Assign/Reassign',
        'mark-in-progress': 'Mark In Progress',
        'send-to-testing': 'Send to Testing',
        'mark-completed': 'Mark Completed',
        'put-on-hold': 'Put On Hold',
        'send-back-rework': 'Send Back for Rework',
      }
      const changeLogEntry: ProjectChangeLogEntry = {
        id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        changedBy: 'Manager',
        itemType: 'ticket',
        itemPath,
        changes: [`Action: ${actionLabels[action]}`, ...changes],
      }
      setChangeLog(prev => [changeLogEntry, ...prev])
    }

    setExecutionPlan(updatedPlan)
  }

  const saveEditTicket = () => {
    if (!executionPlan || !selectedTicket || !editTicketData) return

    // Validation
    if (!editTicketData.title.trim()) {
      setError('Title is required')
      return
    }
    if (!editTicketData.detailedDescription.trim()) {
      setError('Detailed description is required')
      return
    }
    if (editTicketData.estimatedDays < 1 || editTicketData.estimatedDays > 3) {
      setError('Estimated days must be between 1 and 3')
      return
    }

    // Get original ticket for comparison
    const originalTicket = executionPlan.phases[selectedTicket.phaseIndex].sprints[selectedTicket.sprintIndex].features[selectedTicket.featureIndex].tickets[selectedTicket.ticketIndex]
    const phase = executionPlan.phases[selectedTicket.phaseIndex]
    const sprint = executionPlan.phases[selectedTicket.phaseIndex].sprints[selectedTicket.sprintIndex]
    const feature = executionPlan.phases[selectedTicket.phaseIndex].sprints[selectedTicket.sprintIndex].features[selectedTicket.featureIndex]
    
    // Track changes
    const changes: string[] = []
    if (originalTicket.title !== editTicketData.title.trim()) {
      changes.push(`Title: "${originalTicket.title}" → "${editTicketData.title.trim()}"`)
    }
    if (originalTicket.detailedDescription !== editTicketData.detailedDescription.trim()) {
      changes.push('Detailed description updated')
    }
    if (originalTicket.estimatedDays !== editTicketData.estimatedDays) {
      changes.push(`Estimated days: ${originalTicket.estimatedDays} → ${editTicketData.estimatedDays}`)
    }
    if (JSON.stringify(originalTicket.acceptanceCriteria) !== JSON.stringify(editTicketData.acceptanceCriteria.filter(c => c.trim().length > 0))) {
      changes.push('Acceptance criteria updated')
    }
    if ((originalTicket.uiReference || '') !== editTicketData.uiReference.trim()) {
      changes.push(`UI Reference: "${originalTicket.uiReference || 'none'}" → "${editTicketData.uiReference.trim() || 'none'}"`)
    }
    if (originalTicket.status !== editTicketData.status) {
      changes.push(`Status: "${originalTicket.status}" → "${editTicketData.status}"`)
    }
    const originalAssignedToStr = originalTicket.assignedTo ? `${originalTicket.assignedTo.role} - ${originalTicket.assignedTo.name}` : 'Unassigned'
    const editedAssignedToStr = editTicketData.assignedTo ? `${editTicketData.assignedTo.role} - ${editTicketData.assignedTo.name}` : 'Unassigned'
    if (originalAssignedToStr !== editedAssignedToStr) {
      changes.push(`Assigned to: "${originalAssignedToStr}" → "${editedAssignedToStr}"`)
    }
    if (JSON.stringify(originalTicket.comments || []) !== JSON.stringify(editTicketData.comments.filter(c => c.trim().length > 0))) {
      changes.push(`Comments updated (${(originalTicket.comments || []).length} → ${editTicketData.comments.filter(c => c.trim().length > 0).length})`)
    }

    // Update the ticket
    const updatedPlan = { ...executionPlan }
    const ticket = updatedPlan.phases[selectedTicket.phaseIndex].sprints[selectedTicket.sprintIndex].features[selectedTicket.featureIndex].tickets[selectedTicket.ticketIndex]
    
    // Initialize activity log if it doesn't exist
    if (!ticket.activityLog) {
      ticket.activityLog = []
    }
    
    ticket.title = editTicketData.title.trim()
    ticket.detailedDescription = editTicketData.detailedDescription.trim()
    ticket.estimatedDays = editTicketData.estimatedDays
    ticket.acceptanceCriteria = editTicketData.acceptanceCriteria.filter(c => c.trim().length > 0)
    ticket.uiReference = editTicketData.uiReference.trim() || undefined
    ticket.referenceImages = editTicketData.referenceImages.length > 0 ? editTicketData.referenceImages : undefined
    
    // Log status change if it changed
    if (originalTicket.status !== editTicketData.status) {
      ticket.activityLog.push({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'status-change',
        action: 'Status Updated',
        details: `Status changed from "${originalTicket.status}" to "${editTicketData.status}" via edit`,
        changedBy: 'Manager',
        oldValue: originalTicket.status,
        newValue: editTicketData.status,
      })
    }
    
    ticket.status = editTicketData.status
    
    // Log assignment change if it changed (using variables already declared above)
    if (originalAssignedToStr !== editedAssignedToStr) {
      ticket.activityLog.push({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'assignment-change',
        action: 'Assignment Updated',
        details: `Assignment changed from "${originalAssignedToStr}" to "${editedAssignedToStr}" via edit`,
        changedBy: 'Manager',
        oldValue: originalAssignedToStr,
        newValue: editedAssignedToStr,
      })
    }
    
    ticket.assignedTo = editTicketData.assignedTo || undefined
    ticket.comments = editTicketData.comments.filter(c => c.trim().length > 0).length > 0 ? editTicketData.comments.filter(c => c.trim().length > 0) : undefined
    ticket.lastUpdated = new Date().toISOString()
    // Add metadata note if reference images are present
    if (editTicketData.referenceImages.length > 0) {
      const metadataNote = 'Visual references provided by manager'
      ticket.metadata = ticket.metadata || []
      if (!ticket.metadata.includes(metadataNote)) {
        ticket.metadata.push(metadataNote)
      }
    } else {
      // Remove metadata note if no reference images
      if (ticket.metadata) {
        ticket.metadata = ticket.metadata.filter(note => note !== 'Visual references provided by manager')
        ticket.metadata = ticket.metadata.length > 0 ? ticket.metadata : undefined
      }
    }

    // Add change log entry if there are changes
    if (changes.length > 0) {
      const itemPath = `${phase.name} > Sprint ${sprint.sprintNumber} > ${feature.name} > ${ticket.title}`
      const changeLogEntry: ProjectChangeLogEntry = {
        id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        changedBy: 'Manager',
        itemType: 'ticket',
        itemPath,
        changes,
      }
      setChangeLog(prev => [changeLogEntry, ...prev])
    }

    setExecutionPlan(updatedPlan)
    setIsEditingTicket(false)
    setEditTicketData(null)
    setError('')
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
          <Link href={isSummaryView ? "/projects" : "/"} className="text-sm text-blue-600 mb-4 inline-block">
            ← Back to {isSummaryView ? "Projects" : "Home"}
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                {isSummaryView ? 'Project Summary' : displayProject.name}
              </h1>
              <p className="text-gray-600">
                {isSummaryView 
                  ? 'Overview of project details, timelines, costs, and team composition.'
                  : 'Project Analysis & Planning'
                }
              </p>
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
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">Validation Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-4 text-red-600 hover:text-red-800 text-lg font-bold"
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
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
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-medium text-gray-700">Requirements</h4>
                    {displayProject.requirementsSource && (
                      <span className="text-xs text-gray-500">
                        Source: {displayProject.requirementsSource === 'document' ? 'Uploaded Document' : 'Manual Input'}
                      </span>
                    )}
                  </div>
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
              {isSummaryView && project && (
                <button
                  onClick={() => setShowChangeRequirementsModal(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Change Requirements
                </button>
              )}
              {!analysis && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full btn-ai disabled:opacity-50 disabled:cursor-not-allowed relative"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="ai-spinner w-4 h-4 inline-block mr-2"></span>
                      Analyzing requirements...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      AI: Analyze Project
                    </>
                  )}
                </button>
              )}
              {analysis && project && !isSummaryView && (
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
                      className="w-full btn-ai-secondary disabled:opacity-50 disabled:cursor-not-allowed relative"
                    >
                      {isGeneratingPlan ? (
                        <>
                          <span className="ai-spinner w-4 h-4 inline-block mr-2"></span>
                          Generating execution plan...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">📋</span>
                          AI: Create Execution Plan
                        </>
                      )}
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

        {/* Impact Summary Section */}
        {impactAnalysis && (
          <div className="mb-6">
            <div className="ai-container relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
              <div className="p-4 border-b border-indigo-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">✨</span>
                  <h2 className="text-lg font-semibold text-gray-900">AI Impact Analysis</h2>
                  <span className="badge-ai text-xs">AI Generated</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Analysis of requirement changes impact on project plan
                </p>
              </div>
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-sm text-gray-700">{impactAnalysis.summary}</p>
                </div>

                {/* New Features */}
                {impactAnalysis.newFeatures.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-green-600">+</span>
                      New Features to be Added
                    </h3>
                    <ul className="space-y-2">
                      {impactAnalysis.newFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 bg-green-50/50 border border-green-200/50 rounded-md p-3">
                          <span className="text-green-600 font-bold mt-0.5">+</span>
                          <span className="text-sm text-gray-700 flex-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Impacted Features */}
                {impactAnalysis.impactedFeatures.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-amber-600">⚠</span>
                      Existing Features Impacted
                    </h3>
                    <div className="space-y-3">
                      {impactAnalysis.impactedFeatures.map((item, index) => (
                        <div key={index} className="ai-border bg-amber-50/30 border-amber-200/50 rounded-r-md pl-4 pr-3 py-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{item.feature}</h4>
                          <p className="text-xs text-gray-600">{item.impactDescription}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact Metrics */}
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-indigo-200/50">
                  <div className="card p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Additional Time Required</h4>
                    <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      +{impactAnalysis.additionalTimeWeeks} week{impactAnalysis.additionalTimeWeeks !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="card p-4 bg-gradient-to-br from-teal-50/50 to-cyan-50/50">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Additional Cost</h4>
                    <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      {impactAnalysis.costCurrency} +{impactAnalysis.additionalCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-4 border-t border-blue-200">
                  <button
                    onClick={() => setImpactAnalysis(null)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                  >
                    Close Impact Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Sections */}
        {analysis && (
          <div className="space-y-6">
            {/* Timeline Section */}
            <div className="ai-container">
              <div className="p-4 border-b border-indigo-200/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <h2 className="text-lg font-semibold text-gray-900">Timeline Estimate</h2>
                  <span className="badge-ai text-xs">AI Generated</span>
                  {managerAdjusted.has('timeline') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Manager Adjusted</span>
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
            <div className="ai-container">
              <div className="p-4 border-b border-indigo-200/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <h2 className="text-lg font-semibold text-gray-900">Cost Estimate</h2>
                  <span className="badge-ai text-xs">AI Generated</span>
                  {managerAdjusted.has('cost') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Manager Adjusted</span>
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
            <div className="ai-container">
              <div className="p-4 border-b border-indigo-200/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  <h2 className="text-lg font-semibold text-gray-900">Team Composition</h2>
                  <span className="badge-ai text-xs">AI Generated</span>
                  {managerAdjusted.has('team') && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Manager Adjusted</span>
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
                          className="btn-ai"
                        >
                          <span className="mr-2">✨</span>
                          AI: Apply {selectedRecommendations.size} Suggestion{selectedRecommendations.size !== 1 ? 's' : ''}
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
            <div className="ai-container">
              <div className="p-4 border-b border-indigo-200/50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Execution Plan</h2>
                      <p className="text-xs text-gray-600 mt-1">
                        {executionPlan.durationWeeks} weeks plan starting {new Date(executionPlan.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge-ai text-xs">AI Generated</span>
                  </div>
                  <button
                    onClick={handleExtendExecutionPlan}
                    disabled={isGeneratingPlan}
                    className="btn-ai-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <span className="ai-spinner w-4 h-4 inline-block mr-2"></span>
                        Extending plan...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📅</span>
                        AI: Plan Next Month
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {executionPlan.phases.map((phase, phaseIndex) => (
                    <div key={phaseIndex} className="card border-2 border-indigo-200/50">
                      <button
                        onClick={() => toggleSection(`phase-${phaseIndex}`)}
                        className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-left flex justify-between items-center transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          <h3 className="text-sm font-semibold text-gray-900">{phase.name}</h3>
                        </div>
                        <span className="text-xs text-gray-500">
                          {expandedSections.has(`phase-${phaseIndex}`) ? '▼' : '▶'}
                        </span>
                      </button>
                      {expandedSections.has(`phase-${phaseIndex}`) && (
                        <div className="p-4 space-y-4">
                          {phase.sprints.map((sprint, sprintIndex) => {
                            const isSelected = selectedSprint?.phaseIndex === phaseIndex && selectedSprint?.sprintIndex === sprintIndex
                            return (
                            <div key={sprintIndex} className={`border-2 ${isSelected ? 'border-indigo-400 bg-indigo-50/30' : 'border-teal-200 bg-white'} rounded-md ml-4 mt-3`}>
                              <button
                                onClick={() => {
                                  setSelectedSprint({ phaseIndex, sprintIndex })
                                  toggleSection(`sprint-${phaseIndex}-${sprintIndex}`)
                                }}
                                className={`w-full p-3 bg-gradient-to-r ${isSelected ? 'from-indigo-100 to-purple-100' : 'from-teal-50 to-cyan-50'} hover:from-teal-100 hover:to-cyan-100 text-left flex justify-between items-center transition-all`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">🏃</span>
                                  <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Sprint {sprint.sprintNumber}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                                  </p>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {expandedSections.has(`sprint-${phaseIndex}-${sprintIndex}`) ? '▼' : '▶'}
                                </span>
                              </button>
                              {expandedSections.has(`sprint-${phaseIndex}-${sprintIndex}`) && (
                                <div className="p-4 space-y-3">
                                  {sprint.features.map((feature, featureIndex) => {
                                    const isSelected = selectedFeature?.phaseIndex === phaseIndex && selectedFeature?.sprintIndex === sprintIndex && selectedFeature?.featureIndex === featureIndex
                                    return (
                                    <div key={featureIndex} className={`border border-gray-200 bg-white ${isSelected ? 'ring-2 ring-green-500' : ''}`}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedFeature({ phaseIndex, sprintIndex, featureIndex })
                                          setSelectedTicket(null)
                                          toggleSection(`feature-${phaseIndex}-${sprintIndex}-${featureIndex}`)
                                        }}
                                        className={`w-full p-3 text-left flex justify-between items-center ${isSelected ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}`}
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
                                          <div className="space-y-3">
                                            {feature.tickets.map((ticket, ticketIndex) => {
                                              const ticketSectionId = `ticket-${phaseIndex}-${sprintIndex}-${featureIndex}-${ticketIndex}`
                                              const isExpanded = expandedSections.has(ticketSectionId)
                                              
                                              // Calculate end date for multi-day tickets
                                              const ticketEndDate = new Date(ticket.date)
                                              if (ticket.estimatedDays > 1) {
                                                ticketEndDate.setDate(ticketEndDate.getDate() + ticket.estimatedDays - 1)
                                              }
                                              
                                              const isSelected = selectedTicket?.phaseIndex === phaseIndex && selectedTicket?.sprintIndex === sprintIndex && selectedTicket?.featureIndex === featureIndex && selectedTicket?.ticketIndex === ticketIndex
                                              return (
                                                <div key={ticketIndex} className={`border border-gray-200 bg-white ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      setSelectedTicket({ phaseIndex, sprintIndex, featureIndex, ticketIndex })
                                                      toggleSection(ticketSectionId)
                                                    }}
                                                    className={`w-full p-3 text-left flex justify-between items-start ${isSelected ? 'bg-purple-50 hover:bg-purple-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                  >
                                                    <div className="flex-1">
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                          <p className="text-xs font-medium text-gray-900">{ticket.title}</p>
                                                          <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
                                                          {ticket.metadata && ticket.metadata.length > 0 && (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                              {ticket.metadata.map((note, noteIdx) => (
                                                                <span key={noteIdx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">
                                                                  {note}
                                                                </span>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div className="text-right ml-4">
                                                          <p className="text-xs text-gray-500">
                                                            {ticket.estimatedDays > 1 
                                                              ? `${new Date(ticket.date).toLocaleDateString()} - ${ticketEndDate.toLocaleDateString()}`
                                                              : new Date(ticket.date).toLocaleDateString()
                                                            }
                                                          </p>
                                                          <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">
                                                              Day {ticket.day}{ticket.estimatedDays > 1 ? `-${ticket.day + ticket.estimatedDays - 1}` : ''}
                                                            </span>
                                                            {ticket.estimatedDays > 1 && (
                                                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5">
                                                                {ticket.estimatedDays} days
                                                              </span>
                                                            )}
                                                            <span className={`badge ${
                                                              ticket.status === 'planned' ? 'badge-planned' :
                                                              ticket.status === 'in-progress' ? 'badge-in-progress' :
                                                              ticket.status === 'testing' ? 'badge-testing' :
                                                              ticket.status === 'on-hold' ? 'badge-on-hold' :
                                                              ticket.status === 'completed' ? 'badge-completed' :
                                                              ticket.status === 'rework' ? 'badge-rework' :
                                                              'badge-planned'
                                                            }`}>
                                                              {ticket.status}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 ml-2 mt-1">
                                                      {isExpanded ? '▼' : '▶'}
                                                    </span>
                                                  </button>
                                                  {isExpanded && (
                                                    <div className="p-4 border-t border-gray-200 space-y-3">
                                                      {isEditingTicket && selectedTicket?.phaseIndex === phaseIndex && selectedTicket?.sprintIndex === sprintIndex && selectedTicket?.featureIndex === featureIndex && selectedTicket?.ticketIndex === ticketIndex && editTicketData ? (
                                                        <div className="space-y-4">
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Title *</label>
                                                            <input
                                                              type="text"
                                                              value={editTicketData.title}
                                                              onChange={(e) => setEditTicketData({ ...editTicketData, title: e.target.value })}
                                                              className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                              placeholder="Ticket title"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Detailed Description *</label>
                                                            <textarea
                                                              value={editTicketData.detailedDescription}
                                                              onChange={(e) => setEditTicketData({ ...editTicketData, detailedDescription: e.target.value })}
                                                              rows={4}
                                                              className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                              placeholder="Detailed description"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Estimated Days (1-3) *</label>
                                                            <input
                                                              type="number"
                                                              min="1"
                                                              max="3"
                                                              value={editTicketData.estimatedDays}
                                                              onChange={(e) => setEditTicketData({ ...editTicketData, estimatedDays: parseInt(e.target.value) || 1 })}
                                                              className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Acceptance Criteria</label>
                                                            <div className="space-y-2">
                                                              {editTicketData.acceptanceCriteria.map((criterion, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                  <input
                                                                    type="text"
                                                                    value={criterion}
                                                                    onChange={(e) => {
                                                                      const updated = [...editTicketData.acceptanceCriteria]
                                                                      updated[idx] = e.target.value
                                                                      setEditTicketData({ ...editTicketData, acceptanceCriteria: updated })
                                                                    }}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 text-sm"
                                                                    placeholder="Acceptance criterion"
                                                                  />
                                                                  <button
                                                                    onClick={() => {
                                                                      const updated = editTicketData.acceptanceCriteria.filter((_, i) => i !== idx)
                                                                      setEditTicketData({ ...editTicketData, acceptanceCriteria: updated })
                                                                    }}
                                                                    className="px-3 py-2 border border-red-300 bg-red-50 text-red-700 text-sm hover:bg-red-100"
                                                                  >
                                                                    Remove
                                                                  </button>
                                                                </div>
                                                              ))}
                                                              <button
                                                                onClick={() => setEditTicketData({ ...editTicketData, acceptanceCriteria: [...editTicketData.acceptanceCriteria, ''] })}
                                                                className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50"
                                                              >
                                                                Add Criterion
                                                              </button>
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">UI Reference</label>
                                                            <input
                                                              type="text"
                                                              value={editTicketData.uiReference}
                                                              onChange={(e) => setEditTicketData({ ...editTicketData, uiReference: e.target.value })}
                                                              className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                              placeholder="UI reference URL or placeholder"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Status *</label>
                                                            <select
                                                              value={editTicketData.status}
                                                              onChange={(e) => setEditTicketData({ ...editTicketData, status: e.target.value as 'planned' | 'in-progress' | 'testing' | 'completed' | 'on-hold' | 'rework' })}
                                                              className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                            >
                                                              <option value="planned">Planned</option>
                                                              <option value="in-progress">In Progress</option>
                                                              <option value="testing">Testing</option>
                                                              <option value="completed">Completed</option>
                                                              <option value="on-hold">On Hold</option>
                                                              <option value="rework">Rework</option>
                                                            </select>
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Assigned To</label>
                                                            <div className="space-y-2">
                                                              <input
                                                                type="text"
                                                                value={editTicketData.assignedTo?.role || ''}
                                                                onChange={(e) => setEditTicketData({ 
                                                                  ...editTicketData, 
                                                                  assignedTo: e.target.value ? { 
                                                                    role: e.target.value, 
                                                                    name: editTicketData.assignedTo?.name || '' 
                                                                  } : null 
                                                                })}
                                                                className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                                placeholder="Role (e.g., Developer, QA Engineer)"
                                                              />
                                                              <input
                                                                type="text"
                                                                value={editTicketData.assignedTo?.name || ''}
                                                                onChange={(e) => setEditTicketData({ 
                                                                  ...editTicketData, 
                                                                  assignedTo: editTicketData.assignedTo ? { 
                                                                    ...editTicketData.assignedTo, 
                                                                    name: e.target.value 
                                                                  } : { role: '', name: e.target.value }
                                                                })}
                                                                className="w-full px-3 py-2 border border-gray-300 text-sm"
                                                                placeholder="Name"
                                                              />
                                                              {editTicketData.assignedTo && (
                                                                <button
                                                                  type="button"
                                                                  onClick={() => setEditTicketData({ ...editTicketData, assignedTo: null })}
                                                                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                                                                >
                                                                  Clear Assignment
                                                                </button>
                                                              )}
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">Comments</label>
                                                            <div className="space-y-2">
                                                              {editTicketData.comments.map((comment, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                  <textarea
                                                                    value={comment}
                                                                    onChange={(e) => {
                                                                      const updated = [...editTicketData.comments]
                                                                      updated[idx] = e.target.value
                                                                      setEditTicketData({ ...editTicketData, comments: updated })
                                                                    }}
                                                                    rows={2}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 text-sm"
                                                                    placeholder="Comment"
                                                                  />
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                      const updated = editTicketData.comments.filter((_, i) => i !== idx)
                                                                      setEditTicketData({ ...editTicketData, comments: updated })
                                                                    }}
                                                                    className="px-3 py-2 border border-red-300 bg-red-50 text-red-700 text-sm hover:bg-red-100"
                                                                  >
                                                                    Remove
                                                                  </button>
                                                                </div>
                                                              ))}
                                                              <button
                                                                type="button"
                                                                onClick={() => setEditTicketData({ ...editTicketData, comments: [...editTicketData.comments, ''] })}
                                                                className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50"
                                                              >
                                                                Add Comment
                                                              </button>
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <label className="text-xs font-semibold text-gray-900 mb-1 block">
                                                              Reference Images ({editTicketData.referenceImages.length}/3)
                                                            </label>
                                                            {editTicketData.referenceImages.length < 3 && (
                                                              <label
                                                                htmlFor="ticket-image-upload"
                                                                className="inline-block px-3 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 mb-2"
                                                              >
                                                                Upload Image (PNG/JPG)
                                                              </label>
                                                            )}
                                                            <input
                                                              id="ticket-image-upload"
                                                              type="file"
                                                              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                                              multiple
                                                              onChange={handleImageUpload}
                                                              className="hidden"
                                                              disabled={editTicketData.referenceImages.length >= 3}
                                                            />
                                                            {editTicketData.referenceImages.length > 0 && (
                                                              <div className="mt-2 space-y-2">
                                                                {editTicketData.referenceImages.map((image, idx) => (
                                                                  <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 bg-gray-50">
                                                                    <img
                                                                      src={image.previewUrl}
                                                                      alt={image.name}
                                                                      className="w-16 h-16 object-cover border border-gray-300"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                      <p className="text-xs text-gray-700 truncate">{image.name}</p>
                                                                    </div>
                                                                    <button
                                                                      type="button"
                                                                      onClick={() => handleRemoveImage(idx)}
                                                                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                                                                    >
                                                                      Remove
                                                                    </button>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            )}
                                                            {editTicketData.referenceImages.length >= 3 && (
                                                              <p className="text-xs text-gray-500 mt-1">Maximum 3 images reached</p>
                                                            )}
                                                          </div>
                                                          <div className="flex gap-2 pt-2">
                                                            <button
                                                              onClick={saveEditTicket}
                                                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                                                            >
                                                              Save
                                                            </button>
                                                            <button
                                                              onClick={cancelEditTicket}
                                                              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                                                            >
                                                              Cancel
                                                            </button>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <>
                                                          <div className="flex justify-between items-start mb-2">
                                                            <div className="text-xs font-semibold text-gray-900">Details</div>
                                                            <button
                                                              onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedTicket({ phaseIndex, sprintIndex, featureIndex, ticketIndex })
                                                                startEditTicket(phaseIndex, sprintIndex, featureIndex, ticketIndex)
                                                              }}
                                                              className="text-xs px-3 py-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                            >
                                                              Edit
                                                            </button>
                                                          </div>
                                                          {/* Ticket Actions */}
                                                          <div className="mb-3 pb-3 border-b border-gray-200">
                                                            <div className="text-xs font-semibold text-gray-900 mb-2">Actions</div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                              {ticket.status === 'planned' && (
                                                                <>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      const role = prompt('Enter role (e.g., Developer, QA Engineer):')
                                                                      const name = prompt('Enter name:')
                                                                      if (role && name) {
                                                                        handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'assign', role, name)
                                                                      }
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200"
                                                                  >
                                                                    Assign
                                                                  </button>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      const role = prompt('Enter role (e.g., Developer, QA Engineer):')
                                                                      const name = prompt('Enter name:')
                                                                      if (role && name) {
                                                                        handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'mark-in-progress', role, name)
                                                                      }
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                                                                  >
                                                                    Mark In Progress
                                                                  </button>
                                                                </>
                                                              )}
                                                              {ticket.status === 'in-progress' && (
                                                                <>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      const role = prompt('Enter QA role (e.g., QA Engineer):')
                                                                      const name = prompt('Enter name:')
                                                                      if (role && name) {
                                                                        handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'send-to-testing', role, name)
                                                                      }
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200"
                                                                  >
                                                                    Send to Testing
                                                                  </button>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'mark-completed')
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                                                                  >
                                                                    Mark Completed
                                                                  </button>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'put-on-hold')
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200"
                                                                  >
                                                                    Put On Hold
                                                                  </button>
                                                                </>
                                                              )}
                                                              {ticket.status === 'testing' && (
                                                                <>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'mark-completed')
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                                                                  >
                                                                    Mark Completed
                                                                  </button>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      const role = prompt('Enter role for rework (e.g., Developer):')
                                                                      const name = prompt('Enter name:')
                                                                      handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'send-back-rework', role || undefined, name || undefined)
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200"
                                                                  >
                                                                    Send Back for Rework
                                                                  </button>
                                                                </>
                                                              )}
                                                              {ticket.status === 'completed' && (
                                                                <span className="text-xs text-gray-500">No actions available</span>
                                                              )}
                                                              {ticket.status === 'on-hold' && (
                                                                <>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      const role = prompt('Enter role (e.g., Developer, QA Engineer):')
                                                                      const name = prompt('Enter name:')
                                                                      if (role && name) {
                                                                        handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'mark-in-progress', role, name)
                                                                      }
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200"
                                                                  >
                                                                    Resume (Mark In Progress)
                                                                  </button>
                                                                </>
                                                              )}
                                                              {ticket.status === 'rework' && (
                                                                <>
                                                                  <button
                                                                    onClick={(e) => {
                                                                      e.stopPropagation()
                                                                      const role = prompt('Enter role (e.g., Developer):')
                                                                      const name = prompt('Enter name:')
                                                                      if (role && name) {
                                                                        handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'mark-in-progress', role, name)
                                                                      }
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200"
                                                                  >
                                                                    Resume (Mark In Progress)
                                                                  </button>
                                                                </>
                                                              )}
                                                              {ticket.assignedTo && (
                                                                <button
                                                                  onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const role = prompt('Enter new role (e.g., Developer, QA Engineer):', ticket.assignedTo?.role)
                                                                    const name = prompt('Enter new name:', ticket.assignedTo?.name)
                                                                    if (role && name) {
                                                                      handleTicketAction(phaseIndex, sprintIndex, featureIndex, ticketIndex, 'assign', role, name)
                                                                    }
                                                                  }}
                                                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                                                                >
                                                                  Reassign
                                                                </button>
                                                              )}
                                                            </div>
                                                          </div>
                                                          {ticket.detailedDescription && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-1">Detailed Description</div>
                                                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{ticket.detailedDescription}</p>
                                                            </div>
                                                          )}
                                                          {ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0 && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-2">Acceptance Criteria</div>
                                                              <ul className="space-y-1">
                                                                {ticket.acceptanceCriteria.map((criterion, idx) => (
                                                                  <li key={idx} className="text-xs text-gray-700 flex items-start">
                                                                    <span className="text-blue-600 mr-2">•</span>
                                                                    <span>{criterion}</span>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            </div>
                                                          )}
                                                          {ticket.dependencies && ticket.dependencies.length > 0 && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-1">Dependencies</div>
                                                              <div className="flex flex-wrap gap-1">
                                                                {ticket.dependencies.map((dep, idx) => (
                                                                  <span key={idx} className="text-xs bg-amber-100 text-amber-800 px-2 py-1">
                                                                    {dep}
                                                                  </span>
                                                                ))}
                                                              </div>
                                                            </div>
                                                          )}
                                                          {ticket.uiReference && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-1">UI Reference</div>
                                                              <a 
                                                                href={ticket.uiReference} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline"
                                                              >
                                                                {ticket.uiReference}
                                                              </a>
                                                            </div>
                                                          )}
                                                          {ticket.referenceImages && ticket.referenceImages.length > 0 && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-2">Reference Images</div>
                                                              <div className="grid grid-cols-3 gap-2">
                                                                {ticket.referenceImages.map((image, idx) => (
                                                                  <div 
                                                                    key={idx} 
                                                                    className="border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                    onClick={() => setPreviewImage({ url: image.previewUrl, name: image.name })}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onKeyDown={(e) => {
                                                                      if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault()
                                                                        setPreviewImage({ url: image.previewUrl, name: image.name })
                                                                      }
                                                                    }}
                                                                  >
                                                                    <img
                                                                      src={image.previewUrl}
                                                                      alt={image.name}
                                                                      className="w-full h-24 object-cover"
                                                                    />
                                                                    <p className="text-xs text-gray-600 p-1 truncate" title={image.name}>
                                                                      {image.name}
                                                                    </p>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            </div>
                                                          )}
                                                          {ticket.assignedTo && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-1">Assigned To</div>
                                                              <p className="text-xs text-gray-700">
                                                                <span className="font-medium">{ticket.assignedTo.role}</span> - {ticket.assignedTo.name}
                                                              </p>
                                                            </div>
                                                          )}
                                                          {ticket.lastUpdated && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-1">Last Updated</div>
                                                              <p className="text-xs text-gray-700">
                                                                {new Date(ticket.lastUpdated).toLocaleString()}
                                                              </p>
                                                            </div>
                                                          )}
                                                          {ticket.comments && ticket.comments.length > 0 && (
                                                            <div>
                                                              <div className="text-xs font-semibold text-gray-900 mb-2">Comments</div>
                                                              <div className="space-y-2">
                                                                {ticket.comments.map((comment, idx) => (
                                                                  <div key={idx} className="text-xs text-gray-700 bg-gray-50 p-2 border border-gray-200 whitespace-pre-wrap">
                                                                    {comment}
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            </div>
                                                          )}
                                                          {/* Activity History */}
                                                          <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <button
                                                              onClick={(e) => {
                                                                e.stopPropagation()
                                                                const activitySectionId = `activity-${phaseIndex}-${sprintIndex}-${featureIndex}-${ticketIndex}`
                                                                toggleSection(activitySectionId)
                                                              }}
                                                              className="w-full flex items-center justify-between text-xs font-semibold text-gray-900 hover:text-blue-600"
                                                            >
                                                              <span>Activity History</span>
                                                              <span className="text-xs text-gray-500">
                                                                {expandedSections.has(`activity-${phaseIndex}-${sprintIndex}-${featureIndex}-${ticketIndex}`) ? '▼' : '▶'}
                                                              </span>
                                                            </button>
                                                            {expandedSections.has(`activity-${phaseIndex}-${sprintIndex}-${featureIndex}-${ticketIndex}`) && (
                                                              <div className="mt-3 space-y-2">
                                                                {ticket.activityLog && ticket.activityLog.length > 0 ? (
                                                                  ticket.activityLog
                                                                    .slice()
                                                                    .reverse()
                                                                    .map((activity, idx) => (
                                                                      <div key={activity.id} className="border border-gray-200 bg-gray-50 p-2 rounded">
                                                                        <div className="flex items-start justify-between mb-1">
                                                                          <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                              <span className={`text-xs px-2 py-0.5 rounded ${
                                                                                activity.type === 'status-change' ? 'bg-blue-100 text-blue-800' :
                                                                                activity.type === 'assignment-change' ? 'bg-green-100 text-green-800' :
                                                                                'bg-purple-100 text-purple-800'
                                                                              }`}>
                                                                                {activity.type === 'status-change' ? 'Status' :
                                                                                 activity.type === 'assignment-change' ? 'Assignment' :
                                                                                 'Requirement Impact'}
                                                                              </span>
                                                                              <span className="text-xs font-medium text-gray-900">{activity.action}</span>
                                                                            </div>
                                                                            <p className="text-xs text-gray-700">{activity.details}</p>
                                                                            {activity.oldValue && activity.newValue && (
                                                                              <p className="text-xs text-gray-500 mt-1">
                                                                                {activity.oldValue} → {activity.newValue}
                                                                              </p>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                                                                          <span className="text-xs text-gray-500">
                                                                            {new Date(activity.timestamp).toLocaleString()}
                                                                          </span>
                                                                          <span className="text-xs text-gray-500">by {activity.changedBy}</span>
                                                                        </div>
                                                                      </div>
                                                                    ))
                                                                ) : (
                                                                  <p className="text-xs text-gray-500 italic">No activity history available</p>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                  })}
                                </div>
                              )}
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Change Log Section */}
        {changeLog.length > 0 && (
          <div className="mt-6">
            <div className="bg-white border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Project Change Log</h2>
                <p className="text-xs text-gray-600 mt-1">
                  History of edits made to sprints, features, and tickets
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {changeLog.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 ${
                            entry.itemType === 'sprint' ? 'bg-blue-100 text-blue-800' :
                            entry.itemType === 'feature' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {entry.itemType.charAt(0).toUpperCase() + entry.itemType.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-600">
                            by {entry.changedBy}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-900">Item:</span>
                        <span className="text-xs text-gray-700 ml-2">{entry.itemPath}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Changes:</span>
                        <ul className="mt-1 space-y-1">
                          {entry.changes.map((change, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start">
                              <span className="text-gray-400 mr-2">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
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
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
              aria-label="Close preview"
            >
              ×
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-[90vh] object-contain rounded"
            />
            <div className="mt-2 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded inline-block">
                {previewImage.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Change Requirements Modal */}
      {showChangeRequirementsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!isAnalyzingImpact && !isExtractingNewRequirements) {
              setShowChangeRequirementsModal(false)
              setNewRequirements('')
              setNewRequirementsFile(null)
              setExtractedNewRequirementsText('')
              setError('')
            }
          }}
        >
          <div 
            className="relative bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (!isAnalyzingImpact && !isExtractingNewRequirements) {
                  setShowChangeRequirementsModal(false)
                  setNewRequirements('')
                  setNewRequirementsFile(null)
                  setExtractedNewRequirementsText('')
                  setError('')
                }
              }}
              disabled={isAnalyzingImpact || isExtractingNewRequirements}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50"
              aria-label="Close modal"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Change Requirements</h2>
            <p className="text-sm text-gray-600 mb-6">
              Update project requirements. AI will analyze the impact of these changes.
            </p>

            <div className="space-y-4">
              {/* File Upload Option */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document (PDF/DOCX)
                </label>
                <label
                  htmlFor="new-requirements-upload"
                  className={`inline-block px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 ${isExtractingNewRequirements ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isExtractingNewRequirements ? 'Extracting Text...' : (newRequirementsFile ? 'Change Document' : 'Upload Document (PDF/DOCX)')}
                </label>
                <input
                  id="new-requirements-upload"
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleNewRequirementsFileChange}
                  className="hidden"
                  disabled={isExtractingNewRequirements}
                />
                {newRequirementsFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      File: <span className="font-medium">{newRequirementsFile.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({(newRequirementsFile.size / 1024).toFixed(2)} KB)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveNewRequirementsFile}
                      disabled={isExtractingNewRequirements || isAnalyzingImpact}
                      className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {extractedNewRequirementsText && (
                  <p className="mt-2 text-xs text-green-700">
                    Text extracted successfully ({extractedNewRequirementsText.length} characters).
                  </p>
                )}
              </div>

              {/* Text Input Option */}
              <div>
                <label htmlFor="new-requirements-text" className="block text-sm font-medium text-gray-700 mb-2">
                  OR Enter Requirements as Text
                </label>
                <textarea
                  id="new-requirements-text"
                  rows={10}
                  value={newRequirements}
                  onChange={(e) => {
                    setNewRequirements(e.target.value)
                    if (newRequirementsFile && e.target.value.trim()) {
                      handleRemoveNewRequirementsFile()
                    }
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 text-sm font-mono ${newRequirementsFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={newRequirementsFile ? 'Document uploaded. Remove document to enter text requirements.' : 'Enter new requirements...'}
                  disabled={!!newRequirementsFile || isExtractingNewRequirements || isAnalyzingImpact}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (!isAnalyzingImpact && !isExtractingNewRequirements) {
                      setShowChangeRequirementsModal(false)
                      setNewRequirements('')
                      setNewRequirementsFile(null)
                      setExtractedNewRequirementsText('')
                      setError('')
                    }
                  }}
                  disabled={isAnalyzingImpact || isExtractingNewRequirements}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeRequirements}
                  disabled={isAnalyzingImpact || isExtractingNewRequirements || (!newRequirements.trim() && !extractedNewRequirementsText.trim())}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isAnalyzingImpact ? 'Analyzing Impact...' : 'Update Requirements & Analyze Impact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
