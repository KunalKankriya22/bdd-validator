#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Extract dependencies from an Oracle Forms FMB XML file.

Parses the FMB XML to extract:
- Oracle packages and procedures called
- PL/SQL triggers with their types
- LOV/record group queries
- Inherited blocks and property classes
- Screen-to-screen navigation calls (CALL_FORM, OPEN_FORM, NEW_FORM)
- Database table references from block DataSourceName
- Error codes referenced

Outputs JSON to stdout.
"""

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def extract_packages(program_units: list[str], trigger_code: list[str]) -> list[dict]:
    all_code = "\n".join(program_units + trigger_code)

    pkg_pattern = re.compile(r'\b([A-Z_][A-Z0-9_]*)\s*\.\s*([A-Z_][A-Z0-9_]*)\s*\(', re.IGNORECASE)
    packages = {}

    for match in pkg_pattern.finditer(all_code):
        pkg_name = match.group(1).upper()
        proc_name = match.group(2).upper()

        if pkg_name in ("SYSTEM", "NAME_IN", "COPY", "SET_ITEM_PROPERTY",
                        "GET_ITEM_PROPERTY", "SET_BLOCK_PROPERTY",
                        "GET_BLOCK_PROPERTY", "SET_WINDOW_PROPERTY"):
            continue

        key = f"{pkg_name}.{proc_name}"
        if key not in packages:
            packages[key] = {"package": pkg_name, "procedure": proc_name, "call_count": 0}
        packages[key]["call_count"] += 1

    return sorted(packages.values(), key=lambda x: x["call_count"], reverse=True)


def extract_procedure_calls(program_units: list[str], trigger_code: list[str]) -> list[dict]:
    all_code = "\n".join(program_units + trigger_code)

    proc_pattern = re.compile(r'^\s*([a-z_][a-z0-9_]*)\s*\(', re.IGNORECASE | re.MULTILINE)
    builtins = {
        "if", "elsif", "while", "for", "loop", "begin", "end", "return",
        "raise", "exception", "when", "then", "else", "declare", "is",
        "as", "select", "insert", "update", "delete", "from", "where",
        "and", "or", "not", "in", "between", "like", "null", "into",
        "values", "set", "commit", "rollback", "cursor", "open", "close",
        "fetch", "exit", "pragma", "type", "record", "table", "index",
        "varchar2", "number", "date", "boolean", "char", "integer",
        "substr", "to_char", "to_date", "to_number", "nvl", "decode",
        "trim", "ltrim", "rtrim", "upper", "lower", "length", "replace",
        "instr", "lpad", "rpad", "round", "trunc", "mod", "abs",
        "sysdate", "user",
    }

    procedures = {}
    for match in proc_pattern.finditer(all_code):
        name = match.group(1).lower()
        if name in builtins:
            continue
        if name not in procedures:
            procedures[name] = 0
        procedures[name] += 1

    return [
        {"name": name, "call_count": count}
        for name, count in sorted(procedures.items(), key=lambda x: x[1], reverse=True)
        if count > 0
    ][:30]


def extract_screen_calls(program_units: list[str], trigger_code: list[str]) -> list[dict]:
    all_code = "\n".join(program_units + trigger_code)

    call_pattern = re.compile(
        r'(CALL_FORM|OPEN_FORM|NEW_FORM)\s*\(\s*[\'"]([^\'"]+)[\'"]',
        re.IGNORECASE
    )

    calls = []
    seen = set()
    for match in call_pattern.finditer(all_code):
        call_type = match.group(1).upper()
        form_name = match.group(2)
        key = f"{call_type}:{form_name}"
        if key not in seen:
            seen.add(key)
            calls.append({
                "call_type": call_type,
                "form_name": form_name,
            })

    return calls


def extract_error_codes(program_units: list[str], trigger_code: list[str]) -> list[str]:
    all_code = "\n".join(program_units + trigger_code)

    error_pattern = re.compile(r"(?:show_error|handle_error|error_code)\s*\(\s*['\"](\d{4,5})['\"]", re.IGNORECASE)

    codes = set()
    for match in error_pattern.finditer(all_code):
        codes.add(match.group(1))

    return sorted(codes)


def parse_fmb_xml(filepath: Path) -> dict:
    try:
        tree = ET.parse(filepath)
    except ET.ParseError as e:
        print(f"Error parsing XML: {e}", file=sys.stderr)
        sys.exit(2)

    root = tree.getroot()

    ns = ""
    tag = root.tag
    if "}" in tag:
        ns = tag.split("}")[0] + "}"

    def find(tag_name: str):
        return root.iter(f"{ns}{tag_name}")

    blocks = []
    db_tables = set()
    inherited_blocks = []

    for block in find("Block"):
        block_info = {
            "name": block.get("Name", ""),
            "is_database_block": block.get("DatabaseBlock", "false").lower() == "true",
            "data_source": block.get("DataSourceName", ""),
            "parent_module": block.get("ParentModule", ""),
            "parent_name": block.get("ParentName", ""),
            "records_displayed": block.get("RecordsDisplayed", ""),
            "item_count": len(list(block.iter(f"{ns}Item"))),
        }
        blocks.append(block_info)

        if block_info["data_source"]:
            db_tables.add(block_info["data_source"].upper())

        if block_info["parent_module"]:
            inherited_blocks.append({
                "block_name": block_info["name"],
                "parent_module": block_info["parent_module"],
                "parent_name": block_info["parent_name"],
            })

    triggers = []
    trigger_code_list = []
    for trigger in find("Trigger"):
        name = trigger.get("Name", "")
        trigger_type = trigger.get("TriggerType", "")
        code = trigger.get("TriggerText", "")
        triggers.append({
            "name": name,
            "type": trigger_type,
            "has_code": bool(code and code.strip()),
            "code_length": len(code) if code else 0,
        })
        if code:
            trigger_code_list.append(code)

    program_units = []
    program_unit_code = []
    for pu in find("ProgramUnit"):
        name = pu.get("Name", "")
        pu_type = pu.get("ProgramUnitType", "")
        code = pu.get("ProgramUnitText", "")
        program_units.append({
            "name": name,
            "type": pu_type,
            "has_code": bool(code and code.strip()),
            "code_length": len(code) if code else 0,
        })
        if code:
            program_unit_code.append(code)

    lov_queries = []
    for rg in find("RecordGroup"):
        name = rg.get("Name", "")
        query = rg.get("RecordGroupQuery", "")
        rg_type = rg.get("RecordGroupType", "")
        if query:
            tables_in_query = re.findall(r'\bFROM\s+(\w+)', query, re.IGNORECASE)
            lov_queries.append({
                "name": name,
                "type": rg_type,
                "query_preview": query[:200] + ("..." if len(query) > 200 else ""),
                "tables_referenced": [t.upper() for t in tables_in_query],
            })
            for t in tables_in_query:
                db_tables.add(t.upper())

    property_classes = []
    for pc in find("PropertyClass"):
        parent_mod = pc.get("ParentModule", "")
        if parent_mod:
            property_classes.append({
                "name": pc.get("Name", ""),
                "parent_module": parent_mod,
            })

    packages = extract_packages(program_unit_code, trigger_code_list)
    procedures = extract_procedure_calls(program_unit_code, trigger_code_list)
    screen_calls = extract_screen_calls(program_unit_code, trigger_code_list)
    error_codes = extract_error_codes(program_unit_code, trigger_code_list)

    form_module = root
    for fm in find("FormModule"):
        form_module = fm
        break

    form_name = form_module.get("Name", root.get("Name", filepath.stem))
    form_title = form_module.get("Title", root.get("Title", ""))

    return {
        "form_name": form_name,
        "form_title": form_title,
        "file_path": str(filepath),
        "blocks": blocks,
        "database_tables": sorted(db_tables),
        "inherited_blocks": inherited_blocks,
        "property_classes": property_classes,
        "triggers": {
            "count": len(triggers),
            "items": triggers,
        },
        "program_units": {
            "count": len(program_units),
            "items": program_units,
        },
        "oracle_packages": packages,
        "procedure_calls": procedures,
        "lov_queries": lov_queries,
        "screen_navigation": screen_calls,
        "error_codes": error_codes,
        "summary": {
            "block_count": len(blocks),
            "db_block_count": sum(1 for b in blocks if b["is_database_block"]),
            "table_count": len(db_tables),
            "trigger_count": len(triggers),
            "program_unit_count": len(program_units),
            "package_call_count": len(packages),
            "lov_count": len(lov_queries),
            "nav_call_count": len(screen_calls),
            "inherited_block_count": len(inherited_blocks),
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Extract dependencies from an Oracle Forms FMB XML file."
    )
    parser.add_argument("fmb_xml", help="Path to the FMB XML file")
    parser.add_argument("--verbose", action="store_true", help="Print diagnostics to stderr")
    args = parser.parse_args()

    filepath = Path(args.fmb_xml).resolve()
    if not filepath.is_file():
        print(f"Error: file not found: {filepath}", file=sys.stderr)
        sys.exit(2)

    if args.verbose:
        print(f"Parsing: {filepath}", file=sys.stderr)

    result = parse_fmb_xml(filepath)

    if args.verbose:
        s = result["summary"]
        print(f"Blocks: {s['block_count']} ({s['db_block_count']} database)", file=sys.stderr)
        print(f"Tables: {s['table_count']}", file=sys.stderr)
        print(f"Triggers: {s['trigger_count']}", file=sys.stderr)
        print(f"Program units: {s['program_unit_count']}", file=sys.stderr)
        print(f"Package calls: {s['package_call_count']}", file=sys.stderr)
        print(f"LOV queries: {s['lov_count']}", file=sys.stderr)
        print(f"Screen navigation: {s['nav_call_count']}", file=sys.stderr)

    json.dump(result, sys.stdout, indent=2)
    print()

    sys.exit(0)


if __name__ == "__main__":
    main()
