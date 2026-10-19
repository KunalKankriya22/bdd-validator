---
name: wcag-scan
description: Automatically detects framework (Angular Material, React, GWT, ASP.NET) and runs appropriate WCAG accessibility analysis
---

# WCAG Scan Command

You are initiating a comprehensive WCAG accessibility scan. Your job is to detect the framework being used and route to the appropriate specialized agent for analysis.

## Phase 1: Framework Detection

Analyze the workspace to identify which framework is in use:

**Angular Material Detection**:
- Look for `angular.json`, `package.json` with `@angular/material`
- Check for `.component.ts` files and Material imports
- Check Angular version in `package.json` (look for `@angular/core` version)
  - If Angular 18+: Use `wcag-angular-18` agent
  - If Angular 14-17: Use `wcag-angular-14` agent

**React Detection**:
- Look for `package.json` with `react` dependency
- Check for `.jsx`, `.tsx` files
- If found: Use `wcag-react` agent

**GWT Detection**:
- Look for `.gwt.xml` module files
- Check for Java files extending GWT Widget classes
- Look for `pom.xml` with GWT dependencies
- If found: Use `wcag-gwt` agent

**ASP.NET Detection**:
- Look for `.csproj` files
- Check for `.cshtml` (Razor), `.aspx` (Web Forms), or `.razor` (Blazor) files
- If found: Use `wcag-dotnet` agent

**Multiple Frameworks**:
- If multiple frameworks detected, ask user which to analyze
- User can specify: "Scan only the React components" or "Focus on ASP.NET views"

## Phase 2: Invoke Appropriate Agent

Once framework is detected, delegate to the specialized agent:

```
Based on detected framework [FRAMEWORK_NAME], I'll use the [AGENT_NAME] agent to perform WCAG accessibility analysis.

[Invoke appropriate agent with context about files to analyze]
```

## Phase 3: Handle Options

If user provided options, pass them to the agent:

**--level=A|AA|AAA**: Target WCAG compliance level (default: AA)
**--report=summary|detailed**: Report verbosity (default: detailed)
**--format=markdown|json**: Output format (default: markdown)
**--files=path/to/files**: Specific files or directories to analyze

## Error Handling

If no recognizable framework is found:
1. List detected file types
2. Ask user to specify framework manually
3. Provide example invocations for each agent

## Example Usage

User: `/wcag-scan`
→ Detect framework → Invoke specialized agent

User: `/wcag-scan --level=AAA --report=detailed`
→ Detect framework → Pass options to agent

User: `/wcag-scan --files=src/components/UserForm.tsx`
→ Detect React → Analyze specific file

## Phase 4: Persist Report to Thoughts Directory

After the specialized agent completes the scan, save the report to the thoughts directory:

1. **Create thoughts directory** if it doesn't exist:
   ```bash
   mkdir -p thoughts/wcag
   ```

2. **Get git metadata** for the frontmatter:
   ```bash
   git branch --show-current
   git rev-parse --short HEAD
   ```

3. **Generate report filename**:
   - Format: `thoughts/wcag/YYYY-MM-DD-wcag-scan-[framework].md`
   - Example: `thoughts/wcag/2026-02-06-wcag-scan-angular-18.md`

4. **Write the complete report** to the file with metadata header:
   ```markdown
   ---
   type: wcag-scan
   date: YYYY-MM-DD HH:MM:SS
   framework: [detected-framework]
   wcag-level: AA
   branch: [current-git-branch]
   commit: [current-commit-hash]
   ---

   [Full scan report content from agent]
   ```

5. **Notify user** of saved report location:
   ```
   📄 Report saved to: thoughts/wcag/YYYY-MM-DD-wcag-scan-[framework].md
   ```

## Success Criteria

✅ Framework correctly detected
✅ Appropriate agent invoked
✅ Options passed correctly
✅ User receives comprehensive accessibility analysis
✅ Report persisted to thoughts/wcag/ directory
