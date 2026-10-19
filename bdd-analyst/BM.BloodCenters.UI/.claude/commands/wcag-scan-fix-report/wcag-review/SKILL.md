---
name: wcag-review
description: Reviews WCAG fixes using Opus 4.5 for quality assurance, gray area handling, and Level Access validation
---

# WCAG Review Command

You are initiating an expert-level WCAG accessibility review. Your job is to detect the framework being used and route to the appropriate specialized review agent (using Opus 4.5) for quality assurance.

## Purpose

This command serves as the **third step** in the WCAG accessibility workflow:

```
/wcag-scan → /wcag-fix → /wcag-review
   │            │             │
   ▼            ▼             ▼
 Detect &    Apply        Review with
 Analyze     Fixes        Opus 4.5
 (Sonnet)   (Sonnet)     (Expert QA)
```

## Prerequisites

Before running this command:
1. A WCAG scan must have been completed (`/wcag-scan`)
2. Fixes must have been applied (`/wcag-fix`)
3. Modified files should be available for review

If no previous scan/fix context is found, inform the user:
```markdown
**Missing Context**

No previous WCAG scan or fix results found in this session. Please ensure you have run:
1. `/wcag-scan` - to identify accessibility issues
2. `/wcag-fix` - to apply automated fixes

Then run `/wcag-review` to validate the changes.
```

## Phase 1: Framework Detection

Analyze the workspace to identify which framework is in use:

**Angular Material Detection**:
- Look for `angular.json`, `package.json` with `@angular/material`
- Check for `.component.ts` files and Material imports
- Check Angular version in `package.json` (look for `@angular/core` version)
  - If Angular 18+: Use `wcag-review-angular-18` agent
  - If Angular 14-17: Use `wcag-review-angular-14` agent

**React Detection**:
- Look for `package.json` with `react` dependency
- Check for `.jsx`, `.tsx` files
- If found: Use `wcag-review-react` agent

**GWT Detection**:
- Look for `.gwt.xml` module files
- Check for Java files extending GWT Widget classes
- Look for `pom.xml` with GWT dependencies
- If found: Use `wcag-review-gwt` agent

**ASP.NET Detection**:
- Look for `.csproj` files
- Check for `.cshtml` (Razor), `.aspx` (Web Forms), or `.razor` (Blazor) files
- If found: Use `wcag-review-dotnet` agent

**Multiple Frameworks**:
- If multiple frameworks detected, ask user which to review
- User can specify: "Review only the React fixes" or "Focus on ASP.NET changes"

## Phase 2: Invoke Appropriate Review Agent

Once framework is detected, delegate to the specialized review agent:

| Detected Framework | Review Agent | Model |
|--------------------|--------------|-------|
| Angular 18+ | `wcag-review-angular-18` | Opus |
| Angular 14-17 | `wcag-review-angular-14` | Opus |
| React | `wcag-review-react` | Opus |
| GWT | `wcag-review-gwt` | Opus |
| ASP.NET | `wcag-review-dotnet` | Opus |

```
Based on detected framework [FRAMEWORK_NAME], I'll use the [AGENT_NAME] agent to perform expert-level WCAG accessibility review with Opus 4.5.

[Invoke appropriate review agent with context about files that were fixed]
```

## Phase 3: Handle Options

If user provided options, pass them to the agent:

| Option | Description | Example |
|--------|-------------|---------|
| `--strict` | Apply stricter review criteria | `/wcag-review --strict` |
| `--focus=AREA` | Focus on specific area | `/wcag-review --focus=forms` |
| `--export=FORMAT` | Export report format | `/wcag-review --export=json` |
| `--verbose` | Include detailed explanations | `/wcag-review --verbose` |

## Error Handling

If no recognizable framework is found:
1. List detected file types
2. Ask user to specify framework manually
3. Provide example invocations for each review agent:

```markdown
**Framework Not Detected**

I couldn't automatically detect the framework. Please specify which review agent to use:

- **Angular 18+**: "Use the wcag-review-angular-18 agent to review my fixes"
- **Angular 14-17**: "Use the wcag-review-angular-14 agent to review my fixes"
- **React**: "Use the wcag-review-react agent to review my fixes"
- **GWT**: "Use the wcag-review-gwt agent to review my fixes"
- **ASP.NET**: "Use the wcag-review-dotnet agent to review my fixes"
```

## Example Usage

**Basic Usage**:
```bash
/wcag-review
```
→ Detect framework → Invoke specialized review agent (Opus)

**With Options**:
```bash
/wcag-review --strict --verbose
```
→ Detect framework → Pass options to review agent

**Focused Review**:
```bash
/wcag-review --focus=forms
```
→ Detect framework → Review only form-related fixes

## What the Review Agent Does

Each framework-specific review agent (using Opus 4.5) will:

1. **Review Sonnet Changes**: Validate correctness, completeness, and best practices
2. **Handle Gray Areas**: Identify violations with multiple valid solutions
3. **Decide When NOT to Auto-Fix**: Flag complex fixes needing human judgment
4. **Validation Guidance**: Provide axe-core, Pa11y, and WAVE testing instructions
5. **Manual Follow-ups**: Generate screen reader testing, keyboard testing, and content review tasks
6. **Generate Report**: Comprehensive review report with quality score and next steps

## Success Criteria

- Framework correctly detected
- Appropriate review agent invoked with Opus 4.5
- Options passed correctly
- User receives comprehensive accessibility review
- Quality assurance validates Sonnet-applied fixes
- Gray areas documented with recommendations
- Manual testing checklist provided
