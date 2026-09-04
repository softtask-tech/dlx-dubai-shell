# Future Lovable / Supabase publication handoff

This is a future runbook, not an authorization to publish.

1. Review the Phase 1A validation, verification, relationship, search, and privacy reports and resolve the documented publication questions.
2. Review both Phase 1A SQL migrations in a non-production Supabase branch/project. Confirm extension schema, view-security behavior, RLS findings, function ownership, statement timeout, and storage impact.
3. Back up the target. Apply migrations in timestamp order only in the approved non-production environment.
4. Set service credentials only in an approved local/CI secret store. Never place them in Git, Lovable prompts, reports, or Parquet.
5. Run `import_directory.py` without `--execute` and compare all counts and hashes. Only with explicit approval, use `--execute` against non-production. It stages keyed rows, validates every expected count, takes a transaction advisory lock, replaces the snapshot in dependency order, refreshes search, and records publication.
6. Independently test canonical counts; anon, authenticated, and admin RLS; English/Arabic and number searches; orphan handling; and absence of private fields.
7. Connect Lovable only to public views or `search_dld_directory`. Display source export date and non-affiliation wording. Never rank or recommend from registry presence.
8. Obtain explicit production approval, then repeat backup, migration, dry-run, atomic import, smoke tests, and rollback rehearsal. Deployment and UI work are outside Phase 1A.
