# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**
- Use lowercase kebab-case for feature, route, and utility files such as `src/features/company-search/components/company-search-panel.tsx`, `src/features/run-planning/lib/run-plan-estimates.ts`, and `src/app/api/company-search/route.ts`.
- Use pluralized file names for repository and schema modules when they model collections, such as `src/lib/db/repositories/recipes.ts` and `src/lib/db/schema/run-plans.ts`.
- Reserve `page.tsx`, `layout.tsx`, `route.ts`, and `actions.ts` for Next.js entrypoints in `src/app/`.

**Functions:**
- Use camelCase for functions and server actions, such as `saveRecipeAction` in `src/app/recipes/actions.ts`, `buildRunPlanEstimate` in `src/features/run-planning/lib/run-plan-estimates.ts`, and `createCompanySearchSignature` in `src/lib/apollo/company-search.ts`.
- Use `get*`, `list*`, `create*`, `update*`, `save*`, and `mark*` prefixes to make data-access intent explicit, as seen in `src/lib/db/repositories/recipes.ts` and `src/lib/db/repositories/run-plans.ts`.
- Use small local helper names for parsing and normalization, such as `splitLines`, `getMultiValueEntries`, and `normalizeToken` in `src/features/recipes/lib/recipe-form.ts` and `src/features/recipes/components/multi-value-input.tsx`.

**Variables:**
- Use descriptive camelCase names for parsed inputs and intermediate state, such as `existingSnapshot`, `selectedCompanyRecipe`, `activePeopleSnapshot`, and `requestPayload` in `src/app/api/company-search/route.ts`, `src/app/search/page.tsx`, and `src/lib/apollo/company-search.ts`.
- Use `raw*`, `parsed`, and `normalized` to distinguish untrusted input from validated data, following `src/lib/env.ts`, `src/lib/db/repositories/recipes.ts`, and `src/lib/apollo/company-search.ts`.

**Types:**
- Use PascalCase for exported types and props, such as `CompanySearchPayload`, `RunPlanEstimate`, `ApolloUsageSummary`, and `RecipeEditorProps` in `src/lib/company-search/schema.ts`, `src/features/run-planning/lib/run-plan-estimates.ts`, `src/features/usage/lib/apollo-usage.ts`, and `src/features/recipes/components/recipe-editor.tsx`.
- Suffix prop objects with `Props`, such as `CompanySearchPanelProps` in `src/features/company-search/components/company-search-panel.tsx` and `SearchPageProps` in `src/app/search/page.tsx`.
- Use `type` aliases instead of `interface` throughout the current codebase.

## Code Style

**Formatting:**
- Use Prettier-compatible formatting; `eslint-config-prettier` is included in `eslint.config.mjs`, and the source consistently uses double quotes, trailing commas, and semicolons.
- Prefer multiline wrapping once statements become long, especially import lists, ternaries, and object literals, as shown in `src/app/recipes/actions.ts` and `src/lib/apollo/company-search.ts`.
- Keep JSX attributes one-per-line when the element becomes dense, as in `src/features/recipes/components/recipe-editor.tsx`.

**Linting:**
- Use the flat ESLint config in `eslint.config.mjs`.
- Apply `@eslint/js` recommended rules plus Next.js Core Web Vitals and Next.js TypeScript configs from `eslint-config-next`.
- Respect global ignores in `eslint.config.mjs` for `.next/**`, `node_modules/**`, `dist/**`, `coverage/**`, and `next-env.d.ts`.

## Import Organization

**Order:**
1. Node built-ins first, such as `node:crypto` and `node:fs/promises` in `src/lib/db/repositories/recipes.ts` and `src/lib/apollo/company-search.ts`.
2. Third-party packages next, such as `next/server`, `next/navigation`, `react`, `zod`, and `drizzle-orm/pg-core` in `src/app/api/company-search/route.ts`, `src/app/recipes/actions.ts`, `src/features/recipes/components/multi-value-input.tsx`, and `src/lib/db/schema/recipes.ts`.
3. Internal `@/` imports last, usually grouped by domain, as seen throughout `src/app/search/page.tsx` and `src/features/recipes/components/recipe-editor.tsx`.

**Path Aliases:**
- Use the `@/*` alias from `tsconfig.json` for internal imports. Current code does not use long relative import chains.

## Error Handling

