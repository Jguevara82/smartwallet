# SmartWallet - Personal Finance Tracker

A full-stack expense tracker application built with the PERN stack (PostgreSQL, Express, React, Node.js) featuring JWT authentication, transaction management, and interactive charts.

![Dashboard Preview](./screenshots/dashboard.png)

## Features

- **🔐 Authentication**: Secure user registration and login with JWT tokens
- **💰 Transaction Management**: Full CRUD for income and expenses
- **📊 Dashboard**: Visual overview with balance summary and expense breakdown
- **📈 Charts**: Interactive pie chart showing expenses by category (Recharts)
- **🏷️ Categories**: Pre-defined categories for income and expenses with icons
- **🔍 Filtering**: Filter transactions by type and search by description

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, React Router |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens), bcryptjs |

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/smartwallet.git
cd smartwallet
```

### 2. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE smartwallet;
```

### 3. Configure environment variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/smartwallet?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### 4. Install dependencies and run migrations

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 5. Start the application

```bash
# Terminal 1 - Backend (http://localhost:3000)
cd backend
node index.js

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

## Project Structure

```
smartwallet/
├── backend/
│   ├── index.js              # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── src/
│       ├── middleware/
│       │   └── auth.js       # JWT authentication middleware
│       └── routes/
│           ├── auth.js       # Register, login, me endpoints
│           ├── categories.js # Category management
│           └── transactions.js # Transaction CRUD
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx  # Authentication state
│       ├── services/
│       │   └── api.js           # Axios API client
│       └── pages/
│           ├── Dashboard.jsx    # Main dashboard
│           ├── Login.jsx        # Login page
│           ├── Register.jsx     # Registration page
│           ├── Transactions.jsx # Transaction list
│           └── TransactionForm.jsx # Add/Edit form
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new user account |
| POST | `/auth/login` | Login and receive JWT token |
| GET | `/auth/me` | Get current user info |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all categories |
| POST | `/categories/seed` | Create default categories |

### Transactions (Requires Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List user's transactions |
| GET | `/transactions/summary` | Get balance and statistics |
| GET | `/transactions/:id` | Get single transaction |
| POST | `/transactions` | Create new transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |

## Database Schema

```
User (1) ──────< Transaction >────── (1) Category
```

- **User**: id, email, password (hashed), name, timestamps
- **Category**: id, name, type (income/expense), icon, color
- **Transaction**: id, amount, description, type, date, userId, categoryId

## Screenshots

### Login Page
![Login](./screenshots/login.png)

### Dashboard with Charts
![Dashboard](./screenshots/dashboard.png)

### Transaction List
![Transactions](./screenshots/transactions.png)

### Add Transaction
![Add Transaction](./screenshots/add-transaction.png)

## Development

```bash
# Run Prisma Studio (database GUI)
cd backend && npx prisma studio

# Create new migration after schema changes
cd backend && npx prisma migrate dev --name migration_name

# Build frontend for production
cd frontend && npm run build
```

## License

MIT
