---
name: knowledge-qa
description: Answer technical questions about the legacy Blood Center system by searching and cross-referencing the knowledge base.
menu-code: knowledge-qa
---

**Language:** Use {communication_language} for all output.

# Knowledge Q&A

Answer technical questions about the legacy Blood Center system by searching and cross-referencing the knowledge base.

## Process

1. **Understand the question:** Identify what the user is asking about — a specific screen, table, business process, Oracle package, validation rule, or workflow.

2. **Search the knowledge base:** Run `uv run scripts/search-knowledge.py {project-root} "{query}"` to find relevant files across the vault, devdb-docs, screen analyses, and sage indexes.

3. **Read and synthesize:** Read all top results in parallel (batch independent file reads in a single message). Cross-reference multiple sources when they cover the same topic. Cite where each piece of information comes from.

4. **Answer with evidence:** Every claim should reference a specific file and section. If sources conflict, present both versions and note the discrepancy.

## Knowledge Base Sources

| Source | Location | What it contains |
|--------|----------|-----------------|
| Obsidian Vault | `{project-root}/knowledge/obsidian-vault/` | 906 screen definitions, 345 table references, module/submodule hierarchy, screen-to-screen navigation |
| DevDB Docs | `{project-root}/knowledge/devdb-docs/` | Full DDL for 1,096 tables across 30 schemas — columns, types, indexes, triggers, grants |
| Oracle App | `{project-root}/knowledge/oracle-app/` | Legacy source code — SQL scripts, FMB forms, packages, triggers, procedures |
| PDF Guides | `{project-root}/knowledge/*.pdf` | WellSky User Guide, Administration Guide, Reports Guide |
| Sage Indexes | `{project-root}/knowledge/.sage-index/` | Pre-built search indexes for PDFs and vault |
| Screen Analyses | `{project-root}/screens/*/` | Per-screen analysis documents, FMB analyses, screenshots |
| UAT Practices | Look for `*.md` files with UAT/QA content in project root or docs |

## Question Types and Approach

**Screen questions** ("What does screen X do?"): Use `resolve-screen.py` to find all files for that screen, read the vault entry and any existing analysis.

**Table questions** ("What columns does TABLE_X have?"): Use `lookup-tables.py` to pull the full DDL.

**Business process questions** ("How does donation processing work?"): Search for related screens and their workflows, then synthesize the end-to-end flow.

**Package/procedure questions** ("What does PKG_X.procedure_Y do?"): Search in `oracle-app/` for the package source code.

**Validation questions** ("What validates field X?"): Check FMB triggers (WHEN-VALIDATE-ITEM), database constraints, and validation tables.

## Error Handling

- If `search-knowledge.py` returns exit code 1 (no results): don't just say "not found." Offer recovery paths:
  > I searched the knowledge base and didn't find information about "{query}". Here's what I can try:
  > 1. **Broaden the search** — try a related term or module name
  > 2. **List related screens** — I can show screens in the relevant module
  > 3. **Check PDF guides** — the WellSky User Guide may have relevant sections
  > 4. **Search by table** — if you know which DB table is involved, I can find screens that use it
- If `resolve-screen.py` or `lookup-tables.py` fail for a follow-up question: note what failed and provide what information is available from other sources.

## What Success Looks Like

- Answers are grounded in specific files, not general knowledge
- When the knowledge base doesn't contain the answer, say so clearly AND offer alternative search strategies rather than speculating
- Cross-references between sources are surfaced (e.g., "This table is used by 5 screens according to the vault index")
- Technical details include the actual values (column types, trigger names, package signatures), not summaries

## Headless Mode

If `{headless_mode}=true`:
- Use the provided `query` directly — no clarification questions
- Search, read results in parallel, synthesize answer
- On completion, output:

```json
{
  "status": "complete",
  "capability": "knowledge-qa",
  "query": "{original-query}",
  "answer": "{synthesized answer with source citations}",
  "sources": [
    { "file": "{path}", "section": "{section-name}" }
  ],
  "assumptions": [],
  "open_questions": []
}
```

If no results found, return `status: "partial"` with the answer explaining what was searched and suggesting alternative queries in `open_questions`:

```json
{
  "status": "partial",
  "capability": "knowledge-qa",
  "query": "{original-query}",
  "answer": "No information found in the knowledge base for this query.",
  "sources": [],
  "assumptions": [],
  "open_questions": ["Try broader search terms", "Search by related table name", "Check PDF guides manually"]
}
```

## Completion

The capability is complete when:
- The user's question has been answered with evidence from the knowledge base, OR
- The knowledge base has been exhaustively searched and the user has been informed that the answer is not available, with alternative search strategies offered

If the user asks follow-up questions, continue the Q&A session. If they shift to a different capability (screen analysis, BDD generation), route to the appropriate capability.
