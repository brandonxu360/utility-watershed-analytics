# Performance Testing Guide

This guide shows you how to measure the actual performance improvement of the parallel ingestion pipeline.

---

## Quick Test (5 minutes)

### Test 1: Sequential Baseline (1 worker)

```bash
cd /home/brandonx/dev/utility-watershed-analytics/server

# Clear database first
python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete()"

# Time sequential ingestion (1 worker)
time python manage.py ingest_manifest \
  --scope dev_subset \
  --subset-size 20 \
  --max-workers 1 \
  --force
```

**Expected output:**
```
Ingestion completed successfully:
  Watersheds: 1
  Subcatchments: 20
  Channels: 20

real    0m45.234s  ← Note this time!
```

---

### Test 2: Parallel Processing (4 workers)

```bash
# Clear database
python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete()"

# Time parallel ingestion (4 workers)
time python manage.py ingest_manifest \
  --scope dev_subset \
  --subset-size 20 \
  --max-workers 4 \
  --force
```

**Expected output:**
```
Ingestion completed successfully:
  Watersheds: 1
  Subcatchments: 20
  Channels: 20

real    0m12.567s  ← Should be ~4x faster!
```

---

### Calculate Speedup

```
Speedup = Sequential Time / Parallel Time
        = 45.234s / 12.567s
        = 3.6x faster ✅
```

---

## Comprehensive Test (15 minutes)

### Using the Benchmark Script

```bash
cd /home/brandonx/dev/utility-watershed-analytics/server

# Make it executable
chmod +x benchmark_ingestion.py

# Compare sequential vs parallel
python benchmark_ingestion.py --subset-size 20 --sequential-baseline

# Compare different worker counts
python benchmark_ingestion.py --subset-size 30 --compare-workers
```

**Expected output:**
```
╔══════════════════════════════════════════════════════════════════════╗
║             WATERSHED INGESTION PIPELINE BENCHMARK                   ║
╚══════════════════════════════════════════════════════════════════════╝

BENCHMARK RESULTS
======================================================================

Test                                     Time (s)     Speedup     Entries
-------------------------------------------------------------------------------
Sequential baseline (1 worker)              45.23s       1.00x          41 entries
Parallel ingestion (4 workers)              12.57s       3.60x          41 entries

======================================================================

🏆 Best: Parallel ingestion (4 workers) (12.57s)
📊 Improvement: 72.2% faster than slowest
⚡ Speedup: 3.60x
```

---

## Docker Environment Testing

If you're running in Docker:

```bash
# From your project root
docker compose exec server bash

# Inside container
cd /app
python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete()"

# Test sequential
time python manage.py ingest_manifest --scope dev_subset --subset-size 20 --max-workers 1 --force

# Test parallel
python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete()"
time python manage.py ingest_manifest --scope dev_subset --subset-size 20 --max-workers 4 --force
```

---

## Visual Comparison Test

### Step 1: Time sequential (1 worker)
```bash
python manage.py ingest_manifest \
  --scope dev_subset \
  --subset-size 20 \
  --max-workers 1 \
  --force \
  --log-json | tee sequential.log
```

### Step 2: Time parallel (4 workers)
```bash
python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete()"

python manage.py ingest_manifest \
  --scope dev_subset \
  --subset-size 20 \
  --max-workers 4 \
  --force \
  --log-json | tee parallel.log
```

### Step 3: Compare logs
```bash
# Extract duration from logs
grep "total_duration_s" sequential.log
grep "total_duration_s" parallel.log

# Example output:
# sequential.log: "total_duration_s":"45.23"
# parallel.log:   "total_duration_s":"12.57"
```

---

## Expected Results

### Small Subset (20 entries)
- **Sequential (1 worker)**: ~40-60 seconds
- **Parallel (4 workers)**: ~10-20 seconds
- **Speedup**: ~3-4x

### Medium Subset (50 entries)
- **Sequential (1 worker)**: ~100-150 seconds
- **Parallel (4 workers)**: ~25-40 seconds
- **Speedup**: ~3-4x

### Full Dataset (790 entries)
- **Sequential (1 worker)**: ~25-30 minutes
- **Parallel (4 workers)**: ~6-8 minutes
- **Speedup**: ~4x

### Varying Workers
| Workers | Expected Time (50 entries) | Speedup |
|---------|---------------------------|---------|
| 1       | 120s                      | 1.0x    |
| 2       | 65s                       | 1.8x    |
| 4       | 35s                       | 3.4x    |
| 8       | 25s                       | 4.8x    |

---

## What Affects Performance?

### Network Speed
- **Slow network**: Less speedup (bottleneck shifts to bandwidth)
- **Fast network**: More speedup (parallelism helps more)

### Worker Count
- **1 worker**: No parallelism (baseline)
- **4 workers**: ~4x speedup (diminishing returns after this)
- **8+ workers**: Marginal gains (may hit rate limits)

### Batch Size
- **Small batches (100)**: More DB round-trips
- **Large batches (1000)**: Fewer round-trips, more memory

---

## Troubleshooting

### "Not seeing speedup"

1. **Check network latency:**
   ```bash
   time curl -s https://wc-prod.bearhive.duckdns.org/weppcloud/runs/batch;;nasa-roses-2025;;wa-0/disturbed9002_wbt/download/dem/wbt/subcatchments.WGS.geojson > /dev/null
   ```
   If this is very fast (<1s), your bottleneck might be elsewhere.

2. **Check worker count:**
   ```bash
   grep -i "max_workers" parallel.log
   ```
   Ensure it's actually using multiple workers.

3. **Check for errors:**
   ```bash
   grep -i "error\|failed" parallel.log
   ```

### "Getting errors"

- **Database locked**: Ensure only one ingestion runs at a time
- **Network timeouts**: Increase retry attempts or reduce workers
- **Memory issues**: Reduce batch size

---

## Measuring on Full Dataset (Optional)

⚠️ **Warning**: This will take 6-30 minutes depending on configuration.

```bash
# Sequential (will take ~25-30 minutes)
time python manage.py ingest_manifest \
  --scope all \
  --max-workers 1 \
  --force

# Parallel (will take ~6-8 minutes)
python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete()"

time python manage.py ingest_manifest \
  --scope all \
  --max-workers 4 \
  --force
```

---

## Quick Verification Commands

```bash
# Check if data loaded correctly
python manage.py shell -c "
from server.watershed.models import Watershed, Subcatchment, Channel
print(f'Watersheds: {Watershed.objects.count()}')
print(f'Subcatchments: {Subcatchment.objects.count()}')
print(f'Channels: {Channel.objects.count()}')
"

# Verify geometry simplification worked
python manage.py shell -c "
from server.watershed.models import Watershed
simplified = Watershed.objects.filter(simplified_geom__isnull=False).count()
total = Watershed.objects.count()
print(f'Simplified geometries: {simplified}/{total}')
"
```

---

## Summary

**Fastest way to see improvement:**
```bash
# Sequential
time python manage.py ingest_manifest --scope dev_subset --subset-size 20 --max-workers 1 --force

# Parallel (after clearing DB)
time python manage.py ingest_manifest --scope dev_subset --subset-size 20 --max-workers 4 --force

# Compare the "real" times!
```

**Expected**: ~3-4x faster with 4 workers vs 1 worker. 🚀
