// AI Delivery Manager Service
// This abstracts the AI logic - currently using mock data
// Later, this will integrate with OpenAI or similar AI service

import type { Project, ProjectAnalysis, Phase, CostBreakdown, TeamMember, Risk } from '@/lib/data/mockStorage'

export interface AnalyzeProjectRequest {
  name: string
  description: string
  requirements: string
}

export interface AnalyzeProjectResponse {
  analysis: ProjectAnalysis
  clarificationQuestions?: string[]
}

/**
 * Analyzes project requirements and generates a comprehensive project plan
 * Acts as a senior delivery manager
 */
export async function analyzeProject(request: AnalyzeProjectRequest): Promise<AnalyzeProjectResponse> {
  // TODO: Replace with actual AI API call
  // For now, return mock analysis based on requirements

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  const needsClarification = request.requirements.length < 50
  const clarificationQuestions = needsClarification
    ? [
        'What is the target platform/technology stack?',
        'Are there any specific performance requirements?',
        'What is the expected user volume?',
        'Are there any regulatory or compliance requirements?',
      ]
    : undefined

  // Generate mock analysis
  const analysis: ProjectAnalysis = generateMockAnalysis(request)

  return {
    analysis,
    clarificationQuestions,
  }
}

/**
 * Generates a realistic mock project analysis
 * In production, this will be replaced with AI-generated analysis
 */
function generateMockAnalysis(request: AnalyzeProjectRequest): ProjectAnalysis {
  const complexity = estimateComplexity(request.requirements)
  const timelineWeeks = calculateTimeline(complexity)
  const phases = generatePhases(timelineWeeks, request.requirements)
  const cost = calculateCost(complexity, timelineWeeks)
  const team = generateTeam(complexity, timelineWeeks)
  const risks = generateRisks(complexity)
  const recommendations = generateRecommendations(complexity)

  return {
    timeline: {
      estimatedWeeks: timelineWeeks,
      phases,
    },
    cost,
    team,
    risks,
    recommendations,
  }
}

function estimateComplexity(requirements: string): 'simple' | 'medium' | 'complex' {
  const length = requirements.length
  const keywords = [
    'integration', 'api', 'database', 'security', 'scalability',
    'microservices', 'real-time', 'analytics', 'ml', 'ai',
  ].filter(keyword => requirements.toLowerCase().includes(keyword))

  if (keywords.length >= 5 || length > 500) return 'complex'
  if (keywords.length >= 2 || length > 200) return 'medium'
  return 'simple'
}

function calculateTimeline(complexity: 'simple' | 'medium' | 'complex'): number {
  const base = { simple: 4, medium: 8, complex: 16 }
  return base[complexity] + Math.floor(Math.random() * 4)
}

function generatePhases(weeks: number, requirements: string): Phase[] {
  const phases: Phase[] = []

  phases.push({
    name: 'Planning & Design',
    durationWeeks: Math.max(1, Math.floor(weeks * 0.2)),
    description: 'Requirements analysis, architecture design, and project planning',
    deliverables: ['Requirements document', 'System architecture', 'Project plan'],
  })

  phases.push({
    name: 'Development',
    durationWeeks: Math.floor(weeks * 0.5),
    description: 'Core development and implementation',
    deliverables: ['MVP features', 'Codebase', 'Unit tests'],
  })

  phases.push({
    name: 'Testing & QA',
    durationWeeks: Math.max(1, Math.floor(weeks * 0.2)),
    description: 'Quality assurance, integration testing, and bug fixes',
    deliverables: ['Test reports', 'Bug fixes', 'Quality metrics'],
  })

  phases.push({
    name: 'Deployment & Launch',
    durationWeeks: Math.max(1, Math.floor(weeks * 0.1)),
    description: 'Deployment preparation, launch, and initial support',
    deliverables: ['Deployed system', 'Documentation', 'Launch checklist'],
  })

  return phases
}

function calculateCost(
  complexity: 'simple' | 'medium' | 'complex',
  weeks: number
): { estimatedTotal: number; currency: string; breakdown: CostBreakdown[] } {
  const hourlyRate = { simple: 75, medium: 100, complex: 125 }
  const hoursPerWeek = 40
  const baseCost = hourlyRate[complexity] * hoursPerWeek * weeks

  const breakdown: CostBreakdown[] = [
    {
      category: 'Development',
      amount: baseCost * 0.6,
      description: 'Core development work',
    },
    {
      category: 'Testing & QA',
      amount: baseCost * 0.2,
      description: 'Quality assurance and testing',
    },
    {
      category: 'Project Management',
      amount: baseCost * 0.15,
      description: 'Project coordination and management',
    },
    {
      category: 'Infrastructure & Tools',
      amount: baseCost * 0.05,
      description: 'Development tools, CI/CD, hosting',
    },
  ]

  return {
    estimatedTotal: baseCost,
    currency: 'USD',
    breakdown,
  }
}

function generateTeam(
  complexity: 'simple' | 'medium' | 'complex',
  weeks: number
): { composition: TeamMember[]; totalMembers: number } {
  const teamSize = complexity === 'simple' ? 3 : complexity === 'medium' ? 5 : 8

  const composition: TeamMember[] = [
    {
      role: 'Senior Developer',
      count: complexity === 'complex' ? 2 : 1,
      level: 'senior',
      description: 'Leads technical implementation and architecture',
    },
    {
      role: 'Developer',
      count: complexity === 'simple' ? 1 : complexity === 'medium' ? 2 : 3,
      level: 'mid',
      description: 'Implements features and components',
    },
    {
      role: 'QA Engineer',
      count: 1,
      level: 'mid',
      description: 'Testing and quality assurance',
    },
    {
      role: 'Project Manager',
      count: 1,
      level: 'senior',
      description: 'Project coordination and stakeholder management',
    },
  ]

  if (complexity === 'complex') {
    composition.push({
      role: 'DevOps Engineer',
      count: 1,
      level: 'mid',
      description: 'Infrastructure and deployment',
    })
  }

  const totalMembers = composition.reduce((sum, member) => sum + member.count, 0)

  return { composition, totalMembers }
}

