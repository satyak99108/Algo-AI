# Operational Memory (Algo-AI)

Operational Memory is a fully functional MVP web application for visualizing and managing an organization's internal knowledge graph. It allows users to track people, projects, decisions, tasks, processes, and more, as well as the relationships between them.

## Features
- **Dynamic Entity Management:** Create and edit customized entities with properties specific to their type.
- **Relationship Mapping:** Connect entities together (e.g., "Person A" -> *owns* -> "Project B").
- **Interactive Knowledge Graph:** Visualize the entire organization's structure using an interactive Node-based graph (powered by React Flow).
- **Responsive Dark Theme:** A sleek, premium dark-mode UI built with shadcn/ui and Tailwind CSS.

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Uvicorn
- **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn/ui, @xyflow/react

## How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database (or Neon connection string)

### 1. Database Setup
Ensure your PostgreSQL database is running. 
Navigate to the `backend` directory, duplicate `.env.example` to `.env`, and update your `DATABASE_URL`.

### 2. Run the Backend
```bash
cd backend
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Run migrations to create the schema
python -m alembic upgrade head

# (Optional) Seed the database with mock data
python seed.py

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 3. Run the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the App
Open your browser and navigate to [http://localhost:3000](http://localhost:3000). The backend API will be running on `http://localhost:8000`.
