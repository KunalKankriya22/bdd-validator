---
name: batch-analysis
description: Analyze multiple screens in one session with parallel processing and produce a prioritized summary report.
menu-code: batch-analysis
---

**Language:** Use {communication_language} for all output.

# Batch Analysis

Analyze multiple screens in one session and produce a summary report across all of them.

## Inputs

The user provides one of:
- **List of mnemonics:** "Analyze screens cpisep, druaudit, cpimaint"
- **Module filter:** "Analyze all screens in the Donor module"
- **Submodule filter:** "Analyze all Component Processing screens"
- **Working folder filter:** "Analyze all screens that have working folders"

## Process

1. **Resolve the screen list:**
   - For explicit mnemonics: validate each exists using `uv run scripts/list-screens.py {project-root} --search "{mnemonic}"`
   - For module/submodule filters: run `uv run scripts/list-screens.py {project-root} --module "{module}"` or `--submodule "{submodule}"`
   - For working folder filter: run `uv run scripts/list-screens.py {project-root} --with-folder`

2. **Confirm with user:** "I found {N} screens matching your criteria: {list}. Analyze all of them?"

3. **Process screens in parallel:** Delegate each screen to an independent subagent running the Screen Analysis capability:
   - Spawn one subagent per screen — each runs the full Screen Analysis independently
   - Each subagent returns: success/failure, discrepancy count by severity, gap count, output file path
   - If a screen fails (missing FMB, etc.), the subagent logs the reason and returns the failure — other screens continue unaffected
   - Show progress as subagents complete: "{completed}/{total} screens analyzed"

4. **Generate batch summary report:** Write to `{agent.screens_base_path}/{agent.batch_summary_filename}`:

### Batch Summary Format

```markdown
# Batch Analysis Summary
**Date:** {timestamp}
**Screens Processed:** {successful} / {total}

## Aggregate Statistics
- Total UI fields mapped: {sum}
- Total discrepancies: {sum} ({critical} Critical, {warning} Warning, {info} Info)
- Total gaps (legacy missing from Figma): {sum}
- Total gaps (Figma missing from legacy): {sum}

## Screens by Priority

**High priority (Critical discrepancies found):**
| Screen | Title | Critical | Warning | Gaps | Analysis |
|--------|-------|----------|---------|------|----------|

**Medium priority (Warnings only):**
| Screen | Title | Warning | Gaps | Analysis |
|--------|-------|---------|------|----------|

**Low priority (Info only or clean):**
| Screen | Title | Info | Analysis |
|--------|-------|------|----------|

## Failed Screens
| Screen | Reason |
|--------|--------|

## Common Patterns
- Tables used by multiple screens: {list with counts}
- Shared validation tables: {list}
- Common Oracle packages: {list}
```

## Headless Mode

If `{headless_mode}=true`:
- Skip batch confirmation ("Analyze all of them?") — proceed with all resolved screens
- Process all screens via parallel subagents (same as interactive)
- If no screens match the filter, halt with `status: "blocked"`
- On completion, output:

```json
{
  "status": "complete",
  "capability": "batch-analysis",
  "output_file": "{path-to-batch-summary}",
  "summary": {
    "screens_processed": 0,
    "screens_total": 0,
    "screens_failed": 0,
    "total_discrepancies": { "critical": 0, "warning": 0, "info": 0 },
    "total_gaps": { "legacy_missing_from_figma": 0, "figma_missing_from_legacy": 0 }
  },
  "per_screen": [
    { "mnemonic": "", "status": "complete|failed", "output_file": "", "reason": "" }
  ],
  "assumptions": [],
  "open_questions": []
}
```

If no screens matched:

```json
{
  "status": "blocked",
  "capability": "batch-analysis",
  "reason": "No screens match the provided filter or mnemonic list",
  "assumptions": [],
  "open_questions": ["Verify mnemonic spelling or try a broader module filter"]
}
```

## Error Handling

- If no screens match the filter: inform the user and suggest broadening the filter or listing available modules with `uv run scripts/list-screens.py {project-root}`
- If a screen fails mid-batch: log the error, skip that screen, continue processing the rest
- If more than half the screens fail: pause and ask the user if they want to continue or investigate the failures first

## What Success Looks Like

- Every matching screen gets a full analysis document or a clear failure reason
- The batch summary gives the team a prioritized view of which screens need the most attention
- Common patterns across screens are surfaced to inform shared component decisions
