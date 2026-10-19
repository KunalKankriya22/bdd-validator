#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Full-text search across the knowledge base.

Searches vault MDs, devdb-docs, screen analyses, FMB analyses,
and sage-index JSON files. Returns ranked results with file paths
and context snippets.

Outputs JSON to stdout.
"""

import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


MAX_RESULTS = 20
SNIPPET_CONTEXT_LINES = 2


def search_vault_index(project_root: Path, query: str) -> list[dict]:
    index_path = project_root / "knowledge" / ".sage-index" / "vault.index.json"
    if not index_path.is_file():
        return []

    with open(index_path) as f:
        data = json.load(f)

    results = []
    query_lower = query.lower()
    query_words = query_lower.split()

    for name, entry in data.get("entities", {}).items():
        name_lower = name.lower()
        title = entry.get("title", "").lower()
        mnemonic = entry.get("mnemonic", "").lower()
        module = entry.get("module", "").lower()
        sub_module = entry.get("sub_module", "").lower()
        tags = " ".join(entry.get("tags", [])).lower()

        searchable = f"{name_lower} {title} {mnemonic} {module} {sub_module} {tags}"

        score = 0
        for word in query_words:
            if word in searchable:
                score += 1
            if word == name_lower or word == mnemonic:
                score += 3

        if score > 0:
            vault_base = project_root / "knowledge" / "obsidian-vault"
            results.append({
                "source": "vault-index",
                "entity_name": name,
                "type": entry.get("type"),
                "title": entry.get("title", name),
                "module": entry.get("module"),
                "sub_module": entry.get("sub_module"),
                "file_path": str(vault_base / entry.get("file_path", "")),
                "score": score,
                "snippet": f"{entry.get('type', 'unknown')}: {entry.get('title', name)} ({entry.get('module', '')}/{entry.get('sub_module', '')})",
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:MAX_RESULTS]


def search_files(directory: Path, query: str, extensions: tuple, source_label: str) -> list[dict]:
    if not directory.is_dir():
        return []

    results = []
    query_lower = query.lower()
    query_words = query_lower.split()
    query_pattern = re.compile(re.escape(query_lower))

    for root, _dirs, files in os.walk(directory):
        for fname in files:
            if not fname.endswith(extensions):
                continue

            filepath = Path(root) / fname
            try:
                content = filepath.read_text(encoding="utf-8", errors="ignore")
            except (OSError, PermissionError):
                continue

            content_lower = content.lower()
            score = 0

            for word in query_words:
                count = content_lower.count(word)
                if count > 0:
                    score += min(count, 10)

            if fname.lower().replace(".md", "").replace("_", " ") in query_lower:
                score += 5

            if score > 0:
                snippet = extract_snippet(content, query_lower)
                results.append({
                    "source": source_label,
                    "file_path": str(filepath),
                    "file_name": fname,
                    "score": score,
                    "snippet": snippet,
                })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:MAX_RESULTS]


def extract_snippet(content: str, query_lower: str) -> str:
    lines = content.split("\n")
    query_words = query_lower.split()

    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(w in line_lower for w in query_words):
            start = max(0, i - SNIPPET_CONTEXT_LINES)
            end = min(len(lines), i + SNIPPET_CONTEXT_LINES + 1)
            snippet_lines = lines[start:end]
            snippet = "\n".join(l.strip() for l in snippet_lines if l.strip())
            if len(snippet) > 500:
                snippet = snippet[:500] + "..."
            return snippet

    return lines[0].strip() if lines else ""


def search_sage_indexes(project_root: Path, query: str) -> list[dict]:
    sage_dir = project_root / "knowledge" / ".sage-index"
    if not sage_dir.is_dir():
        return []

    results = []
    query_lower = query.lower()
    query_words = query_lower.split()

    for index_file in sage_dir.iterdir():
        if not index_file.name.endswith(".index.json") or index_file.name == "vault.index.json":
            continue

        try:
            with open(index_file) as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError):
            continue

        source_file = data.get("file", index_file.stem)
        file_path = data.get("file_path", "")
        sections = data.get("sections", [])

        for section in sections:
            heading = section.get("heading", "").lower()
            score = sum(1 for w in query_words if w in heading)

            if score > 0:
                results.append({
                    "source": "pdf-index",
                    "file_name": source_file,
                    "file_path": file_path,
                    "section": section.get("heading"),
                    "page": section.get("page"),
                    "score": score,
                    "snippet": f"PDF: {source_file} — Section: {section.get('heading')} (page {section.get('page')})",
                })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:MAX_RESULTS]


def main():
    parser = argparse.ArgumentParser(
        description="Search across the knowledge base for relevant information."
    )
    parser.add_argument("project_root", help="Project root directory")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--max-results", type=int, default=MAX_RESULTS, help="Maximum results per source")
    parser.add_argument("--verbose", action="store_true", help="Print diagnostics to stderr")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    query = args.query

    if args.verbose:
        print(f"Searching for: {query}", file=sys.stderr)

    all_results = []

    if args.verbose:
        print("Searching all sources in parallel...", file=sys.stderr)

    search_tasks = {
        "vault-index": lambda: search_vault_index(project_root, query),
        "screen-analysis": lambda: search_files(
            project_root / "screens", query, (".md",), "screen-analysis"
        ),
        "devdb-docs": lambda: search_files(
            project_root / "knowledge" / "devdb-docs", query, (".md",), "devdb-docs"
        ),
        "obsidian-vault": lambda: search_files(
            project_root / "knowledge" / "obsidian-vault", query, (".md",), "obsidian-vault"
        ),
        "sage-indexes": lambda: search_sage_indexes(project_root, query),
    }

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(fn): name for name, fn in search_tasks.items()
        }
        for future in as_completed(futures):
            source_name = futures[future]
            try:
                results = future.result()
                all_results.extend(results)
                if args.verbose:
                    print(f"  {source_name}: {len(results)} results", file=sys.stderr)
            except Exception as e:
                if args.verbose:
                    print(f"  {source_name}: ERROR - {e}", file=sys.stderr)

    all_results.sort(key=lambda x: x["score"], reverse=True)
    top_results = all_results[:args.max_results]

    output = {
        "query": query,
        "total_matches": len(all_results),
        "results_returned": len(top_results),
        "results": top_results,
    }

    json.dump(output, sys.stdout, indent=2)
    print()

    sys.exit(0 if top_results else 1)


if __name__ == "__main__":
    main()
