# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```text
apollo/
├── src/app/                 # Next App Router pages, route handlers, layout, and server actions
├── src/features/            # Feature-scoped UI components and small feature-local helpers
├── src/lib/                 # Shared schemas, Apollo integration, env parsing, and persistence code
├── data/                    # JSON persistence files created at runtime
├── .planning/               # GSD roadmap, state, phases, and generated codebase docs
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript config with `@/*` path alias
├── eslint.config.mjs        # ESLint flat config
└── package.json             # Scripts and dependency manifest
```

## Directory Purposes

**`src/app`:**
- Purpose: Hold route entry points and framework-owned files.
- Contains: `src/app/layout.tsx`, `src/app/page.tsx`, search workflow routes under `src/app/search`, compatibility redirects under `src/app/recipes/*`, API routes under `src/app/api/*`, and server actions in `src/app/recipes/actions.ts`
- Key files: `src/app/search/page.tsx`, `src/app/recipes/actions.ts`, `src/app/api/company-search/route.ts`

**`src/features`:**
- Purpose: Group UI by workflow area instead of by generic component type.
- Contains: Feature folders for `company-search`, `people-search`, `recipes`, `run-planning`, and `usage`
- Key files: `src/features/company-search/components/company-results-workspace.tsx`, `src/features/recipes/components/recipe-editor.tsx`, `src/features/run-planning/components/run-plan-panel.tsx`

**`src/lib`:**
- Purpose: Hold cross-feature code that should remain independent from page composition.
- Contains: Apollo search clients in `src/lib/apollo`, request and entity schemas in `src/lib/company-search`, `src/lib/people-search`, and `src/lib/recipes`, environment parsing in `src/lib/env.ts`, and file-backed repositories in `src/lib/db/repositories`
- Key files: `src/lib/apollo/company-search.ts`, `src/lib/apollo/people-search.ts`, `src/lib/db/repositories/recipes.ts`, `src/lib/env.ts`

**`src/lib/db/repositories`:**
- Purpose: Encapsulate all reads and writes to local JSON persistence files.
- Contains: Record modules for recipes, company snapshots, people snapshots, and run plans
- Key files: `src/lib/db/repositories/recipes.ts`, `src/lib/db/repositories/company-snapshots.ts`, `src/lib/db/repositories/people-snapshots.ts`, `src/lib/db/repositories/run-plans.ts`

**`src/lib/db/schema`:**
- Purpose: Store persistence-related types and partial future database schema definitions.
- Contains: Type aliases in `src/lib/db/schema/people-snapshots.ts` and `src/lib/db/schema/run-plans.ts`, plus currently unused Drizzle table declarations in `src/lib/db/schema/recipes.ts` and `src/lib/db/schema/company-snapshots.ts`
- Key files: `src/lib/db/schema/run-plans.ts`, `src/lib/db/schema/people-snapshots.ts`

**`data`:**
- Purpose: Runtime persistence location for JSON-backed state.
- Contains: Files created by repository modules such as `recipes.json`, `company-snapshots.json`, `people-snapshots.json`, and `run-plans.json`
- Key files: `data/.gitkeep`

**`.planning`:**
- Purpose: GSD workflow artifacts and generated planning context.
- Contains: Roadmap, phase folders, research notes, and generated codebase docs
- Key files: `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/codebase/ARCHITECTURE.md`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Redirects `/` to `/search`
- `src/app/layout.tsx`: Defines the root HTML shell and global stylesheet import
- `src/app/search/page.tsx`: Main operational workspace
- `src/app/search/company/page.tsx`: Company workflow with inline recipe editing and snapshot operations
- `src/app/search/people/page.tsx`: People workflow with inline recipe editing, imports, and saved people snapshots
- `src/app/recipes/company/page.tsx`: Compatibility redirect into `/search/company`
- `src/app/recipes/people/page.tsx`: Compatibility redirect into `/search/people`

**Configuration:**
- `package.json`: Runtime and lint/typecheck scripts
- `tsconfig.json`: Strict TypeScript config and `@/*` alias
- `next.config.ts`: Next.js app config
- `eslint.config.mjs`: ESLint flat configuration
- `src/lib/env.ts`: Validated environment variable access

**Core Logic:**
- `src/app/recipes/actions.ts`: Central mutation entry point for forms
- `src/lib/apollo/company-search.ts`: Company search integration and fixture/live branching
- `src/lib/apollo/people-search.ts`: People search integration and fixture/live branching
- `src/lib/db/repositories/recipes.ts`: Recipe persistence and legacy payload normalization
- `src/lib/db/repositories/company-snapshots.ts`: Company snapshot persistence and reuse lookup
- `src/lib/db/repositories/people-snapshots.ts`: People snapshot persistence for paired context
- `src/lib/db/repositories/run-plans.ts`: Run-plan persistence and readiness promotion

**Testing:**
- Not detected. No test directories, test files, or test runner config are present in the current tree.

## Naming Conventions

**Files:**
- Route entry files use Next.js conventions: `page.tsx`, `layout.tsx`, and `route.ts` under `src/app`
- React components use kebab-case file names with descriptive suffixes, for example `src/features/company-search/components/company-search-panel.tsx`
- Shared modules also use kebab-case names, for example `src/lib/apollo/company-filter-definitions.ts` and `src/features/run-planning/lib/run-plan-estimates.ts`

**Directories:**
- App routes mirror URL structure under `src/app`, for example `src/app/recipes/company`
- Primary user-facing workflow routes now live under `src/app/search/*`; `src/app/recipes/*` remains only as redirect compatibility shims
- Feature directories are domain-oriented under `src/features/<feature-name>`
- Shared code directories are capability-oriented under `src/lib/<capability>`

## Where to Add New Code

**New Feature:**
- Primary code: Create a new folder under `src/features/<feature-name>/` with `components/` for UI and `lib/` only if the helper is feature-specific.
- Route composition: Add or update the relevant page in `src/app/*` to load data and render the new feature surface.
- Shared server/domain logic: Put Apollo-facing or cross-feature logic in `src/lib/*`, not inside `src/features/*`.
- Tests: Not established. If tests are introduced, keep them close to the feature or module they cover and document the convention first.

**New Component/Module:**
- Implementation: Place workflow-specific components in the closest feature folder, for example `src/features/company-search/components/` or `src/features/recipes/components/`.
- Client interactivity: Mark the file with `"use client"` only when local React state or event handlers are actually needed, following `src/features/company-search/components/company-results-workspace.tsx` and `src/features/people-search/components/people-search-panel.tsx`.

**Utilities:**
- Shared helpers: Put schema parsing, environment access, repository logic, and Apollo request helpers under `src/lib/`.
- Feature-local helpers: Put them in `src/features/<feature-name>/lib/` when they only support one workflow, following `src/features/recipes/lib/recipe-form.ts` and `src/features/company-search/lib/company-search-warnings.ts`.

## Special Directories

**`src/app/api`:**
- Purpose: HTTP entry points for JSON consumers
- Generated: No
- Committed: Yes

**`src/lib/db/schema`:**
- Purpose: Persistence schema/types staging area
- Generated: No
- Committed: Yes

**`data`:**
- Purpose: Local runtime storage for JSON-backed records
- Generated: Partially; repository modules create files on demand
- Committed: Only `data/.gitkeep` is committed in the current tree

**`.next`:**
- Purpose: Next.js build output and caches
- Generated: Yes
- Committed: No

**`.planning/codebase`:**
- Purpose: Generated architecture, stack, convention, and concern reference docs for later GSD phases
- Generated: Yes
- Committed: Yes

---

*Structure analysis: 2026-03-23*
