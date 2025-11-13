# AGENTS Handbook

## Purpose
This guide documents the architecture, directory structure, conventions, and collaboration rules for humans and AI agents working in the HUIT Social Credits repository. Use it to understand how the system is composed, how modules connect, and how to extend the project without breaking established contracts.

## System Architecture Overview
- **Style:** Two-tier client–server monolith with a shared domain model around student activities and social credits.
- **Client:** React 18 + Vite SPA. Routing handled by React Router; state fetched with TanStack Query, auth kept in a Zustand store. UI relies on Ant Design, MUI primitives, and custom components.
- **Server:** Express 5 app exposing REST endpoints under `/api`. Business logic grouped in feature controllers. Prisma ORM mediates access to a PostgreSQL database defined in `prisma/schema.prisma`.
- **Data & Storage:** PostgreSQL for transactional data. Supabase Storage (via service role key) keeps rich media (attendance photos, feedback proofs, activity covers).
- **Authentication:** JWT-based access tokens issued by the backend. Refresh tokens are stored in HTTP-only cookies scoped to `/api/auth`.
- **Data Flow:** React views call `client/src/utils/http.js` (Axios) → Express routes (`server/index.js`) → Controllers → Prisma services → Database and Supabase as needed → Responses transformed back to DTOs consumed by React pages.

### Technology Stack
| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite, React Router, TanStack Query, Zustand, Ant Design, MUI, Emotion, Recharts, Swiper |
| Backend | Node.js, Express 5, Prisma Client, bcrypt, JWT, Yup validation, Nodemailer |
| Database | PostgreSQL (Prisma migrations) |
| Storage & Integrations | Supabase Storage, SMTP mailer |
| Tooling | ESLint + Prettier (frontend), Nodemon, dotenv, Vite PWA plugin |
| Deployment | Vercel (see `server/vercel.json`), environment via `.env`/platform secrets |

## Repository Map
```
HUIT-Social-Credits/
├── README.md                    # Quickstart setup
├── AGENTS.md                    # This collaboration guide
├── client/                      # React SPA (Vite)
│   ├── package.json             # FE scripts & dependencies
│   ├── vite.config.js           # Vite & PWA setup
│   ├── public/                  # Static assets (favicons, manifest)
│   └── src/
│       ├── App.jsx              # Router + providers
│       ├── main.jsx             # React root bootstrap
│       ├── api/                 # Axios wrappers per backend feature
│       ├── admin/               # Admin layouts, contexts, and pages
│       ├── user/                # Student-facing layouts & pages
│       ├── components/          # Shared UI widgets, guards, forms
│       ├── pages/               # Standalone screens (e.g., landing)
│       ├── routes/              # Route configuration tables
│       ├── layouts/             # Generic layout shells
│       ├── hooks/               # Custom React hooks
│       ├── stores/              # Zustand stores (auth)
│       ├── utils/               # Formatting, HTTP, sanitizer helpers
│       ├── services/            # External service helpers (Supabase upload)
│       └── config/              # Route constants, Supabase client
└── server/                      # Express + Prisma backend
    ├── index.js                 # Express app bootstrap & router wiring
    ├── package.json             # BE scripts & dependencies
    ├── prisma/
    │   ├── schema.prisma        # PostgreSQL schema & enums
    │   └── migrations/          # Generated migrations (keep consistent)
    ├── src/
    │   ├── env.js               # Environment loader & defaults
    │   ├── prisma.js            # Prisma client singleton (generated)
    │   ├── generated/           # Prisma client output (do NOT edit)
    │   ├── controllers/         # Feature logic (auth, activities, stats…)
    │   ├── routes/              # Express routers per feature
    │   ├── middlewares/         # Auth & error handling middleware
    │   ├── utils/               # Helpers (JWT, attendance, Supabase)
    │   ├── seed.js              # Data seeding helpers
    │   └── ...                  # Additional domain utilities
    └── vercel.json              # Deployment configuration
```

