# DLD Phase 1B — directory integration and hardening

Status: complete for local/static scope. Stopped before any database connection, production write, commit, push, deployment, Phase 2, transaction, rent or yield work.

## Built

- Hardened the two additive Phase 1A migrations for deterministic/resumable staging, serialized atomic publication, transactional rollback, safe curated bridges, private canonical/search storage, security-barrier public views, bounded public search and verified-only related context.
- Added public-only TypeScript models, normalization and URL contracts, server-side search/detail functions, pagination/type filtering, exact-number priority, and safe unavailable/not-found/empty states.
- Added restrained directory index/list/detail pages and registered the list pages for metadata/sitemap generation.
- Added sanitized fixtures and tests for English, Arabic, every requested number type, pagination, privacy, unmatched links, one-language records and unavailable Supabase.
- Documented the supported Lovable Cloud review, migration, staging and atomic publication path.

## Routes

- `/directory`
- `/directory/developers` and `/directory/developers/$slug`
- `/directory/projects` and `/directory/projects/$slug`
- `/directory/brokers` and `/directory/brokers/$id`
- `/directory/offices` and `/directory/offices/$id`
- `/directory/licences`
- `/directory/permits`
- `/directory/valuators`
- `/directory/escrow-agents`

## Data functions and public surfaces

- `searchDirectoryFn` validates and invokes the server-only search implementation.
- `getDirectoryRecordFn` validates and invokes the server-only detail lookup.
- `searchDirectoryServer` calls only `search_dld_directory`.
- `getDirectoryRecordServer` calls only `dld_directory_search_public`.
- Browser components receive the fixed `DirectoryRecord` public shape and never create or import a Supabase client.

Proposed database objects are the canonical `dld_directory_*` tables, `dld_directory_import_runs`, `dld_directory_stage`, private `dld_directory_search_index`, per-entity `dld_directory_*_public` views, `dld_directory_search_public`, `search_dld_directory(...)`, and service-only `publish_dld_directory(uuid)`.

## Preserved local output counts

| Output | Rows |
| --- | ---: |
| Communities | 301 |
| Developers | 2,348 |
| Projects | 3,039 |
| Brokers | 8,709 |
| Broker-office links | 8,724 |
| Offices | 2,574 |
| Office activities | 4,963 |
| Licences | 2,948 |
| Permits | 175,056 |
| Valuators | 153 |
| Escrow agents | 25 |
| Owner associations | 110 |
| Free-zone companies | 250 |
| Search index | 195,513 |

No Phase 1B data output was uploaded. The raw DLD folder is unchanged.

## Relationship coverage retained from Phase 1A

- Project → developer: 3,029 / 3,037 non-null rows matched (99.736582%); 8 rows across 4 identifiers remain internal and unmatched.
- Project → community: 3,039 / 3,039 matched (100%).
- Project → escrow agent: 2,718 / 2,718 non-null rows matched (100%).
- Broker affiliation → office: 8,711 / 8,724 matched (99.850986%); 13 rows across 3 identifiers remain internal and unmatched.
- Office participant → licence participant: 372 / 2,574 matched (14.452214%).
- Developer participant → licence participant: 78 / 2,348 matched (3.321976%).

Only matched foreign-key relationships can enter public related context. No name/fuzzy link is invented.

## Privacy decisions enforced

Public responses may contain official professional names; registration, project, licence and permit numbers; activities/statuses; validity dates; matched relationships; source dataset/export date; and the approved disclaimer/notices. One supplied official language remains one language.

Phone, email, fax, nationality/demographic fields, participant IDs, aliases, unmatched identifiers, office hierarchy identifiers and owner-association coordinates remain internal. Search relevance is not a ranking, recommendation, partnership, verification, endorsement or quality score. The product wording is “Recorded in DLD open data,” never “DLD verified.”

## Verification

- Phase 0 source-aware verifier: pass, 160 checks.
- Phase 1A verifier and idempotent rebuild: pass; every canonical key unique and every sanitized output manifest/count/privacy check passed.
- Phase 1B static verifier: pass, 24 checks; database execution recorded as `not_run_local_postgresql_unavailable`.
- Sanitized directory unit tests: pass, 6 tests.
- TypeScript typecheck: pass.
- ESLint on all changed Phase 1B TypeScript/TSX files: pass.
- Production client and SSR/Nitro build: pass. Existing unrelated deprecation/configuration warnings remain.
- `git diff --check`: pass.

## Assumptions and blockers

- No local PostgreSQL, Supabase CLI or Docker runtime was already available, so SQL execution, live RLS/grant behavior, query plans and transaction rollback still require a disposable Supabase-compatible environment.
- No credentials or new environment variables are needed for this local phase. Future Lovable Cloud access is user-authorized inside the linked Lovable project, not through credentials supplied to this repository task.
- The nullable curated bridges intentionally start empty. Populating them is a separately reviewed matching/publication action.
- Lovable Test/Live may only be used if this existing project already has that feature. Database data does not automatically copy from Test to Live.

See `PHASE-1B-MIGRATION-REVIEW.md` and `PHASE-1B-LOVABLE-CLOUD.md` for the remaining database publication procedure.
