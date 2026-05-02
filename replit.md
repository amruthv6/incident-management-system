# Incident Management System (OpsCenter)

## Overview

A professional Incident and Employee Management System built for IT operations and infrastructure support teams. Provides real-time tracking of incidents, employee records, and an operations dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: MongoDB + Mongoose
- **Validation**: Zod (`zod/v4`) + Orval-generated schemas
- **Frontend**: React + Vite + TanStack Query + Wouter + Tailwind CSS + shadcn/ui
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables Required

- `MONGODB_URI` — MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/ims-db`)
- `SESSION_SECRET` — Session secret (already configured)

## Seed Data

Once `MONGODB_URI` is set, run the seed script to populate example data:
```
MONGODB_URI=<your-uri> npx ts-node scripts/src/seed.ts
```

## Architecture

```
artifacts/
  api-server/          # Express 5 API server with MongoDB/Mongoose
    src/
      models/          # Mongoose models (Employee, Incident)
      routes/          # REST API routes (employees, incidents, dashboard)
      middlewares/     # requireMongo middleware
      lib/             # MongoDB connection, logger
  ims-app/             # React + Vite frontend
    src/
      pages/           # Dashboard, IncidentList, IncidentDetail, EmployeeList, EmployeeDetail
      components/      # Layout (Sidebar, AppLayout), UI (PriorityBadge, StatusBadge)

lib/
  api-spec/            # OpenAPI spec (source of truth)
  api-client-react/    # Generated React Query hooks
  api-zod/             # Generated Zod validation schemas
```

## Features

- Employee record management (CRUD)
- Incident/ticket creation and tracking
- Priority classification (Low, Medium, High, Critical)
- Incident status lifecycle: Open → Investigating → Resolved
- Incident history logs with timeline
- Dashboard with real-time stats, charts (priority/status breakdown), recent incidents
- Search and filtering (by status, priority, department)
- Responsive operations-focused UI (steel blue theme)

## API Routes

```
GET    /api/healthz
GET    /api/employees          ?search=&department=&role=
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id

GET    /api/incidents          ?search=&status=&priority=&assignedTo=&page=&limit=
POST   /api/incidents
GET    /api/incidents/:id
PUT    /api/incidents/:id
DELETE /api/incidents/:id
PATCH  /api/incidents/:id/status
GET    /api/incidents/:id/logs
POST   /api/incidents/:id/logs

GET    /api/dashboard/stats
GET    /api/dashboard/recent-incidents
GET    /api/dashboard/priority-breakdown
GET    /api/dashboard/status-breakdown
```

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