## Key Modules & Features
| Module | Path | Responsibility | Entry Point(s) |
| --- | --- | --- | --- |
| Authentication API | `server/src/controllers/auth.controller.js` | Login, refresh token rotation, password reset OTP | `server/src/routes/auth.routes.js`, `/api/auth/*`
| Activity Lifecycle | `server/src/controllers/activity.controller.js` | CRUD for activities, registrations, attendance, feedback submission | `server/src/routes/activity.routes.js`
| Academic Catalog | `server/src/controllers/academic.controller.js` | Read-only endpoints for departments, semesters, credit groupings | `server/src/routes/academic.routes.js`
| Notifications | `server/src/controllers/notification.controller.js` | User notifications CRUD/read state | `server/src/routes/notification.routes.js`
| Statistics & Points | `server/src/controllers/stats.controller.js`, `server/src/utils/points.js` | Aggregate user scores, leaderboards, reports | `server/src/routes/stats.routes.js`
| User Management | `server/src/controllers/user.controller.js` | Admin CRUD for users, roles, activation | `server/src/routes/user.routes.js`
| System Settings | `server/src/controllers/system.controller.js` | Manage semesters, attendance methods, general configuration | `server/src/routes/system.routes.js`
| Feedback Moderation | `server/src/controllers/feedback.controller.js` | Review, approve, or reject feedback with media evidence | `server/src/routes/feedback.routes.js`
| Client Auth Flow | `client/src/stores/useAuthStore.js`, `client/src/utils/http.js` | Persist access token, handle refresh, attach Authorization header | Initialized in `client/src/App.jsx`
| Client Activity Experience | `client/src/api/activities.api.js`, `client/src/components/CardActivity`, `client/src/user/pages/*` | Fetch and render activity lists, details, registration dialogs | Routed via `client/src/routes/userRoutes.jsx`
| Admin Dashboard | `client/src/admin/pages/*`, `client/src/admin/layouts/AdminLayout` | Admin CRUD, scoring, approval workflows | Nested under `/admin` routes in `client/src/App.jsx`

## AI Agent Roles
### Common Ground Rules
- Always read `README.md`, relevant environment templates, and feature docs before editing.
- Do not change public REST contracts, GraphQL schemas, or database enums without explicit approval.
- Preserve Prisma-generated files (`server/src/generated`) and migration history integrity.
- Follow existing naming conventions and leave TODO comments with context if deferring work.
- Prefer feature branches named `feature/<short-desc>` or `fix/<short-desc>`; commit messages should be imperative (e.g., “Add attendance export API”).

### Documentation Agent
- **Scope:** Markdown/docs (`README.md`, `AGENTS.md`, `client/README.md`), inline comments when clarifying behavior.
- **Responsibilities:** Update setup instructions, architecture notes, ADRs, docstrings.
- **Forbidden:** No changes to `src/` code, Prisma schema, or configuration files affecting runtime.
- **Style:** Markdown in English, concise sections, code blocks with language tags.

### Refactor Agent
- **Scope:** Application logic in `client/src/**` and `server/src/**` (excluding `generated/`).
- **Responsibilities:** Improve code structure, modularity, performance, or readability while keeping behavior intact.
- **Forbidden:** Do not alter API response shapes, route paths, Prisma models, or migrations unless the task explicitly requests it. Avoid touching deployment config without sign-off.
- **Style:** Frontend must pass ESLint/Prettier (`npm run lint`, `npm run prettier:fix`); backend should keep 2-space indentation, double quotes, and async/await patterns. Favor pure functions and descriptive naming.

### Test Agent
- **Scope:** Test scaffolding (`client/src/**/__tests__`, future `tests/` dirs), CI scripts, mock data under `client/src/__mocks__` or `server/tests` when created.
- **Responsibilities:** Add unit/integration/E2E tests, configure tooling (Vitest, Jest, Supertest, etc.), maintain coverage docs.
- **Forbidden:** No production code changes except for minimal seams (e.g., dependency injection) agreed beforehand. Do not modify Prisma schema or migrations.
- **Style:** Co-locate tests near source when possible, use descriptive test names, prefer Arrange/Act/Assert commenting.

### Security Review Agent
- **Scope:** Audit changes across `server/src`, `client/src/utils/http.js`, authentication, authorization, and configuration files.
- **Responsibilities:** Identify vulnerabilities, suggest mitigations, harden headers, validation, and secrets handling.
- **Forbidden:** Must not introduce breaking changes or refactor large areas; submit issues or targeted patches only. Never commit credentials.
- **Style:** Provide clear rationales in comments/PR summaries. Follow existing validation patterns (Yup, Prisma constraints).

### UI/UX Agent
- **Scope:** Frontend presentation layers (`client/src/components`, `client/src/admin/pages`, `client/src/user/pages`, styling in `client/src/index.css` or component styles).
- **Responsibilities:** Implement new UI features, adjust layouts, ensure accessibility, manage translations/labels.
- **Forbidden:** Do not modify backend, Prisma schema, or core data fetching logic (`client/src/utils/http.js`) unless coordinating with Refactor Agent. Avoid inline styles unless necessary.
- **Style:** Use Ant Design/MUI tokens when available, keep components PascalCase, prefer CSS modules/Sass or styled components already in use. Ensure responsive breakpoints remain intact.

