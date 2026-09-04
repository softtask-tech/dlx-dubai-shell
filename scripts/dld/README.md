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
