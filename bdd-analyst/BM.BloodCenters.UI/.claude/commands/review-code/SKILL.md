---
name: review-code
description: Quick code review focusing on Angular best practices and project standards
---

# Code Review Skill

Perform a focused code review of current changes or specified files.

## Review Process

1. **Get current changes**: Run `git diff` to see what's changed
2. **Review against standards**: Check `.claude/coding-standards.md`, `.claude/components.md`, and `.claude/business-rules.md`
3. **Analyze for issues** in these areas:

### Review Checklist

#### Angular Best Practices
- [ ] Components are standalone when appropriate
- [ ] Proper use of OnPush change detection strategy
- [ ] Reactive forms preferred over template-driven
- [ ] Services properly injected (not instantiated)
- [ ] Lifecycle hooks used correctly
- [ ] Proper use of async pipe for observables
- [ ] No subscriptions without unsubscribe logic

#### Code Quality
- [ ] Clear, descriptive variable/function names
- [ ] Functions are single-purpose and concise
- [ ] No code duplication (DRY principle)
- [ ] Proper error handling
- [ ] Type safety (no `any` unless justified)
- [ ] Input validation at boundaries

#### Security
- [ ] No XSS vulnerabilities (proper sanitization)
- [ ] No SQL injection risks in API calls
- [ ] Sensitive data not logged or exposed
- [ ] Proper authentication/authorization checks

#### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists use trackBy functions
- [ ] Lazy loading implemented where appropriate
- [ ] No memory leaks (subscriptions cleaned up)

#### Testing
- [ ] New code has corresponding tests
- [ ] Tests follow AAA pattern
- [ ] Proper mocking of dependencies
- [ ] Edge cases covered

#### Styling
- [ ] Follows naming conventions from coding standards
- [ ] File organization matches project structure
- [ ] SCSS variables used for theme values
- [ ] Responsive design considerations

## Output Format

Provide a concise review with:

1. **Summary**: Overall assessment in 1-2 sentences
2. **Issues Found**: List with file:line references
   - 🔴 Critical issues (security, bugs)
   - 🟡 Improvements (best practices, performance)
   - 🟢 Suggestions (code quality, maintainability)
3. **Positive Notes**: What was done well
4. **Action Items**: Specific changes recommended with priority

## Example Output

```markdown
### Summary
Overall solid implementation. A few performance improvements and one security concern.

### Issues

🔴 **[user-form.component.ts:45](user-form.component.ts#L45)** - Missing input sanitization before API call
🟡 **[user-list.component.ts:32](user-list.component.ts#L32)** - Large list without trackBy function
🟢 **[user.service.ts:18](user.service.ts#L18)** - Consider adding error type for better error handling

### Positive
- Great use of reactive forms
- Proper separation of concerns
- Good test coverage

### Actions
1. Add sanitization at user-form.component.ts:45 (Critical)
2. Implement trackBy for user list (Important)
3. Consider error typing (Optional)
```

Keep review comments professional, constructive, and specific.
