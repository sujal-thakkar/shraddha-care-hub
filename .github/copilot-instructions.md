# Copilot Instructions — Shraddha Care Hub

## Project Overview

NGO web platform (React SPA) for elder welfare — public-facing pages + admin dashboard backed by Supabase. Deployed to Vercel at `shraddha.hosla.in`.

### Lovable Platform

This project is primarily built and managed in [Lovable](https://lovable.dev). Local edits are for tweaks and nuanced changes only. Be aware:
- **Do NOT edit auto-generated files:** `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts` — Lovable regenerates these
- **Do NOT modify** the `lovable-tagger` plugin in `vite.config.ts`
- Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and secrets (Resend API key, `SUPABASE_SERVICE_ROLE_KEY`) are configured in Lovable's platform — they are not in the local `.env` and agents should not prompt for them
- When adding new pages/routes, follow the existing lazy-load pattern in `src/App.tsx` so Lovable stays compatible

## Architecture

- **Frontend:** React 18 + TypeScript + Vite (SWC) + Tailwind CSS + shadcn/ui (Radix) + Aceternity UI
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage + RLS)
- **State:** TanStack React Query v5 for server state; `useState` for local/form state
- **Routing:** React Router DOM v6 with lazy-loaded routes in `src/App.tsx`

### Key directories

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level page components (default exports, lazy-loaded) |
| `src/pages/admin/` | Admin dashboard pages behind auth guard in `Dashboard.tsx` |
| `src/components/ui/` | shadcn/ui + Aceternity UI primitives (see below) |
| `src/components/{feature}/` | Feature-grouped components (e.g., `home/`, `donate/`, `layout/`) |
| `src/integrations/supabase/` | **Auto-generated** `client.ts` and `types.ts` — do NOT edit manually |
| `src/hooks/` | Custom hooks (`.tsx` extension by convention, even without JSX) |
| `src/lib/` | Utilities — `cn()` in `utils.ts`, rate limiting in `rate-limit.ts` |
| `supabase/functions/` | Deno-based Edge Functions (email via Resend API) |
| `supabase/migrations/` | SQL migration files for schema changes |

## Commands

```sh
npm run dev        # Start dev server on port 8080
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest (run once)
npm run test:watch # Vitest (watch mode)
```

## Code Conventions

### Exports & Imports
- **Pages** use `export default function PageName()` (required for lazy loading)
- **Components** use named exports: `export function MyComponent()`
- Import alias: `@/` maps to `src/` — always use `@/components/...`, `@/hooks/...`, etc.
- Import order: React → react-router → utilities (`cn`) → shadcn/ui → lucide icons → framer-motion → local components → assets → hooks

### UI Components
- **shadcn/ui:** Add new primitives via `npx shadcn-ui@latest add <name>`
- **Aceternity UI:** Registry configured in `components.json` — add components via `npx shadcn@latest add "https://ui.aceternity.com/registry/<name>.json"`. Existing Aceternity components include `3d-card.tsx`, `layout-text-flip.tsx`, `text-flip.tsx` in `src/components/ui/`
- Prefer using existing UI components before adding new ones

### Styling
- Tailwind utility classes only — no CSS modules or styled-components
- Use `cn()` from `@/lib/utils` for conditional class merging
- Theme colors via HSL CSS variables: `text-primary`, `bg-background`, `border-border`, etc.
- Responsive: mobile-first with `md:` and `lg:` breakpoints
- Headings often use `font-serif`; body uses default sans

### Data Fetching (TanStack React Query)
```tsx
// Read — useQuery with supabase
const { data, isLoading } = useQuery({
  queryKey: ["table-name"],
  queryFn: async () => {
    const { data, error } = await supabase.from("table").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as TypeName[];
  },
});

// Write — useMutation + invalidation
const mutation = useMutation({
  mutationFn: async (values) => {
    const { error } = await supabase.from("table").insert(values);
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["table-name"] }),
});
```

### Form Submissions
- Forms use `useState` for form data + `isSubmitting` boolean
- Rate limiting: call `checkRateLimit(email, tableName)` from `@/lib/rate-limit` before inserts
- Toasts via `useToast()` from `@/hooks/use-toast`:
  - Success: `toast({ title: "...", description: "..." })`
  - Error: `toast({ title: "Error", description: "...", variant: "destructive" })`
- Loading indicator: `<Loader2 className="animate-spin" />` from lucide-react
- Always wrap submit logic in `try/catch/finally` with `setIsSubmitting(false)` in `finally`

### Custom Hooks
- Accept a single options object with defaults; return a named object (not a tuple)
- Use `IntersectionObserver` for scroll-triggered behavior; always clean up in `useEffect`
- See `src/hooks/use-scroll-animation.tsx` as the canonical example

### Edge Functions (Supabase)
- Deno runtime with URL imports (`https://deno.land/std@...`, `https://esm.sh/...`)
- Pattern: `serve(async (req) => {...})` with CORS headers constant
- Create service-role client inside each function via `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`
- Anti-spam: verify the referenced record exists and was created within last 5 minutes
- Return `new Response(JSON.stringify({...}), { headers: {...corsHeaders, "Content-Type": "application/json"} })`

### Admin Pages
- Auth guard in `Dashboard.tsx` checks session + `supabase.rpc("is_admin")`
- CRUD pages follow consistent pattern: `useQuery` for list, `useMutation` for updates/deletes
- Filter bar with search `Input` + status `Select`, client-side `.filter()` on query data
- Detail/edit views in `Dialog` components; delete with `confirm()` dialog
- Status badges use color maps: `Record<Status, string>` → Tailwind class

## TypeScript
- Strict mode is OFF (`"strict": false` in tsconfig) — don't rely on strict null checks
- Database types are auto-generated in `src/integrations/supabase/types.ts`
- Components often define local interfaces rather than importing from the types file

## Testing
- Vitest + jsdom + @testing-library/react — test files go in `src/` co-located or `src/test/`
- Globals enabled (`describe`/`it`/`expect` available without import)
- Coverage is minimal — add tests for new complex logic
