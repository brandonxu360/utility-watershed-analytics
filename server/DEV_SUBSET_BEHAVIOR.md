# Dev Subset Behavior Update

## What Changed

The `dev_subset` scope now correctly handles the relationship between watersheds, subcatchments, and channels.

### Previous Behavior ❌

- Loaded first N watersheds
- Loaded first N subcatchments  
- Loaded first N channels
- **Problem**: These were independent - could load mismatched data

### New Behavior ✅

- Loads **ALL watersheds** from the watershed file
- Loads **first N subcatchments** (each represents a unique runid)
- Loads **ALL channels** matching those same runids
- **Then filters watersheds** to keep only those matching the selected runids

## Why This Makes Sense

The data structure is:
- **1 watershed GeoJSON file** contains ALL watersheds (each with a different `runid`)
- **Multiple subcatchment files** (one per runid)
- **Multiple channel files** (one per runid, matching subcatchments)

So when you say `--subset-size 10`, you're saying:
> "Load the first 10 runids with their complete data (watersheds + subcatchments + channels)"

## Example

```bash
python manage.py ingest_manifest --scope dev_subset --subset-size 5
```

**Loads:**
1. Fetches watershed file (contains all ~395 watersheds)
2. Loads first 5 subcatchments (runids: wa-0, wa-1, wa-2, wa-3, wa-4)
3. Loads first 5 channels (matching those same runids)
4. **Filters watersheds** to keep only those 5 runids
5. Deletes the other ~390 watersheds from the database

**Result:**
- 5 watersheds (matching the 5 runids)
- 5 subcatchment files loaded (one per runid)
- 5 channel files loaded (one per runid)

## Files Modified

1. **`manifest_reader.py`**: 
   - Always loads all watersheds (file contains all runids)
   - Subsets subcatchments by N
   - Filters channels to match subcatchment runids

2. **`ingestion_orchestrator.py`**:
   - Extracts selected runids from subcatchments
   - Passes runids to watershed loader
   - Deletes watersheds not in selected runids after loading

3. **`ingest_manifest.py`**:
   - Updated help text to clarify subset-size is "number of runids"

4. **`test_manifest_reader.py`**:
   - Updated test to verify channels match subcatchment runids

5. **`INGESTION_README.md`**:
   - Added explanation of how dev_subset works

## Testing

```bash
# Load 10 complete runids
python manage.py ingest_manifest --scope dev_subset --subset-size 10 --force

# Verify correct counts
python manage.py shell -c "
from server.watershed.models import Watershed, Subcatchment, Channel
print(f'Watersheds: {Watershed.objects.count()}')  # Should be 10
print(f'Subcatchments: {Subcatchment.objects.count()}')  # ~10-100 (multiple per runid)
print(f'Channels: {Channel.objects.count()}')  # ~10-100 (multiple per runid)

# Verify runids match
from server.watershed.models import Watershed
runids = set(Watershed.objects.values_list('runid', flat=True))
print(f'Unique runids: {len(runids)}')  # Should be 10
"
```

## Benefits

✅ **Correct relationships**: Watersheds, subcatchments, and channels always match  
✅ **Complete data**: Each runid has all its associated data  
✅ **Faster dev testing**: Load 10 runids instead of 50 random entries  
✅ **Predictable**: Same subset every time (first N runids alphabetically)