function generateRisks(complexity: 'simple' | 'medium' | 'complex'): Risk[] {
  const risks: Risk[] = [
    {
      level: complexity === 'complex' ? 'high' : 'medium',
      description: 'Scope creep and changing requirements',
      mitigation: 'Establish clear requirements baseline and change management process',
    },
    {
      level: 'medium',
      description: 'Resource availability and dependencies',
      mitigation: 'Plan for buffer time and maintain resource visibility',
    },
    {
      level: complexity === 'simple' ? 'low' : 'medium',
      description: 'Technical complexity and integration challenges',
      mitigation: 'Conduct proof of concepts early and involve technical experts',
    },
  ]

  if (complexity === 'complex') {
    risks.push({
      level: 'high',
      description: 'Coordination overhead in larger team',
      mitigation: 'Implement clear communication channels and regular sync meetings',
    })
  }

  return risks
}

function generateRecommendations(complexity: 'simple' | 'medium' | 'complex'): string[] {
  const recommendations = [
    'Start with an MVP to validate core functionality early',
    'Implement CI/CD pipeline from the beginning',
    'Establish regular stakeholder communication cadence',
    'Plan for code reviews and knowledge sharing sessions',
  ]

  if (complexity === 'complex') {
    recommendations.push('Consider breaking into smaller sub-projects or phases')
    recommendations.push('Invest in documentation and architectural decision records')
  }

  return recommendations
}

// Team Replacement Logic for Member Exit

export interface TeamReplacementRequest {
  exitingRole: string
  exitingSkills: string[]
}

export interface TeamReplacementResult {
  recommendedReplacement: TeamMember | null
  reasoning: string
  skillMatchScore: number
  availabilityScore: number
  alternatives: Array<{
    member: TeamMember
    score: number
    reasoning: string
  }>
}

/**
 * Finds the best replacement for an exiting team member
 * Demo logic: matches skills and considers availability
 */
export async function findTeamReplacement(
  teamComposition: TeamMember[],
  request: TeamReplacementRequest
): Promise<TeamReplacementResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Role skill mappings (demo data)
  const roleSkillMap: Record<string, string[]> = {
    'Senior Developer': ['development', 'architecture', 'code review', 'mentoring', 'technical leadership'],
    'Developer': ['development', 'coding', 'testing', 'documentation', 'bug fixing'],
    'QA Engineer': ['testing', 'quality assurance', 'test automation', 'bug reporting', 'test planning'],
    'Project Manager': ['project management', 'stakeholder management', 'planning', 'coordination', 'reporting'],
    'DevOps Engineer': ['deployment', 'infrastructure', 'ci/cd', 'monitoring', 'automation'],
  }

  // Calculate skill overlap scores for each team member
  const candidates = teamComposition
    .filter(member => member.role !== request.exitingRole) // Exclude the exiting role
    .map(member => {
      const memberSkills = roleSkillMap[member.role] || []
      const exitingSkillsLower = request.exitingSkills.map(s => s.toLowerCase())
      const memberSkillsLower = memberSkills.map(s => s.toLowerCase())

      // Calculate skill match score (0-100)
      const matchingSkills = exitingSkillsLower.filter(skill =>
        memberSkillsLower.some(ms => ms.includes(skill) || skill.includes(ms))
      )
      const skillMatchScore = (matchingSkills.length / Math.max(request.exitingSkills.length, 1)) * 100

      // Availability score based on count (more members = more available)
      // If count > 1, they can spare someone (100%), if count = 1, less available (50%)
      const availabilityScore = member.count > 1 ? 100 : 50

      // Combined score: 70% skill match, 30% availability
      const combinedScore = skillMatchScore * 0.7 + availabilityScore * 0.3

      // Generate reasoning
      const skillMatches = matchingSkills.length > 0
        ? matchingSkills.join(', ')
        : 'limited'
      const availabilityReason = member.count > 1
        ? `${member.count} members available - can spare one`
        : 'only 1 member - limited availability'

      return {
        member,
        score: combinedScore,
        skillMatchScore,
        availabilityScore,
        reasoning: `Skill match: ${skillMatches} (${skillMatchScore.toFixed(0)}% match). Availability: ${availabilityReason} (${availabilityScore}%). Combined score: ${combinedScore.toFixed(0)}%`,
      }
    })
    .sort((a, b) => b.score - a.score) // Sort by score descending

  // Get best match
  const bestMatch = candidates[0] || null

  // Generate overall reasoning
  let reasoning = ''
  if (!bestMatch) {
    reasoning = `No suitable replacement found in the current team. Consider external hiring for ${request.exitingRole}.`
  } else {
    reasoning = `Recommended: ${bestMatch.member.role} (${bestMatch.member.level} level). ` +
      `Reason: ${bestMatch.member.role} has ${bestMatch.skillMatchScore.toFixed(0)}% skill overlap with ${request.exitingRole}. ` +
      `Availability: ${bestMatch.member.count > 1 ? `Good - ${bestMatch.member.count} members in this role, can spare one` : 'Limited - only 1 member, may need backup plan'}. ` +
      `This replacement minimizes skill gaps and maintains team capacity.`
  }

  return {
    recommendedReplacement: bestMatch?.member || null,
    reasoning,
    skillMatchScore: bestMatch?.skillMatchScore || 0,
    availabilityScore: bestMatch?.availabilityScore || 0,
    alternatives: candidates.slice(0, 3).map(c => ({
      member: c.member,
      score: c.score,
      reasoning: c.reasoning,
    })),
  }
}

