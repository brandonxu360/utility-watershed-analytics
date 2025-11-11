# Watershed Data Ingestion Pipeline

## Overview

This ingestion pipeline loads geospatial watershed data from remote GeoJSON sources into PostGIS with **parallel fetching** and **batched database writes** for improved performance.

## Key Features

- ✅ **Parallel URL fetching** with bounded concurrency (default: 4 workers)
- ✅ **Batched database writes** to reduce transaction overhead
- ✅ **Environment-aware subsetting** (auto-detects dev vs production)
- ✅ **Structured logging** with JSON output support
- ✅ **Retry logic** with exponential backoff for network failures
- ✅ **Dry-run mode** for manifest validation
- ✅ **Backward compatible** with existing `load_watershed_data` command

## Architecture

### Data Flow

```
Manifest (YAML)
    ↓
ManifestReader (parse & subset)
    ↓
ParallelFetcher (concurrent URL fetch with retry)
    ↓
IngestionOrchestrator (serial DB writes with batching)
    ↓
PostGIS (bulk_create + geometry simplification)
```

### Components

- **`ingestion_config.py`**: Environment-aware configuration with sensible defaults
- **`manifest_reader.py`**: YAML parsing with validation and subsetting
- **`parallel_fetcher.py`**: Bounded `ThreadPoolExecutor` for IO parallelism
- **`ingestion_logger.py`**: Structured logging with run/correlation IDs
- **`ingestion_orchestrator.py`**: Main orchestration logic
- **`management/commands/ingest_manifest.py`**: Full-featured CLI command
- **`management/commands/load_watershed_data.py`**: Updated to use new pipeline

## Usage

### Quick Start (Development)

```bash
# Load with defaults (auto-detects DEBUG mode, loads subset)
python manage.py ingest_manifest

# Or use the legacy command (now uses new pipeline)
python manage.py load_watershed_data
```

### Production Load (All Data)

```bash
# Load full dataset
python manage.py ingest_manifest --scope all

# Or let it auto-detect (with DEBUG=False in settings)
python manage.py ingest_manifest
```

### Custom Configuration

```bash
# Increase parallelism and batch size
python manage.py ingest_manifest \
  --max-workers 8 \
  --batch-size 1000 \
  --scope all

# Structured JSON logging for production monitoring
python manage.py ingest_manifest \
  --log-json \
  --scope all
```

### Development Workflow

```bash
# Validate manifest without loading
python manage.py ingest_manifest --dry-run

# Load small subset for quick testing
python manage.py ingest_manifest --scope dev_subset --subset-size 10

# Force reload (clears existing data)
python manage.py ingest_manifest --force

# Skip geometry simplification for speed
python manage.py ingest_manifest --skip-simplify
```

## Configuration

### Settings (settings.py)

Add to `settings.py` to override defaults:

```python
INGESTION = {
    'MODE': 'url',              # 'url' | 'download' (url-only for now)
    'MAX_WORKERS': 4,           # Parallel fetch workers
    'BATCH_SIZE': 500,          # DB bulk_create batch size
    'SCOPE': 'auto',            # 'auto' | 'dev_subset' | 'all'
    'SUBSET_SIZE': 50,          # Number of runids in dev mode
    'LOG_JSON': False,          # Structured JSON logging
    'DOWNLOAD_DIR': '/tmp/ingestion',  # For future download mode
}
```

### Environment Awareness

- **`SCOPE='auto'`** (default):
  - If `DEBUG=True` → loads `dev_subset` (first N runids with all their data)
  - If `DEBUG=False` → loads `all` data
- Override with `--scope` CLI argument

### How `dev_subset` Works

In development mode (`SCOPE='dev_subset'`):
1. Loads the first `SUBSET_SIZE` subcatchments (each represents a unique runid)
2. Loads ALL channels for those same runids
3. Loads ONLY the watersheds matching those runids
4. Example: `--subset-size 10` loads 10 runids with their complete data

## Performance Characteristics

### Before (Sequential)

- **~790 HTTP requests** serially (with retry/backoff)
- **Estimated**: 1-2 seconds per request × 790 = **~26-52 minutes**
- **Bottleneck**: Network IO latency

### After (Parallel)

- **~790 HTTP requests** with 4 workers in parallel
- **Estimated**: ~26-52 minutes ÷ 4 = **~6-13 minutes**
- **Speedup**: **~4x** (scales with `MAX_WORKERS`)

### Recommendations

- **Development**: Use `--scope dev_subset` (default with `DEBUG=True`)
- **Production**: Use `--max-workers 8` on good network, `--batch-size 1000` for large datasets
- **Monitoring**: Use `--log-json` and parse structured logs

## Command Reference

### `ingest_manifest`

Full-featured ingestion command with all options.

```bash
python manage.py ingest_manifest [OPTIONS]
```

**Options:**

