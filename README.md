# ✨ AuraFeedback - Customer Feedback & Analytics Portal

A full-stack, enterprise-grade customer feedback management platform built with modern aesthetics, glassmorphism design, real-time sentiment analysis, interactive analytics, and MySQL 8.0 database integration.

---

## 🌟 Key Features

- **🛍️ Purchased Products Selector**: Customers select recently purchased items to leave verified reviews.
- **💬 Interactive Feedback Form**: 
  - Dynamic 5-star ratings with animated emoji status.
  - Live sentiment analysis (positive, neutral, negative) as the user types.
  - Smart category tagging and quick tag selection.
  - Confetti celebration upon successful submission with custom ticket IDs (`AF-XXXXX-TKT`).
- **📊 Real-time Analytics Dashboard**:
  - Net Promoter Score (NPS) calculation.
  - Customer Satisfaction (CSAT) score.
  - Sentiment breakdown charts and rating distributions.
  - Search and filter by category, rating, sentiment, and keywords.
  - AI-assisted quick response generator for customer support teams.
  - One-click reply copying and ticket status management.
- **🗄️ MySQL 8.0+ Integration**:
  - Relational schema with foreign keys, data constraints, and cascading deletions.
  - Dual-mode architecture: seamlessly connects to MySQL, with automatic fallback to local JSON storage if offline.

---

## 🏗️ Project Architecture

```
saravanan feedback/
├── .gitignore               # Git ignore rules for passwords and modules
├── README.md                # Project documentation
├── frontend/                # Client-Side Application
│   ├── index.html           # Product selection portal
│   ├── index.js             # Product catalog handler
│   ├── feedback.html        # Review submission form
│   ├── feedback.js          # Review submission & sentiment engine
│   ├── dashboard.html       # Analytics & ticket management UI
│   ├── dashboard.js         # KPI metrics, filtering, and reply logic
│   ├── styles.css           # Glassmorphism design system & variables
│   ├── app.js               # Shared state and utility library
│   └── api.js               # Frontend API service with offline fallback
└── backend/                 # Server & Database Layer
    ├── server.js            # Node.js REST API server (zero required dependencies)
    ├── server.py            # Python alternative server
    ├── db.js                # Database connection module (MySQL + JSON fallback)
    ├── schema.sql           # Complete MySQL database creation & seed script
    ├── setup_database.ps1   # 1-click database setup script for Windows
    ├── package.json         # Backend dependencies (mysql2, dotenv)
    ├── .env.example         # Environment template
    ├── README.md            # Detailed API documentation
    └── data/                # Persistent JSON data storage
        ├── products.json    # Default product catalog
        └── feedbacks.json   # Customer feedback entries
```

---

## 🚀 Getting Started

### 1. Database Setup (MySQL 8.0+)

1. Ensure MySQL Server is running (e.g. `MySQL80` Windows service).
2. Run the database setup script in PowerShell:
   ```powershell
   cd backend
   .\setup_database.ps1
   ```
   *Or import [backend/schema.sql](file:///c:/Users/Saravanan%20M/Dropbox/the%20project/saravanan%20feedback/backend/schema.sql) directly via MySQL Workbench or command line:*
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
3. Update your database password in [backend/.env](file:///c:/Users/Saravanan%20M/Dropbox/the%20project/saravanan%20feedback/backend/.env):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=aurafeedback_db
   ```

### 2. Start the Backend Server

```bash
cd backend
npm install   # Installs mysql2 and dotenv
npm start     # Runs on http://localhost:5000
```
*(Or run `node server.js` / `python server.py`)*

### 3. Open the Frontend

Open [frontend/index.html](file:///c:/Users/Saravanan%20M/Dropbox/the%20project/saravanan%20feedback/frontend/index.html) in your browser (or use Live Server / VS Code extension).

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status and active database engine (`MySQL` or `JSON`) |
| `GET` | `/api/products` | Retrieve all reviewable products |
| `GET` | `/api/feedbacks` | Query reviews (`search`, `category`, `rating`, `sentiment`) |
| `GET` | `/api/feedbacks/stats`| Computed analytics (NPS, CSAT, sentiment percentages) |
| `POST`| `/api/feedbacks` | Submit review ticket with automated sentiment scoring |
| `POST`| `/api/feedbacks/:id/reply` | Add official customer support response |
| `DELETE`| `/api/feedbacks/:id` | Remove feedback record |

---

## 👤 Author

Developed by **Saravanan M**