// Project Plan Revision Logic

export interface ReviseProjectPlanRequest {
  originalAnalysis: ProjectAnalysis
  selectedRecommendations: string[]
  originalRequirements: string
}

// Requirement Impact Analysis

export interface RequirementImpactAnalysis {
  newFeatures: string[]
  impactedFeatures: Array<{
    feature: string
    impactDescription: string
  }>
  additionalTimeWeeks: number
  additionalCost: number
  costCurrency: string
  summary: string
}

export interface AnalyzeRequirementImpactRequest {
  originalRequirements: string
  newRequirements: string
  originalAnalysis: ProjectAnalysis
  projectName: string
  projectDescription: string
}

/**
 * Analyzes the impact of requirement changes on an existing project plan
 * Compares new requirements with existing plan and identifies changes
 */
export async function analyzeRequirementImpact(
  request: AnalyzeRequirementImpactRequest
): Promise<RequirementImpactAnalysis> {
  // TODO: Replace with actual AI API call
  // For now, return mock impact analysis based on requirement comparison

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  const { originalRequirements, newRequirements, originalAnalysis } = request

  // Simple comparison logic (in production, use AI to compare)
  const originalWords = new Set(originalRequirements.toLowerCase().split(/\s+/))
  const newWords = new Set(newRequirements.toLowerCase().split(/\s+/))
  
  // Find new keywords (simplified comparison)
  const newKeywords = Array.from(newWords).filter(word => 
    word.length > 4 && !originalWords.has(word)
  ).slice(0, 5)

  // Estimate additional complexity based on length difference
  const lengthDiff = newRequirements.length - originalRequirements.length
  const complexityMultiplier = lengthDiff > 500 ? 1.5 : lengthDiff > 200 ? 1.3 : 1.1

  // Calculate additional time (based on complexity and original timeline)
  const additionalTimeWeeks = Math.max(1, Math.ceil(
    (originalAnalysis.timeline.estimatedWeeks * (complexityMultiplier - 1)) * 0.3
  ))

  // Calculate additional cost (based on additional time and original cost per week)
  const costPerWeek = originalAnalysis.cost.estimatedTotal / originalAnalysis.timeline.estimatedWeeks
  const additionalCost = Math.ceil(additionalTimeWeeks * costPerWeek * 1.2) // 20% buffer for complexity

  // Generate new features (mock based on new keywords)
  const newFeatures = newKeywords.length > 0
    ? [
        `Enhanced ${newKeywords[0] || 'functionality'} integration`,
        `New ${newKeywords[1] || 'feature'} capabilities`,
        `Improved ${newKeywords[2] || 'system'} components`,
      ].filter(Boolean).slice(0, 3)
    : ['Additional feature enhancements', 'Extended functionality', 'New capabilities']

  // Generate impacted features (mock based on analysis)
  const impactedFeatures = originalAnalysis.timeline.phases.slice(0, 3).map((phase, index) => ({
    feature: phase.name,
    impactDescription: `Requires adjustments to ${phase.name.toLowerCase()} phase deliverables and timeline`,
  }))

  // Generate summary
  const summary = `Requirement changes introduce ${newFeatures.length} new features and impact ${impactedFeatures.length} existing phases. Additional time: ${additionalTimeWeeks} weeks. Additional cost: ${originalAnalysis.cost.currency} ${additionalCost.toLocaleString()}.`

  return {
    newFeatures,
    impactedFeatures,
    additionalTimeWeeks,
    additionalCost,
    costCurrency: originalAnalysis.cost.currency,
    summary,
  }
}

/**
 * Revises a project plan based on selected recommendations
 * Adjusts timeline, cost, risks, and team based on applied suggestions
 */
