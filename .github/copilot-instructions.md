# SmartWallet - Copilot Instructions

## Project Overview

SmartWallet is a PERN-stack expense tracker with a **monorepo structure**:
- `frontend/` - React + Vite + TailwindCSS SPA
- `backend/` - Express API with Prisma ORM
- Database: PostgreSQL (Supabase/Neon hosted)

## Architecture & Data Flow

```
React Frontend (Vite) → Express API → Prisma ORM → PostgreSQL
     :5173                :3000
```

### Data Models ([backend/prisma/schema.prisma](../backend/prisma/schema.prisma))
- **User**: `id`, `email` (unique), `name`, has many `Expense`
- **Expense**: `id`, `amount`, `description`, `createdAt`, belongs to `User` via `authorId`

## Developer Workflows

### Running the Project
```bash
# Frontend (runs on localhost:5173)
cd frontend && npm install && npm run dev

# Backend (runs on localhost:3000)
cd backend && npm install && npm run dev
```

### Database Commands
```bash
cd backend
npx prisma generate      # Generate Prisma Client after schema changes
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Visual database browser
```

### Environment Setup
Backend requires `DATABASE_URL` environment variable pointing to PostgreSQL instance.

## Code Patterns

### Backend API Pattern ([backend/index.js](../backend/index.js))
- Express with `express.json()` middleware
- Prisma Client instantiated at module level
- Routes use async/await with Prisma queries directly in handlers

```javascript
app.post('/resource', async (req, res) => {
  const result = await prisma.model.create({ data: req.body });
  res.json(result);
});
```

### Frontend Patterns
- Functional components with TailwindCSS utility classes
- ESM imports (`"type": "module"` in package.json)
- Styling via `@tailwind` directives in [frontend/src/index.css](../frontend/src/index.css)

## Key Conventions

1. **IDs**: Use `cuid()` for all model primary keys (see Prisma schema)
2. **Timestamps**: Include `createdAt`/`updatedAt` on data models
3. **Styling**: TailwindCSS utilities only - no separate CSS files per component
4. **API Port**: Backend runs on `:3000`, Frontend dev server on `:5173`

## Planned Features (per README)
- Authentication system
- Charts for spending visualization
- Monthly/yearly expense reports
