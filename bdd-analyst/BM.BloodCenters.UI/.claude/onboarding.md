# New Developer Onboarding Guide

**Welcome to the Blood Center Management System! This guide will get you productive in 30 minutes.**

---

## 🎯 What You'll Learn

1. How to use Claude Code with this project
2. How to find and reuse existing code
3. How to create components, services, and tests
4. How to avoid common mistakes

---

## 📋 Prerequisites

- [ ] Claude Code installed (desktop app, VS Code extension, or web)
- [ ] Repository cloned locally
- [ ] Node.js and npm installed
- [ ] Angular CLI installed: `npm install -g @angular/cli`
- [ ] Dependencies installed: `npm install`

---

## 🚀 Quick Start (5 Minutes)

### 1. Verify Setup

```bash
# From project root
npm test          # Should run tests
npm run lint      # Should pass
npm start         # Dev server should start on localhost:4200
```

### 2. Test Claude Code Integration

Open Claude Code and try:
```
"Show me the existing reusable components"
```

Claude should search `src/app/shared/components/` and list components.

### 3. Try a Simple Task

```
"Create a button to refresh the user list"
```

Claude should:
- Search for existing button components
- Search for user list component
- Copy existing patterns
- Generate the code + tests

---

## 📖 How This Project Works

### The CLAUDE.md File (Auto-Loaded)

**CLAUDE.md** in the project root is automatically loaded by Claude Code.

It teaches Claude to:
- ✅ Search the codebase dynamically (glob/grep)
- ✅ Copy existing patterns instead of inventing
- ✅ Never guess API contracts
- ✅ Always write tests
- ✅ Never use `any` types

**You don't need to reference it manually.** Just describe what you want.

### The .claude/ Folder (Reference Documentation)

Contains reference docs you can ask Claude to read when needed:
- `architecture.md` - System overview
- `coding-standards.md` - Standards and patterns
- `business-rules.md` - Domain logic
- `quick-reference.md` - Checklists
- `test-examples.md` - Test templates

**90% of the time:** Just describe what you want. Claude uses dynamic discovery.

**10% of the time:** For deep dives, ask Claude to read specific docs.

### The commands/ Directory (Slash Commands)

Type `/` in Claude Code to see available commands:
- `/review-code` - Quick code review
- `/add-tests [file]` - Generate unit tests
- `/check-api` - Validate API integration
- `/add-docs` - Add JSDoc comments
- `/fix-styles` - Fix style violations

---

## 🛠️ Common Tasks - Step by Step

### Task 1: Create a New Component

**What you say to Claude:**
```
"Create a user profile component that displays user information"
```

**What Claude does automatically:**
1. Searches for similar components: `glob "src/app/**/user*.component.ts"`
2. Finds `user-list.component.ts` as template
3. Copies its structure (standalone, inject, destroy$, etc.)
4. Creates your component matching the pattern
5. Generates `.spec.ts` file with tests
6. Achieves 80%+ coverage

**Your job:**
1. Review the generated code
2. Run tests: `npm test`
3. Verify it works
4. Commit

**Pro tip:** You can be more specific:
```
"Create a user profile component that displays:
- Name, email, phone
- Edit button
- Uses reactive forms
- Validates email format
```

---

### Task 2: Integrate with API

**What you say to Claude:**
```
"Create API service to get user profile by ID"
```

**What Claude asks you:**
```
Before I create the service, I need to verify:
1. What is the exact endpoint path?
2. What does the response structure look like?
3. Are there any query parameters?
```

**Why?** Claude never guesses API contracts. You must provide actual endpoint details.

**You provide:**
```
Endpoint: GET /api/users/{id}
Response:
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Claude then:**
1. Searches for similar API service: `glob "src/app/*/services/*api.service.ts"`
2. Copies the pattern
3. Creates TypeScript interface for response
4. Adds endpoint to `api.constants.ts`
5. Creates service with proper error handling
6. Generates tests with `HttpClientTestingModule`

---

### Task 3: Fix a Bug

**What you say to Claude:**
```
"Fix the date validation bug in the effective date field"
```

**What Claude does:**
1. Searches for the error: `grep "effective date" src/app/ --include="*.ts"`
2. Finds the relevant file
3. Identifies the issue
4. Fixes it
5. Adds regression test to prevent recurrence

**Your job:**
1. Verify the fix works
2. Run tests: `npm test`
3. Commit

---

### Task 4: Write Tests for Existing Code

**What you say to Claude:**
```
"/add-tests src/app/components/user-form.component.ts"
```

**What Claude does:**
1. Reads the component
2. Finds similar `.spec.ts` file as template
3. Generates comprehensive tests:
   - Component creation
   - Form validation
   - Submit logic
   - Error handling
   - Edge cases
4. Achieves 90%+ coverage

---

## 🎓 Best Practices (Learn These First Week)

### 1. Always Search Before Creating

**Bad (wastes time):**
```
"Create a data table component"
```
→ Creates duplicate when `DataTableComponent` already exists!

**Good:**
```
"I need to display users in a table. Check if we have a reusable table component."
```
→ Claude finds `DataTableComponent`, shows you how to use it.

---

### 2. Never Guess API Contracts

**Bad:**
```
"Create API service for user management"
```
→ Claude will ask for endpoint details. Just provide them upfront.

**Good:**
```
"Create API service for user management.