export async function reviseProjectPlan(
  request: ReviseProjectPlanRequest
): Promise<ProjectAnalysis> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const { originalAnalysis, selectedRecommendations, originalRequirements } = request
  
  // Start with a copy of the original analysis
  const revised: ProjectAnalysis = {
    ...originalAnalysis,
    revisedBasedOn: selectedRecommendations,
  }

  // Analyze selected recommendations to determine adjustments
  const recommendationsText = selectedRecommendations.join(' ').toLowerCase()
  
  // Calculate adjustments based on recommendation keywords
  let timelineAdjustment = 0
  let costAdjustment = 0
  let additionalRisks: Risk[] = []
  let teamAdjustments = false

  // MVP/early validation recommendations
  if (recommendationsText.includes('mvp') || recommendationsText.includes('validate')) {
    timelineAdjustment += 1 // Adds planning time
    costAdjustment += 5000 // Additional planning costs
  }

  // CI/CD recommendations
  if (recommendationsText.includes('ci/cd') || recommendationsText.includes('pipeline')) {
    timelineAdjustment += 1 // Initial setup time
    costAdjustment += 8000 // Infrastructure setup
    teamAdjustments = true
    additionalRisks.push({
      level: 'low',
      description: 'CI/CD pipeline complexity and maintenance',
      mitigation: 'Start with basic pipeline and iterate based on team needs',
    })
  }

  // Documentation recommendations
  if (recommendationsText.includes('documentation') || recommendationsText.includes('records')) {
    timelineAdjustment += 1 // Documentation time
    costAdjustment += 3000 // Documentation overhead
  }

  // Sub-projects/phases recommendations
  if (recommendationsText.includes('sub-projects') || recommendationsText.includes('phases')) {
    timelineAdjustment += 2 // Additional coordination time
    costAdjustment += 10000 // Project management overhead
    additionalRisks.push({
      level: 'medium',
      description: 'Increased coordination overhead between phases',
      mitigation: 'Establish clear phase boundaries and handoff processes',
    })
  }

  // Communication recommendations
  if (recommendationsText.includes('communication') || recommendationsText.includes('cadence')) {
    costAdjustment += 2000 // Meeting and coordination costs
  }

  // Code reviews and knowledge sharing
  if (recommendationsText.includes('code review') || recommendationsText.includes('knowledge sharing')) {
    timelineAdjustment += 1 // Review overhead
    costAdjustment += 5000 // Review time costs
  }

  // Apply timeline adjustments
  revised.timeline.estimatedWeeks = Math.max(1, originalAnalysis.timeline.estimatedWeeks + timelineAdjustment)
  
  // Adjust phase durations proportionally if timeline increased
  if (timelineAdjustment > 0) {
    const adjustmentRatio = revised.timeline.estimatedWeeks / originalAnalysis.timeline.estimatedWeeks
    revised.timeline.phases = originalAnalysis.timeline.phases.map(phase => ({
      ...phase,
      durationWeeks: Math.max(1, Math.round(phase.durationWeeks * adjustmentRatio)),
    }))
    
    // Update development phase to account for new recommendations
    const devPhaseIndex = revised.timeline.phases.findIndex(p => p.name.includes('Development'))
    if (devPhaseIndex >= 0) {
      revised.timeline.phases[devPhaseIndex].deliverables = [
        ...revised.timeline.phases[devPhaseIndex].deliverables,
        ...(recommendationsText.includes('mvp') ? ['MVP validation'] : []),
        ...(recommendationsText.includes('ci/cd') ? ['CI/CD pipeline'] : []),
        ...(recommendationsText.includes('documentation') ? ['Technical documentation'] : []),
      ]
    }
  }

  // Apply cost adjustments
  revised.cost.estimatedTotal = originalAnalysis.cost.estimatedTotal + costAdjustment
  
  // Adjust cost breakdown proportionally
  const costRatio = revised.cost.estimatedTotal / originalAnalysis.cost.estimatedTotal
  revised.cost.breakdown = originalAnalysis.cost.breakdown.map(item => ({
    ...item,
    amount: Math.round(item.amount * costRatio),
  }))

  // Add cost breakdown items for new recommendations if significant
  if (costAdjustment > 5000) {
    revised.cost.breakdown.push({
      category: 'Implementation Overhead',
      amount: costAdjustment,
      description: 'Additional costs from implementing selected recommendations',
    })
  }

  // Apply team adjustments
  if (teamAdjustments) {
    // Check if DevOps role exists
    const devOpsIndex = revised.team.composition.findIndex(m => m.role.includes('DevOps'))
    if (devOpsIndex >= 0) {
      // Increase DevOps count or ensure it exists
      revised.team.composition[devOpsIndex].count = Math.max(1, revised.team.composition[devOpsIndex].count)
    } else {
      // Add DevOps role if CI/CD is recommended
      revised.team.composition.push({
        role: 'DevOps Engineer',
        count: 1,
        level: 'mid',
        description: 'Infrastructure and deployment automation',
      })
    }
    
    // Recalculate total members
    revised.team.totalMembers = revised.team.composition.reduce((sum, member) => sum + member.count, 0)
  }

  // Add additional risks
  if (additionalRisks.length > 0) {
    revised.risks = [...originalAnalysis.risks, ...additionalRisks]
  }

  return revised
}

/**
 * Generates a change log entry for plan revision
 */
export function generateRevisionChangeLog(
  originalAnalysis: ProjectAnalysis,
  revisedAnalysis: ProjectAnalysis,
  selectedRecommendations: string[]
): ChangeLogEntry {
  const timelineDelta = revisedAnalysis.timeline.estimatedWeeks - originalAnalysis.timeline.estimatedWeeks
  const costDelta = revisedAnalysis.cost.estimatedTotal - originalAnalysis.cost.estimatedTotal
  
  const whatChanged = selectedRecommendations.length > 0
    ? `Applied ${selectedRecommendations.length} recommendation(s): ${selectedRecommendations.slice(0, 3).join(', ')}${selectedRecommendations.length > 3 ? '...' : ''}`
    : 'Project plan revised based on manager feedback'
  
  const whyChanged = selectedRecommendations.length > 0
    ? `Manager selected recommendations to improve project quality, risk management, or delivery approach`
    : 'Plan adjustments made based on review and feedback'
  
  const timelineImpact = timelineDelta > 0
    ? `Timeline increased from ${originalAnalysis.timeline.estimatedWeeks} weeks to ${revisedAnalysis.timeline.estimatedWeeks} weeks (+${timelineDelta} weeks)`
    : timelineDelta < 0
    ? `Timeline decreased from ${originalAnalysis.timeline.estimatedWeeks} weeks to ${revisedAnalysis.timeline.estimatedWeeks} weeks (${timelineDelta} weeks)`
    : `Timeline remains ${originalAnalysis.timeline.estimatedWeeks} weeks (no change)`
  
  const costImpact = costDelta > 0
    ? `Cost increased from ${originalAnalysis.cost.currency} ${originalAnalysis.cost.estimatedTotal.toLocaleString()} to ${revisedAnalysis.cost.currency} ${revisedAnalysis.cost.estimatedTotal.toLocaleString()} (+${costDelta.toLocaleString()})`
    : costDelta < 0
    ? `Cost decreased from ${originalAnalysis.cost.currency} ${originalAnalysis.cost.estimatedTotal.toLocaleString()} to ${revisedAnalysis.cost.currency} ${revisedAnalysis.cost.estimatedTotal.toLocaleString()} (${costDelta.toLocaleString()})`
    : `Cost remains ${originalAnalysis.cost.currency} ${originalAnalysis.cost.estimatedTotal.toLocaleString()} (no change)`
  
  return {
    timestamp: new Date().toISOString(),
    type: 'revision',
    whatChanged,
    whyChanged,
    timelineImpact,
    costImpact,
  }
}

