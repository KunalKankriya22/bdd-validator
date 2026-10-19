#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""List available screens from the vault index.

Lists all 906 screens with module, submodule, title, and mnemonic.
Shows which screens have working folders in screens/.
Supports filtering by module, submodule, or keyword.

Outputs JSON to stdout.
"""

import argparse
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="List available screens from the vault index."
    )
    parser.add_argument("project_root", help="Project root directory")
    parser.add_argument("--module", help="Filter by module name (case-insensitive)")
    parser.add_argument("--submodule", help="Filter by submodule name (case-insensitive)")
    parser.add_argument("--search", help="Filter by keyword in name, title, or mnemonic")
    parser.add_argument("--with-folder", action="store_true", help="Only show screens that have working folders in screens/")
    parser.add_argument("--verbose", action="store_true", help="Print diagnostics to stderr")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    index_path = project_root / "knowledge" / ".sage-index" / "vault.index.json"

    if not index_path.is_file():
        print(f"Error: vault index not found at {index_path}", file=sys.stderr)
        sys.exit(2)

    with open(index_path) as f:
        data = json.load(f)

    screens_dir = project_root / "screens"
    existing_folders = set()
    if screens_dir.is_dir():
        existing_folders = {d.name.lower() for d in screens_dir.iterdir() if d.is_dir()}

    screens = []
    for name, entry in data.get("entities", {}).items():
        if entry.get("type") != "screen":
            continue

        mnemonic = entry.get("mnemonic", name).lower()
        has_folder = mnemonic in existing_folders

        screen = {
            "mnemonic": mnemonic,
            "title": entry.get("title", name),
            "module": entry.get("module", ""),
            "sub_module": entry.get("sub_module", ""),
            "has_working_folder": has_folder,
            "table_count": len(entry.get("relationships", {}).get("tables", []))
                + len(entry.get("relationships", {}).get("lov_sources", [])),
        }

        if args.module and args.module.lower() not in screen["module"].lower():
            continue
        if args.submodule and args.submodule.lower() not in screen["sub_module"].lower():
            continue
        if args.search:
            search_lower = args.search.lower()
            searchable = f"{screen['mnemonic']} {screen['title']} {screen['module']} {screen['sub_module']}".lower()
            if search_lower not in searchable:
                continue
        if args.with_folder and not has_folder:
            continue

        screens.append(screen)

    screens.sort(key=lambda s: (s["module"], s["sub_module"], s["mnemonic"]))

    modules = {}
    for s in screens:
        mod = s["module"] or "Unknown"
        if mod not in modules:
            modules[mod] = {"screen_count": 0, "sub_modules": set()}
        modules[mod]["screen_count"] += 1
        if s["sub_module"]:
            modules[mod]["sub_modules"].add(s["sub_module"])

    module_summary = {
        k: {"screen_count": v["screen_count"], "sub_modules": sorted(v["sub_modules"])}
        for k, v in modules.items()
    }

    output = {
        "total_screens": len(screens),
        "screens_with_folders": sum(1 for s in screens if s["has_working_folder"]),
        "module_summary": module_summary,
        "screens": screens,
    }

    json.dump(output, sys.stdout, indent=2)
    print()

    sys.exit(0)


if __name__ == "__main__":
    main()
