#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Resolve all files related to a screen mnemonic.

Given a screen mnemonic (e.g., cpisep), finds:
- Screen working folder contents (FMB XML, analysis MDs, screenshots)
- Obsidian vault entry with module/submodule/relationships
- Referenced DB tables and their DDL file paths in devdb-docs
- FMB XML location in oracle-app (if not in screen folder)

Outputs JSON manifest to stdout.
"""

import argparse
import json
import os
import sys
from pathlib import Path


def find_screen_folder(project_root: Path, mnemonic: str) -> dict | None:
    screen_dir = project_root / "screens" / mnemonic
    if not screen_dir.is_dir():
        return None

    contents = {
        "path": str(screen_dir),
        "fmb_xml": None,
        "fmb_analysis": None,
        "screen_analysis": None,
        "legacy_screenshot": None,
        "figma_screenshots": [],
        "other_files": [],
    }

    for f in sorted(screen_dir.iterdir()):
        if f.name.startswith("."):
            continue
        name_lower = f.name.lower()
        if name_lower.endswith("_fmb.xml"):
            contents["fmb_xml"] = str(f)
        elif name_lower.endswith("-fmb-analysis.md"):
            contents["fmb_analysis"] = str(f)
        elif name_lower.endswith("-screen-analysis.md") and not name_lower.endswith(".bak.md"):
            contents["screen_analysis"] = str(f)
        elif name_lower == "legacy.png":
            contents["legacy_screenshot"] = str(f)
        elif name_lower.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
            contents["figma_screenshots"].append(str(f))
        else:
            contents["other_files"].append(str(f))

    return contents


def find_vault_entry(project_root: Path, mnemonic: str) -> dict | None:
    index_path = project_root / "knowledge" / ".sage-index" / "vault.index.json"
    if not index_path.is_file():
        print(f"Warning: vault index not found at {index_path}", file=sys.stderr)
        return None

    with open(index_path) as f:
        index_data = json.load(f)

    entities = index_data.get("entities", {})

    entry = entities.get(mnemonic)
    if entry and entry.get("type") == "screen":
        vault_base = project_root / "knowledge" / "obsidian-vault"
        file_path = entry.get("file_path", "")
        entry["absolute_path"] = str(vault_base / file_path)
        return entry

    for key, val in entities.items():
        if val.get("type") == "screen" and val.get("mnemonic") == mnemonic:
            vault_base = project_root / "knowledge" / "obsidian-vault"
            file_path = val.get("file_path", "")
            val["absolute_path"] = str(vault_base / file_path)
            return val

    return None


def find_table_ddl_paths(project_root: Path, table_names: list[str]) -> dict:
    devdb = project_root / "knowledge" / "devdb-docs" / "schemas"
    if not devdb.is_dir():
        return {}

    table_index = {}
    for schema_dir in devdb.iterdir():
        if not schema_dir.is_dir():
            continue
        tables_dir = schema_dir / "Tables"
        if not tables_dir.is_dir():
            continue
        for table_file in tables_dir.iterdir():
            if table_file.suffix == ".md":
                table_index[table_file.stem.upper()] = str(table_file)

    results = {}
    for name in table_names:
        upper_name = name.upper()
        if upper_name in table_index:
            results[name] = table_index[upper_name]
        else:
            results[name] = None

    return results


def find_fmb_in_oracle_app(project_root: Path, mnemonic: str) -> str | None:
    oracle_app = project_root / "knowledge" / "oracle-app"
    if not oracle_app.is_dir():
        return None

    target_names = [f"{mnemonic}_fmb.xml", f"{mnemonic}.fmb.xml", f"{mnemonic}.fmb"]
    for root, _dirs, files in os.walk(oracle_app):
        for fname in files:
            if fname.lower() in target_names:
                return str(Path(root) / fname)
    return None


def extract_table_names_from_vault(vault_entry: dict) -> list[str]:
    if not vault_entry:
        return []

    tables = []
    relationships = vault_entry.get("relationships", {})

    for key in ("tables", "lov_sources", "read_write_screens"):
        if key == "read_write_screens":
            continue
        refs = relationships.get(key, [])
        tables.extend(refs)

    return list(set(tables))


def main():
    parser = argparse.ArgumentParser(
        description="Resolve all files related to a screen mnemonic."
    )
    parser.add_argument("project_root", help="Project root directory")
    parser.add_argument("mnemonic", help="Screen mnemonic (e.g., cpisep)")
    parser.add_argument("--verbose", action="store_true", help="Print diagnostics to stderr")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    mnemonic = args.mnemonic.lower()

    if args.verbose:
        print(f"Resolving screen: {mnemonic}", file=sys.stderr)
        print(f"Project root: {project_root}", file=sys.stderr)

    manifest = {
        "mnemonic": mnemonic,
        "project_root": str(project_root),
        "screen_folder": None,
        "vault_entry": None,
        "referenced_tables": [],
        "table_ddl_paths": {},
        "fmb_xml_oracle_app": None,
    }

    manifest["screen_folder"] = find_screen_folder(project_root, mnemonic)

    manifest["vault_entry"] = find_vault_entry(project_root, mnemonic)

    table_names = extract_table_names_from_vault(manifest["vault_entry"])
    manifest["referenced_tables"] = sorted(table_names)

    if table_names:
        manifest["table_ddl_paths"] = find_table_ddl_paths(project_root, table_names)

    if manifest["screen_folder"] is None or manifest["screen_folder"]["fmb_xml"] is None:
        manifest["fmb_xml_oracle_app"] = find_fmb_in_oracle_app(project_root, mnemonic)

    has_data = manifest["screen_folder"] or manifest["vault_entry"]

    if args.verbose:
        screen_files = "found" if manifest["screen_folder"] else "not found"
        vault = "found" if manifest["vault_entry"] else "not found"
        tables = len(manifest["referenced_tables"])
        print(f"Screen folder: {screen_files}", file=sys.stderr)
        print(f"Vault entry: {vault}", file=sys.stderr)
        print(f"Referenced tables: {tables}", file=sys.stderr)

    json.dump(manifest, sys.stdout, indent=2)
    print()

    sys.exit(0 if has_data else 1)


if __name__ == "__main__":
    main()