// Execution Plan Generation Logic

export interface ChangeLogEntry {
  timestamp: string
  type: 'revision' | 'extension'
  whatChanged: string
  whyChanged: string
  timelineImpact: string
  costImpact: string
}

export interface ExecutionPlan {
  startDate: string
  durationWeeks: number
  phases: ExecutionPhase[]
  changeLog?: ChangeLogEntry[]
}

export interface ExecutionPhase {
  name: string
  sprints: Sprint[]
}

export interface Sprint {
  sprintNumber: number
  startDate: string
  endDate: string
  features: Feature[]
}

export interface Feature {
  name: string
  description: string
  tickets: Ticket[]
}

export interface TicketReferenceImage {
  name: string
  previewUrl: string // base64 or local URL
}

export interface Ticket {
  day: number
  date: string
  title: string
  description: string
  detailedDescription: string
  estimatedDays: number // 1-3 days
  acceptanceCriteria: string[]
  dependencies?: string[] // Optional ticket IDs or titles this depends on
  uiReference?: string // URL or placeholder for UI reference (optional)
  referenceImages?: TicketReferenceImage[] // Array of reference images
  metadata?: string[] // Optional metadata notes (e.g., "Visual references provided by manager")
  assignee?: string // Legacy field - use assignedTo instead
  status: 'planned' | 'in-progress' | 'completed'
  assignedTo?: {
    role: string
    name: string
  }
  lastUpdated?: string // ISO timestamp
  comments?: string[] // Optional array of comments
}

export interface GenerateExecutionPlanRequest {
  requirements: string
  analysis: ProjectAnalysis
  selectedSuggestions?: string[]
}

/**
 * Generates a day-by-day execution plan for the first 2 months (8 weeks)
 * Structure: Phase → Sprint → Feature → Tickets (daily)
 * Assumes: Sprint = 2 weeks, 5 working days per week
 */
export async function generateExecutionPlan(
  request: GenerateExecutionPlanRequest
): Promise<ExecutionPlan> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const { requirements, analysis, selectedSuggestions = [] } = request
  
  // Calculate dates: 8 weeks from today
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const durationWeeks = 8
  const sprintsPerPhase = 1 // Each phase can span multiple sprints
  
  // Extract features from requirements and suggestions
  const features = extractFeatures(requirements, selectedSuggestions)
  
  // Map analysis phases to execution phases with sprints
  const executionPhases: ExecutionPhase[] = []
  let currentDay = 0
  let sprintNumber = 1
  
  for (const phase of analysis.timeline.phases) {
    // Calculate how many sprints this phase needs (at least 1, based on duration)
    const phaseWeeks = Math.min(phase.durationWeeks, durationWeeks - Math.floor(currentDay / 5))
    const phaseSprints = Math.max(1, Math.ceil(phaseWeeks / 2))
    
    const sprints: Sprint[] = []
    
    for (let s = 0; s < phaseSprints && sprintNumber <= 4; s++) {
      const sprintStartDate = new Date(startDate)
      sprintStartDate.setDate(sprintStartDate.getDate() + currentDay)
      
      const sprintEndDate = new Date(sprintStartDate)
      sprintEndDate.setDate(sprintEndDate.getDate() + 9) // 2 weeks = 10 days, end on day 9
      
      // Assign features to this sprint based on phase
      const sprintFeatures = assignFeaturesToSprint(
        features,
        phase.name,
        sprintNumber,
        s,
        phaseSprints
      )
      
      // Generate daily tickets for each feature
      const featuresWithTickets = sprintFeatures.map(feature => ({
        ...feature,
        tickets: generateTicketsForFeature(feature, sprintStartDate, currentDay),
      }))
      
      sprints.push({
        sprintNumber,
        startDate: sprintStartDate.toISOString().split('T')[0],
        endDate: sprintEndDate.toISOString().split('T')[0],
        features: featuresWithTickets,
      })
      
      currentDay += 10 // Move to next sprint
      sprintNumber++
    }
    
    if (sprints.length > 0) {
      executionPhases.push({
        name: phase.name,
        sprints,
      })
    }
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    durationWeeks,
    phases: executionPhases,
    changeLog: [],
  }
}

export interface ExtendExecutionPlanRequest {
  existingPlan: ExecutionPlan
  requirements: string
  analysis: ProjectAnalysis
  selectedSuggestions?: string[]
}

/**
 * Extends an existing execution plan by 4 weeks (2 sprints)
 * Continues sprint numbering and appends to existing phases
 */