## Coding & Naming Conventions
- **Formatting:** 2-space indentation across JS/JSX. Frontend formatting enforced by Prettier; run `npm run prettier:fix`. Backend should mirror existing style (double quotes, semicolons, trailing commas where logical).
- **Linting:** Frontend uses ESLint (`npm run lint`). Backend currently lacks a linter—maintain consistent code style manually.
- **Naming:**
  - React components, pages, and layouts: PascalCase (`ActivitiesDetailPage`).
  - Hooks: `useX` prefix (`useAuthStore`).
  - Zustand stores: `use<Name>Store.js` returning selectors.
  - Express controllers: `<feature>.controller.js`; routes: `<feature>.routes.js` with RESTful verbs; middlewares: `<name>.middleware.js`.
  - Prisma models/enums follow PascalCase Vietnamese domain terms (e.g., `NguoiDung`, `TrangThaiDangKy`). Column names use camelCase.
  - API endpoints grouped by resource (`/api/activities/:id/registrations`). Keep response objects flat and localized text in Vietnamese as needed.
- **Internationalization:** Static copy currently Vietnamese; introduce translation keys only if adding i18n support. Avoid hardcoding new English strings unless necessary.
- **Error Handling:** Backend should return JSON with `{ error: "message" }` or structured payloads; use `errorHandler` middleware for uncaught errors. Frontend should use shared notification/toast components.
- **Logging:** Use `console` sparingly; prefer contextual logging during development. Avoid logging secrets or large payloads.

## Testing & Quality Gates
- **Frontend:**
  - Install deps: `cd client && npm install`.
  - Lint & format: `npm run lint`, `npm run prettier`.
  - Build sanity check: `npm run build`.
  - (Future) Place component tests alongside components or in `__tests__` folders and run with configured test runner once added.
- **Backend:**
  - Install deps: `cd server && npm install`.
  - Sync Prisma: `npx prisma generate` (before running dev/build).
  - Database migrations: `npm run build` (deploy migrations) or `npx prisma migrate dev --name <desc>` when altering schema.
  - Start dev server: `npm run dev` (nodemon) or `npm run start`.
  - Add integration tests under `server/tests` (to be created) using Supertest/Jest; ensure they seed/teardown DB safely.
- **Expectations:** Any change impacting business logic, API contracts, or UI flows should include or update relevant tests/lint checks. Always run affected commands locally before pushing.

## Safe Extension & Refactor Guidelines
- **Before Changing Code:** Review `README.md`, environment variables in `server/src/env.js`, existing controllers/routes, and Prisma models that touch your feature. Confirm Supabase buckets/constants in `env` if working with media.
- **Adding a New Backend Feature:**
  1. Create a controller under `server/src/controllers/<feature>.controller.js` with pure functions using Prisma.
  2. Define a router in `server/src/routes/<feature>.routes.js` and mount it in `server/index.js` under `/api/<feature>`.
  3. Add validation or helper utilities in `server/src/utils` if shared. Update `middlewares` when new auth requirements arise.
  4. Update Prisma schema (`prisma/schema.prisma`) if new tables/fields needed; run `npx prisma migrate dev --name <change>` and regenerate client.
- **Adding a New Frontend Feature:**
  1. Create API wrapper in `client/src/api/<feature>.api.js` calling the new endpoint.
  2. Add hooks/state in `client/src/hooks` or `stores` as appropriate.
  3. Implement UI in `client/src/components` or relevant page folders (`admin/pages`, `user/pages`).
  4. Register routes in `client/src/routes/*.jsx` and wire them in `App.jsx`.
  5. Leverage existing shared components (modals, forms) before creating new ones.
- **Refactor Checklist:**
  - Identify impacted controllers, routes, and React pages; search with `rg` instead of `grep -R`.
  - Update associated docs/tests simultaneously.
  - Validate Prisma changes (`npx prisma format`, `npx prisma generate`).
  - Run `client` lint/build and `server` dev/build commands to ensure no regressions.
  - Confirm Supabase utilities handle new buckets/paths if media workflows change.
- **Deployment Considerations:** Keep `.env` keys synchronized across environments. Do not commit actual secrets. Update `vercel.json` only with deployment owner approval.

Use this handbook as the authoritative reference whenever you plan, implement, or review changes in the HUIT Social Credits codebase.
