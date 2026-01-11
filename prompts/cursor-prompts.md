# Cursor AI Prompt Log

This file maintains a history of all AI prompts used to build and modify this application.
It helps with prompt governance, reproducibility, and review.

---

## Prompt Template

**Prompt ID:**  
**Date:**  
**Feature / Purpose:**  
**Files Impacted:**  
**Prompt Content:**  
**Notes / Outcome:**

---

## Initial Entry

**Prompt ID:** PROMPT-001  
**Date:** Initial project setup  
**Feature / Purpose:** Project bootstrap - AI-powered project management application setup  
**Files Impacted:** All initial project files  
**Prompt Content:**  
"This is an AI-powered project management application. The AI acts as a senior delivery manager. It analyzes project requirements, asks clarification questions if needed, creates realistic project plans, estimates cost and timeline, suggests team composition, and helps manage changes. Human managers always review and approve AI outputs. Avoid overengineering. Keep logic practical and demo-ready.

Set up the complete project structure from scratch. Use a single full-stack setup with Next.js (App Router). Frontend and backend should live in the same codebase. Stack requirements: - Frontend: Next.js + React + Tailwind CSS - Backend: Next.js API routes (Node.js) - AI logic: abstracted behind service functions (no real API key yet) - Database: start with in-memory / mock data (no real DB for now) Initial goals: 1. Scaffold the full project structure 2. Create basic pages for: - Project creation - Project analysis 3. Create placeholder API routes"

**Notes / Outcome:**  
Successfully bootstrapped the application with Next.js App Router architecture. Created project structure with pages for project creation and analysis. Implemented mock data storage and AI service abstraction layer. Established foundation for AI-powered delivery management features.

---

**Prompt ID:** PROMPT-002  
**Date:** 2024-12-19  
**Feature / Purpose:** Enhanced execution plan ticket structure - multi-day tickets with detailed fields  
**Files Impacted:** lib/services/aiDeliveryManager.ts, lib/data/mockStorage.ts (if Ticket interface is defined there)  
**Prompt Content:**  
"Enhance the execution plan ticket structure.

Changes required:
- Allow tickets to span multiple days (1–3 days)
- Add fields to each ticket:
  - title
  - detailedDescription
  - estimatedDays
  - acceptanceCriteria (array of strings)
  - dependencies (optional)
  - uiReference (string URL or placeholder)

Update the execution plan generator logic so:
- Larger or complex tasks are grouped into multi-day tickets
- Simpler tasks remain single-day
- Tickets are more realistic for real development work"

**Notes / Outcome:**  
Implementation in progress - updating Ticket interface and ticket generation logic to support multi-day tickets with enhanced fields for better project planning realism.

---

**Prompt ID:** PROMPT-003  
**Date:** 2024-12-19  
**Feature / Purpose:** Enhanced ticket generation with UI references for frontend-related tickets  
**Files Impacted:** lib/services/aiDeliveryManager.ts  
**Prompt Content:**  
"Enhance ticket generation to include UI references when applicable.

Behavior:
- For frontend-related tickets, add a uiReference field
- Use placeholder references such as:
  - "Wireframe: Login Page"
  - "Dashboard Layout Reference"
  - "Form UI – Basic CRUD Screen"

Do NOT integrate real image generation.
Keep it mock but realistic and demo-friendly."

**Notes / Outcome:**  
Implementation in progress - enhancing ticket generation logic to automatically add UI references for frontend-related tickets with realistic placeholder values.

---

**Prompt ID:** PROMPT-004  
**Date:** 2024-12-19  
**Feature / Purpose:** Make execution plan items clickable with detail views  
**Files Impacted:** app/projects/analyze/page.tsx  
**Prompt Content:**  
"Make sprints, features, and tickets clickable in the execution plan UI.

Requirements:
- Clicking a sprint opens sprint details
- Clicking a feature opens feature details
- Clicking a ticket opens ticket details
- Highlight the selected item visually
- Keep hierarchy navigation intuitive"

**Notes / Outcome:**  
Implementation in progress - adding click handlers and detail views for sprints, features, and tickets with visual highlighting for selected items.

---

**Prompt ID:** PROMPT-005  
**Date:** 2024-12-19  
**Feature / Purpose:** Ticket editing functionality with validation  
**Files Impacted:** app/projects/analyze/page.tsx  
**Prompt Content:**  
"For ticket editing, allow modification of:
- title
- detailedDescription
- estimatedDays
- acceptanceCriteria
- uiReference

Ensure validation:
- estimatedDays must be between 1 and 3
- title and description are mandatory"

