# Personal Finance Manager  
*A Vite + React frontend with optional Flask + MySQL backend*

This project provides a modern financial management UI built in **Vite + React**, along with a starter **Flask + MySQL backend scaffold**. The app supports budgeting, reminders, reporting, and dashboard insights.

---

## ✅ Features Included

### **Budgets**
- Create, edit, and delete budgets  
- Automatic overwrite when the same category + period is added  
- Category totals and validation  

### **Reminders**
- View, edit, delete reminders  
- Dashboard alerts: **due soon**, **due today**, **overdue**  
- Upcoming-week reminders displayed on dashboard  

### **Dashboard & Reports**
- Weekly reminder insights  
- Monthly report selector  
- Spending overview and pattern visualization  

### **UI / UX**
- Light/Dark theme via Theme Provider  
- Theme preference persistence  
- Clean and modular page structure  

### **Backend (Starter Scaffold)**
- Flask API starter layout  
- MySQL schema & connection setup  
- Ready for endpoint integration  

---

## 📌 Prerequisites

| Tool      | Version          |
|-----------|------------------|
| Node.js   | **18+**          |
| Python    | **3.10+**        |
| MySQL     | **8.x+**         |

---

# 🚀 Frontend Setup (Vite + React)

1. Install dependencies  
     npm install
   
2. Start the dev server
  npm run dev
**Default URL**: http://localhost:5173

3. Create a production build
  npm run build

4. Preview the production build
  npm run preview

**📁 Project Structure (Frontend)**
src/
 ├── context/
 │    ├── ThemeContext.jsx
 │    └── FinanceContext.jsx
 ├── pages/
 │    ├── Dashboard.jsx
 │    ├── Budgets.jsx
 │    ├── Reminders.jsx
 │    ├── Reports.jsx
 │    └── Settings.jsx
 └── components/

**🗄 Backend Setup (Flask + MySQL)**
Backend code is located inside:
  backend/
1. Create the MySQL database
  mysql -u <user> -p < backend/Database/finance_schema.sql
  OPTIONAL: For mock data run backend/Database/mockdata.sql
2. Install Python dependencies
  py -m pip install flask_cors pymysql python-dateutil PyJWT
3. Configure environment variables
  export MYSQL_HOST=localhost
  export MYSQL_USER=root
  export MYSQL_PASSWORD=password
  export MYSQL_DB=personal_finance
4. Run the Flask API
  python backend/Flask/flask_api.py

**🤝 Backend Collaboration Notes**
*Frontend currently uses local state.
Replace local logic inside FinanceContext.jsx once backend endpoints are implemented.

*Reminder amounts are stored in base currency, then converted on edit.

*Budget creation overwrites duplicates with the same period + category.

*Dashboard expects reminders sorted by due date and only displays items within the next 7 days.

**🧪 Testing**
Verify the production build:
  npm run build
