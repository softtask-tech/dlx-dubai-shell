# DLD local audit and directory tooling

These scripts read the supplied DLD export folder without modifying it. Raw rows are
materialized only in `data/dld/local/phase0.duckdb`, which is ignored by Git.

From the repository root on Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts\dld\requirements.txt
.\.venv\Scripts\python.exe scripts\dld\phase0_audit.py --source 'C:\path\to\DLD DATA COD'
.\.venv\Scripts\python.exe scripts\dld\verify_phase0.py --source 'C:\path\to\DLD DATA COD'
```

Use `--reuse-db` to regenerate reports from an already materialized local database.
The audit performs no network requests and contains no Supabase client or credentials.

Phase 1A consumes only the verified local DuckDB database and produces sanitized,
ignored Parquet plus versionable reports:

```powershell
.\.venv\Scripts\python.exe scripts\dld\build_directory.py
.\.venv\Scripts\python.exe scripts\dld\import_directory.py
.\.venv\Scripts\python.exe scripts\dld\verify_directory.py
```

`import_directory.py` is a network-free validation dry run unless `--execute` is
explicitly supplied. Phase 1A did not use execution mode or database credentials.

Phase 1D creates a portable, sanitized JSONL package for the additive sanitized
publisher. Run its unit/static checks before generating, then independently verify
the finished package:

```powershell
.\.venv\Scripts\python.exe -m unittest scripts.dld.test_phase1d
.\.venv\Scripts\python.exe scripts\dld\build_phase1d_transfer.py
.\.venv\Scripts\python.exe scripts\dld\verify_phase1d_transfer.py --determinism
```

The ignored output is `data/dld/transfer/phase1d`. These commands are local and
network-free; they do not connect to Supabase or Lovable.

Phase 3A reuses the Phase 0 DuckDB database in read-only mode and emits only
aggregate/schema/policy reports:

```powershell
.\.venv\Scripts\python.exe scripts\dld\phase3a_audit.py --source 'C:\path\to\DLD DATA COD'
.\.venv\Scripts\python.exe scripts\dld\verify_phase3a.py
```

No transaction, contract, participant or property row is written to the
versioned reports. Private analytical facts remain a Phase 3B proposal only.