**Notes / Outcome:**  
Implementation in progress - adding ticket editing functionality with validation for title, detailedDescription, estimatedDays, acceptanceCriteria, and uiReference fields.

---

**Prompt ID:** PROMPT-006  
**Date:** 2024-12-19  
**Feature / Purpose:** Change log system for tracking edits to sprints, features, and tickets  
**Files Impacted:** app/projects/analyze/page.tsx, lib/data/mockStorage.ts (optional for storage)  
**Prompt Content:**  
"Add a change log system.

Whenever a sprint, feature, or ticket is edited:
- Record what changed
- Record who changed it (Manager)
- Record timestamp

Display this in a "Project Change Log" section."

**Notes / Outcome:**  
Implementation in progress - creating change log system to track edits to sprints, features, and tickets with manager attribution and timestamps.

---

**Prompt ID:** PROMPT-007  
**Date:** 2024-12-19  
**Feature / Purpose:** Document upload support in project creation form  
**Files Impacted:** app/projects/create/page.tsx  
**Prompt Content:**  
"Enhance the project creation form to support document upload.

Requirements:
- Add file upload input accepting PDF and DOCX files
- Make document upload optional
- Allow either:
  - Text input (existing flow)
  - OR document upload
- Display uploaded file name in UI"

**Notes / Outcome:**  
Implementation in progress - adding file upload functionality to project creation form with PDF and DOCX support, optional upload, and file name display.

---

**Prompt ID:** PROMPT-008  
**Date:** 2024-12-19  
**Feature / Purpose:** Document text extraction from PDF and DOCX files  
**Files Impacted:** app/projects/create/page.tsx, package.json (if adding libraries)  
**Prompt Content:**  
"Implement document text extraction logic.

Behavior:
- If PDF uploaded, extract text using a lightweight library or mock extraction
- If DOCX uploaded, extract raw text
- Combine extracted text into a single requirements string
- Pass extracted text to analyzeProject() as project requirements

If extraction fails:
- Show a friendly error message
- Allow fallback to manual text input"

**Notes / Outcome:**  
Implementation in progress - adding text extraction logic for PDF and DOCX files with error handling and fallback to manual input.

---

**Prompt ID:** PROMPT-009  
**Date:** 2024-12-19  
**Feature / Purpose:** Update AI analysis pipeline to treat text and document requirements uniformly  
**Files Impacted:** app/projects/create/page.tsx, app/projects/analyze/page.tsx, lib/data/mockStorage.ts (optional)  
**Prompt Content:**  
"Update the AI analysis pipeline so that:
- AI does not care whether input came from text or document
- Project analysis is based on the final combined requirements text
- Display a label indicating:
  "Requirements source: Manual Input / Uploaded Document""

**Notes / Outcome:**  
Implementation in progress - updating analysis pipeline to treat all requirements uniformly and display source label.

---

**Prompt ID:** PROMPT-010  
**Date:** 2024-12-19  
**Feature / Purpose:** Extend ticket data model to support reference images  
**Files Impacted:** lib/services/aiDeliveryManager.ts, app/projects/analyze/page.tsx  
**Prompt Content:**  
"Extend the ticket data model to support reference images.

Changes:
- Add referenceImages field to tickets
- Type: array of image objects
  - name
  - previewUrl (base64 or local URL)
- Keep existing uiReference text field as optional"

**Notes / Outcome:**  
Implementation in progress - adding referenceImages array field to Ticket interface with name and previewUrl properties, while keeping uiReference text field optional.

---

**Prompt ID:** PROMPT-011  
**Date:** 2024-12-19  
**Feature / Purpose:** Image upload functionality in ticket edit panel  
**Files Impacted:** app/projects/analyze/page.tsx  
**Prompt Content:**  
"Add image upload functionality to the ticket edit panel.

Requirements:
- Allow uploading PNG and JPG images
- Preview images inside the ticket editor
- Allow removing images before saving
- Limit max 3 images per ticket
- Store images in local state (no backend upload needed)"

**Notes / Outcome:**  
Implementation in progress - adding image upload UI to ticket editor with PNG/JPG support, preview, remove functionality, and 3-image limit.

---

**Prompt ID:** PROMPT-012  
**Date:** 2024-12-19  
**Feature / Purpose:** Display reference images in ticket details view with click-to-preview  
**Files Impacted:** app/projects/analyze/page.tsx  
**Prompt Content:**  
"Display reference images in the ticket details view.

Requirements:
- Show image thumbnails
- Allow click-to-preview (modal or lightbox)
- Clearly label as "Reference Images""

**Notes / Outcome:**  
Implementation in progress - adding image display with thumbnails, click-to-preview modal/lightbox, and clear labeling.

