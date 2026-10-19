---
name: wcag-scan-fix-report
description: Full WCAG accessibility pipeline — scans for issues, applies fixes, reviews with Opus, iterates until zero issues, then generates a scored PDF report with conditional sections based on accessibility score
---

# WCAG Full Pipeline Command

You are orchestrating a complete WCAG accessibility pipeline. This command chains scan → fix → review in a loop until no issues remain, then generates a structured PDF accessibility report.

**Do not modify any individual sub-skill files.** This orchestrator calls them in sequence.

---

## Pipeline Overview

```
┌──────────────────────────────────────────────────────────┐
│                  WCAG Full Pipeline                      │
│                                                          │
│  [1] wcag-scan  ──► issues found?                       │
│         │                 │                              │
│         │ No issues       │ Yes                         │
│         ▼                 ▼                              │
│      [5] Report    [2] wcag-fix                         │
│      Generation        │                                │
│                        ▼                                │
│                   [3] wcag-review                       │
│                        │                                │
│                        ▼                                │
│                   [4] re-scan ──► score ≥90 AND          │
│                        │          no critical/serious?  │
│                        │               │                │
│                        │ 0 issues   Yes: skip minor/mod │
│                        │  OR early  ▼                   │
│                        │  exit   [5] parse-axe-report   │
│                        └────────────►│                  │
│                                      ▼                  │
│                                 [6] Score & PDF         │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 1: Initial Setup

Before scanning, collect the target scope:

1. If the user provided `--files=<path>`, use that path for all phases.
2. Otherwise, scan from the current working directory.
3. Create the output directory:
   ```bash
   mkdir -p thoughts/wcag
   ```
4. Record the start timestamp and git context:
   ```bash
   git branch --show-current
   git rev-parse --short HEAD
   ```
5. Initialize an **iteration counter** at `0` and a **max iterations guard** at `10` to prevent infinite loops.

---

## Phase 2: Run wcag-scan (Sub-Skill)

Invoke the `wcag-scan` sub-skill using the Skill tool:

```
Use the wcag-scan-fix-report:wcag-scan skill to scan [target files/directory].
Pass any --files, --level, or --format options the user provided.
```

After the scan completes:

- **Capture the full scan report** including all identified issues grouped by severity (critical, serious, moderate, minor).
- **Count total issues**: `totalIssues = critical + serious + moderate + minor`.
- Save the scan result to `thoughts/wcag/scan-iteration-[N].md` where N is the current iteration number.

If `totalIssues === 0`:
- Skip to **Phase 6: Report Generation** — no fixes needed.

---

## Phase 3: Run wcag-fix (Sub-Skill)

Invoke the `wcag-fix` sub-skill using the Skill tool:

```
Use the wcag-scan-fix-report:wcag-fix skill to apply fixes for the issues identified in the scan.
Use --auto-apply mode since the user has already approved the pipeline by invoking this command.
Focus on the same files from the scan.
```

After fixes are applied:
- **Record all applied fixes**: file paths, issue types, WCAG criteria addressed.
- **Record any skipped fixes**: issues that required manual intervention.
- Save the fix summary to `thoughts/wcag/fix-iteration-[N].md`.

---

## Phase 4: Run wcag-review (Sub-Skill)

Invoke the `wcag-review` sub-skill using the Skill tool:

```
Use the wcag-scan-fix-report:wcag-review skill to perform expert QA review of the fixes just applied.
Review the same files that were modified in the fix phase.
```

After review completes:
- **Capture the review report**: quality score, validated fixes, flagged issues, gray areas, manual testing recommendations.
- Save the review report to `thoughts/wcag/review-iteration-[N].md`.
- Extract any issues the review identified that still need attention.

---

## Phase 5: Re-Scan Loop Check

After the review, increment the iteration counter and re-run the scan on the same files:

```
Use the wcag-scan-fix-report:wcag-scan skill to re-scan [same target files].
```

Evaluate the result:

| Condition | Action |
|-----------|--------|
| `newIssues === 0` | Proceed to Phase 6 |
| `score ≥ 90 AND critical === 0 AND serious === 0` | **Early exit** — skip remaining minor/moderate, proceed to Phase 6 |
| `newIssues > 0 AND iteration < maxIterations` | Return to Phase 3 (wcag-fix) |
| `iteration >= maxIterations` | Log warning, proceed to Phase 6 with remaining issues noted |

### Early-Exit Threshold (score ≥ 90, no critical/serious)

When the re-scan score is **90 or above** **and** there are zero critical and zero serious issues remaining, stop iterating. The remaining moderate and minor issues are not worth the additional pipeline time at this score level.

Log the following notice before proceeding to Phase 6:

```
ℹ️  Early-exit threshold reached (score: [SCORE]/100).
    No critical or serious issues remain.
    [N] moderate and [M] minor issues are being skipped — they will be
    documented in the report under "Can Do Better" for manual follow-up.
