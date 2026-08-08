# ClearLoop Frontend

Next.js App Router · TypeScript · Tailwind · TanStack Query

## Structure
- `app/` — routes. Dashboard pages under `app/dashboard/`
- `lib/api/` — API functions, one file per resource, all through `lib/api/client.ts`
- `lib/hooks/` — TanStack Query hooks wrapping the api functions
- `components/ui/` — shadcn primitives

## Conventions
- New resource = a file in `lib/api/` + a hook in `lib/hooks/`. Never fetch directly in components.
- Auth state comes from `lib/contexts/AuthContext.tsx`, protected pages wrap in `ProtectedRoute`
- Server errors surface to the user — no silent catch

## Backend
NestJS at `clearloop-backend`. Invitations API is in `src/invitations/`.