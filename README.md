# ReimburseIQ — Reimbursement Management System

Enterprise-grade expense reimbursement platform with AI anomaly detection, multi-step approval workflows, OCR receipt scanning, and real-time notifications.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT (access + refresh tokens), bcrypt
- **AI:** Anthropic Claude API (OCR + anomaly detection)
- **Real-time:** Socket.io

---

## ⚡ Quick Start (No Config Needed)

All secrets and database URL are pre-configured. Just run:

```bash
# Terminal 1 — Backend
cd server
npm install
npx prisma db push --accept-data-loss
npm run seed
npm run dev

# Terminal 2 — Frontend
cd client
npm install
npm run dev
```

Open → **http://localhost:5173**

---

## 🔐 Demo Accounts

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@acme.com         | admin123     |
| Manager  | manager@acme.com       | manager123   |
| Employee | employee@acme.com      | employee123  |

---

## ✨ Features

- 🔐 JWT auth with role-based access (Admin / Manager / Employee)
- 💰 Expense submission with live currency conversion
- 📷 OCR receipt scanning via Claude AI
- 🤖 AI anomaly detection with severity levels
- ✅ Multi-step approval engine (Sequential / Percentage / Specific / Hybrid)
- 📊 Admin dashboard with filters and CSV export
- 🔔 Real-time Socket.io notifications
- 📋 Full audit trail with visual timeline

---

## 🗒️ Notes

- SQLite database file is at `server/prisma/dev.db`
- The `ANTHROPIC_API_KEY` in `server/.env` is required for OCR/AI features — replace with a real key to enable them
- All other secrets are pre-filled and ready to use
