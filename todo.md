# DRY Refactor Plan

1. [x] Add shared API handler helper to remove repeated try/catch scaffolding in `app/api/*` routes (start with simple GET endpoints).
2. [x] Centralize domain interfaces/constants (course + stream names, data shapes) for reuse across pages/components.
3. [x] Extract common page header + data fetching logic into shared hooks/components for dashboard-like pages.
4. [x] Create formatting utilities (status badges, stream badges, RU date helpers) and replace duplicated logic in tables/dialogs.
5. [x] Introduce DB query helper (wrapping `pool.connect`) and migrate read-only queries in `lib/queries.ts`.
