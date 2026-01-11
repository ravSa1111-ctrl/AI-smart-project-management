import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/data/mockStorage'
import { findTeamReplacement, type TeamReplacementRequest } from '@/lib/services/aiDeliveryManager'

// POST /api/projects/[id]/team/replace - Find team replacement for exiting member
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

    if (!project.analysis?.team) {
      return NextResponse.json(
        { error: 'Project analysis not found. Please analyze the project first.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { exitingRole, exitingSkills } = body as TeamReplacementRequest

    if (!exitingRole || !exitingSkills || !Array.isArray(exitingSkills)) {
      return NextResponse.json(
        { error: 'Missing required fields: exitingRole, exitingSkills (array)' },
        { status: 400 }
      )
    }

    // Find replacement
    const replacementResult = await findTeamReplacement(
      project.analysis.team.composition,
      { exitingRole, exitingSkills }
    )

    return NextResponse.json({
      replacement: replacementResult,
    })
  } catch (error) {
    console.error('Error finding team replacement:', error)
    return NextResponse.json(
      { error: 'Failed to find team replacement' },
      { status: 500 }
    )
  }
}
