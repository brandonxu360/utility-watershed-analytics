# Ingestion Pipeline Architecture Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Django Management Command                    │
│              python manage.py ingest_manifest                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IngestionOrchestrator                         │
│  • Coordinates entire pipeline                                  │
│  • Manages stats and error tracking                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─────► ManifestReader ────────┐
                 │       • Parse YAML            │
                 │       • Validate structure    │
                 │       • Apply subsetting      │
                 │                               │
                 │       Returns: List of URLs   │
                 │       per entity type         │
                 │                               │
                 └───────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ParallelFetcher                             │
│                (ThreadPoolExecutor, 4 workers)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Worker 1 ──┐                                                   │
│  Worker 2 ──┼──► Fetch URLs with retry/backoff                 │
│  Worker 3 ──┤    • Exponential backoff (6 attempts)             │
│  Worker 4 ──┘    • Creates DataSource per URL                   │
│                  • Returns FetchResult objects                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Serial Database Writes                         │
│                  (Preserve Transaction Safety)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  For each successful fetch:                                      │
│    1. Extract runid from URL                                     │
│    2. Parse features from DataSource                             │
│    3. Batch into groups of 500 (configurable)                    │
│    4. bulk_create() per batch                                    │
│    5. Log progress every 50 entries                              │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PostGIS                                  │
│  • Watershed table (1 entry)                                     │
│  • Subcatchment table (~395 entries)                             │
│  • Channel table (~395 entries)                                  │
│  • Geometry simplification (ST_SimplifyPreserveTopology)         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interactions

```
┌──────────────┐
│ CLI Args     │
│ --max-workers│──────┐
│ --batch-size │      │
│ --scope      │      │
└──────────────┘      │
                      │
┌──────────────┐      │      ┌──────────────────┐
│ settings.py  │      │      │ Environment      │
│ INGESTION={} │──────┼─────▶│ DEBUG=True/False │
└──────────────┘      │      └──────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ Config       │
              │ Resolver     │
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  MAX_WORKERS   BATCH_SIZE    SCOPE
      (4)         (500)     (auto→dev/prod)
```

## Logging Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      IngestionLogger                             │
│  • run_id: Unique per ingestion run                              │
│  • correlation_id: Unique per URL fetch                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├──► INFO: Start/stop, counts, durations
                 ├──► DEBUG: Per-URL details, fetch timings
                 ├──► WARNING: Retries, skipped entries
                 └──► ERROR: Failures with actionable context
                      │
                      ▼
         ┌────────────────────────┐
         │  Output Format         │
         ├────────────────────────┤
         │ Key-Value (default):   │
         │  run_id=... level=INFO │
         │                        │
         │ JSON (--log-json):     │
         │  {"run_id": "...",     │
         │   "level": "INFO"}     │
         └────────────────────────┘
```

## Data Entity Relationships

```
┌──────────────────────┐
│   Watershed          │ 1 entry from 1 URL
│   Primary Key: runid │
└──────────┬───────────┘
           │
           │ 1:N
           │
           ├────────────────────────────┐
           │                            │
           ▼                            ▼
┌──────────────────┐       ┌──────────────────┐
│  Subcatchment    │       │    Channel       │
│  FK: watershed   │       │  FK: watershed   │
│  ~395 entries    │       │  ~395 entries    │
│  from ~395 URLs  │       │  from ~395 URLs  │
└──────────────────┘       └──────────────────┘

Total: 1 + 395 + 395 = 791 URLs to fetch
With 4 workers: 791 ÷ 4 = ~198 fetches per worker
```

## Performance Timeline

```
Before (Sequential):
────────────────────────────────────────────────────────────
Fetch 1 ──▶ Fetch 2 ──▶ Fetch 3 ──▶ ... ──▶ Fetch 791
~2s each                                      Total: ~26 min
────────────────────────────────────────────────────────────

After (Parallel, 4 workers):
────────────────────────────────────────────────────────────
Worker 1: Fetch 1 ──▶ Fetch 5 ──▶ Fetch 9  ──▶ ...
Worker 2: Fetch 2 ──▶ Fetch 6 ──▶ Fetch 10 ──▶ ...
Worker 3: Fetch 3 ──▶ Fetch 7 ──▶ Fetch 11 ──▶ ...
Worker 4: Fetch 4 ──▶ Fetch 8 ──▶ Fetch 12 ──▶ ...
                                    Total: ~6-7 min (4x faster)
────────────────────────────────────────────────────────────
```

## Configuration Decision Tree

```
                    Start Ingestion
                          │
                          ▼
                  Check SCOPE setting
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   scope='all'    scope='auto'    scope='dev_subset'
        │                 │                 │
        │         ┌───────┴───────┐         │
        │         ▼               ▼         │
        │    DEBUG=True     DEBUG=False     │
        │         │               │         │
        │         ▼               ▼         │
        └──► dev_subset      Load all ◄────┘
                │               │
                ▼               ▼
           Load 50/section  Load 791 total
```

## Error Handling Flow

```
Fetch URL
    │
    ├──► Success ──────────────────────────┐
    │                                       │
    └──► Failure                            │
          │                                 │
          ▼                                 │
      Retry with backoff                    │
      (6 attempts max)                      │
          │                                 │
          ├──► Success ──────────────────┐  │
          │                              │  │
          └──► All retries failed        │  │
                │                        │  │
                ▼                        │  │
            Log ERROR                    │  │
            Skip entry                   │  │
            Continue with next           │  │
                │                        │  │
                └────────────────────────┴──┘
                                         │
                                         ▼
                                  Process next URL
```

## Module Dependency Graph

```
management/commands/ingest_manifest.py
    │
    ├──► ingestion_config.py
    │       └──► settings.py (Django)
    │
    ├──► ingestion_logger.py
    │       └──► logging (stdlib)
    │
    ├──► manifest_reader.py
    │       └──► yaml (stdlib)
    │
    └──► ingestion_orchestrator.py
            │
            ├──► manifest_reader.py
            ├──► parallel_fetcher.py
            │       └──► ThreadPoolExecutor (stdlib)
            ├──► ingestion_logger.py
            └──► models.py (Django)
                    └──► GDAL/OGR

No new dependencies required! ✅
```

## Backward Compatibility

```
Old Command:
python manage.py load_watershed_data
                │
                ▼
        load_watershed_data.py
                │
                ├──► [OLD] load.py → load_remote.py
                │
                └──► [NEW] IngestionOrchestrator
                            (delegates internally)
                            
Result: Same interface, improved performance ✅
```
