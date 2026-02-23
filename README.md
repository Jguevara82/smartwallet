# SmartWallet 💰

A full-stack personal finance tracker built with the **PERN stack** (PostgreSQL, Express, React, Node.js). Track your income, expenses, set budgets, and manage recurring transactions with a beautiful, modern UI.

[![CI](https://github.com/Jguevara82/smartwallet/actions/workflows/ci.yml/badge.svg)](https://github.com/Jguevara82/smartwallet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://smartwallet-five-ruby.vercel.app)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)

## ✨ Features

- **🔐 Secure Authentication** - JWT-based auth with password hashing (bcrypt)
- **💰 Transaction Management** - Full CRUD for income and expenses
- **� Advanced Search & Filters** - Server-side search, filter by type/category/date/amount, sorting, and pagination
- **�📊 Visual Dashboard** - Balance overview with interactive charts (Recharts)
- **📅 Recurring Transactions** - Automate bills, subscriptions, salary tracking
- **🎯 Budget Management** - Set spending limits with visual alerts
- **🏷️ Smart Categories** - Pre-defined categories with icons and colors
- **📱 Responsive Design** - Works on desktop and mobile (TailwindCSS)

## 🎬 Demo

![Dashboard](images/dashboard.png)
![Transactions](images/transactions.png)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, React Router, Axios |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT, bcryptjs |

## 📋 Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14+ (or Docker)
- **npm** or **yarn**

## 🚀 Quick Start

### Option A: With Docker (Recommended)

The easiest way to get started - Docker handles the database for you.

```bash
# 1. Clone the repository
git clone https://github.com/Jguevara82/smartwallet.git
cd smartwallet

# 2. Start PostgreSQL with Docker
docker-compose up -d

# 3. Setup backend
cd backend
cp .env.example .env
npm install
npm run setup

# 4. Setup frontend (new terminal)
cd frontend
npm install

# 5. Start both servers
# Terminal 1 (backend):
cd backend && npm run dev

# Terminal 2 (frontend):
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

### Option B: With Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# 1. Clone the repository
git clone https://github.com/Jguevara82/smartwallet.git
cd smartwallet

# 2. Create database
psql -U postgres
CREATE DATABASE smartwallet;
\q

# 3. Setup backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run setup

# 4. Seed categories (optional)
npm run db:seed

# 5. Setup frontend (new terminal)
cd frontend
npm install

# 6. Start servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/smartwallet` |
| `JWT_SECRET` | Secret key for JWT tokens | Use a random 64+ character string |
| `PORT` | API server port | `3000` |

**⚠️ Security Warning**: Never commit `.env` files! Generate a secure JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Deployment

### Frontend (Vercel)

1. Import the repository into Vercel
2. Set **Root Directory** to `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL (e.g. `https://smartwallet-api.up.railway.app`) |

### Backend (Railway)

1. Import the repository into Railway
2. Set **Root Directory** to `backend`
3. Start Command: `npm start`
4. Add environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides this) |
| `JWT_SECRET` | Random 64+ character string |
| `PORT` | `3000` |
| `FRONTEND_URL` | Your Vercel domain (comma-separated for multiple) |

## ✅ CI/CD

GitHub Actions CI runs frontend tests/build and backend Prisma generation on every push/PR to `main`.

See: [.github/workflows/ci.yml](.github/workflows/ci.yml)

## 📁 Project Structure

```
smartwallet/
├── backend/                 # Express API
│   ├── src/
│   │   ├── middleware/      # Auth middleware
│   │   └── routes/          # API routes
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Category seeder
│   └── index.js             # Server entry point
│
├── frontend/                # React SPA
│   └── src/
│       ├── context/         # Auth context
│       ├── pages/           # Page components
│       └── services/        # API client
│
├── docker-compose.yml       # PostgreSQL container
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new user |
| POST | `/auth/login` | Login, get token |
| GET | `/auth/me` | Get current user |

### Transactions (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List transactions (with search, filters, sorting & pagination) |
| GET | `/transactions/summary` | Get balance & stats |
| POST | `/transactions` | Create transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |

#### Query Parameters for `GET /transactions`

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Case-insensitive search on description |
| `type` | string | Filter by `income` or `expense` |
| `categoryId` | string | Filter by category ID |
| `startDate` | string | Start of date range (ISO date) |
| `endDate` | string | End of date range (ISO date) |
| `minAmount` | number | Minimum transaction amount |
| `maxAmount` | number | Maximum transaction amount |
| `sortBy` | string | Sort field: `date` (default), `amount`, `createdAt` |
| `sortOrder` | string | `asc` or `desc` (default) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

Response format:
```json
{
  "data": [ { ...transaction } ],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

### Budgets (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/budgets` | List budgets with status |
| GET | `/budgets/alerts` | Get over-budget alerts |
| POST | `/budgets` | Create budget |
| PUT | `/budgets/:id` | Update budget |
| DELETE | `/budgets/:id` | Delete budget |

### Recurring (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recurring` | List recurring transactions |
| GET | `/recurring/upcoming` | Next 30 days |
| POST | `/recurring` | Create recurring |
| POST | `/recurring/process` | Generate due transactions |
| POST | `/recurring/:id/skip` | Skip next occurrence |

### Categories
| Method | Endpoint | Description |
|----------|-------------|---------|
| GET | `/categories` | List all categories |
| POST | `/categories/seed` | Create default categories |

## 🗃️ Database Schema

```
User ──┬── Transaction ──── Category
       ├── Budget ────────── Category
       └── RecurringTransaction ── Category
```

**Models:**
- **User**: Authentication and ownership
- **Category**: Transaction classification (income/expense)
- **Transaction**: Individual income/expense records
- **Budget**: Spending limits per category
- **RecurringTransaction**: Automated transaction templates

## 🧪 Development

### Useful Commands

```bash
# Backend
npm run dev          # Start with watch mode
npm run db:studio    # Open Prisma Studio (GUI)
npm run db:migrate   # Create migration
npm run db:seed      # Seed categories

# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Database Migrations

After modifying `prisma/schema.prisma`:

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Recharts](https://recharts.org/) - Composable charting library
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons

---

Made with ❤️