```

These skipped issues must still be included in the final report's **"Can Do Better"** section so they are not silently dropped.

**Iteration limit warning** (if max reached):
```
⚠️  Maximum iteration limit (10) reached. [N] issues remain that could not be fully resolved automatically.
These will be documented in the report under "Requires Manual Review".
```

---

## Phase 6: Generate WCAG JSON via parse-axe-report (Sub-Skill)

Invoke the `parse-axe-report` sub-skill using the Skill tool, passing the **accumulated findings** from all iterations:

```
Use the wcag-scan-fix-report:parse-axe-report skill to generate a structured WCAG JSON from the final scan results.
```

The sub-skill will produce a JSON object structured as:
```json
{
  "summary": {
    "totalViolations": <number>,
    "critical": <number>,
    "serious": <number>,
    "moderate": <number>,
    "minor": <number>
  },
  "violations": [ ... ],
  "frameworkSpecificAdvice": { ... }
}
```

Save this JSON to `thoughts/wcag/wcag-report-final.json`.

---

## Phase 7: Read Accessibility Score from parse-axe-report Output

**Do not calculate your own score.** The `parse-axe-report` skill produces an accessibility score as part of its output. Extract that score directly from the skill's result.

Look for the score field in the parse-axe-report output (it may appear as `score`, `accessibilityScore`, or equivalent — use whatever field name the skill returns). This is the authoritative value for the rest of the pipeline.

**Score interpretation**:

| Score | Rating | Report Section |
|-------|--------|----------------|
| 95–100 | Excellent | Summary + "Can Do Better" |
| 85–94 | Good | Summary + "Can Do Better" |
| < 85 | Needs Work | Summary + "What Needs to Be Improvised" |

---

## Phase 8: Generate PDF Report

### Step 8a: Build the HTML Report

Construct a well-structured HTML document. Use the following template, filling in all values:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WCAG Accessibility Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1a1a2e;
      background: #ffffff;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 28px; color: #0066cc; margin-bottom: 6px; }
    .header .meta { font-size: 12px; color: #666; }
    .score-banner {
      border-radius: 8px;
      padding: 24px 32px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .score-banner.excellent { background: #e8f5e9; border-left: 6px solid #2e7d32; }
    .score-banner.good      { background: #e3f2fd; border-left: 6px solid #0066cc; }
    .score-banner.needs-work{ background: #fff3e0; border-left: 6px solid #e65100; }
    .score-number { font-size: 56px; font-weight: 700; }
    .score-banner.excellent .score-number { color: #2e7d32; }
    .score-banner.good      .score-number { color: #0066cc; }
    .score-banner.needs-work .score-number { color: #e65100; }
    .score-label { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
    .score-sub   { font-size: 13px; color: #555; }
    .section { margin-bottom: 36px; }
    .section h2 {
      font-size: 20px;
      color: #0066cc;
      border-bottom: 1px solid #dde;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      border-radius: 6px;
      padding: 14px;
      text-align: center;
    }
    .stat-card.critical  { background: #ffebee; border: 1px solid #ef9a9a; }
    .stat-card.serious   { background: #fff3e0; border: 1px solid #ffcc80; }
    .stat-card.moderate  { background: #fffde7; border: 1px solid #fff176; }
    .stat-card.minor     { background: #f3e5f5; border: 1px solid #ce93d8; }
    .stat-card .count { font-size: 32px; font-weight: 700; }
    .stat-card.critical  .count { color: #c62828; }
    .stat-card.serious   .count { color: #e65100; }
    .stat-card.moderate  .count { color: #f9a825; }
    .stat-card.minor     .count { color: #7b1fa2; }
    .stat-card .label { font-size: 12px; color: #555; margin-top: 2px; }
    .iteration-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .iteration-table th {
      background: #0066cc;
      color: #fff;
      padding: 10px 12px;
      text-align: left;
    }
    .iteration-table td { padding: 9px 12px; border-bottom: 1px solid #eee; }
    .iteration-table tr:nth-child(even) td { background: #f5f8ff; }
    .violation-item {
      border: 1px solid #dde;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .violation-item .v-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 6px;
    }
    .badge.critical  { background: #ffebee; color: #c62828; }
    .badge.serious   { background: #fff3e0; color: #e65100; }
    .badge.moderate  { background: #fffde7; color: #f57f17; }
    .badge.minor     { background: #f3e5f5; color: #7b1fa2; }
    .improvement-card {
      border-left: 4px solid #0066cc;
      background: #f5f8ff;
      border-radius: 0 6px 6px 0;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .improvement-card h4 { font-size: 14px; color: #0066cc; margin-bottom: 6px; }
    .improvement-card p  { font-size: 13px; color: #333; }
    .remaining-item {
      border-left: 4px solid #e65100;
      background: #fff8f5;
      border-radius: 0 6px 6px 0;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .remaining-item h4 { font-size: 14px; color: #e65100; margin-bottom: 6px; }
    .checklist { list-style: none; padding: 0; }
    .checklist li { padding: 6px 0; padding-left: 24px; position: relative; font-size: 13px; }
    .checklist li::before { content: "☐"; position: absolute; left: 0; color: #0066cc; }
    .footer {
      margin-top: 48px;
      border-top: 1px solid #dde;
      padding-top: 16px;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      .score-banner { break-inside: avoid; }
      .violation-item { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <h1>WCAG Accessibility Report</h1>
    <div class="meta">
      Generated: {{DATE}} &nbsp;|&nbsp; Branch: {{BRANCH}} &nbsp;|&nbsp;
      Commit: {{COMMIT}} &nbsp;|&nbsp; Framework: {{FRAMEWORK}} &nbsp;|&nbsp;
      Target: {{TARGET_PATH}} &nbsp;|&nbsp; Iterations: {{ITERATIONS}}
    </div>
  </div>

  <!-- SCORE BANNER -->
  <div class="score-banner {{SCORE_CLASS}}">
    <div>
      <div class="score-label">Accessibility Score</div>
      <div class="score-sub">WCAG 2.1 Level AA &nbsp;|&nbsp; {{RATING}}</div>
    </div>
    <div class="score-number">{{SCORE}}</div>
  </div>

  <!-- ══════════════════════════════════════════════════════════ -->
  <!-- SECTION 1: SUMMARY                                         -->
  <!-- ══════════════════════════════════════════════════════════ -->
  <div class="section">
    <h2>Summary</h2>

    <!-- Violation counts -->
    <div class="stats-grid">
      <div class="stat-card critical">
        <div class="count">{{CRITICAL_COUNT}}</div>
        <div class="label">Critical</div>
      </div>
      <div class="stat-card serious">
        <div class="count">{{SERIOUS_COUNT}}</div>
        <div class="label">Serious</div>
      </div>
      <div class="stat-card moderate">
        <div class="count">{{MODERATE_COUNT}}</div>
        <div class="label">Moderate</div>
      </div>
      <div class="stat-card minor">
        <div class="count">{{MINOR_COUNT}}</div>
        <div class="label">Minor</div>
      </div>
    </div>

    <!-- Iteration history table -->
    <table class="iteration-table">
      <thead>
        <tr>
          <th>Iteration</th>
          <th>Issues Found</th>
          <th>Issues Fixed</th>
          <th>Remaining</th>
          <th>Review Outcome</th>
        </tr>
      </thead>
      <tbody>
        {{ITERATION_ROWS}}
        <!-- Each row: <tr><td>1</td><td>12</td><td>10</td><td>2</td><td>Passed QA</td></tr> -->
      </tbody>
    </table>

    <!-- Resolved violations list -->
    {{#if RESOLVED_VIOLATIONS}}
    <h3 style="margin-top:20px; margin-bottom:12px; font-size:16px; color:#2e7d32;">
      ✅ Resolved ({{RESOLVED_COUNT}} issues fixed across {{ITERATIONS}} iteration(s))
    </h3>
    {{RESOLVED_VIOLATIONS_HTML}}
    {{/if}}

    <!-- Remaining violations (if any) -->
    {{#if REMAINING_VIOLATIONS}}
    <h3 style="margin-top:20px; margin-bottom:12px; font-size:16px; color:#c62828;">
      ⚠️ Requires Manual Review ({{REMAINING_COUNT}} issues)
    </h3>
    {{REMAINING_VIOLATIONS_HTML}}
    {{/if}}
  </div>

  <!-- ══════════════════════════════════════════════════════════ -->
  <!-- SECTION 2a: CAN DO BETTER  (score >= 85)                   -->
  <!-- ══════════════════════════════════════════════════════════ -->
  {{#if SCORE_GOOD}}
  <div class="section">
    <h2>Can Do Better</h2>
    <p style="margin-bottom:16px; color:#555; font-size:13px;">
      Your accessibility score is <strong>{{SCORE}}/100</strong>. The critical issues have been resolved.
      The following enhancements will push your score closer to 100 and improve the experience
      for users of assistive technologies.
    </p>

    {{IMPROVEMENT_ITEMS_HTML}}
    <!-- Each item rendered as:
    <div class="improvement-card">
      <h4>[Improvement title — WCAG X.X.X]</h4>
      <p>[Specific, actionable recommendation]</p>
    </div>
    -->

    <h3 style="margin-top:24px; margin-bottom:12px; font-size:15px;">Recommended Manual Validation</h3>
    <ul class="checklist">
      <li>Navigate the entire page using only the keyboard (Tab, Shift+Tab, Enter, Arrow keys)</li>
      <li>Test with a screen reader: NVDA (Windows), VoiceOver (macOS/iOS), or TalkBack (Android)</li>
      <li>Verify all form error messages are announced by screen readers</li>
      <li>Check color contrast for custom colors using the WebAIM Contrast Checker</li>
      <li>Validate dynamic content updates are announced via ARIA live regions</li>
      <li>Run axe-core browser extension for any pages not covered by the automated scan</li>
    </ul>
  </div>
  {{/if}}

  <!-- ══════════════════════════════════════════════════════════ -->
  <!-- SECTION 2b: WHAT NEEDS TO BE IMPROVISED  (score < 85)      -->
  <!-- ══════════════════════════════════════════════════════════ -->
  {{#if SCORE_NEEDS_WORK}}
  <div class="section">
    <h2>What Needs to Be Improvised</h2>
    <p style="margin-bottom:16px; color:#555; font-size:13px;">
      Your accessibility score is <strong>{{SCORE}}/100</strong>. There are significant accessibility
      barriers that may prevent users with disabilities from using this application.
      Address the following issues prioritized by severity.
    </p>

    {{REMAINING_ISSUES_HTML}}
    <!-- Each item rendered as:
    <div class="remaining-item">
      <h4>[Critical/Serious issue — WCAG X.X.X — File: path/to/file.ts]</h4>
      <p>[Specific fix recommendation with code example if applicable]</p>
    </div>
    -->

    <h3 style="margin-top:24px; margin-bottom:12px; font-size:15px;">Immediate Action Checklist</h3>
    <ul class="checklist">
      <li>Fix all <strong>Critical</strong> violations immediately — these block assistive technology users entirely</li>
      <li>Fix all <strong>Serious</strong> violations before next release — these significantly impair usability</li>
      <li>Add <code>aria-label</code> or visible text to all interactive elements without labels</li>
      <li>Ensure every form input has a programmatically associated <code>&lt;label&gt;</code></li>
      <li>Verify heading hierarchy is logical and sequential (h1 → h2 → h3)</li>
      <li>Ensure keyboard focus indicators are visible on all interactive elements</li>
      <li>Add <code>alt</code> text to all informational images; set <code>alt=""</code> for decorative images</li>
      <li>Validate color contrast ratio meets 4.5:1 (normal text) and 3:1 (large text)</li>
      <li>Re-run <code>/wcag-scan</code> after each fix batch to track progress</li>
    </ul>

    <h3 style="margin-top:24px; margin-bottom:12px; font-size:15px;">Framework-Specific Guidance</h3>
    {{FRAMEWORK_ADVICE_HTML}}
  </div>
  {{/if}}

  <div class="footer">
    WellSky WCAG Accessibility Report &nbsp;|&nbsp; Generated by Claude Code wcag-scan-fix-report pipeline
    &nbsp;|&nbsp; WCAG 2.1 Level AA &nbsp;|&nbsp; {{DATE}}
  </div>

</body>
</html>
```