export async function extendExecutionPlan(
  request: ExtendExecutionPlanRequest
): Promise<ExecutionPlan> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const { existingPlan, requirements, analysis, selectedSuggestions = [] } = request
  
  // Find the last sprint number and end date
  let lastSprintNumber = 0
  let lastSprintEndDate: Date | null = null
  
  for (const phase of existingPlan.phases) {
    for (const sprint of phase.sprints) {
      if (sprint.sprintNumber > lastSprintNumber) {
        lastSprintNumber = sprint.sprintNumber
        lastSprintEndDate = new Date(sprint.endDate)
      }
    }
  }
  
  if (!lastSprintEndDate) {
    // Fallback: use the plan start date
    lastSprintEndDate = new Date(existingPlan.startDate)
    lastSprintEndDate.setDate(lastSprintEndDate.getDate() + existingPlan.durationWeeks * 7)
  }
  
  // Calculate new start date (next day after last sprint ends)
  const extensionStartDate = new Date(lastSprintEndDate)
  extensionStartDate.setDate(extensionStartDate.getDate() + 1)
  extensionStartDate.setHours(0, 0, 0, 0)
  
  const extensionWeeks = 4 // 4 weeks = 2 sprints
  const newSprintNumber = lastSprintNumber + 1
  // Calculate current day: each sprint is 10 working days
  let currentDay = lastSprintNumber * 10
  
  // Extract features from requirements and suggestions
  const features = extractFeatures(requirements, selectedSuggestions)
  
  // Create extended phases by appending to existing phases or creating new ones
  const extendedPhases: ExecutionPhase[] = [...existingPlan.phases]
  
  // Determine which phases to extend (focus on later phases)
  const phasesToExtend = analysis.timeline.phases.filter((phase, index) => 
    index >= Math.floor(analysis.timeline.phases.length / 2) // Focus on latter half
  )
  
  // If no later phases, extend the last phase
  const targetPhases = phasesToExtend.length > 0 ? phasesToExtend : [analysis.timeline.phases[analysis.timeline.phases.length - 1]]
  
  let sprintNumber = newSprintNumber
  
  for (const phase of targetPhases) {
    // Find or create the phase in extended phases
    let executionPhase = extendedPhases.find(p => p.name === phase.name)
    
    if (!executionPhase) {
      executionPhase = {
        name: phase.name,
        sprints: [],
      }
      extendedPhases.push(executionPhase)
    }
    
    // Add 2 sprints for this extension (4 weeks total)
    const sprintsToAdd = 2
    
    for (let s = 0; s < sprintsToAdd; s++) {
      const sprintStartDate = new Date(extensionStartDate)
      sprintStartDate.setDate(sprintStartDate.getDate() + (s * 10))
      
      const sprintEndDate = new Date(sprintStartDate)
      sprintEndDate.setDate(sprintEndDate.getDate() + 9) // 2 weeks = 10 days, end on day 9
      
      // Assign features to this sprint based on phase
      const sprintFeatures = assignFeaturesToSprint(
        features,
        phase.name,
        sprintNumber,
        s,
        sprintsToAdd
      )
      
      // Generate daily tickets for each feature
      const featuresWithTickets = sprintFeatures.map(feature => ({
        ...feature,
        tickets: generateTicketsForFeature(feature, sprintStartDate, currentDay),
      }))
      
      executionPhase.sprints.push({
        sprintNumber,
        startDate: sprintStartDate.toISOString().split('T')[0],
        endDate: sprintEndDate.toISOString().split('T')[0],
        features: featuresWithTickets,
      })
      
      currentDay += 10 // Move to next sprint
      sprintNumber++
    }
  }
  
  // Calculate how many sprints were actually added
  const sprintsAdded = sprintNumber - newSprintNumber
  
  // Generate change log entry
  const changeLogEntry: ChangeLogEntry = {
    timestamp: new Date().toISOString(),
    type: 'extension',
    whatChanged: `Extended execution plan by ${extensionWeeks} weeks (${sprintsAdded} sprint${sprintsAdded !== 1 ? 's' : ''})`,
    whyChanged: 'Manager requested additional planning time for remaining project phases',
    timelineImpact: `Timeline extended from ${existingPlan.durationWeeks} weeks to ${existingPlan.durationWeeks + extensionWeeks} weeks (+${extensionWeeks} weeks)`,
    costImpact: `No direct cost impact from extension. Cost remains based on original analysis estimate.`,
  }

  return {
    startDate: existingPlan.startDate,
    durationWeeks: existingPlan.durationWeeks + extensionWeeks,
    phases: extendedPhases,
    changeLog: [...(existingPlan.changeLog || []), changeLogEntry],
  }
}

/**
 * Extracts features from requirements and selected suggestions
 */