---

**Prompt ID:** PROMPT-013  
**Date:** 2024-12-19  
**Feature / Purpose:** Add metadata note for tickets with reference images  
**Files Impacted:** lib/services/aiDeliveryManager.ts, app/projects/analyze/page.tsx  
**Prompt Content:**  
"When reference images are added to a ticket:
- Add a note in the ticket metadata:
  "Visual references provided by manager"
- Display this note in execution plan summaries"

**Notes / Outcome:**  
Implementation in progress - adding metadata note to tickets with reference images and displaying it in execution plan summaries.

---

**Prompt ID:** PROMPT-014  
**Date:** 2024-12-19  
**Feature / Purpose:** Create View Projects page with clickable project cards  
**Files Impacted:** app/projects/page.tsx (new), app/page.tsx  
**Prompt Content:**  
"Create a "View Projects" page that displays all projects as clickable cards.

Requirements:
- Each card should show:
  - Project name
  - Short description
  - Timeline summary
  - Status indicator
- Clicking a card opens the project in summary mode
- This page is read-focused (overview)"

**Notes / Outcome:**  
Implementation in progress - creating a View Projects page with clickable project cards showing name, description, timeline summary, and status indicator.

---

**Prompt ID:** PROMPT-015  
**Date:** 2024-12-19  
**Feature / Purpose:** Modify project details view for summary mode from View Projects  
**Files Impacted:** app/projects/analyze/page.tsx, app/projects/page.tsx  
**Prompt Content:**  
"Modify the project details view when opened from "View Projects".

Requirements:
- Remove the following buttons:
  - Approve
  - Reject
  - Create Project Plan
- Keep full visibility of:
  - Execution plan
  - Sprints
  - Features
  - Tickets
- Tickets must remain editable
- Clearly label this view as "Project Summary""

**Notes / Outcome:**  
Implementation in progress - modifying analyze page to support summary mode with removed action buttons while keeping full execution plan visibility and ticket editing.

---

**Prompt ID:** PROMPT-016  
**Date:** 2024-12-19  
**Feature / Purpose:** Add Change Requirements button with modal in project summary view  
**Files Impacted:** app/projects/analyze/page.tsx  
**Prompt Content:**  
"Add a "Change Requirements" button in the project summary view.

On click:
- Open a modal
- Allow:
  - Document upload (PDF/DOC)
  - OR text input for new requirements
- Submission should trigger AI impact analysis"

**Notes / Outcome:**  
Implementation in progress - adding Change Requirements button with modal for document upload or text input, triggering AI impact analysis on submission.

---

**Prompt ID:** PROMPT-017  
**Date:** 2024-12-19  
**Feature / Purpose:** Implement AI requirement impact analysis  
**Files Impacted:** lib/services/aiDeliveryManager.ts, app/projects/analyze/page.tsx  
**Prompt Content:**  
"Implement AI requirement impact analysis.

Behavior:
- Compare new requirements with existing project plan
- Identify:
  - New features to be added
  - Existing features that will be impacted
- Calculate:
  - Additional time required
  - Additional cost
- Generate a clear "Impact Summary" section"

**Notes / Outcome:**  
Implementation in progress - creating AI requirement impact analysis function to compare new requirements with existing plan, identify impacted features, calculate time/cost changes, and display impact summary.

---

**Prompt ID:** PROMPT-018  
**Date:** 2024-12-19  
**Feature / Purpose:** Update execution plan based on new requirements  
**Files Impacted:** lib/services/aiDeliveryManager.ts, app/projects/analyze/page.tsx  
**Prompt Content:**  
"Update the execution plan based on new requirements.

Rules:
- Do NOT modify completed tickets
- Append new sprints for new work
- Update affected features carefully
- Preserve original timeline as baseline
- Mark new changes as "Change Request - Phase X""

**Notes / Outcome:**  
Implementation in progress - creating function to update execution plan based on new requirements while preserving completed tickets, appending new sprints, updating affected features, and marking changes.

---

**Prompt ID:** PROMPT-019  
**Date:** 2026-01-11  
**Feature / Purpose:** Extend ticket model to support workflow tracking  
**Files Impacted:** lib/services/aiDeliveryManager.ts, app/projects/analyze/page.tsx  
**Prompt Content:**  
"Extend the ticket model to support workflow tracking.

Add:
- status field (enum)
- assignedTo (role + name)
- lastUpdated
- comments (optional)"

**Notes / Outcome:**  
Implementation in progress - extending Ticket interface with workflow tracking fields (status enum, assignedTo with role and name, lastUpdated timestamp, and optional comments array).

---
