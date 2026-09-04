# DLD Phase 1A — Searchable Directory Foundation

Status: local-only implementation prepared for review. No Supabase connection, migration application, upload, commit, push, deployment, Phase 1B, or Phase 2 work was performed.

## Boundary

Phase 1A uses the verified Phase 0 DuckDB database and only the eleven approved source datasets. Raw DLD files remain outside Git and unchanged. Transaction, rent, yield, valuation analytics, service-charge analytics, Noor, and UI redesign are excluded.

## Local model

Canonical entities use official DLD identifiers stored as text. Repeating relationships are normalized into `dld_directory_office_activities` and `dld_directory_broker_office_links`. A broker is one professional record even when the source lists affiliations with multiple offices. Source relationship identifiers are retained; a separate nullable matched identifier is used where the scoped extract has an orphan.

The curated `areas`, `developers`, and `projects` tables remain editorially authoritative. The unapplied migration adds only nullable `dld_directory_*_id` bridges. It does not update descriptions, images, slugs, partner flags, recommendations, publication state, or any existing values.

## Search contract

`dld_directory_search_public` and `search_dld_directory(search_query, result_limit)` return entity type/key, English and Arabic display names, primary and secondary official numbers, official status when available, source export date/dataset, and the non-affiliation statement.

Searchable types are community, developer, project, broker, office, licence, permit, valuator, escrow agent, owner association, and free-zone company. Normalized aliases cover case, punctuation, Arabic diacritics and common alef variants, plus compact number/name forms. Aliases and matching-only participant identifiers are not part of the public response.

Projects have only one source project-name field in this extract. It is classified as English or Arabic by its script and is never transliterated or invented; the other language can therefore be null.

## Public-field policy

Public fields are official professional names, registration/project/licence/permit numbers, professional activity and legal/status fields, validity dates, official directory relationships, and source provenance. Phone, email, fax, webpage, personal demographic fields, and matching-only identifiers are internal or excluded by default. No field or search order implies endorsement, ranking, quality, availability, partner status, or recommendation.

Required wording: “Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied.”

## Repeatable local workflow

```powershell
.\.venv\Scripts\python.exe scripts\dld\build_directory.py
.\.venv\Scripts\python.exe scripts\dld\import_directory.py
.\.venv\Scripts\python.exe scripts\dld\verify_directory.py
```

The importer is network-free by default. Its untested future `--execute` mode requires an explicit service environment and uses staging plus one atomic publish RPC. Do not use it until the migrations, policy, and Supabase project are reviewed and backed up.

Machine-readable results are in `reports/dld/phase1a`. Sanitized Parquet is in the ignored `data/dld/directory/phase1a` directory.

## Unresolved publication questions

1. Confirm with the site owner and legal counsel that professional licence and permit details are within the intended public-data licence use and retention policy.
2. Decide whether owner-association coordinates should be public at launch; they can be removed from the public view without affecting search.
3. Decide how to display projects whose source provides only an Arabic or only a Latin-script name; Phase 1A deliberately does not translate.
4. Decide whether orphan source relationships should be visible as unlinked official numbers or hidden from the public response.
5. Decide whether validity dates need a “source snapshot, verify with DLD” display note in addition to the export date.
