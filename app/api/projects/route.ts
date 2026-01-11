import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/data/mockStorage'

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const projects = storage.getAllProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
// analysis and changeDescription are optional during creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, requirements, analysis } = body

    // Required fields for creation
    if (!name || !description || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, requirements' },
        { status: 400 }
      )
    }

    // analysis is optional during creation
    const project = storage.createProject({
      name,
      description,
      requirements,
      ...(analysis && { analysis }), // Only include if provided
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