Replace all `{{PLACEHOLDER}}` tokens with real values derived from the pipeline results:

| Placeholder | Source |
|-------------|--------|
| `{{DATE}}` | Current date/time (`date "+%Y-%m-%d %H:%M"`) |
| `{{BRANCH}}` | `git branch --show-current` |
| `{{COMMIT}}` | `git rev-parse --short HEAD` |
| `{{FRAMEWORK}}` | Detected framework from Phase 2 |
| `{{TARGET_PATH}}` | Files/directory scanned |
| `{{ITERATIONS}}` | Total loop iterations completed |
| `{{SCORE}}` | Calculated score (0–100) |
| `{{SCORE_CLASS}}` | `excellent` (95–100), `good` (85–94), `needs-work` (<85) |
| `{{RATING}}` | `Excellent` / `Good` / `Needs Work` |
| `{{CRITICAL_COUNT}}` etc. | From final parse-axe-report JSON |
| `{{ITERATION_ROWS}}` | One `<tr>` per iteration with issue counts |
| `{{RESOLVED_VIOLATIONS_HTML}}` | Violations fixed during the pipeline |
| `{{REMAINING_VIOLATIONS_HTML}}` | Violations requiring manual review |
| `{{IMPROVEMENT_ITEMS_HTML}}` | Populated when score ≥ 85 |
| `{{REMAINING_ISSUES_HTML}}` | Populated when score < 85 |
| `{{FRAMEWORK_ADVICE_HTML}}` | `frameworkSpecificAdvice` from JSON |
| `{{SCORE_GOOD}}` | `true` when score ≥ 85 |
| `{{SCORE_NEEDS_WORK}}` | `true` when score < 85 |

