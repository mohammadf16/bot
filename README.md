# Car Platform (Frontend + Backend)

A full-stack car platform with a Next.js frontend and a Fastify backend.

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Fastify 5, TypeScript, MySQL, JWT, Zod
- Runtime: Node.js 20+

## Project Structure

```text
car/
  backend/     # API server
  frontend/    # Next.js app
  reports/     # generated reports/artifacts
  scripts/     # utility scripts
```

## Prerequisites

- Node.js >= 20
- npm
- MySQL (for backend)

## Quick Start

1) Install dependencies:

```bash
npm --prefix backend install
npm --prefix frontend install
```

2) Configure environment:

- Backend env: `backend/.env`
- Frontend env: `frontend/.env.local` (or based on `frontend/.env.example`)

3) Run backend:

```bash
npm --prefix backend run dev
```

4) Run frontend:

```bash
npm --prefix frontend run dev
```

Frontend default: `http://localhost:3000`

## Useful Commands

### Backend

```bash
npm --prefix backend run build
npm --prefix backend run start
npm --prefix backend run test
```

### Frontend

```bash
npm --prefix frontend run build
npm --prefix frontend run start
npm --prefix frontend run lint
```

## Deployment Notes

- See [VPS_DEPLOY.md](./VPS_DEPLOY.md) for VPS deployment steps.
- See `ecosystem.config.cjs` for PM2 process configuration.

## Notes

- Generated files (`.next`, `out`, logs, zip artifacts, test artifacts) should not be committed.
- Keep secrets only in local env files, never in git.
