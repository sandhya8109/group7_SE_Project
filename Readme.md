-Requirements:
-Python
-Flask 
-    py -m pip install Flask
-MySQL
+# Personal Finance Manager (Frontend & Backend overview)
+
+This project provides a Vite + React frontend for tracking budgets, reminders, and reports, along with a starter Flask + MySQL backend. Use this guide to install dependencies, run the app locally, build for production, and understand what features currently exist for collaboration with the backend.
+
+## What’s included
+- Budget creation with edit/delete controls, per-category totals, and overwrite behavior when the same budget period/category is added again.
+- Reminder dashboard that surfaces due-soon/today/overdue alerts and supports viewing, editing, and deleting reminders.
+- Spending insights and upcoming reminders visible on the main dashboard for the next week.
+- Theme provider with deterministic light/dark mode toggles and persisted preference.
+- Monthly report selector that lets you view any month in the chosen year.
+- Flask + MySQL backend scaffolding (see `backend/`).
+
+## Prerequisites
+- Node.js 18+ and npm
+- Python 3.10+ (for the Flask backend)
+- MySQL 8.x (or compatible)
+
+## Frontend setup (Vite + React)
+1. Install dependencies:
+   ```bash
+   npm install
+   ```
+2. Start the dev server (default http://localhost:5173):
+   ```bash
+   npm run dev
+   ```
+3. Build for production:
+   ```bash
+   npm run build
+   ```
+4. Preview the production build locally:
+   ```bash
+   npm run preview
+   ```
+
+### Project structure (frontend)
+- `src/context/ThemeContext.jsx` — light/dark theme provider with deterministic setters and persistence.
+- `src/context/FinanceContext.jsx` — budgets, reminders, reports, and currency handling.
+- `src/pages/` — UI pages for Dashboard, Budgets, Reminders, Reports, Settings, etc.
+
+## Backend setup (Flask + MySQL)
+The backend lives in `backend/` and is separate from the Vite dev server.
+
+1. Create and initialize the database:
+   ```bash
+   mysql -u <user> -p < backend/Database/finance_schema.sql
+   ```
+2. Install Python dependencies (adjust to your virtualenv/venv workflow):
+   ```bash
+   pip install flask flask-cors pymysql werkzeug
+   ```
+3. Configure environment variables (defaults shown):
+   ```bash
+   export MYSQL_HOST=localhost
+   export MYSQL_USER=root
+   export MYSQL_PASSWORD=password
+   export MYSQL_DB=personal_finance
+   ```
+4. Run the API:
+   ```bash
+   python backend/Flask/flask_api.py
+   ```
+
+## Coordination notes for backend collaborators
+- The frontend currently uses local state for finance data. Hook up real endpoints in `src/context/FinanceContext.jsx` when the Flask API is ready.
+- Reminder amounts are stored in base currency values and converted to the active currency on edit display.
+- Budget creation overwrites an existing entry when the same period/category is submitted instead of duplicating it.
+- Dashboard expects reminder data sorted by due date and shows alerts for the next week.
+
+## Testing
+Run the production build to verify the frontend bundles successfully:
+```bash
+npm run build
+```
+