- `--manifest PATH`: Path to manifest YAML (defaults to project manifest)
- `--mode {url|download}`: Fetch mode (only `url` implemented)
- `--max-workers N`: Parallel fetch workers (default: 4)
- `--batch-size N`: DB batch size (default: 500)
- `--scope {auto|dev_subset|all}`: Data scope (default: auto)
- `--subset-size N`: Dev subset size (default: 50)
- `--dry-run`: Validate manifest only
- `--log-json`: Structured JSON logging
- `--force`: Clear existing data first
- `--skip-simplify`: Skip geometry simplification

### `load_watershed_data`

Legacy command (now delegates to new pipeline for backward compatibility).

```bash
python manage.py load_watershed_data [OPTIONS]
```

**Options:**

- `--force`: Clear existing data first
- `--dry-run`: Preview without loading

## Logging

### Key-Value Format (Default)

```
run_id=run_20251110_123456_a1b2c3d4 level=INFO message=Ingestion started scope=dev_subset total_entries=150 timestamp=2025-11-10T12:34:56.789Z
run_id=run_20251110_123456_a1b2c3d4 level=INFO message=Loading subcatchments count=50
run_id=run_20251110_123456_a1b2c3d4 level=INFO message=Fetched subcatchments data count=50 duration_s=12.34 success_count=50
```

### JSON Format (`--log-json`)

```json
{"run_id": "run_20251110_123456_a1b2c3d4", "level": "INFO", "message": "Ingestion started", "scope": "dev_subset", "total_entries": 150, "timestamp": "2025-11-10T12:34:56.789Z"}
{"run_id": "run_20251110_123456_a1b2c3d4", "level": "INFO", "message": "Loading subcatchments", "count": 50}
{"run_id": "run_20251110_123456_a1b2c3d4", "level": "INFO", "message": "Fetched subcatchments data", "count": 50, "duration_s": "12.34", "success_count": 50}
```

### Log Levels

- **INFO**: Start/stop, counts, durations, progress
- **DEBUG**: Per-entry URLs, correlation IDs, fetch timings
- **WARNING**: Retries, skipped entries
- **ERROR**: Failures with actionable context (URL, error, suggested action)

## Testing

Run tests with:

```bash
# All watershed app tests
python manage.py test server.watershed

# Specific test modules
python manage.py test server.watershed.tests.test_ingestion_config
python manage.py test server.watershed.tests.test_manifest_reader
python manage.py test server.watershed.tests.test_ingestion_logger
```

## Troubleshooting

### "Manifest file not found"

- Verify manifest path: `--manifest /path/to/data-manifest.yaml`
- Default expects manifest at `server/data-manifest.yaml`

### "Database already contains N watersheds"

- Use `--force` to clear and reload
- Or `--dry-run` to validate without writing

### "Failed to fetch N entries"

- Check network connectivity
- Review error logs for specific URLs
- Reduce `--max-workers` if hitting rate limits

### Slow performance

- Increase `--max-workers` (try 8-16 on good network)
- Increase `--batch-size` (try 1000-2000)
- Use `--scope dev_subset` for testing

### GDAL/DataSource errors

- Ensure GDAL libraries installed: `apt-get install gdal-bin`
- Check Python bindings: `pip list | grep GDAL`

## Future Enhancements (Not Implemented Yet)

- **Download mode**: Two-step download to local temp → load (simple extension)
- **Resume capability**: Track processed entries, skip on re-run
- **Progress bar**: Rich terminal UI with tqdm
- **Metrics export**: Prometheus-compatible metrics
- **S3 support**: Direct read from S3 URLs

## Design Philosophy

- **Minimal dependencies**: Standard library + Django/GDAL
- **Small patches**: Isolated changes, no sweeping refactors
- **Backward compatible**: Existing commands still work
- **Observable**: Structured logs with run/correlation IDs
- **Incremental**: Easy to extend (download mode, resume, etc.)

## Files Modified/Created

### New Files

- `server/watershed/ingestion_config.py`
- `server/watershed/ingestion_logger.py`
- `server/watershed/manifest_reader.py`
- `server/watershed/parallel_fetcher.py`
- `server/watershed/ingestion_orchestrator.py`
- `server/watershed/management/commands/ingest_manifest.py`
- `server/watershed/tests/test_ingestion_config.py`
- `server/watershed/tests/test_manifest_reader.py`
- `server/watershed/tests/test_ingestion_logger.py`

### Modified Files

- `server/watershed/loaders/load_remote.py`: Added `batch_size` parameter to `_save_watershed_associated_layer`
- `server/watershed/management/commands/load_watershed_data.py`: Delegate to new pipeline

### Preserved Files (Unchanged)

- `server/watershed/models.py`
- `server/watershed/load.py`
- `server/data-manifest.yaml`

---

**Questions or Issues?** Review logs with `--log-json` for structured debugging, or run `--dry-run` to validate manifest before loading.
