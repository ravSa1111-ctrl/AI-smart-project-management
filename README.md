# Power Employee Platform

AI-powered project management application where an AI acts as a senior delivery manager. The AI analyzes project requirements, creates realistic project plans, estimates cost and timeline, suggests team composition, and helps manage changes.

Human managers always review and approve AI outputs.

## Features

- **Project Creation**: Create new projects with detailed requirements
- **AI Analysis**: Automated project analysis with timeline, cost, team, and risk assessments
- **Project Planning**: Comprehensive project plans with phases and deliverables
- **Approval Workflow**: Human managers review and approve/reject AI-generated plans

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **AI Logic**: Abstracted service layer (currently mocked, ready for AI API integration)
- **Data Storage**: In-memory mock storage (ready for database integration)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── projects/         # Project API endpoints
│   ├── projects/             # Project pages
│   │   ├── create/           # Project creation page
│   │   └── analyze/          # Project analysis page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── lib/                      # Utility libraries
│   ├── data/                 # Data layer
│   │   └── mockStorage.ts    # In-memory storage
│   └── services/             # Business logic
│       └── aiDeliveryManager.ts  # AI service (mocked)
└── public/                   # Static assets
```

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get project by ID
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/analyze` - Analyze project (AI)

## Development Notes

- **AI Integration**: The AI logic is abstracted in `lib/services/aiDeliveryManager.ts`. Replace the mock implementation with actual AI API calls (OpenAI, etc.)
- **Database**: Currently using in-memory storage. Replace `lib/data/mockStorage.ts` with database calls (PostgreSQL, MongoDB, etc.)
- **No Overengineering**: Code is kept practical and demo-ready

## Next Steps

1. Integrate real AI API (OpenAI, Anthropic, etc.)
2. Add database (PostgreSQL, MongoDB, etc.)
3. Add authentication and user management
4. Add project change management features
5. Add more detailed reporting and analytics

## License

MIT
