# Tenet Coding Standards

**File:** `coding-standards.md`  
**Purpose:** Define how all Tenet code must be written so the system is consistent, maintainable, and safe for Codex and human engineers.

---

## 1. Languages & Frameworks

- Backend / API: **TypeScript** (strict) with Next.js (App Router) and Node.
- Frontend: **TypeScript + React** (Next.js App Router) with Tailwind CSS and shadcn/ui.
- Shared logic: TypeScript in `packages/core` and `packages/types`.
- Styling: Tailwind utility classes; no custom CSS unless necessary.
- Database: SQL (Postgres via Supabase).

---

## 2. TypeScript Rules

- `strict: true` in `tsconfig.json`
- No `any` unless explicitly documented and unavoidable.
- All functions should have explicit return types for exported functions.
- Avoid `null` when possible; prefer `undefined`.

---

## 3. Project Structure

Follow `architecture.md`, but in general:

- `apps/web` – Next.js app (routes, pages, UI shells).
- `packages/core` – core logic (routing-engine, AI, SOPs, integrations).
- `packages/ui` – shared UI components.
- `packages/types` – shared types, Zod schemas.

No “god files.” Keep files focused and cohesive.

---

## 4. Imports & Modules

- Use **absolute imports** based on tsconfig paths where configured.
- Group imports: external libs, then internal modules.
- No circular dependencies.

Example ordering:

```ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

import { TenetRequest } from '@/packages/types/routing'
import { getOrgFromToken } from '@/packages/core/auth'
