# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun dev          # Start dev server
bun build        # Production build
bun lint         # ESLint

# Drizzle ORM
bunx drizzle-kit generate   # Generate migration from schema changes
bunx drizzle-kit push       # Push schema directly to DB (dev only)
bunx drizzle-kit studio     # Open Drizzle Studio GUI
```

Requires `DATABASE_URL` in `.env`.

## Architecture

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind CSS 4 · shadcn/ui · Drizzle ORM · PostgreSQL · Better Auth · Zod · React Hook Form

### Path aliases (tsconfig.json)

| Alias           | Resolves to      |
| --------------- | ---------------- |
| `@db/*`         | `./db/*`         |
| `@lib/*`        | `./lib/*`        |
| `@components/*` | `./components/*` |

### Directory layout

- **`app/`** — Next.js App Router. Route groups: `(auth)` for login/register pages. Auth API handled at `app/api/auth/[...all]/route.ts` via `toNextJsHandler(auth)`.
- **`db/`** — Database layer. `db/index.ts` exports the Drizzle client (`db`) using a pg `Pool`. All table definitions live in `db/schemas/`, exported through `db/schemas/index.ts`. Migrations output to `db/migrations/`.
- **`lib/`** — Shared logic. `lib/auth.ts` is the Better Auth server instance; `lib/auth-client.ts` exports `authClient` for client components. `lib/schemas/` holds Zod schemas for form validation.
- **`components/`** — Shared React components. `components/ui/` contains shadcn/ui primitives.

### Database schema overview

All primary keys use `cuid2` (`@paralleldrive/cuid2`) via `$defaultFn`. Core entities and their relationships:

```
user
 ├── financial_accounts  (type: debit | credit | savings | cash | investment)
 │    └── transactions   (type: income | expense | transfer; status: pending | completed | cancelled)
 │    └── recurring_transactions  (frequency: daily | weekly | monthly | yearly)
 │         └── recurring_transaction_executions
 │    └── monthly_account_snapshots
 ├── transaction_categories
 └── [Better Auth tables: session, account, verification]
```

`transferGroupId` on `transactions` links the two legs of a transfer.

### Auth

Better Auth is configured with email/password in `lib/auth.ts`, using the Drizzle adapter pointed at the pg pool. The server instance is consumed by the catch-all API route. Client components call `authClient` from `lib/auth-client.ts`.

### UI

shadcn/ui is configured with style `radix-lyra`, icon library `lucide`, and CSS variables. Add components with `bunx shadcn add <component>`. The `cn()` utility is at `@lib/utils`. Icons come from `lucide-react`.
