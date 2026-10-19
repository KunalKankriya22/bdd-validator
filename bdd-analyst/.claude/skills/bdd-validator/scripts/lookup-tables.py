#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Look up database table definitions from devdb-docs.

Given one or more table names, searches across all schemas in devdb-docs
and returns structured column definitions, constraints, indexes, triggers,
and grants.

Outputs JSON to stdout.
"""

import argparse
import json
import re
import sys
from pathlib import Path


def parse_columns(content: str) -> list[dict]:
    columns = []
    in_columns = False
    header_seen = False

    for line in content.split("\n"):
        if line.strip() == "## Columns":
            in_columns = True
            continue
        if in_columns and line.strip().startswith("## "):
            break
        if in_columns and line.strip().startswith("| #"):
            header_seen = True
            continue
        if in_columns and line.strip().startswith("| ---"):
            continue
        if in_columns and header_seen and line.strip().startswith("|"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 5:
                columns.append({
                    "position": parts[0],
                    "name": parts[1],
                    "type": parts[2],
                    "nullable": parts[3],
                    "default": parts[4] if len(parts) > 4 else "",
                    "comment": parts[5] if len(parts) > 5 else "",
                })

    return columns


def parse_primary_key(content: str) -> str | None:
    in_pk = False
    for line in content.split("\n"):
        if line.strip() == "## Primary Key":
            in_pk = True
            continue
        if in_pk and line.strip().startswith("## "):
            break
        if in_pk and line.strip():
            text = line.strip()
            if "no primary key" in text.lower():
                return None
            text = re.sub(r"^>\s*\[!.*?\]\s*", "", text)
            text = re.sub(r"^>\s*", "", text)
            if text:
                return text
    return None


def parse_table_section(content: str, section_name: str) -> list[str]:
    items = []
    in_section = False
    for line in content.split("\n"):
        if line.strip() == f"## {section_name}":
            in_section = True
            continue
        if in_section and line.strip().startswith("## "):
            break
        if in_section and line.strip().startswith("- "):
            items.append(line.strip()[2:])
        if in_section and line.strip().startswith("|") and not line.strip().startswith("| ---") and not line.strip().startswith("| Grantee") and not line.strip().startswith("| Index"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if parts:
                items.append(" | ".join(parts))
    return items


def parse_metadata(content: str) -> dict:
    meta = {}
    patterns = {
        "schema": r"\*\*Schema\*\*:\s*\[\[.*?\|(.*?)\]\]|\*\*Schema\*\*:\s*(\S+)",
        "tablespace": r"\*\*Tablespace\*\*:\s*(\S+)",
        "estimated_rows": r"\*\*Estimated Rows\*\*:\s*(\S+)",
        "last_analyzed": r"\*\*Last Analyzed\*\*:\s*(.+)",
        "partitioned": r"\*\*Partitioned\*\*:\s*(\S+)",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, content)
        if match:
            meta[key] = next(g for g in match.groups() if g is not None).strip()
    return meta


def parse_table_file(filepath: Path) -> dict:
    content = filepath.read_text(encoding="utf-8")

    result = {
        "table_name": filepath.stem,
        "file_path": str(filepath),
        "metadata": parse_metadata(content),
        "columns": parse_columns(content),
        "primary_key": parse_primary_key(content),
        "foreign_keys": parse_table_section(content, "Foreign Keys"),
        "referenced_by": parse_table_section(content, "Referenced By"),
        "triggers": parse_table_section(content, "Triggers"),
        "indexes": parse_table_section(content, "Indexes"),
        "grants": parse_table_section(content, "Grants"),
    }

    return result


def build_table_index(devdb_path: Path) -> dict[str, Path]:
    index = {}
    schemas_dir = devdb_path / "schemas"
    if not schemas_dir.is_dir():
        return index

    for schema_dir in schemas_dir.iterdir():
        if not schema_dir.is_dir():
            continue
        tables_dir = schema_dir / "Tables"
        if not tables_dir.is_dir():
            continue
        for table_file in tables_dir.iterdir():
            if table_file.suffix == ".md":
                index[table_file.stem.upper()] = table_file

    return index


def main():
    parser = argparse.ArgumentParser(
        description="Look up database table definitions from devdb-docs."
    )
    parser.add_argument("project_root", help="Project root directory")
    parser.add_argument("tables", nargs="+", help="Table names to look up")
    parser.add_argument("--verbose", action="store_true", help="Print diagnostics to stderr")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    devdb_path = project_root / "knowledge" / "devdb-docs"

    if not devdb_path.is_dir():
        print(f"Error: devdb-docs not found at {devdb_path}", file=sys.stderr)
        sys.exit(2)

    if args.verbose:
        print(f"Building table index from {devdb_path}", file=sys.stderr)

    table_index = build_table_index(devdb_path)

    if args.verbose:
        print(f"Indexed {len(table_index)} tables across all schemas", file=sys.stderr)

    results = {"found": {}, "not_found": []}

    for table_name in args.tables:
        upper_name = table_name.upper()
        if upper_name in table_index:
            if args.verbose:
                print(f"Found: {upper_name} -> {table_index[upper_name]}", file=sys.stderr)
            results["found"][table_name] = parse_table_file(table_index[upper_name])
        else:
            if args.verbose:
                print(f"Not found: {upper_name}", file=sys.stderr)
            results["not_found"].append(table_name)

    results["summary"] = {
        "requested": len(args.tables),
        "found": len(results["found"]),
        "not_found": len(results["not_found"]),
    }

    json.dump(results, sys.stdout, indent=2)
    print()

    sys.exit(0 if not results["not_found"] else 1)


if __name__ == "__main__":
    main()
