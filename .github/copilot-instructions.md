# SmartWallet - Copilot Instructions

## Project Overview

SmartWallet is a PERN-stack personal finance tracker with a **monorepo structure**:
- `frontend/` - React + Vite + TailwindCSS SPA with Recharts
- `backend/` - Express API with Prisma ORM + JWT Authentication
- Database: PostgreSQL (local or cloud hosted)

## Architecture & Data Flow

```
React Frontend (Vite) → Express API → Prisma ORM → PostgreSQL
     :5173                :3000
        ↓                    ↓
   AuthContext          JWT Middleware
   (localStorage)       (Bearer token)
```

### Authentication Flow
1. User registers/logs in → Backend returns JWT token
2. Frontend stores token in `localStorage`
3. All API requests include `Authorization: Bearer <token>` header
4. Backend `authMiddleware` validates token and extracts `userId`

### Data Models ([backend/prisma/schema.prisma](../backend/prisma/schema.prisma))
- **User**: `id`, `email` (unique), `password` (hashed), `name`, has many `Transaction`
- **Category**: `id`, `name`, `type` (income|expense), `icon`, `color`
- **Transaction**: `id`, `amount`, `description`, `type`, `date`, belongs to `User` and `Category`

## Developer Workflows

### Running the Project
```bash
# Backend (runs on localhost:3000)
cd backend && npm install && npm run dev

# Frontend (runs on localhost:5173)
cd frontend && npm install && npm run dev
```

### Database Commands
```bash
cd backend
npx prisma generate      # Generate Prisma Client after schema changes
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Visual database browser
```

### Environment Setup
Backend `.env` requires:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smartwallet"
JWT_SECRET="your-secret-key"
PORT=3000
```

## Code Patterns

### Backend Structure
```
backend/
├── index.js                 # Express app entry point
├── src/
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   └── routes/
│       ├── auth.js          # POST /auth/register, /auth/login, GET /auth/me
│       ├── categories.js    # GET /categories, POST /categories/seed
│       └── transactions.js  # Full CRUD with auth protection
```

### API Pattern
```javascript
// Protected route example (backend/src/routes/transactions.js)
router.use(authMiddleware);  // All routes require auth
router.get('/', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.userId },  // Filter by authenticated user
    include: { category: true },
  });
  res.json(transactions);
});
```

### Frontend Structure
```
frontend/src/
├── context/
│   └── AuthContext.jsx      # Auth state, login/logout/register functions
├── services/
│   └── api.js               # Axios instance with auth interceptor
└── pages/
    ├── Login.jsx            # Login form
    ├── Register.jsx         # Registration form
    ├── Dashboard.jsx        # Summary cards + Pie chart (Recharts)
    ├── Transactions.jsx     # Transaction list with filters
    └── TransactionForm.jsx  # Add/Edit transaction form
```

### Frontend Patterns
```javascript
// API calls with auth (frontend/src/services/api.js)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Protected routes (frontend/src/App.jsx)
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

## Key Conventions

1. **IDs**: Use `cuid()` for all model primary keys
2. **Passwords**: Hash with bcryptjs (10 salt rounds)
3. **JWT**: 7-day expiration, contains `userId` and `email`
4. **API Responses**: Return JSON objects, errors have `{ error: "message" }`
5. **Styling**: TailwindCSS utilities only - no separate CSS files
6. **Icons**: Use lucide-react for UI icons, emoji for category icons
7. **Charts**: Recharts for data visualization

## API Endpoints

### Auth (no token required)
- `POST /auth/register` - Create user, returns token
- `POST /auth/login` - Validate credentials, returns token
- `GET /auth/me` - Get current user (requires token)

### Categories (no token required)
- `GET /categories?type=expense|income` - List categories
- `POST /categories/seed` - Create default categories

### Transactions (token required)
- `GET /transactions` - List user's transactions
- `GET /transactions/summary` - Balance, totals, expenses by category
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- Charts for spending visualization
- Monthly/yearly expense reports
