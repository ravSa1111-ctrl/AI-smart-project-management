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
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Create Project
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Start a new project. The AI delivery manager will analyze requirements and create a comprehensive plan.
            </p>
            <Link
              href="/projects/create"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium"
            >
              Create Project
            </Link>
          </div>

                <div className="bg-white border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    View Projects
                  </h2>
                  <p className="text-gray-600 mb-4 text-sm">
                    Overview of all projects. Review and analyze existing projects. Get AI insights on timelines, costs, and team composition.
                  </p>
                  <Link
                    href="/projects"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium"
                  >
                    View Projects
                  </Link>
                </div>

          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              AI Prompt Log
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Developer panel - Review AI prompts used to build this application (read-only).
            </p>
            <Link
              href="/prompts"
              className="inline-block px-4 py-2 bg-gray-600 text-white text-sm font-medium"
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