Save the HTML to `thoughts/wcag/wcag-report-final.html`.

---

### Step 8b: Convert HTML to PDF

Try the following conversion methods in order, stopping at the first success:

**Method 1 — Node.js Puppeteer** (if puppeteer is installed globally or in node_modules):
```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://$(pwd)/thoughts/wcag/wcag-report-final.html', { waitUntil: 'networkidle0' });
  await page.pdf({
    path: 'thoughts/wcag/wcag-report-final.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  await browser.close();
  console.log('PDF generated successfully');
})();
"
```

**Method 2 — wkhtmltopdf** (if installed):
```bash
wkhtmltopdf \
  --page-size A4 \
  --margin-top 20mm --margin-bottom 20mm \
  --margin-left 15mm --margin-right 15mm \
  --enable-local-file-access \
  thoughts/wcag/wcag-report-final.html \
  thoughts/wcag/wcag-report-final.pdf
```

**Method 3 — Python WeasyPrint** (if installed):
```bash
python3 -c "
from weasyprint import HTML
HTML(filename='thoughts/wcag/wcag-report-final.html').write_pdf('thoughts/wcag/wcag-report-final.pdf')
print('PDF generated successfully')
"
```

**Method 4 — macOS Chrome headless** (macOS only):
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless \
  --disable-gpu \
  --print-to-pdf=thoughts/wcag/wcag-report-final.pdf \
  --print-to-pdf-no-header \
  thoughts/wcag/wcag-report-final.html 2>/dev/null
