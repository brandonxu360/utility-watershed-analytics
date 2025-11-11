#!/bin/bash
# Quick performance comparison test
# Usage: ./quick_benchmark.sh [subset-size]

set -e

SUBSET_SIZE=${1:-20}
SERVER_DIR="/home/brandonx/dev/utility-watershed-analytics/server"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QUICK INGESTION BENCHMARK"
echo "  Testing with $SUBSET_SIZE entries per section"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$SERVER_DIR"

clear_db() {
    echo "🗑️  Clearing database..."
    python manage.py shell -c "from server.watershed.models import *; Channel.objects.all().delete(); Subcatchment.objects.all().delete(); Watershed.objects.all().delete(); print('✓ Database cleared')"
    sleep 1
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 1: Sequential (1 worker)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
clear_db

START1=$(date +%s.%N)
python manage.py ingest_manifest \
    --scope dev_subset \
    --subset-size "$SUBSET_SIZE" \
    --max-workers 1 \
    --force \
    > /tmp/sequential.log 2>&1
END1=$(date +%s.%N)
DURATION1=$(echo "$END1 - $START1" | bc)

echo ""
echo "✅ Sequential completed in: ${DURATION1}s"
tail -5 /tmp/sequential.log | grep -E "(Watersheds|Subcatchments|Channels)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 2: Parallel (4 workers)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
clear_db

START2=$(date +%s.%N)
python manage.py ingest_manifest \
    --scope dev_subset \
    --subset-size "$SUBSET_SIZE" \
    --max-workers 4 \
    --force \
    > /tmp/parallel.log 2>&1
END2=$(date +%s.%N)
DURATION2=$(echo "$END2 - $START2" | bc)

echo ""
echo "✅ Parallel completed in: ${DURATION2}s"
tail -5 /tmp/parallel.log | grep -E "(Watersheds|Subcatchments|Channels)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
printf "  Sequential (1 worker):  %8.2fs\n" "$DURATION1"
printf "  Parallel (4 workers):   %8.2fs\n" "$DURATION2"
echo ""

SPEEDUP=$(echo "scale=2; $DURATION1 / $DURATION2" | bc)
IMPROVEMENT=$(echo "scale=1; (($DURATION1 - $DURATION2) / $DURATION1) * 100" | bc)

printf "  ⚡ Speedup:              %8.2fx\n" "$SPEEDUP"
printf "  📊 Improvement:         %8.1f%%\n" "$IMPROVEMENT"
echo ""

# Extrapolate to full dataset
ENTRIES_TOTAL=$((1 + SUBSET_SIZE + SUBSET_SIZE))
FULL_DATASET=791
RATE=$(echo "scale=4; $ENTRIES_TOTAL / $DURATION2" | bc)
FULL_TIME=$(echo "scale=2; $FULL_DATASET / $RATE" | bc)
FULL_MINUTES=$(echo "scale=1; $FULL_TIME / 60" | bc)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXTRAPOLATION TO FULL DATASET (791 entries)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
printf "  Processing rate:        %8.2f entries/second\n" "$RATE"
printf "  Estimated full load:    %8.1f minutes (%.0f seconds)\n" "$FULL_MINUTES" "$FULL_TIME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