Endpoint: GET /api/users
Response: { success: boolean, data: User[] }

User interface:
- id: string
- name: string
- email: string
```
→ Claude creates service immediately with correct types.

---

### 3. Describe, Don't Prescribe

**Bad (micromanaging):**
```
"Create a UserComponent class with a constructor that injects UserApiService,
add a ngOnInit method, subscribe to getData() with takeUntil, ..."
```

**Good (describe intent):**
```
"Create a user list component that loads users from the API and displays them in a table"
```
→ Claude knows the patterns, just tell it what you want.

---

### 4. Use Slash Commands for Common Tasks

**Instead of:**
```
"Review my code and check for Angular best practices, test coverage, security issues..."
```

**Just do:**
```
/review-code
```

---

## 🚫 Common Mistakes (Avoid These)

### Mistake 1: Not Searching for Existing Components

❌ **Wrong:**
```
"Create a loading spinner component"
```
→ Duplicate! `LoadingSpinnerComponent` exists.

✅ **Correct:**
```
"I need a loading spinner. Do we have one?"
```
→ Claude finds it, shows usage.

---

### Mistake 2: Using `any` Type

❌ **Wrong:**
```typescript
data: any;
response: any;
```

✅ **Correct:**
```typescript
interface UserData {
  id: string;
  name: string;
}

data: UserData;
```

---

### Mistake 3: Not Unsubscribing from Observables

❌ **Wrong:**
```typescript
ngOnInit() {
  this.service.getData().subscribe(data => this.data = data);
}
```
→ Memory leak!

✅ **Correct:**
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

### Mistake 4: Skipping Tests

❌ **Wrong:**
```
"Create user component"
[Only creates .ts file, no .spec.ts]
```

✅ **Correct:**
Claude automatically creates tests. If it doesn't:
```
"Create user component with unit tests"
```
or use:
```
/add-tests src/app/components/user.component.ts
```

---

## 📊 Your First Week Checklist

### Day 1: Setup & Familiarization
- [ ] Development environment working
- [ ] Can run `npm start`, `npm test`, `npm run lint`
- [ ] Explored `src/app/shared/components/` directory
- [ ] Read `CLAUDE.md` to understand approach
- [ ] Read `quick-reference.md` for checklists

### Day 2: Simple Component
- [ ] Created first component using Claude Code
- [ ] Component follows existing patterns
- [ ] Tests included and passing
- [ ] PR submitted and reviewed

### Day 3: API Integration
- [ ] Created API service
- [ ] Used proper TypeScript interfaces
- [ ] Added endpoint to `api.constants.ts`
- [ ] Tests mock HTTP calls correctly

### Day 4: Bug Fix
- [ ] Fixed a bug using Claude Code
- [ ] Added regression test
- [ ] Verified fix doesn't break other tests

### Day 5: Code Review
- [ ] Used `/review-code` command
- [ ] Fixed identified issues
- [ ] Learned common anti-patterns to avoid

---

## 🆘 Getting Help

### When Claude Doesn't Know

If Claude says "I don't know the API contract":
1. Check backend Swagger docs
2. Check existing similar service
3. Ask a senior developer

### When Tests Fail

```bash
# Run specific test
npm test -- --include='**/user.component.spec.ts'

# Run with coverage
npm test -- --code-coverage

# Check coverage report
open coverage/index.html
```

### When Stuck

1. **Check existing code:** Search for similar implementation
2. **Ask Claude:** "/review-code" to find issues
3. **Read reference docs:** Ask Claude to read relevant `.claude/*.md` file
4. **Ask team:** #engineering-help channel

---

## 🎯 Success Metrics

**After 1 week, you should:**
- ✅ Create components that pass PR review first time
- ✅ Never create duplicate components (always search first)
- ✅ Write tests automatically (80%+ coverage)
- ✅ Follow all coding standards without thinking
- ✅ Use Claude Code for 80%+ of coding tasks

**After 1 month, you should:**
- ✅ Mentor new developers on the system
- ✅ Contribute to `.claude/` documentation improvements
- ✅ Create custom slash commands for common tasks

---

## 📚 Additional Resources

- [Quick Reference](quick-reference.md) - Essential checklists
- [Test Examples](test-examples.md) - Copy-paste test templates
- [Architecture](architecture.md) - System deep dive
- [Coding Standards](coding-standards.md) - Complete standards
- [Business Rules](business-rules.md) - Domain knowledge
- [Commands README](commands/README.md) - Slash commands guide

---

## 🎉 Welcome to the Team!

You're now equipped to be productive with Claude Code and this codebase.

**Remember:**
1. Search before creating
2. Copy existing patterns
3. Never guess API contracts
4. Always write tests
5. Ask questions when stuck

**Happy coding!** 🚀
