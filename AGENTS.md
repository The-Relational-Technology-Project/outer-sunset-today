# Project conventions

- Keep cross-source event identity and market-wide celebration consolidation in the shared event-identity helper used by all ingestion paths and admin duplicate review, so fixes apply to both new imports and existing rows.
- Normalize incoming event identity before storing it and fail closed when duplicate lookup fails, so publisher addresses and lookup failures do not create extra listings.
- Run identity regression tests with `bun test supabase/functions/_shared/event-identity.test.ts`.
- Only freshly parsed official iCal records with matching source URL, date, and title may overwrite existing event times; AI and aggregator imports remain fill-only to prevent guessed time changes.
- Public menu and news feeds share validation and Neighborhood API serialization in `_shared/public-feed*` and use anonymous read credentials with explicit field selection to preserve read policies and avoid exposing private data.