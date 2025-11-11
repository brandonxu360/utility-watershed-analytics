#!/usr/bin/env python3
"""
Benchmark script to compare ingestion pipeline performance.

This script helps you measure the actual performance difference between
sequential and parallel ingestion approaches.

Usage:
    python benchmark_ingestion.py --subset-size 20
    python benchmark_ingestion.py --subset-size 50 --max-workers 4
    python benchmark_ingestion.py --subset-size 100 --compare-workers
"""

import argparse
import sys
import time
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple


class BenchmarkResult:
    """Store and display benchmark results."""
    
    def __init__(self, name: str, duration: float, stats: Dict):
        self.name = name
        self.duration = duration
        self.stats = stats
    
    def __repr__(self):
        return f"{self.name}: {self.duration:.2f}s ({self.stats})"


def run_ingestion(args: List[str], description: str) -> Tuple[BenchmarkResult, bool]:
    """
    Run ingestion command and measure time.
    
    Returns:
        Tuple of (BenchmarkResult, success)
    """
    print(f"\n{'='*70}")
    print(f"Running: {description}")
    print(f"Command: python manage.py {' '.join(args)}")
    print(f"{'='*70}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            ['python', 'manage.py'] + args,
            cwd='/app/server',
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )
        
        duration = time.time() - start_time
        
        # Parse output for stats
        stats = {}
        for line in result.stdout.split('\n'):
            if 'Watersheds:' in line:
                stats['watersheds'] = int(line.split(':')[1].strip())
            elif 'Subcatchments:' in line:
                stats['subcatchments'] = int(line.split(':')[1].strip())
            elif 'Channels:' in line:
                stats['channels'] = int(line.split(':')[1].strip())
        
        print(f"✅ Success in {duration:.2f}s")
        print(f"Stats: {stats}")
        
        if result.returncode != 0:
            print(f"❌ Command failed with exit code {result.returncode}")
            print(f"Error output:\n{result.stderr}")
            return BenchmarkResult(description, duration, stats), False
        
        return BenchmarkResult(description, duration, stats), True
        
    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        print(f"❌ Timeout after {duration:.2f}s")
        return BenchmarkResult(description, duration, {}), False
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ Error: {e}")
        return BenchmarkResult(description, duration, {}), False


def clear_database():
    """Clear existing watershed data."""
    print("\n🗑️  Clearing database...")
    result = subprocess.run(
        ['python', 'manage.py', 'shell', '-c',
         'from server.watershed.models import Watershed, Subcatchment, Channel; '
         'Channel.objects.all().delete(); '
         'Subcatchment.objects.all().delete(); '
         'Watershed.objects.all().delete(); '
         'print("Database cleared")'],
        cwd='/app/server',
        capture_output=True,
        text=True
    )
    print(result.stdout)


def print_comparison(results: List[BenchmarkResult]):
    """Print formatted comparison table."""
    print("\n" + "="*70)
    print("BENCHMARK RESULTS")
    print("="*70)
    
    # Table header
    print(f"\n{'Test':<40} {'Time (s)':<12} {'Speedup':<12} {'Entries':<15}")
    print("-" * 79)
    
    baseline = results[0] if results else None
    
    for result in results:
        speedup = baseline.duration / result.duration if baseline and result != baseline else 1.0
        total_entries = sum(result.stats.values())
        
        print(f"{result.name:<40} {result.duration:>8.2f}s    "
              f"{speedup:>6.2f}x      {total_entries:>6} entries")
    
    print("\n" + "="*70)
    
    # Calculate and show best performer
    if len(results) > 1:
        best = min(results, key=lambda r: r.duration)
        worst = max(results, key=lambda r: r.duration)
        improvement = ((worst.duration - best.duration) / worst.duration) * 100
        
        print(f"\n🏆 Best: {best.name} ({best.duration:.2f}s)")
        print(f"📊 Improvement: {improvement:.1f}% faster than slowest")
        print(f"⚡ Speedup: {worst.duration / best.duration:.2f}x")


def main():
    parser = argparse.ArgumentParser(description='Benchmark ingestion pipeline')
    parser.add_argument('--subset-size', type=int, default=20,
                        help='Number of entries per section to test (default: 20)')
    parser.add_argument('--max-workers', type=int, default=4,
                        help='Number of parallel workers (default: 4)')
    parser.add_argument('--compare-workers', action='store_true',
                        help='Compare different worker counts (1, 2, 4, 8)')
    parser.add_argument('--sequential-baseline', action='store_true',
                        help='Include sequential baseline (max-workers=1)')
    parser.add_argument('--skip-clear', action='store_true',
                        help='Skip database clearing between runs')
    
    args = parser.parse_args()
    
    results = []
    
    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║             WATERSHED INGESTION PIPELINE BENCHMARK                   ║
╚══════════════════════════════════════════════════════════════════════╝

Configuration:
  - Subset size: {args.subset_size} entries per section
  - Max workers: {args.max_workers}
  - Compare workers: {args.compare_workers}
  - Sequential baseline: {args.sequential_baseline}

This will test the ingestion pipeline with different configurations
to measure actual performance improvements.
""")
    
    # Test scenarios
    test_configs = []
    
    if args.compare_workers:
        # Compare different worker counts
        for workers in [1, 2, 4, 8]:
            test_configs.append((
                f"Parallel ingestion ({workers} workers)",
                ['ingest_manifest', '--scope', 'dev_subset', 
                 '--subset-size', str(args.subset_size),
                 '--max-workers', str(workers),
                 '--force']
            ))
    elif args.sequential_baseline:
        # Sequential baseline + parallel
        test_configs.append((
            f"Sequential baseline (1 worker)",
            ['ingest_manifest', '--scope', 'dev_subset',
             '--subset-size', str(args.subset_size),
             '--max-workers', '1',
             '--force']
        ))
        test_configs.append((
            f"Parallel ingestion ({args.max_workers} workers)",
            ['ingest_manifest', '--scope', 'dev_subset',
             '--subset-size', str(args.subset_size),
             '--max-workers', str(args.max_workers),
             '--force']
        ))
    else:
        # Default: just test current config
        test_configs.append((
            f"Parallel ingestion ({args.max_workers} workers)",
            ['ingest_manifest', '--scope', 'dev_subset',
             '--subset-size', str(args.subset_size),
             '--max-workers', str(args.max_workers),
             '--force']
        ))
    
    # Run tests
    for description, cmd_args in test_configs:
        if not args.skip_clear and results:  # Clear DB between runs (except first)
            clear_database()
            time.sleep(2)  # Give DB a moment
        
        result, success = run_ingestion(cmd_args, description)
        if success:
            results.append(result)
        else:
            print(f"⚠️  Skipping failed test from results")
    
    # Print comparison
    if results:
        print_comparison(results)
        
        # Extrapolate to full dataset
        if results and results[0].stats:
            print("\n" + "="*70)
            print("EXTRAPOLATION TO FULL DATASET (~790 entries)")
            print("="*70)
            
            for result in results:
                entries = sum(result.stats.values())
                if entries > 0:
                    rate = entries / result.duration  # entries per second
                    full_dataset_time = 790 / rate  # seconds for 790 entries
                    
                    print(f"\n{result.name}:")
                    print(f"  Rate: {rate:.2f} entries/second")
                    print(f"  Estimated full load: {full_dataset_time:.1f}s ({full_dataset_time/60:.1f} minutes)")
    else:
        print("\n❌ No successful benchmark results to compare")
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