function extractFeatures(requirements: string, suggestions: string[]): string[] {
  const features: string[] = []
  const reqLower = requirements.toLowerCase()
  
  // Common feature patterns
  if (reqLower.includes('authentication') || reqLower.includes('login')) {
    features.push('User Authentication')
  }
  if (reqLower.includes('database') || reqLower.includes('data storage')) {
    features.push('Database Setup')
  }
  if (reqLower.includes('api') || reqLower.includes('integration')) {
    features.push('API Development')
  }
  if (reqLower.includes('frontend') || reqLower.includes('ui') || reqLower.includes('interface')) {
    features.push('Frontend Development')
  }
  if (reqLower.includes('backend') || reqLower.includes('server')) {
    features.push('Backend Development')
  }
  if (reqLower.includes('testing') || reqLower.includes('qa')) {
    features.push('Testing Framework')
  }
  if (reqLower.includes('deployment') || reqLower.includes('deploy')) {
    features.push('Deployment Setup')
  }
  
  // Add features based on suggestions
  if (suggestions.some(s => s.toLowerCase().includes('ci/cd'))) {
    features.push('CI/CD Pipeline')
  }
  if (suggestions.some(s => s.toLowerCase().includes('mvp'))) {
    features.push('MVP Validation')
  }
  if (suggestions.some(s => s.toLowerCase().includes('documentation'))) {
    features.push('Technical Documentation')
  }
  
  // Default features if none extracted
  if (features.length === 0) {
    features.push('Core Feature Development', 'Integration & Testing', 'Deployment Preparation')
  }
  
  return features
}

/**
 * Assigns features to a sprint based on phase and sprint number
 */
function assignFeaturesToSprint(
  allFeatures: string[],
  phaseName: string,
  sprintNumber: number,
  sprintIndex: number,
  totalSprints: number
): Feature[] {
  // Filter features based on phase
  let relevantFeatures: string[] = []
  
  if (phaseName.includes('Planning') || phaseName.includes('Design')) {
    relevantFeatures = allFeatures.filter(f => 
      f.includes('Setup') || f.includes('Framework') || f.includes('Documentation')
    )
    if (relevantFeatures.length === 0) {
      relevantFeatures = ['Requirements Analysis', 'Architecture Design', 'Project Setup']
    }
  } else if (phaseName.includes('Development')) {
    relevantFeatures = allFeatures.filter(f => 
      !f.includes('Setup') && !f.includes('Testing') && !f.includes('Deployment')
    )
    if (relevantFeatures.length === 0) {
      relevantFeatures = ['Core Feature Development', 'API Implementation', 'Frontend Development']
    }
  } else if (phaseName.includes('Testing')) {
    relevantFeatures = allFeatures.filter(f => 
      f.includes('Testing') || f.includes('QA') || f.includes('Validation')
    )
    if (relevantFeatures.length === 0) {
      relevantFeatures = ['Integration Testing', 'QA Testing', 'Bug Fixes']
    }
  } else if (phaseName.includes('Deployment')) {
    relevantFeatures = allFeatures.filter(f => 
      f.includes('Deployment') || f.includes('CI/CD')
    )
    if (relevantFeatures.length === 0) {
      relevantFeatures = ['Deployment Configuration', 'Production Setup', 'Launch Preparation']
    }
  }
  
  // Distribute features across sprints if multiple sprints per phase
  const featuresPerSprint = Math.max(1, Math.ceil(relevantFeatures.length / totalSprints))
  const startIndex = sprintIndex * featuresPerSprint
  const endIndex = Math.min(startIndex + featuresPerSprint, relevantFeatures.length)
  const sprintFeatures = relevantFeatures.slice(startIndex, endIndex)
  
  return sprintFeatures.map(name => ({
    name,
    description: `Implement ${name} for ${phaseName}`,
    tickets: [], // Will be populated later
  }))
}

/**
 * Generates tickets for a feature with multi-day support
 * Complex tasks are grouped into multi-day tickets (1-3 days)
 * Simpler tasks remain single-day
 */
function generateTicketsForFeature(
  feature: Feature,
  sprintStartDate: Date,
  sprintStartDay: number
): Ticket[] {
  const tickets: Ticket[] = []
  const workingDays = 10 // 2 weeks = 10 working days
  
  // Determine ticket definitions based on feature complexity
  const ticketDefinitions = getTicketDefinitionsForFeature(feature)
  
  let currentDay = sprintStartDay
  
  for (const ticketDef of ticketDefinitions) {
    if (currentDay >= sprintStartDay + workingDays) break
    
    const ticketDate = new Date(sprintStartDate)
    ticketDate.setDate(ticketDate.getDate() + (currentDay - sprintStartDay))
    
    const now = new Date()
    tickets.push({
      day: currentDay + 1,
      date: ticketDate.toISOString().split('T')[0],
      title: ticketDef.title,
      description: ticketDef.description,
      detailedDescription: ticketDef.detailedDescription,
      estimatedDays: ticketDef.estimatedDays,
      acceptanceCriteria: ticketDef.acceptanceCriteria,
      dependencies: ticketDef.dependencies,
      uiReference: ticketDef.uiReference,
      status: 'planned',
      lastUpdated: now.toISOString(),
      // assignedTo and comments are optional and can be set later
    })
    
    currentDay += ticketDef.estimatedDays
  }
  
  return tickets
}

/**
 * Returns ticket definitions for a feature
 * Groups complex tasks into multi-day tickets (2-3 days)
 * Keeps simpler tasks as single-day tickets (1 day)
 */