**Patterns:**
- Validate external and persisted input with Zod at module boundaries using `.parse(...)` when invalid input should fail fast, as in `src/app/api/company-search/route.ts`, `src/app/api/people-search/route.ts`, `src/features/recipes/lib/recipe-form.ts`, and `src/lib/apollo/company-search.ts`.
- Use `.safeParse(...)` only when the code intentionally branches on validation success, as in `src/lib/env.ts` and `src/lib/db/repositories/recipes.ts`.
- Throw plain `Error` instances with explicit operator-facing messages for invalid state, such as missing IDs or mismatched recipe types in `src/app/recipes/actions.ts`.
- Catch narrow filesystem and network failure cases close to the boundary and either return a fallback or rethrow, as in `src/lib/db/repositories/recipes.ts` and `src/features/usage/lib/apollo-usage.ts`.

## Logging

**Framework:** None

**Patterns:**
- Do not add `console` logging by default. No `console.*` calls are present under `src/`.
- Surface operational state through return values and UI messages instead, such as fallback status objects in `src/features/usage/lib/apollo-usage.ts` and warning arrays in `src/lib/apollo/company-search.ts`.

## Comments

**When to Comment:**
- Keep comments sparse. The current codebase relies on descriptive naming and structured sections rather than inline commentary.
- Add a short comment only when a normalization or compatibility branch is not obvious. Existing files currently avoid comments even in parsing-heavy code like `src/lib/db/repositories/recipes.ts`.

**JSDoc/TSDoc:**
- Not used in the current codebase. Prefer clear type aliases and function names over block documentation.

## Function Design

**Size:**
- Keep leaf helpers small and focused, as in `getSingleParam` in `src/app/search/page.tsx` and `normalizeToken` in `src/features/recipes/components/multi-value-input.tsx`.
- Allow orchestration functions to stay longer when they own a full request or form workflow, such as `runPeopleSearchAction` in `src/app/recipes/actions.ts` and `searchCompanies` in `src/lib/apollo/company-search.ts`.

**Parameters:**
- Accept typed domain objects instead of loose dictionaries where possible, such as `payload: CompanySearchPayload` in `src/lib/apollo/company-search.ts`.
- Use discriminated unions or overloads when behavior differs by type, as in `RecipeEditorProps` in `src/features/recipes/components/recipe-editor.tsx` and the overloaded `parseRecipeFormData` signatures in `src/features/recipes/lib/recipe-form.ts`.

**Return Values:**
- Return structured objects rather than tuples or mixed primitives, as in `ApolloUsageSummary` from `src/features/usage/lib/apollo-usage.ts` and `CompanySearchResult` from `src/lib/apollo/company-search.ts`.
- Use `null` for missing records in read paths, such as `getRecipeById` in `src/lib/db/repositories/recipes.ts`, instead of throwing for normal absence.

## Module Design

**Exports:** 
- Prefer named exports for functions, schemas, and types across the repo. No default exports are used in library modules; Next.js entry files keep the required default page export in `src/app/search/page.tsx` and `src/app/page.tsx`.
- Co-locate types with the module that owns them, such as result types in `src/lib/apollo/company-search.ts` and props in component files like `src/features/company-search/components/company-search-panel.tsx`.

**Barrel Files:**
- Not used. Import from the concrete module path instead of adding index barrels.

## React and Next.js Patterns

- Mark client components explicitly with `"use client"` only where hooks or DOM event handling are required, such as `src/features/recipes/components/multi-value-input.tsx`, `src/features/company-search/components/company-results-workspace.tsx`, and `src/features/people-search/components/people-search-panel.tsx`.
- Keep server components and route handlers free of client-only APIs. Data loading in `src/app/search/page.tsx` and JSON APIs in `src/app/api/*/route.ts` stay server-side.
- Put server actions in `src/app/recipes/actions.ts` under a top-level `"use server"` directive and have forms call them directly via the `action` prop from components like `src/features/company-search/components/company-search-panel.tsx` and `src/features/recipes/components/recipe-editor.tsx`.

## Data and Validation Patterns

- Define Zod schemas alongside the domain they validate, such as `src/lib/company-search/schema.ts`, `src/lib/people-search/schema.ts`, and `src/lib/recipes/schema.ts`.
- Infer TypeScript types from Zod schemas using `z.infer`, as in `src/lib/company-search/schema.ts`.
- Normalize external API payloads into app-owned result shapes before returning them, as in `normalizeCompany` and `getFixtureResult` in `src/lib/apollo/company-search.ts`.
- Keep persistence adapters in `src/lib/db/repositories/*.ts`; these modules handle serialization, backward-compat normalization, and sorting, as seen in `src/lib/db/repositories/recipes.ts`.

---

*Convention analysis: 2026-03-23*
