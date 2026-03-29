# How ReimburseIQ Works

ReimburseIQ is a full-stack, enterprise-grade reimbursement management system. It is built to facilitate complex, multi-tiered expense approvals, leverage AI to detect fraudulent or anomalous expenses, and provide real-time updates to employees and managers.

This document breaks down the core architecture and technical workflows that power the application.

---

## 1. Core Architecture

The application is structured as a **Monorepo** consisting of two main parts:
*   **Client (`/client`)**: A React Single Page Application (SPA) built with Vite and Tailwind CSS v4. It manages state via the React Context API and handles complex routing with role-based guards.
*   **Server (`/server`)**: A Node.js and Express REST API. It uses Prisma as an ORM to interact with the local SQLite database (`dev.db`).

### Authentication Flow (JWT)
1.  **Login**: The user provides credentials. The backend verifies the hash using `bcrypt` and issues two tokens:
    *   **Access Token**: A short-lived (15m) JWT sent back in the JSON body. The React app stores this **in memory** (never in `localStorage` for security reasons).
    *   **Refresh Token**: A long-lived (7d) JWT sent as an **`httpOnly` cookie**. This cookie cannot be accessed by client-side JavaScript, protecting against XSS attacks.
2.  **Silent Refresh**: When the Access Token expires, Axios network requests begin failing with a `401 Unauthorized`. An automated Axios Interceptor gracefully catches this failure, hits the `/api/auth/refresh` endpoint (which automatically sends the `httpOnly` cookie), receives a fresh Access Token, and retries the failed request seamlessly.
3.  **Role Guards**: Both the React router (`ProtectedRoute`) and the Express backend (`roleGuard` middleware) strictly verify that the logged-in user has the necessary permissions (Employee, Manager, or Admin) to access a resource.

---

## 2. The Expense Lifecycle

### Submission
When an employee submits an expense, the `expense.service.js` handles currency conversion using a live exchange rate API to standardize all company expenses into a single base currency (e.g., USD).

### AI Anomaly Detection (`anomaly.service.js`)
Immediately after a successful database insert, the backend fires an asynchronous, non-blocking call to the `analyzeExpense()` function. 
*   **Context Gathering**: The system queries the employee's last 10 expenses and the company's average spend for that specific category.
*   **Claude API Analysis**: This historical data block is packaged into a prompt and sent to Anthropic's Claude. The AI acts as a digital auditor.
*   **Flagging**: If Claude detects suspicious patterns (e.g., highly unusual amounts, duplicate submissions, weekend filings), the expense is updated in the database with an `aiFlag=true`, a severity level, and a concise reasoning string. 
*   **Immediate Action**: High severity flags trigger instant socket notifications to managers.

---

## 3. The Approval Engine (`approval.engine.js`)

Unlike standard applications that use simple "Manager A approves User B" logic, ReimburseIQ features a deeply dynamic **Multi-Step Approval Engine**.

When an expense is submitted, it enters a multi-step queue. The engine evaluates the company's `ApprovalRule` configurations at each step:
*   **Sequential Rules**: Enforces strict step-by-step hierarchies (e.g., Direct Manager must approve first (Step 1), then the Finance Director (Step 2)).
*   **Percentage / Threshold Rules**: Requires a certain percentage of a group to approve (e.g., 50% of the HR team must approve the expense).
*   **Hybrid Rules**: Complex conditional routing based on department logic.

**How it executes:**
1.  **Step Assignment**: The engine determines who must approve Step $X$ and creates `AuditLog` entries tagging the relevant managers.
2.  **Processing**: When an approver clicks "Approve", an `ApprovalLog` is written. The engine checks if the current Step's conditions are fully met.
3.  **Advancement**: If the step is satisfied, the engine increments the expense's `currentApproverStep` and pings the approvers assigned to the next step. If no more rules exist, it finalizes the expense as `APPROVED`. Rejections instantly halt the engine and finalize the expense as `REJECTED`.

---

## 4. Real-time Infrastructure (Socket.io)

Polling a database for updates is highly inefficient for a dashboard. ReimburseIQ uses persistent WebSocket connections via `Socket.io` to push data from the server directly to the React frontend in milliseconds.

1.  **Connection**: Upon logging in, the React `SocketContext` connects to the backend and authenticates using the JWT.
2.  **Rooms**: The backend assigns the user's socket to a private room based on their User ID (`user_${userId}`).
3.  **Events**: When the Approval Engine routes a ticket to a manager, or when a manager rejects an employee's ticket, the `notification.service.js` emits a targeted payload to that specific user's private room. React listens for this payload, incrementing the unread bell counter and firing a specialized "toast" alert in real-time.

---

## 5. Database Schema (SQLite & Prisma)

The relational integrity is securely managed via `schema.prisma`. 
*   **Company**: The top-level tenant. It defines the base currency.
*   **User**: Associates an individual with a specific Role, a specific Company, and a specific Direct Manager.
*   **Expense**: The core functional object, linked to the `submittedBy` User.
*   **ApprovalRule**: Configures the dynamic logic for the Approval Engine.
*   **AuditLog / ApprovalLog**: Immutable ledger tables tracking the "who, what, and when" of every significant action (submission, AI flagging, approval steps, admin overrides) to ensure the system is enterprise-compliant for auditing.
