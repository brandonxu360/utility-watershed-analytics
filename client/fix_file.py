#!/usr/bin/env python3
path = "/app/client/src/components/side-panels/WatershedOverview.tsx"
with open(path, "r") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Find the line numbers of MILLCREEK_RUN_ID occurrences
for i, line in enumerate(lines, 1):
    if "MILLCREEK_RUN_ID" in line or "export default function WatershedOverview" in line:
        print(f"Line {i}: {line.rstrip()}")
