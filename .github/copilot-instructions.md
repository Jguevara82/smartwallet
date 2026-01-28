# SmartWallet - Copilot Instructions

> This file provides context for AI coding assistants working on this project.

## Project Overview

SmartWallet is a **PERN-stack personal finance tracker** with a monorepo structure:

- `frontend/` - React + Vite + TailwindCSS SPA with Recharts
- `backend/` - Express API with Prisma ORM + JWT Authentication
- Database: PostgreSQL (via Docker or local installation)

## Architecture & Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│   Express API   │────▶│   PostgreSQL    │
│    (Vite)       │     │   (Prisma ORM)  │     │   (Database)    │
│   :5173         │     │     :3000       │     │     :5432       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   AuthContext              JWT Middleware
   (localStorage)          (Bearer token)
```

### Authentication Flow

1. User registers/logs in → Backend returns JWT token
2. Frontend stores token in `localStorage`
3. All API requests include `Authorization: Bearer <token>` header
4. Backend `authMiddleware` validates token and extracts `userId`

### Data Models (backend/prisma/schema.prisma)

| Model | Description |
|-------|-------------|
| **User** | id, email (unique), password (hashed), name, timestamps |
| **Category** | id, name, type (income\|expense), icon, color |
| **Transaction** | id, amount, description, type, date → User, Category |
| **Budget** | id, amount, period, alertThreshold → User, Category |
| **RecurringTransaction** | id, amount, frequency, nextDate, isActive → User, Category |

## Project Structure

```
smartwallet/
├── backend/
│   ├── index.js                    # Express app entry point
│   ├── package.json                # Dependencies & scripts
│   ├── .env.example                # Environment template
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.js                 # Category seeder
│   └── src/
│       ├── middleware/
│       │   └── auth.js             # JWT verification
│       └── routes/
│           ├── auth.js             # Register, login, me
│           ├── categories.js       # Category CRUD + seed
│           ├── transactions.js     # Transaction CRUD + summary
│           ├── budgets.js          # Budget CRUD + alerts
│           └── recurring.js        # Recurring CRUD + process
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx                # App entry point
│       ├── App.jsx                 # Router + auth wrapper
│       ├── context/
│       │   └── AuthContext.jsx     # Auth state management
│       ├── services/
│       │   └── api.js              # Axios client + interceptors
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx       # Overview + charts + alerts
│           ├── Transactions.jsx    # List with filters
│           ├── TransactionForm.jsx # Add/edit form
│           ├── Budgets.jsx         # Budget management
│           └── Recurring.jsx       # Recurring transactions
│
├── docker-compose.yml              # PostgreSQL container
├── .gitignore
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

## Development Workflows

### Running the Project

```bash
# Option 1: With Docker (recommended)
docker-compose up -d                    # Start PostgreSQL
cd backend && cp .env.example .env      # Create env file
cd backend && npm install && npm run setup
cd frontend && npm install
cd backend && npm run dev               # Terminal 1
cd frontend && npm run dev              # Terminal 2

# Option 2: Local PostgreSQL
psql -U postgres -c "CREATE DATABASE smartwallet"
# Then follow steps above
```

### Database Commands

```bash
cd backend
npm run db:generate   # Generate Prisma Client
npm run db:migrate    # Create and apply migrations
npm run db:push       # Push schema without migration
npm run db:studio     # Visual database browser
npm run db:seed       # Seed default categories
```

### Environment Variables

Backend `.env` (from `.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartwallet"
JWT_SECRET="your-secure-random-string"
PORT=3000
```

## Code Patterns

### Backend Route Pattern

```javascript
// Protected route with auth middleware
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await prisma.model.findMany({
      where: { userId: req.user.userId },  // Filter by authenticated user
      include: { category: true },
    });
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
```

### Frontend API Pattern

```javascript
// services/api.js - Axios with auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Usage in components
const response = await transactionsAPI.getAll();
setTransactions(response.data);
```

### Frontend Component Pattern

```jsx
// Protected route wrapper in App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## API Endpoints

### Auth (public)
- `POST /auth/register` - Create user, return token
- `POST /auth/login` - Validate credentials, return token
- `GET /auth/me` - Get current user (requires token)

### Categories (public)
- `GET /categories?type=expense|income` - List categories
- `POST /categories/seed` - Create default categories

### Transactions (protected)
- `GET /transactions` - List user's transactions
- `GET /transactions/summary` - Balance, totals, by-category
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Budgets (protected)
- `GET /budgets` - List with spending status
- `GET /budgets/alerts` - Get exceeded thresholds
- `POST /budgets` - Create budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

### Recurring (protected)
- `GET /recurring` - List recurring transactions
- `GET /recurring/upcoming` - Due in next 30 days
- `POST /recurring` - Create recurring
- `PUT /recurring/:id` - Update recurring
- `DELETE /recurring/:id` - Delete recurring
- `POST /recurring/process` - Generate due transactions
- `POST /recurring/:id/skip` - Skip next occurrence

## Key Conventions

1. **IDs**: Use `cuid()` for all model primary keys
2. **Passwords**: Hash with bcryptjs (10 salt rounds)
3. **JWT**: 7-day expiration, contains `userId` and `email`
4. **API Responses**: Return JSON, errors use `{ error: "message" }`
5. **Styling**: TailwindCSS utilities only - no separate CSS files
6. **Icons**: Use lucide-react for UI, emoji for categories
7. **Charts**: Recharts for data visualization
8. **Forms**: Controlled components with useState
9. **Routing**: React Router v7 with protected routes

## Budget System

### How It Works
1. User sets budget per expense category (e.g., $500/month for Food)
2. System calculates current spending automatically
3. Progress bar shows usage (green → yellow → red)
4. Alerts when spending reaches `alertThreshold` (default 80%)

### Status Values
- `ok` (green): Under threshold
- `warning` (yellow): Above threshold, under limit
- `exceeded` (red): Over budget

## Recurring Transactions System

### How It Works
1. User creates template (amount, category, frequency)
2. `nextDate` tracks when transaction should occur
3. `POST /recurring/process` generates actual transactions
4. System updates `nextDate` based on frequency

### Frequency Values
- `daily`, `weekly`, `biweekly`, `monthly`, `yearly`

### Actions
- **Process**: Generate transactions for due items
- **Skip**: Advance `nextDate` without creating transaction
- **Pause/Resume**: Toggle `isActive`

## Security Notes

- Never commit `.env` files (use `.env.example` as template)
- JWT secrets should be 64+ random characters in production
- All user data is filtered by `userId` in queries
- Passwords are hashed before storage
- Frontend handles 401 by clearing auth and redirecting
