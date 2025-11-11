# Pre-Deployment Checklist

Before merging to production, verify the following:

## ✅ Code Quality

- [ ] No syntax errors in new files
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] Consistent code style (PEP 8)
- [ ] Docstrings on all public functions/classes

## ✅ Testing

- [ ] Unit tests pass: `python manage.py test server.watershed.tests.test_ingestion_config`
- [ ] Unit tests pass: `python manage.py test server.watershed.tests.test_manifest_reader`
- [ ] Unit tests pass: `python manage.py test server.watershed.tests.test_ingestion_logger`
- [ ] All existing tests still pass: `python manage.py test server.watershed`
- [ ] Dry-run validation works: `python manage.py ingest_manifest --dry-run`

## ✅ Functional Verification

- [ ] Dev subset loads correctly: `python manage.py ingest_manifest --scope dev_subset --subset-size 5`
- [ ] Backward compatibility: `python manage.py load_watershed_data --dry-run`
- [ ] Force reload works: `python manage.py ingest_manifest --force --scope dev_subset --subset-size 3`
- [ ] JSON logging works: `python manage.py ingest_manifest --log-json --dry-run`
- [ ] Geometry simplification works (check `simplified_geom` field populated)

## ✅ Performance

- [ ] Parallel fetching active (check logs for concurrent fetches)
- [ ] Batch inserts happening (check DB logs or use `--log-json` to see batch sizes)
- [ ] No memory leaks (monitor with dev subset, then larger loads)
- [ ] Expected speedup observed (~4x on network-bound loads)

## ✅ Documentation

- [ ] `INGESTION_README.md` reviewed
- [ ] `IMPLEMENTATION_SUMMARY.md` reviewed
- [ ] `QUICK_REFERENCE.md` reviewed
- [ ] `ARCHITECTURE_DIAGRAM.md` reviewed
- [ ] Inline code comments sufficient

## ✅ Deployment

- [ ] Database migrations (none required, but verify)
- [ ] Environment variables set (if using custom `INGESTION` config in settings.py)
- [ ] GDAL libraries installed on target server
- [ ] Network egress allowed for data source URLs
- [ ] Log aggregation configured (if using `--log-json`)

## ✅ Rollback Plan

- [ ] Old `load_watershed_data` command still works
- [ ] No schema changes (safe to rollback)
- [ ] Can revert to previous commit if needed

## 🧪 Test Commands (Run These)

```bash
# 1. Dry run validation
python manage.py ingest_manifest --dry-run

# 2. Small subset test
python manage.py ingest_manifest --scope dev_subset --subset-size 5 --force

# 3. Verify data loaded
python manage.py shell
>>> from server.watershed.models import Watershed, Subcatchment, Channel
>>> Watershed.objects.count()  # Should be 1
>>> Subcatchment.objects.count()  # Should be ~5 (or your subset size)
>>> Channel.objects.count()  # Should be ~5 (or your subset size)
>>> exit()

# 4. Test backward compatibility
python manage.py load_watershed_data --dry-run

# 5. Run unit tests
python manage.py test server.watershed.tests.test_ingestion_config
python manage.py test server.watershed.tests.test_manifest_reader
python manage.py test server.watershed.tests.test_ingestion_logger

# 6. Test JSON logging
python manage.py ingest_manifest --log-json --dry-run | head -5
```

## 📊 Performance Benchmark (Optional)

```bash
# Baseline (sequential, if old code still accessible)
time python manage.py load_watershed_data --force

# New pipeline (dev subset)
time python manage.py ingest_manifest --force --scope dev_subset

# New pipeline (with concurrency tuning)
time python manage.py ingest_manifest --force --scope dev_subset --max-workers 8
```

## 🚨 Red Flags to Watch For

- [ ] Database connection pool exhaustion
- [ ] Memory usage growing unbounded
- [ ] Network timeouts not retrying
- [ ] Failed fetches not logged properly
- [ ] Batch inserts failing silently
- [ ] Geometry simplification taking too long

## ✅ Sign-Off

- [ ] Code reviewed by: _______________
- [ ] Tests verified by: _______________
- [ ] Documentation reviewed by: _______________
- [ ] Performance benchmarked by: _______________
- [ ] Ready for production: [ ] Yes [ ] No

---

## 🎯 Success Criteria

1. **Correctness**: Same data as before (validate counts and sample geometries)
2. **Performance**: ~4x faster on full dataset
3. **Reliability**: Retry logic handles transient failures
4. **Observability**: Structured logs show progress and errors
5. **Compatibility**: Existing scripts work unchanged

---

**When all items checked, ready to merge! 🚀**
