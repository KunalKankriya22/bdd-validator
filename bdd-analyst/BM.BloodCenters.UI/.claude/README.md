# AI Development System - Hybrid Approach

**Dynamic discovery for efficiency + Strategic documentation for governance.**

## 🎯 How It Works

### Core: Dynamic Discovery (80% of tasks)

**CLAUDE.md** (project root) is auto-loaded by Claude Code on every session. It teaches Claude to:
1. **Search the codebase** for existing patterns (glob/grep)
2. **Copy what works** instead of inventing
3. **Discover just-in-time** instead of bulk-reading docs

**Developers just describe what they want. Claude handles the rest.**

### Support: Strategic Documentation (20% of tasks)

For complex tasks, onboarding, and governance:
- **quick-reference.md** - One-page checklists for common tasks
- **onboarding.md** - New developer 30-minute guide
- **test-examples.md** - Copy-paste test templates
- Reference docs (architecture, coding-standards, business-rules, etc.)

## 📁 Structure

```
CLAUDE.md                     # Auto-loaded (teaches dynamic discovery)
.claude/
├── README.md                 # This file - system overview
│
├── Quick Start & Learning
│   ├── onboarding.md         # 30-min new developer guide
│   ├── quick-reference.md    # Essential checklists
│   └── test-examples.md      # Copy-paste test templates
│
├── Reference Documentation
│   ├── architecture.md       # Tech stack & system overview
│   ├── coding-standards.md   # Standards & anti-patterns
│   ├── business-rules.md     # Domain logic & validation
│   ├── api-contracts.md      # API patterns & conventions
│   ├── devops-guidelines.md  # CI/CD & deployment
│   └── figma-guidelines.md   # Design system mapping
│
└── Slash Commands
    └── commands/             # Auto-discovered by Claude Code
        ├── review-code/
        ├── add-tests/
        ├── check-api/
        ├── add-docs/
        └── fix-styles/
```

## 🚀 For Developers

### Typical Workflow (90% of tasks)

**Just describe what you want in plain English:**
```
"Create a user profile component"
"Add export to CSV button"  
"Fix the date validation bug"
```

Claude automatically:
- ✅ Searches for existing components (glob/grep)
- ✅ Copies patterns from similar code
- ✅ Writes tests (AAA pattern, 80%+ coverage)
- ✅ Follows all coding standards
- ✅ Never guesses API contracts

**No manual steps required.**

### When You Need Extra Guidance (10% of tasks)

**New to the team?**
→ Read [onboarding.md](onboarding.md) - 30-minute guide

**Quick checklist needed?**
→ Check [quick-reference.md](quick-reference.md) - One-page essentials

**Writing tests?**
→ Copy from [test-examples.md](test-examples.md) - Production templates

**Deep architecture questions?**
→ Ask Claude to read [architecture.md](architecture.md)

### Using Slash Commands

Type `/` in Claude Code:
- `/review-code` - Quick code review
- `/add-tests [file]` - Generate unit tests
- `/check-api` - Validate API contracts
- `/add-docs` - Add JSDoc comments
- `/fix-styles` - Fix style violations

## 🎯 Key Principles

### 1. Discovery Over Documentation
```bash
# Don't maintain component lists. Search dynamically:
glob "src/app/shared/components/*/*.component.ts"
grep -r "similar-pattern" src/app/ --include="*.ts"
```

### 2. Copy Patterns, Don't Invent
- Creating component? Copy structure from similar component
- API service? Copy pattern from existing service
- Tests? Copy from similar .spec.ts file

### 3. Just-In-Time Context
- Don't bulk-read 7+ files upfront
- Search for what you need when you need it
- Load one example, adapt it

### 4. Self-Maintaining
- No hand-maintained inventories that drift
- Codebase is the source of truth
- Documentation is minimal and stable

## 📊 Benefits

### For Developers
- **Efficient:** 70-80% token reduction through dynamic discovery
- **Fast:** No manual doc references for most tasks
- **Consistent:** Copies existing patterns automatically
- **Accurate:** Always reflects current code, never stale
- **Supported:** Strategic docs available when needed

### For New Developers
- **Quick onboarding:** 30-minute guide gets you productive
- **Clear checklists:** One-page reference for common tasks
- **Copy-paste templates:** Ready-to-use test examples
- **Safe learning:** Reference docs available for deep dives

### For Team Leads
- **Governance:** Formal structure for enterprise compliance
- **Quality:** Enforced standards, mandatory testing
- **Scalable:** Works for 20 or 200 engineers
- **Low maintenance:** Only 3 docs need occasional updates
- **Measurable:** Track PR pass rates, coverage, duplicates

### For the Organization
- **Cost savings:** 70-80% token reduction vs static approach
- **Quality improvement:** Standards auto-applied, less rework
- **Faster delivery:** Developers spend less time searching
- **Knowledge retention:** Patterns live in code, not docs

## 🔍 Example Workflow

**User:** "Create user settings component"

**Claude's process:**
```bash
# 1. Search for similar components
glob "src/app/**/user*.component.ts"
glob "src/app/**/*settings*.component.ts"

# 2. Read ONE example
read src/app/modules/system-administration/user-profile.component.ts

# 3. Search for API service pattern
glob "src/app/*/services/user*.service.ts"

# 4. Copy patterns and adapt
# 5. Generate tests by copying similar .spec.ts
# 6. Done - matches existing code style perfectly
```

**Result:** Component that fits perfectly, no static docs needed.

## 🆚 vs Traditional Approach

**Traditional (Static Docs):**
- ❌ 23+ markdown files to maintain
- ❌ Hand-maintained component inventory (drifts)
- ❌ Bulk-read 7+ files before every task
- ❌ Settings that don't actually work
- ❌ Platform-specific scripts (.sh files)

**Dynamic Approach (CTO-Level):**
- ✅ 3 core files (CLAUDE.md, architecture.md, coding-standards.md)
- ✅ Auto-discover components via search
- ✅ Load only what's needed when needed
- ✅ No invalid config
- ✅ Cross-platform (no scripts)

## 🎓 For Team Leads

**Onboarding new developers:**
1. Tell them to use Claude Code normally
2. Just describe what they want to build
3. That's it. System does the rest.

**Measuring effectiveness:**
- PR review pass rate (should be high)
- Duplicate component creation (should be near zero)
- Test coverage (should be 80%+)
- Token usage per task (should be low)

## 🔧 Maintenance

**Monthly:** Nothing. System is self-maintaining.

**Annually:** 
- Review `CLAUDE.md` for clarity improvements
- Update `coding-standards.md` if standards change
- Add new slash commands if common patterns emerge

**That's it.** No inventory updates, no sync scripts, no drift to fix.

## ✅ Success Criteria

You know it's working when:
- Developers never mention .claude/ files
- Code reviews pass on first try
- No duplicate components created
- Tests included automatically
- API contracts never guessed
- Token usage stays low

---

**Bottom line:** Search → Copy → Adapt → Test

The 200 engineers before you already solved your problem. Find it, copy it, adapt it.
