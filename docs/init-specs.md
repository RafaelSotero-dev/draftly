# AI INSTRUCTION: COMMUNICATION PREFERENCE
**IMPORTANT:** Although these specifications are in English, you MUST communicate with the user, provide progress updates, and ask questions exclusively in **PORTUGUESE**.

---

# Technical Specification: Excalidraw Clone with Project Management, Supabase & PostgreSQL

## 1. Objective
Create a virtual whiteboard application using the **Excalidraw** open-source codebase as a foundation, extending its features to include a **Project Management System** (a feature normally exclusive to the paid Excalidraw+ version).

## 2. Tech Stack
- **Core:** [Excalidraw Open Source](https://github.com/excalidraw/excalidraw)
- **Framework:** React.js
- **Language:** TypeScript
- **Backend/Database:** Supabase
- **DBMS:** PostgreSQL
- **ORM:** Prisma

## 3. Infrastructure & Persistence
- **DBMS:** The system will use **PostgreSQL** hosted on Supabase.
- **Connection:** The database connection URI is located in the `.env` file (`DATABASE_URL`).
- **Database State:** The PostgreSQL database is currently empty with no tables created.
- **AI (Kiro) Responsibilities:**
    - Configure Prisma to use the `postgresql` provider.
    - Design the database schema reflecting the structure of Projects, Folders, and Canvas Elements.
    - Generate and execute initial migrations to PostgreSQL on Supabase.

## 4. Functional Requirements

### 4.1. Core Integration
- Implement the main Excalidraw component ensuring full parity with drawing tools, shape libraries, and support for `.excalidraw` files.

### 4.2. Project Module (Exclusive Feature)
- **Main Dashboard:** A file manager interface where users can view and manage cloud-saved projects.
- **Folder Structure:** Ability to organize drawings into hierarchical folders.
- **Project Metadata:** Name, creation/modification dates, and automatic thumbnail generation from the canvas.
- **File Operations:** Full CRUD (Create, Rename, Duplicate, Delete, Move).

### 4.3. Sync Logic
- Implement real-time synchronization between the local canvas state and PostgreSQL via Prisma.
- Ensure efficient "Auto-save" to prevent request overloading.

## 5. Implementation Instructions for Kiro
1. **Phase 1:** Initialize the Excalidraw environment and configure Prisma with the `postgresql` provider and `.env` connection.
2. **Phase 2:** Design the Prisma Schema to support the hierarchy: `Folders -> Projects -> CanvasData`.
3. **Phase 3:** Execute migrations to PostgreSQL.
4. **Phase 4:** Develop the Dashboard and Sidebar UI, integrating API calls for persistence.
5. **Phase 5:** Implement context switching between projects with dynamic loading from the database.

## 6. Design Notes
- Minimalist aesthetics following the Excalidraw standard.
- UX focused on low latency during the saving process.