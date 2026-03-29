# ReimburseIQ

Enterprise-grade expense reimbursement platform with AI anomaly detection, multi-step approval workflows, OCR receipt scanning, and real-time notifications.

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS v4
- **Backend:** Node.js + Express
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT (access + refresh tokens), bcrypt
- **AI:** Anthropic Claude API (OCR + anomaly detection)
- **Real-time:** Socket.io

## Quick Start

### Prerequisites

- Node.js 18+

### 1. Configure Environment

Edit `server/.env` with your API keys. The `DATABASE_URL` is pre-configured for a local SQLite file (`dev.db`).

### 2. Install & Migrate

```bash
# Server
cd server
npm install
npx prisma db push --accept-data-loss
npm run seed

# Client
cd ../client
npm install
```

### 4. Run

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

Open http://localhost:5173

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@acme.com | admin123 |
| Manager | manager@acme.com | manager123 |
| Employee | employee@acme.com | employee123 |

## Features

- 🔐 JWT auth with role-based access (Admin/Manager/Employee)
- 💰 Expense submission with live currency conversion
- 📷 OCR receipt scanning via Claude AI
- 🤖 AI anomaly detection with severity levels
- ✅ Multi-step approval engine (Sequential/Percentage/Specific/Hybrid)
- 📊 Admin dashboard with filters and CSV export
- 🔔 Real-time Socket.io notifications
- 📋 Full audit trail with visual timeline
