#!/usr/bin/env python3
"""Regenerate golden-trace fixtures for the engine tests.

Runs the worker's OWN Python (extracted from public/workers/pyodide.worker.js)
under CPython for a few sample programs and writes the resulting RunResult JSON
to src/lib/__fixtures__/. Those fixtures feed src/lib/golden.test.ts, which runs
the full classify/detect/narrate pipeline on real traces.

Usage:  python scripts/gen-golden-fixtures.py   (from the repo root)
"""

import json
import os
import re

WORKER = "public/workers/pyodide.worker.js"
OUTDIR = "src/lib/__fixtures__"

PROGRAMS = {
    "bubble_sort": (
        "def bubble_sort(a):\n"
        "    for i in range(len(a)):\n"
        "        for j in range(len(a)-1-i):\n"
        "            if a[j] > a[j+1]:\n"
        "                a[j], a[j+1] = a[j+1], a[j]\n"
        "    return a\n\n"
        "arr = [5, 2, 4, 1]\n"
        "bubble_sort(arr)\n"
    ),
    "two_pointer": (
        "def two_sum(nums, target):\n"
        "    left, right = 0, len(nums) - 1\n"
        "    while left < right:\n"
        "        s = nums[left] + nums[right]\n"
        "        if s == target:\n"
        "            return [left, right]\n"
        "        if s < target:\n"
        "            left += 1\n"
        "        else:\n"
        "            right -= 1\n"
        "    return []\n\n"
        "nums = [2, 7, 11, 15]\n"
        "two_sum(nums, 26)\n"
    ),
}


def load_runner():
    js = open(WORKER, encoding="utf-8").read()
    start = js.index("const TRACE_PROGRAM = `") + len("const TRACE_PROGRAM = `")
    end = js.index("`;", start)
    prog = js[start:end]
    # drop the trailing __runx_run(...) invocation so we can call it ourselves
    prog = re.sub(r"__runx_run\(\s*__runx_source.*?\)\s*$", "", prog, flags=re.S)
    ns: dict = {}
    exec(compile(prog, "<trace>", "exec"), ns)
    return lambda source: json.loads(ns["__runx_run"](source, 2000, 100, 12, 200, ""))


def main():
    run = load_runner()
    os.makedirs(OUTDIR, exist_ok=True)
    for name, src in PROGRAMS.items():
        result = run(src)
        with open(f"{OUTDIR}/{name}.json", "w", encoding="utf-8") as f:
            json.dump({"code": src, "result": result}, f)
        print(f"{name}: {len(result['snapshots'])} steps, error={result['error']}")


if __name__ == "__main__":
    main()
