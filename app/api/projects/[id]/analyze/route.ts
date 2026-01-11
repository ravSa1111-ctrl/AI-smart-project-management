import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/data/mockStorage'
import { analyzeProject } from '@/lib/services/aiDeliveryManager'

// POST /api/projects/[id]/analyze - Analyze a project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = storage.getProjectById(params.id)
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Analyze the project using AI delivery manager
    const analysisResponse = await analyzeProject({
      name: project.name,
      description: project.description,
      requirements: project.requirements,
    })

    // Update project with analysis
    const updatedProject = storage.updateProject(params.id, {
      status: 'analyzing',
      analysis: analysisResponse.analysis,
    })

    return NextResponse.json({
      project: updatedProject,
      clarificationQuestions: analysisResponse.clarificationQuestions,
    })
  } catch (error) {
    console.error('Error analyzing project:', error)
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    )
  }
}
