# AGENTS.md

## Big picture
- SPA entry is `src/main.jsx` -> `src/App.jsx`; providers are composed there (`ThemeProvider`, `AuthProvider`, React Query, router).
- Routing is generated from `src/pages.config.js` and wrapped by `src/Layout.jsx` (navigation, language, global UX).
- Backend boundary is Supabase: JS client in `src/lib/supabaseClient.js`, edge functions/migrations in `src/supabase/`.

## Routing and page registration
- Add new screens in `src/pages/`; expected route shape is `/<PageName>` (via `src/pages.config.js` + `src/App.jsx`).
- `src/pages.config.js` is marked auto-generated; only change `mainPage` manually. Pages auto-register when added to `src/pages/` directory.
- Access control is centralized in `src/App.jsx`: public pages list (`Home`, `Listings`, `ListingDetail`, `AgentAvailability`, `Compare`, `Profile`) bypass `AuthGuard`; all other pages are protected.
- `AuthGuard` wraps unauthenticated users → check `useAuth()` hook to access current user or redirect to login.
- Build links with `createPageUrl("PageName")` from `@/utils/index.ts` (replaces spaces with hyphens in URL).

## Data flow and service boundaries
- Use `api` from `src/api/apiClient.js` in UI code; avoid scattering raw Supabase calls.
- `Listing` uses dedicated functions (`listingList`, `listingGet`, `listingCreate`, etc.), while most entities use generic `entityCrud` proxies (e.g., `api.entities.Favorites.filter(...)`, `api.entities.Appointments.create(...)`).
- Normalize incoming data via `normalizeProfile()` → map server fieldnames to compatibility aliases (`account_type` → `role`, `language_preference` → `lang`).
- Auth/user shape is normalized in `src/lib/AuthContext.jsx` and `apiClient` with fallback to `buildFallbackUser()` if profile table missing.
- Legacy sort/query names are translated in `apiClient` (for example `-created_date` → `-created_at`).
- Entity CRUD proxy pattern: `api.entities.EntityName.filter(filters, sort, limit)`, `.get(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)` — reduces boilerplate.
- Upload to Supabase: use `uploadToSupabase()` helper from `src/lib/uploadToSupabase.js` for consistent storage path and public signing.

## Project-specific conventions
- Prefer alias imports with `@/` (configured in `vite.config.js`, `jsconfig.json`).
- Most pages follow `useEffect` + local state fetch patterns (see `src/pages/Listings.jsx`), not broad React Query hook usage.
- Preserve compatibility fields (`role`, `lang`, `is_verified`) when editing profile/auth flows.
- Language changes are dual-write: `LanguageContext` updates localStorage key `dari_lang` and calls `api.auth.updateMe({ lang })` for profile sync (see `src/components/LanguageContext.jsx`).
- URL filter state is managed via utilities: `decodeFiltersFromUrl`, `pushFilterStateToUrl`, `encodeFiltersToUrl` in `src/utils/urlFilterState.js` — enables bookmarkable, shareable filter states (see `src/pages/Listings.jsx`).
- Arabic/RTL: language `"ar"` sets `document.documentElement.dir="rtl"` and `document.documentElement.lang="ar"` automatically.
- Use `useLang()` hook from `LanguageContext` to access current language, not direct Supabase calls.
- Components use Radix UI primitives (dialog, select, sheet, accordion, etc.) from `src/components/ui/`; check existing patterns before adding new UI elements.
- Responsive breakpoint: `768px` (Tailwind's `md`). Use `useIsMobile()` hook from `@/hooks/use-mobile` for runtime checks.

## Agent engineering mindset
- Operate as a domain expert: real-estate flows (listing lifecycle, verification, appointments, messaging) should stay consistent across UI, edge functions, and DB assumptions.
- Think in edge cases first: unauthenticated users, missing profile rows, stale JWT claims, partial Supabase failures, and language/RTL fallbacks must degrade safely.
- Optimize for scalability: reuse the `api` boundary and existing proxies/functions instead of adding one-off Supabase access in page components.
- Optimize for maintainability: prefer small composable helpers, preserve existing compatibility aliases, and avoid breaking route/auth conventions.
- Apply framework best practices in-context: keep React state predictable, side effects isolated, and route protection/page registration aligned with `src/App.jsx` and `src/pages.config.js`.
- Leverage proven patterns from broad engineering experience, but adapt to this repository's established architecture before introducing new abstractions.

## Workflows that matter
- Frontend: `npm install`, `npm run dev`, `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`.
- Testing: `npm run test` (single run) or `npm run test:watch` (interactive mode) with Vitest; scoped to `src/components/**` and `src/pages/**`.
- Lint/typecheck are intentionally scoped (`eslint.config.js`, `jsconfig.json` include/exclude), so excluded folders (`src/api/**`, `src/lib/**`, `src/components/ui/**`) need manual attention.
- Supabase local loop from `src/docs/LOCAL_DEVELOPMENT.md`: `supabase start`, `supabase db reset`, `supabase functions serve`.
- Environment setup: Create `src/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for local development.
- React Query defaults: retry=1, refetchOnWindowFocus=false (see `src/lib/query-client.js`); rarely needed for pages since most data is fetched directly via `api`.

## Component organization and patterns
- UI components live in `src/components/ui/` (Radix primitives + Tailwind); generally not linted to allow external code imports.
- Feature components organized in subdirectories: `src/components/listing/`, `src/components/messages/`, `src/components/appointments/`, `src/components/filters/`, `src/components/admin/`, etc.
- Specialized manager components: `PushNotificationManager`, `PushAlertManager` (handles push subscriptions), `NotificationSettings`, `OnboardingModal` (shown to new users without `first_name`).
- Config-driven components: `src/components/listing.config.jsx`, `src/components/price.config.jsx`, `src/components/propertyTypes.jsx` define shared data shapes and translations.
- Dark mode: Use Tailwind's `dark:` prefix (enabled via next-themes). Colors respect theme context set in `src/lib/ThemeContext.jsx`.

## Integrations and deployment
- Push notifications span frontend managers and `send-push-notification` edge function.
- Listing approval triggers social/watermark flows (`src/docs/EDGE_FUNCTIONS.md`, `src/supabase/functions/social-media-post`, `src/supabase/functions/watermark-listing-media`).
- Admin rights depend on JWT claim `role` derived from `profiles.account_type` (`src/docs/ADMIN_SETUP.md`).
- Deployment is split: frontend via Base44 publish, backend via Supabase CLI (`src/docs/DEPLOYMENT.md`).