function getTicketDefinitionsForFeature(feature: Feature): Array<{
  title: string
  description: string
  detailedDescription: string
  estimatedDays: number
  acceptanceCriteria: string[]
  dependencies?: string[]
  uiReference?: string
}> {
  const featureName = feature.name
  const featureLower = featureName.toLowerCase()
  
  // Detect if feature is frontend-related
  const isFrontendFeature = 
    featureLower.includes('frontend') ||
    featureLower.includes('ui') ||
    featureLower.includes('interface') ||
    featureLower.includes('dashboard') ||
    featureLower.includes('login') ||
    featureLower.includes('form') ||
    featureLower.includes('page') ||
    featureLower.includes('screen') ||
    featureLower.includes('component') ||
    featureLower.includes('layout') ||
    featureLower.includes('view')
  
  // Complex features get multi-day tickets
  const isComplexFeature = 
    featureLower.includes('authentication') ||
    featureLower.includes('api') ||
    featureLower.includes('database') ||
    featureLower.includes('integration') ||
    featureLower.includes('setup') ||
    featureLower.includes('pipeline') ||
    featureLower.includes('deployment')
  
  // Helper function to get UI reference for frontend tickets
  const getUIReference = (ticketTitle: string): string | undefined => {
    if (!isFrontendFeature) return undefined
    
    const titleLower = ticketTitle.toLowerCase()
    
    // Design/Planning tickets
    if (titleLower.includes('design') || titleLower.includes('plan')) {
      if (featureLower.includes('login') || featureLower.includes('authentication')) {
        return 'Wireframe: Login Page'
      } else if (featureLower.includes('dashboard')) {
        return 'Dashboard Layout Reference'
      } else if (featureLower.includes('form')) {
        return 'Form UI – Basic CRUD Screen'
      } else {
        return `Wireframe: ${featureName}`
      }
    }
    
    // Implementation tickets
    if (titleLower.includes('implement')) {
      if (featureLower.includes('login') || featureLower.includes('authentication')) {
        return 'Login Page UI Reference'
      } else if (featureLower.includes('dashboard')) {
        return 'Dashboard Component Layout'
      } else if (featureLower.includes('form')) {
        return 'Form UI – CRUD Screen Layout'
      } else if (featureLower.includes('list') || featureLower.includes('table')) {
        return 'Data Table UI Reference'
      } else {
        return `${featureName} UI Component Reference`
      }
    }
    
    // Testing/Review tickets
    if (titleLower.includes('test') || titleLower.includes('review')) {
      return `${featureName} UI Testing Reference`
    }
    
    return undefined
  }
  
  if (isComplexFeature) {
    // Multi-day tickets for complex features
    return [
      {
        title: `Design & Plan ${featureName}`,
        description: `Design architecture and create implementation plan for ${featureName}`,
        detailedDescription: `Create detailed design documentation including architecture diagrams, data models, API contracts, and implementation approach. Review with team and get approval before implementation.`,
        estimatedDays: 2,
        acceptanceCriteria: [
          'Design documentation complete and reviewed',
          'Architecture diagrams created',
          'API contracts defined (if applicable)',
          'Team review completed',
        ],
        uiReference: getUIReference(`Design & Plan ${featureName}`),
      },
      {
        title: `Implement ${featureName} - Core Logic`,
        description: `Implement core functionality for ${featureName}`,
        detailedDescription: `Develop the main implementation including business logic, data access layer, and core functionality. Follow coding standards and best practices.`,
        estimatedDays: 3,
        acceptanceCriteria: [
          'Core logic implemented',
          'Unit tests written (minimum 80% coverage)',
          'Code review completed',
          'All tests passing',
        ],
        dependencies: [`Design & Plan ${featureName}`],
        uiReference: getUIReference(`Implement ${featureName} - Core Logic`),
      },
      {
        title: `Integrate & Test ${featureName}`,
        description: `Integration testing and refinement for ${featureName}`,
        detailedDescription: `Integrate with other components, perform integration testing, fix issues, and refine implementation based on test results.`,
        estimatedDays: 2,
        acceptanceCriteria: [
          'Integration tests passing',
          'No critical bugs',
          'Performance meets requirements',
          'Documentation updated',
        ],
        dependencies: [`Implement ${featureName} - Core Logic`],
        uiReference: getUIReference(`Integrate & Test ${featureName}`),
      },
      {
        title: `Review & Refine ${featureName}`,
        description: `Final review and polish for ${featureName}`,
        detailedDescription: `Perform final code review, refactoring if needed, update documentation, and ensure code quality standards are met.`,
        estimatedDays: 1,
        acceptanceCriteria: [
          'Code review completed',
          'Documentation updated',
          'Ready for deployment',
        ],
        dependencies: [`Integrate & Test ${featureName}`],
        uiReference: getUIReference(`Review & Refine ${featureName}`),
      },
    ]
  } else {
    // Single-day tickets for simpler features
    return [
      {
        title: `Design ${featureName}`,
        description: `Create design for ${featureName}`,
        detailedDescription: `Design the feature, create mockups or wireframes, and define acceptance criteria.`,
        estimatedDays: 1,
        acceptanceCriteria: [
          'Design document created',
          'Mockups/wireframes ready',
          'Acceptance criteria defined',
        ],
        uiReference: getUIReference(`Design ${featureName}`),
      },
      {
        title: `Implement ${featureName}`,
        description: `Implement ${featureName}`,
        detailedDescription: `Develop the feature according to design, write tests, and ensure code quality.`,
        estimatedDays: 2,
        acceptanceCriteria: [
          'Implementation complete',
          'Unit tests written',
          'Code review completed',
        ],
        dependencies: [`Design ${featureName}`],
        uiReference: getUIReference(`Implement ${featureName}`),
      },
      {
        title: `Test ${featureName}`,
        description: `Test ${featureName}`,
        detailedDescription: `Perform thorough testing including unit tests, integration tests, and manual testing. Fix any bugs found.`,
        estimatedDays: 1,
        acceptanceCriteria: [
          'All tests passing',
          'No critical bugs',
          'Feature works as expected',
        ],
        dependencies: [`Implement ${featureName}`],
        uiReference: getUIReference(`Test ${featureName}`),
      },
    ]
  }
}
