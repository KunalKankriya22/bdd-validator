---
name: wcag-fix
description: Applies WCAG compliance fixes based on scan results with user approval
---

# WCAG Fix Command

You are applying accessibility fixes identified during a WCAG scan. This command applies fixes with user approval to ensure changes are understood and desired.

## Prerequisites

Before running this command:
1. A WCAG scan must have been completed (via `/wcag-scan` or direct agent invocation)
2. Accessibility issues must have been identified with recommended fixes
3. User should have reviewed the scan report

## Phase 1: Validate Context

Check if accessibility analysis has been performed:
- Look for recent scan results in conversation context
- If no scan found, prompt user to run `/wcag-scan` first
- Verify fixes are available and actionable

## Phase 2: Present Fix Plan

Summarize proposed fixes by severity:

```markdown
## Accessibility Fixes to Apply

### Critical Issues (Must Fix) - [COUNT]
1. [Issue description] in [file:line]
   - WCAG Criterion: [X.X.X]
   - Fix: [Brief description]
   - Files affected: [list]

### High Priority Issues - [COUNT]
2. [Issue description] in [file:line]
   ...

### Medium Priority Issues - [COUNT]
...

### Low Priority Issues - [COUNT]
...

## Options:
- Apply all fixes (recommended)
- Apply only critical and high priority
- Apply specific fixes interactively
- Cancel and review manually
```

## Phase 3: User Approval

Handle different approval modes:

**--auto-apply** (requires global approval):
- Apply all fixes without prompting for each
- Still show summary before starting
- Require one approval for all changes

**Interactive mode** (default):
- Present each fix category
- Ask for approval before applying
- Allow user to skip certain fixes

**--dry-run**:
- Show what would be changed without applying
- Display before/after code snippets
- No actual file modifications

**--priority=critical|high|medium|low**:
- Apply only fixes at or above specified priority
- Useful for incremental improvements

## Phase 4: Apply Fixes

For each approved fix:

1. **Backup original code** (in memory for undo capability)
2. **Apply the fix** using appropriate tools
3. **Validate syntax** (ensure no compilation errors)
4. **Report status**: ✅ Applied or ❌ Failed

Example application:
```
Applying fix 1/10: Add aria-label to icon button
  File: src/components/Header.tsx:45
  Status: ✅ Applied successfully

Applying fix 2/10: Associate label with form input
  File: src/components/UserForm.tsx:120
  Status: ✅ Applied successfully
```

## Phase 5: Validation

After applying fixes:

1. **Run linters** (if available): ESLint, TSLint, Prettier, etc.
2. **Check for errors**: Report any introduced issues
3. **Suggest testing**:
   ```
   Fixes applied successfully! Please validate:
   
   ✅ Run your test suite
   ✅ Test with keyboard navigation
   ✅ Validate with screen reader
   ✅ Run automated accessibility tests (axe, pa11y)
   ```

## Phase 6: Summary Report

Generate summary of applied changes:

```markdown
## Accessibility Fix Summary

**Fixes Applied**: 8 of 10
**Files Modified**: 5
**WCAG Issues Resolved**: 8

### Applied Fixes:
- ✅ Added aria-label to 3 icon buttons
- ✅ Associated 2 form labels with inputs
- ✅ Fixed heading hierarchy in HomePage
- ✅ Added alt text to 2 images
- ✅ Improved keyboard focus indicators

### Skipped Fixes:
- UserProfile.tsx: Complex fix requires manual review
- NavBar.tsx: User chose to handle manually

### Next Steps:
1. Review changes in version control
2. Run test suite to ensure no regressions
3. Test with assistive technologies
4. Commit changes with descriptive message

### Recommended Commit Message:
```
fix(a11y): Apply WCAG 2.1 Level AA accessibility fixes

- Add aria-labels to icon buttons for screen readers
- Associate form labels with inputs properly
- Fix heading hierarchy throughout application
- Add missing alt text to images
- Improve focus indicator visibility

WCAG Criteria addressed: 1.1.1, 1.3.1, 2.4.6, 2.4.7, 4.1.2
```
```

## Error Handling

If fixes fail:
- Report specific error messages
- Provide rollback option
- Suggest manual fix approach
- Preserve original code for recovery

If linter fails after fixes:
- Show linter errors
- Offer to revert changes
- Suggest fix + lint cycle

## Options Reference

| Option | Description | Example |
|--------|-------------|---------|
| `--auto-apply` | Apply all fixes with one approval | `/wcag-fix --auto-apply` |
| `--dry-run` | Preview changes without applying | `/wcag-fix --dry-run` |
| `--priority=LEVEL` | Apply fixes at/above priority | `/wcag-fix --priority=high` |
| `--files=PATTERN` | Apply fixes to specific files | `/wcag-fix --files=src/components/**` |
| `--interactive` | Prompt for each fix (default) | `/wcag-fix --interactive` |

## Best Practices

**Before Applying**:
- Commit current work
- Review scan report carefully
- Understand what each fix does
- Have a rollback plan

**After Applying**:
- Run full test suite
- Manual keyboard testing
- Screen reader validation
- Create descriptive commit

**Incremental Approach**:
- Start with critical issues: `/wcag-fix --priority=critical`
- Then high priority: `/wcag-fix --priority=high`
- Review and test between each level
- Commit fixes in logical groups

## Success Criteria

✅ Fixes applied without errors
✅ No compilation/linting issues introduced
✅ Changes properly documented
✅ User provided with clear next steps
✅ Rollback option available if needed

---

**Important**: Always test accessibility fixes with actual assistive technologies (screen readers, keyboard navigation) before considering them complete. Automated fixes should be validated by users with disabilities when possible.