```

**Method 5 — Fallback** (if all above fail):
Notify the user:
```
⚠️  PDF conversion tools not available. The HTML report has been saved at:
    thoughts/wcag/wcag-report-final.html

To convert manually:
  • Open in Chrome/Edge → File → Print → Save as PDF
  • Install wkhtmltopdf: brew install wkhtmltopdf
  • Install puppeteer: npm install -g puppeteer
```

---

## Phase 9: Final Output

After all phases complete, print a summary to the user:

```markdown
## ✅ WCAG Full Pipeline Complete

**Score**: [SCORE]/100  ([RATING])
**Framework**: [FRAMEWORK]
**Iterations**: [N]
**Files Modified**: [COUNT]

### Pipeline Results:
- Issues Found (initial): [N]
- Issues Fixed: [N]
- Issues Remaining (manual): [N]
- Review Outcome: [Passed QA / Partial]

### Artifacts:
- 📊 Final JSON:   thoughts/wcag/wcag-report-final.json
- 🌐 HTML Report:  thoughts/wcag/wcag-report-final.html
- 📄 PDF Report:   thoughts/wcag/wcag-report-final.pdf
- 📁 Scan Logs:    thoughts/wcag/scan-iteration-*.md
- 📁 Fix Logs:     thoughts/wcag/fix-iteration-*.md
- 📁 Review Logs:  thoughts/wcag/review-iteration-*.md

