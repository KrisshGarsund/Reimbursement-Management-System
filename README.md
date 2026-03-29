# ReimburseIQ — Reimbursement Management System

Enterprise-grade expense reimbursement platform with AI anomaly detection, multi-step approval workflows, OCR receipt scanning, and real-time notifications.

## The Problem

Companies lose thousands of hours every year to manual expense reimbursement 
processes. Employees submit claims with no visibility into where they stand. 
Managers get buried in approval queues with zero context. Finance teams 
struggle with fragmented, error-prone records and no audit trail.

There is no simple way to define flexible approval flows, catch fraudulent or 
duplicate claims automatically, or maintain a transparent history of every 
decision made.

**ReimburseIQ solves all of this in one platform.**

---

## What It Does

ReimburseIQ is a full-stack web application that digitizes and intelligences 
the entire expense reimbursement lifecycle — from submission to final approval 
— with AI at its core.

### For Employees
- Submit expense claims in any currency with live conversion to the company currency
- Upload a receipt photo and let AI auto-fill the entire form via OCR
- Track the real-time status of every claim submitted
- Get instant notifications when a claim is approved or rejected

### For Managers
- See a queue of expenses waiting for approval with full context
- View AI risk badges that flag suspicious claims before opening them
- Approve or reject with comments in two clicks
- Access full team expense history

### For Admins
- Auto-create company profile on signup with country-based currency detection
- Create and manage employees, managers, and roles
- Configure flexible multi-step approval chains with four rule types
- View and filter all company expenses
- Export expense reports as CSV
- Override any approval with full audit logging

---

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
