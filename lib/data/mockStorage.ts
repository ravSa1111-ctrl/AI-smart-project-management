// In-memory storage for projects
// This will be replaced with a real database later

export interface Project {
  id: string
  name: string
  description: string
  requirements: string
  status: 'draft' | 'analyzing' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  analysis?: ProjectAnalysis
}

export interface ProjectAnalysis {
  timeline: {
    estimatedWeeks: number
    phases: Phase[]
  }
  cost: {
    estimatedTotal: number
    currency: string
    breakdown: CostBreakdown[]
  }
  team: {
    composition: TeamMember[]
    totalMembers: number
  }
  risks: Risk[]
  recommendations: string[]
  clarificationQuestions?: string[]
  revisedBasedOn?: string[] // Applied suggestions/recommendations
}

export interface Phase {
  name: string
  durationWeeks: number
  description: string
  deliverables: string[]
}

export interface CostBreakdown {
  category: string
  amount: number
  description: string
}

export interface TeamMember {
  role: string
  count: number
  level: 'junior' | 'mid' | 'senior'
  description: string
}

export interface Risk {
  level: 'low' | 'medium' | 'high'
  description: string
  mitigation: string
}

// In-memory storage
let projects: Project[] = []
let nextId = 1

export const storage = {
  // Create a new project
  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Project {
    const project: Project = {
      ...projectData,
      id: `project-${nextId++}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    projects.push(project)
    return project
  },

  // Get all projects
  getAllProjects(): Project[] {
    return [...projects]
  },

  // Get project by ID
  getProjectById(id: string): Project | undefined {
    return projects.find(p => p.id === id)
  },

  // Update project
  updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = projects.findIndex(p => p.id === id)
    if (index === -1) return null

    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return projects[index]
  },

  // Delete project
  deleteProject(id: string): boolean {
    const index = projects.findIndex(p => p.id === id)
    if (index === -1) return false
    projects.splice(index, 1)
    return true
  },
}
