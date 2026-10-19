# Claude Code Commands (Cross-Platform)

Custom slash commands for team development. **Auto-discovered by Claude Code** - no manual setup required.

## Available Commands

### `/review-code`
Quick code review focusing on Angular best practices and project standards

**Usage:**
```
/review-code
```

### `/validate-screen`
Comprehensive screen validation against quality checklist (chapter validation, dates, LOV filters, pagination, error messages, UI/UX, accessibility)

**Usage:**
```
/validate-screen http://localhost:4200/donor-functions/donor-list
/validate-screen src/app/modules/donor-functions/donor-list/donor-list.component.ts
/validate-screen donor-list
```

Accepts URL, component path, or component name. Automatically finds the component from URL by searching route configurations. Validates against 10-section checklist covering all critical quality aspects. Provides detailed pass/fail report with line numbers and specific fixes.

### `/fix-ado-tests`
Fix failing test cases from an Azure DevOps build. Authenticates with ADO, fetches test failures, analyzes root causes, applies fixes, and generates a report.

**Usage:**
```
/fix-ado-tests https://dev.azure.com/mediwareis/BloodCenters/_build/results?buildId=2231923 <PAT-token>
```

Accepts the ADO build URL and optionally a PAT token (will prompt if not provided). Automatically:
1. Pulls latest code from origin/Dev
2. Fetches test failure details from ADO REST API
3. Categorizes failures by root cause (hardcoded dates, cross-field validation, import errors, etc.)
4. Applies targeted fixes to each spec file
5. Generates a fix report at `.claude/test-fix-reports/build-{buildId}-fixes.md`

### `/gap-analysis`
Oracle Forms FMB gap analysis against Angular UI + .NET API. Checks dropdown/LOV values, master screen impacts, chapter/timezone handling, and field validations.

**Usage:**
```
/gap-analysis
/gap-analysis DONMAST
/gap-analysis D:/Wellsky/forms/QCHISDTL.xml
/gap-analysis MLT-12420
```

Accepts FMB XML export path, screen mnemonic, pasted FMB content, or JIRA epic key. Outputs structured gap report with Issue, Severity, Area, Current Behavior, Expected Behavior, Root Cause, and Suggested Fix for each gap found.

## Creating New Commands

1. **Create command directory:**
   ```bash
   mkdir .claude/commands/my-command
   ```

2. **Create SKILL.md file:**
   ```markdown
   ---
   name: my-command
   description: Brief description (shows in autocomplete)
   ---

   # Command Implementation

   Detailed instructions for Claude:
   - What to do step-by-step
   - Which project files to reference
   - Expected output format
   ```

3. **Test:**
   ```
   /my-command
   ```

4. **Commit:**
   ```bash
   git add .claude/commands/my-command/
   git commit -m "Add my-command"
   ```

## Command Structure

```
.claude/commands/
  command-name/
    SKILL.md              ← Required: Command definition with frontmatter
    references/           ← Optional: Supporting examples
```

## Best Practices

- **Be specific:** Clear descriptions help Claude know when to suggest your command
- **Reference docs:** Point to CLAUDE.md, `.claude/coding-standards.md` for project patterns
- **Include examples:** Show expected input/output
- **Keep focused:** One command = one specific task
- **Test thoroughly:** Run multiple times to refine

---

**Questions?** Check [Claude Code Documentation](https://claude.com/claude-code/docs)
