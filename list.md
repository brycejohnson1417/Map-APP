Here is the prioritized list of top refactoring opportunities based on code size, coupling, and complexity.

### 1. Decouple `fraternitees` Tenant Logic from Core Domain and UI
- **Current Problem:** Tenant-specific logic for "Fraternitees" is hardcoded throughout the core application. For example, `lib/domain/runtime.ts` has a specific `fraterniteesLeadScore` type, `app/accounts/[accountId]/page.tsx` checks if `orgSlug === "fraternitees"`, and `lib/application/runtime/territory-service.ts` directly imports `gradeFraterniteesLead`. This violates the open/closed principle and prevents easily adding new tenants without modifying core files.
- **Proposed Change:** Implement a plugin or strategy pattern for tenant extensions. The core domain should use a generic `TenantExtension` or `Metadata` field. Create a tenant resolution service that dynamically injects tenant-specific behavior (like lead scoring or UI badging) based on the `orgSlug`.
- **Risk:** High. This touches core domain models and many frontend components that rely on the data. Requires thorough testing of account pages and territory views.
- **Files Touched:** `lib/domain/runtime.ts`, `app/accounts/[accountId]/page.tsx`, `lib/application/runtime/account-service.ts`, `lib/application/runtime/territory-service.ts`, `lib/application/runtime/plugin-settings.ts`, and multiple `components/*`.

### 2. Extract Business Logic from API Routes (e.g., Printavo Sync)
- **Current Problem:** `app/api/tenants/fraternitees/printavo/sync/route.ts` is 341 lines and contains complex domain logic for data syncing, backfilling, cursor management, and calling external APIs. API routes should only handle HTTP concerns.
- **Proposed Change:** Move the sync orchestration and cursor management logic into a dedicated service class or function (e.g., `PrintavoSyncService` in `lib/application/fraternitees/`). The API route should simply parse the request, call the service, and format the response.
- **Risk:** Low/Medium. The logic itself doesn't need to change, just its location. It relies heavily on Supabase calls, so testing the extracted service might require mocks, but it makes the code much cleaner and testable.
- **Files Touched:** `app/api/tenants/fraternitees/printavo/sync/route.ts`, creating a new file like `lib/application/fraternitees/printavo-sync-service.ts`.

### 3. Decompose the `TerritoryWorkspace` Monolith Component
- **Current Problem:** `components/territory/territory-workspace.tsx` is an massive 1,600+ line component. It handles map initialization (Google Maps and Leaflet), data fetching, caching, complex UI state (filters, sidebars, modals), and rendering massive DOM trees. It's too complex to maintain or test effectively.
- **Proposed Change:**
  1. Extract map provider logic (Google vs Leaflet) into custom hooks (e.g., `useGoogleMap`, `useLeafletMap`).
  2. Extract data fetching and state management into a generic custom hook (e.g., `useTerritoryData`).
  3. Break the UI down into smaller components: `TerritorySidebar`, `TerritoryFilters`, `TerritoryMap`, and `TerritoryPinDetails`.
- **Risk:** High. React state changes in a component this large are very prone to regressions, especially with complex third-party map libraries depending on DOM refs.
- **Files Touched:** Mostly `components/territory/territory-workspace.tsx` (splitting it into 4-6 new files in a `components/territory/workspace/` folder).

### 4. Decompose the `FraterniteesWorkspace` Component
- **Current Problem:** Similar to TerritoryWorkspace, `components/fraternitees/fraternitees-portal.tsx` is nearly 900 lines long. It handles everything from API polling and live syncing to rendering complex preview tables, settings toggles, and state transitions.
- **Proposed Change:** Extract sub-components like `PrintavoSyncPanel`, `LiveScorePreviewTable`, and `PluginSettingsList`. Move the complex polling and sync logic into custom hooks.
- **Risk:** Medium. Less risky than the map component because it doesn't involve complex third-party DOM mutations, but it still manages a lot of asynchronous state.
- **Files Touched:** `components/fraternitees/fraternitees-portal.tsx` and creating new files in `components/fraternitees/`.

### 5. Refactor `ppp-savings-service.ts` God Service
- **Current Problem:** `lib/application/runtime/ppp-savings-service.ts` is almost 1,100 lines long. It mixes external API communication (Nabis), local database queries, complex business rules (pricing calculations, discount logic), and UI/Presentation logic (generating HTML emails).
- **Proposed Change:**
  1. Extract HTML email generation into a template layer or separate file (`ppp-email-generator.ts`).
  2. Extract Nabis API calls into a dedicated adapter `NabisClient`.
  3. Keep the core pricing math in the service, or move it to a pure domain service `PppPricingCalculator`.
- **Risk:** Medium. Extracting HTML and API clients is low risk, but modifying the pricing/discount calculation code requires high caution as it likely impacts financial reporting.
- **Files Touched:** `lib/application/runtime/ppp-savings-service.ts`, creating 2-3 new focused files.

### 6. Standardize Database Access via Repositories
- **Current Problem:** Files like `lib/application/fraternitees/runtime-import-service.ts` and various API routes instantiate their own Supabase clients (`getSupabaseAdminClient() as any`) and perform direct SQL-like queries scattered throughout business logic. This makes caching, testing, and schema changes very difficult.
- **Proposed Change:** Create a clear Repository layer (e.g., `AccountRepository`, `OrderRepository`) in `lib/infrastructure/supabase/`. Update services to depend on these repositories rather than interacting with the Supabase client directly.
- **Risk:** Medium. It touches many files, but the changes are mostly structural (moving queries into functions).
- **Files Touched:** Widespread across `lib/application/` and `app/api/`.