### PDF Sections:
[If score >= 85]  → Summary + "Can Do Better"
[If score < 85]   → Summary + "What Needs to Be Improvised"
```

---

## Options Reference

| Option | Description | Example |
|--------|-------------|---------|
| `--files=<path>` | Scope scan to specific path | `/wcag-scan-fix-report --files=src/app/modules/donor` |
| `--level=A\|AA\|AAA` | WCAG compliance level (default: AA) | `/wcag-scan-fix-report --level=AAA` |
| `--max-iterations=N` | Override iteration cap (default: 10) | `/wcag-scan-fix-report --max-iterations=5` |
| `--dry-run` | Scan and report only, no fixes applied | `/wcag-scan-fix-report --dry-run` |
| `--skip-review` | Skip the Opus QA review step per iteration | `/wcag-scan-fix-report --skip-review` |
| `--no-early-exit` | Disable the ≥ 90 score early-exit threshold; keep iterating until 0 issues | `/wcag-scan-fix-report --no-early-exit` |

---

## Error Handling

| Situation | Action |
|-----------|--------|
| No framework detected | Prompt user to specify framework, then continue |
| wcag-fix cannot auto-fix an issue | Mark as "Requires Manual Review", continue pipeline |
| wcag-review flags a fix as incorrect | Add issue back to fix queue for next iteration |
| PDF conversion fails | Fall back to HTML-only, notify user |
| Git not available | Skip branch/commit metadata, use current date only |
| Iteration limit reached | Log warning, proceed with remaining issues in the report |
| Score ≥ 90 with no critical/serious | Early exit — document skipped moderate/minor in "Can Do Better" |

---

## Success Criteria

✅ All phases execute in sequence without user needing to manually invoke sub-skills
✅ Pipeline loops until 0 auto-fixable issues remain or iteration limit hit
✅ parse-axe-report JSON correctly generated from final scan state
✅ Accessibility score calculated from violation counts
✅ PDF report generated with correct conditional section (score ≥ 85 → "Can Do Better"; score < 85 → "What Needs to Be Improvised")
✅ All artifacts saved to `thoughts/wcag/`
✅ Final summary printed with artifact paths
