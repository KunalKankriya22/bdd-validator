---
name: parse-axe-report
description: Parse and process axe-core accessibility test reports to extract violations, warnings, and recommendations. Use when processing automated accessibility test results, integrating axe-core scan output into WCAG analysis, or converting JSON reports into actionable fix recommendations.
icon: file-text
color: blue
---

# Axe-core Report Parser Skill

## Purpose
Parse and process axe-core accessibility test reports to extract violations, warnings, and recommendations.

## When to Use This Skill
- Processing automated accessibility test results
- Integrating axe-core scan output into WCAG analysis
- Converting JSON reports into actionable fix recommendations

## Input Format

Axe-core generates JSON reports with this structure:
```json
{
  "violations": [
    {
      "id": "button-name",
      "impact": "critical",
      "tags": ["wcag2a", "wcag412", "section508"],
      "description": "Buttons must have discernible text",
      "help": "Buttons must have discernible text",
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.4/button-name",
      "nodes": [
        {
          "html": "<button class=\"icon-btn\"></button>",
          "target": [".icon-btn"],
          "failureSummary": "Fix any of the following:\n  Element does not have inner text...",
          "impact": "critical"
        }
      ]
    }
  ],
  "passes": [...],
  "incomplete": [...],
  "inapplicable": [...]
}
```

## Output Format

Transform into structured recommendations:
```json
{
  "summary": {
    "totalViolations": 10,
    "critical": 3,
    "serious": 4,
    "moderate": 2,
    "minor": 1
  },
  "violations": [
    {
      "id": "button-name",
      "wcagCriteria": ["4.1.2"],
      "severity": "critical",
      "description": "Buttons must have discernible text",
      "impactedElements": 1,
      "fix": "Add aria-label or inner text to button",
      "codeLocation": ".icon-btn",
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.4/button-name"
    }
  ],
  "frameworkSpecificAdvice": {
    "angular": "Use aria-label attribute on mat-button with only icons",
    "react": "Add aria-label prop to button elements without text content",
    "gwt": "Set aria-label via getElement().setAttribute()",
    "aspnet": "Add aria-label to buttons rendered without visible text"
  }
}
```

## Processing Steps

1. **Parse JSON**: Load axe-core JSON report
2. **Extract Violations**: Focus on violations array
3. **Categorize by Severity**: Group by impact (critical, serious, moderate, minor)
4. **Map to WCAG**: Extract WCAG criteria from tags
5. **Generate Fixes**: Provide framework-specific fix recommendations
6. **Prioritize**: Order by severity and number of affected elements

## Integration with WCAG Agents

Each framework agent can use this skill to:
- Supplement manual code analysis with automated scan results
- Validate that manual fixes address axe-core violations
- Generate comprehensive reports combining manual and automated findings

## Usage Example

```javascript
// Run axe-core in browser console or test
const results = await axe.run();

// Save to file
const fs = require('fs');
fs.writeFileSync('axe-report.json', JSON.stringify(results, null, 2));
```

Then invoke WCAG agent with:
```
I have an axe-core report at axe-report.json. Please analyze and provide framework-specific fixes.
```

## Success Criteria

✅ All violations extracted and categorized
✅ WCAG criteria correctly mapped
✅ Framework-specific recommendations provided
✅ Fixes prioritized by severity and impact
