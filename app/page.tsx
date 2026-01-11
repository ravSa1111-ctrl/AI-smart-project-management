import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Power Employee Platform
          </h1>
          <p className="text-gray-600">
            AI-Powered Project Management with Senior Delivery Manager
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card card-hover p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✨</span>
              <h2 className="text-xl font-semibold text-gray-900">
                Create Project
              </h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Start a new project. The AI delivery manager will analyze requirements and create a comprehensive plan.
            </p>
            <Link
              href="/projects/create"
              className="btn-ai inline-block"
            >
              Create Project
            </Link>
          </div>

          <div className="card card-hover p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📊</span>
              <h2 className="text-xl font-semibold text-gray-900">
                View Projects
              </h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Overview of all projects. Review and analyze existing projects. Get AI insights on timelines, costs, and team composition.
            </p>
            <Link
              href="/projects"
              className="btn-ai-secondary inline-block"
            >
              View Projects
            </Link>
          </div>

          <div className="card card-hover p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔍</span>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Prompt Log
              </h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Developer panel - Review AI prompts used to build this application (read-only).
            </p>
            <Link
              href="/prompts"
              className="inline-block px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              View Prompt Log
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Human managers review and approve all AI outputs
          </p>
        </div>
      </div>
    </div>
  )
}
