# WellSky Claude Code Plugins - Usage Guide

**For Blood Center Development Team**

**Last Updated:** April 22, 2026

---

## 📋 Executive Summary

WellSky provides 26+ pre-built Claude Code plugins that **complement our existing `.claude` system**. This guide identifies the highest-value plugins for our Blood Center team and provides practical usage examples.

**Key Takeaway:** Our `.claude` system provides project-specific knowledge and patterns. WellSky plugins provide automation and external integrations. Together, they significantly accelerate development.

---

## 🎯 Recommended Plugins (Priority Order)

### Must-Have (Install Week 1)

| Plugin | Value | Time Savings | Installation |
|--------|-------|--------------|--------------|
| `shared` | **REQUIRED** | N/A (base dependency) | `/plugin install shared@wellsky-plugins` |
| `bug-fix` | **HIGH** | 30-60 min per ticket | `/plugin install bug-fix@wellsky-plugins` |
| `unit-gen` | **HIGH** | 15-30 min per test file | `/plugin install unit-gen@wellsky-plugins` |
| `wcag-scan-fix` | **HIGH** | 20-40 min per screen | `/plugin install wcag-scan-fix@wellsky-plugins` |

### High-Value (Install Week 2-3)

| Plugin | Value | Time Savings | Installation |
|--------|-------|--------------|--------------|
| `snyk-security` | **MEDIUM-HIGH** | 10-20 min per scan | `/plugin install snyk-security@wellsky-plugins` |
| `ws-atlassian` | **MEDIUM** | 5-10 min per ticket lookup | `/plugin install ws-atlassian@wellsky-plugins` |

### Future Consideration (Install When Needed)

| Plugin | When to Install | Installation |
|--------|----------------|--------------|
| `angular-upgrade-assistant` | Angular 21 release | `/plugin install angular-upgrade-assistant@wellsky-plugins` |
| `e2e-test-gen` | If team adopts Playwright | `/plugin install e2e-test-gen@wellsky-plugins` |
| `sql-query-generator` | For test data queries | `/plugin install sql-query-generator@wellsky-plugins` |

---

## 🚀 Quick Start Setup

### Prerequisites

1. **Claude Code CLI installed** (you already have this)
2. **Google Cloud authentication** - Run:
   ```bash
   gcloud auth login
   gcloud config set project wellsky-project-id
   ```
3. **GitHub access to WellSky plugins repo** - Verify:
   ```bash
   gh repo view mediwareinc/wellsky-claude-code-plugins
   ```

### One-Time Marketplace Setup (5 minutes)

**Follow the official guide:**
👉 [Claude Code - Manual Setup Guide](https://wellsky.atlassian.net/wiki/spaces/ME/pages/2513896473/Claude+Code+-+manual+setup#Marketplace-Setup)

**TLDR:**
1. Authenticate GitHub CLI: `gh auth login`
2. Add WellSky marketplace to Claude Code
3. Verify marketplace is available

### Install Essential Plugins (2 minutes)

```bash
# Required base plugin (install first)
/plugin install shared@wellsky-plugins

# Top 3 high-value plugins
/plugin install bug-fix@wellsky-plugins
/plugin install unit-gen@wellsky-plugins
/plugin install wcag-scan-fix@wellsky-plugins

# Verify installation
/plugin
```

**Expected output:**
```
✔ Installed Plugins:
  - shared (v1.x.x)
  - bug-fix (v1.x.x)
  - unit-gen (v1.x.x)
  - wcag-scan-fix (v1.x.x)
```

### Configure Credentials

**JIRA Token (for bug-fix, ws-atlassian):**
```bash
# Set JIRA credentials
export JIRA_EMAIL="your.name@wellsky.com"
export JIRA_API_TOKEN="your-jira-token"
export JIRA_BASE_URL="https://wellsky.atlassian.net"
```

**Get JIRA Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy token and save to environment variable

**Snyk Token (for snyk-security):**
```bash
export SNYK_TOKEN="your-snyk-token"
```

**Get Snyk Token:**
1. Log in to Snyk (ask Security team for access)
2. Account Settings → API Token
3. Copy token and save to environment variable

---

## 📚 Plugin Usage Guides

### 1. `bug-fix` - Automated JIRA Ticket Analysis

**What it does:**
- Fetches JIRA ticket details
- Analyzes codebase for root cause
- Suggests code fixes
- Generates comprehensive tests
- Creates PR-ready implementation

**When to use:**
- Fixing bugs from JIRA backlog
- Understanding complex defects
- Getting fix suggestions with test coverage

**Example 1: Analyze and Fix a Bug**

```
User: Analyze JIRA ticket MLT-12345
```

**What Claude does:**
1. ✅ Fetches ticket from JIRA (title, description, acceptance criteria)
2. ✅ Searches codebase for related files using our `.claude` dynamic discovery
3. ✅ Identifies root cause based on code analysis
4. ✅ Suggests fix following `.claude/coding-standards.md` patterns
5. ✅ Generates unit tests (AAA pattern, 90% coverage)
6. ✅ Provides implementation plan

**Example output:**
```markdown
## JIRA Ticket Analysis: MLT-12345

**Title:** Date picker allows past dates in Effective Date field

**Root Cause:**
- File: src/app/modules/donor-functions/donor-form.component.ts:145
- Issue: Missing DateFieldValidationUtility.getMinDate() validator
- Impact: Users can select invalid past dates

**Recommended Fix:**
1. Add minDate getter using chapter timezone
2. Update template [min]="minDate" binding
3. Add validator: DateFieldValidationUtility.effectiveDateNotPastValidator

**Tests to Add:**
- should prevent selection of past dates
- should allow today's date
- should allow future dates
- should respect chapter timezone

**Implementation:** [code provided]
```

**Example 2: Quick Root Cause Analysis**

```
User: What's causing the error in MLT-12346?
```

**Claude analyzes ticket, searches code, identifies:**
```
Root cause: Component not unsubscribing from Observable
File: src/app/modules/laboratory-functions/lab-results.component.ts:89
Fix: Add takeUntil(this.destroy$) pattern
```

**Pro tip:** Works best when JIRA ticket has:
- Clear description
- Reproduction steps
- Expected vs actual behavior

---

### 2. `unit-gen` - Automated Unit Test Generation

**What it does:**
- Analyzes component/service code
- Generates comprehensive unit tests
- Follows AAA pattern (Arrange-Act-Assert)
- Achieves 90%+ coverage
- Matches project test patterns

**When to use:**
- New component needs tests
- Improving test coverage
- Learning test patterns for complex scenarios

**Example 1: Generate Tests for Component**

```
User: /unit-gen src/app/modules/donor-functions/donor-list/donor-list.component.ts
```

**What Claude generates:**
```typescript
describe('DonorListComponent', () => {
  let component: DonorListComponent;
  let fixture: ComponentFixture<DonorListComponent>;
  let mockService: jasmine.SpyObj<DonorApiService>;
  
  beforeEach(() => {
    // Arrange - Setup
    mockService = jasmine.createSpyObj('DonorApiService', ['getDonors']);
    mockService.getDonors.and.returnValue(of(mockData));
    
    TestBed.configureTestingModule({
      imports: [DonorListComponent],
      providers: [
        { provide: DonorApiService, useValue: mockService }
      ]
    });
    
    fixture = TestBed.createComponent(DonorListComponent);
    component = fixture.componentInstance;
  });
  
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    
    it('should load donors on init', () => {
      // Arrange - Already done in beforeEach
      
      // Act
      component.ngOnInit();
      
      // Assert
      expect(mockService.getDonors).toHaveBeenCalled();
      expect(component.donors.length).toBe(3);
    });
  });
  
  describe('Pagination', () => {
    it('should default to page size 25', () => {
      expect(component.pageSize).toBe(25);
    });
    
    it('should reset to page 1 when filters change', () => {
      // Arrange
      component.pageIndex = 5;
      
      // Act
      component.onFilterChange();
      
      // Assert
      expect(component.pageIndex).toBe(0);
    });
  });
  
  describe('Observable Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      // Arrange
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      // Act
      component.ngOnDestroy();
      
      // Assert
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
```

**Example 2: Generate Tests for Service**

```
User: Generate tests for donor-api.service.ts
```

**Claude generates:**
- HTTP call tests with HttpClientTestingModule
- Error handling tests
- Data transformation tests
- All public method coverage

**Pro tip:** Claude will:
- ✅ Match your existing test patterns
- ✅ Use AAA structure
- ✅ Follow `.claude/coding-standards.md` patterns
- ✅ Include edge cases

---

### 3. `wcag-scan-fix` - Accessibility Analysis & Fixes

**What it does:**
- Scans Angular screens for WCAG violations
- Identifies specific accessibility issues
- Generates automated fixes
- Provides ARIA label recommendations
- Ensures keyboard navigation

**When to use:**
- New feature development (before PR)
- Accessibility compliance review
- Fixing a11y issues from QA
- Complementing `/validate-screen` Section 10

**Example 1: Scan Screen for Issues**

```
User: /wcag-scan http://localhost:4200/donor-functions/donor-list
```

**What Claude finds:**
```markdown
## WCAG Accessibility Scan Results

**URL:** http://localhost:4200/donor-functions/donor-list

### Critical Issues (3)

1. **Missing ARIA labels on icon buttons**
   - Location: Edit button (line 45), Delete button (line 46)
   - WCAG: 4.1.2 Name, Role, Value
   - Impact: Screen readers cannot describe button purpose
   - Fix: Add aria-label="Edit donor" and aria-label="Delete donor"

2. **Insufficient color contrast**
   - Location: Status badge (line 89)
   - Contrast ratio: 3.2:1 (needs 4.5:1)
   - WCAG: 1.4.3 Contrast (Minimum)
   - Fix: Change color from #999999 to #767676

3. **Form field missing label association**
   - Location: Search input (line 23)
   - WCAG: 1.3.1 Info and Relationships
   - Fix: Add <label for="search"> or aria-label

### Warnings (5)
[Additional non-critical issues...]

### Automated Fixes Available
Would you like me to apply these fixes?
```

**Example 2: Auto-Fix Accessibility Issues**

```
User: Fix the WCAG issues in donor-list.component.html
```

**Claude applies:**
```html
<!-- Before -->
<button mat-icon-button (click)="edit(donor)">
  <mat-icon>edit</mat-icon>
</button>

<!-- After -->
<button mat-icon-button 
        (click)="edit(donor)"
        aria-label="Edit donor {{donor.name}}">
  <mat-icon>edit</mat-icon>
</button>
```

**Example 3: Integration with /validate-screen**

```
Workflow:

1. You: /validate-screen http://localhost:4200/donor-list
   -> Your custom skill: 10-section quality check
   -> Reports: "⚠️ Screen Reader Text: Missing aria-labels on lines 45, 46"

2. You: /wcag-scan http://localhost:4200/donor-list
   -> WellSky plugin: Detailed accessibility analysis
   -> Provides specific fixes with code

3. You: Apply the ARIA label fixes
   -> Claude: Updates component HTML

4. You: /validate-screen http://localhost:4200/donor-list
   -> Your skill: ✅ All accessibility checks pass
```

**Pro tip:** Run this BEFORE creating PR to catch issues early

---

### 4. `snyk-security` - Security Vulnerability Scanning

**What it does:**
- Scans dependencies for vulnerabilities
- Identifies security issues in code (SAST)
- Provides AI-powered fix recommendations
- Generates security tests
- Creates PRs with fixes

**When to use:**
- Before merging to main
- Weekly security audits
- After adding new dependencies
- Investigating security incidents

**Example 1: Scan for Vulnerabilities**

```
User: Run Snyk security scan
```

**What Claude does:**
1. Scans package.json dependencies
2. Analyzes code for security issues
3. Checks for exposed secrets
4. Provides remediation recommendations

**Example output:**
```markdown
## Snyk Security Scan Results

### High Severity (2)

1. **Prototype Pollution in lodash**
   - Package: lodash@4.17.19
   - Vulnerability: CVE-2020-8203
   - Impact: Prototype pollution can lead to DoS or RCE
   - Fix: Upgrade to lodash@4.17.21
   - Breaking changes: None

2. **Regular Expression DoS in moment**
   - Package: moment@2.29.1
   - Vulnerability: CVE-2022-31129
   - Impact: ReDoS in parsing logic
   - Fix: Upgrade to moment@2.29.4
   - Breaking changes: None

### Medium Severity (5)
[Additional issues...]

### Automated Fix Available
Would you like me to create a PR with these dependency updates?
```

**Example 2: Check for Exposed Secrets**

```
User: Scan for exposed secrets
```

**Claude checks for:**
- API keys in code
- Hardcoded passwords
- Private keys
- Database connection strings
- OAuth tokens

**Example 3: Security Test Generation**

```
User: Generate security tests for user authentication
```

**Claude generates:**
- SQL injection tests
- XSS vulnerability tests
- CSRF protection tests
- Authentication bypass tests

**Pro tip:** Integrate with your pre-commit workflow:
```bash
# Add to git hooks
/plugin run snyk-security scan
```

---

### 5. `ws-atlassian` - JIRA & Confluence Integration

**What it does:**
- Fetches JIRA ticket details
- Updates ticket status
- Creates tickets from code
- Searches Confluence docs
- Links PRs to tickets

**When to use:**
- Looking up ticket details
- Updating ticket status during development
- Finding documentation
- Creating technical tickets

**Example 1: Fetch Ticket Details**

```
User: What's in MLT-12345?
```

**Claude returns:**
```markdown
## JIRA Ticket: MLT-12345

**Title:** Fix date picker timezone issue
**Status:** In Progress
**Assignee:** Your Name
**Priority:** High
**Sprint:** Sprint 42

**Description:**
Date picker in Effective Date field uses browser timezone instead of 
chapter timezone, causing validation errors for users in different timezones.

**Acceptance Criteria:**
- [ ] Date picker uses chapter timezone from HeaderService
- [ ] Validation respects chapter timezone
- [ ] Tests cover multiple timezone scenarios

**Related Tickets:**
- Blocks: MLT-12346
- Related: MLT-11931
```

**Example 2: Update Ticket Status**

```
User: Move MLT-12345 to Code Review
```

**Claude:**
1. Updates JIRA ticket status
2. Adds comment with PR link
3. Assigns to reviewers

**Example 3: Search Confluence**

```
User: Find documentation about DateFieldValidationUtility
```

**Claude searches Confluence:**
```
Found in: "Frontend Development Guide" page
Section: Date Handling Utilities

DateFieldValidationUtility provides timezone-aware date validation:
- getMinDate(chapterOffset): Returns today in chapter timezone
- formatDateForAPI(): Converts to YYYY-MM-DD
[Full documentation excerpt...]
```

**Pro tip:** Reduces context switching between browser and IDE

---

### 6. `sql-query-generator` - Test Data Query Generation

**What it does:**
- Generates SQL queries for test data
- Infers schema from existing queries
- Supports multiple database dialects
- Creates parameterized queries
- Formats output for copy-paste

**When to use:**
- Setting up test data
- Debugging database issues
- Writing integration tests
- Querying test environments

**Example 1: Generate Test Data Query**

```
User: Generate SQL to insert test donor with blood type O+
```

**Claude generates:**
```sql
-- Insert test donor with O+ blood type
INSERT INTO Donors (
    DonorID,
    FirstName,
    LastName,
    DateOfBirth,
    BloodType,
    RhFactor,
    EffectiveDate,
    ChapterID
) VALUES (
    'TEST-DONOR-001',
    'John',
    'Doe',
    '1985-05-15',
    'O',
    '+',
    GETDATE(),
    'CH-001'
);

-- Verify insertion
SELECT * FROM Donors WHERE DonorID = 'TEST-DONOR-001';
```

**Example 2: Query Existing Test Data**

```
User: Get all active donors from last month
```

**Claude generates:**
```sql
SELECT 
    d.DonorID,
    d.FirstName,
    d.LastName,
    d.BloodType,
    d.RhFactor,
    d.EffectiveDate
FROM Donors d
WHERE 
    d.EffectiveDate >= DATEADD(MONTH, -1, GETDATE())
    AND (d.TerminationDate IS NULL OR d.TerminationDate > GETDATE())
    AND d.ChapterID = 'CH-001'
ORDER BY d.EffectiveDate DESC;
```

**Pro tip:** Specify database dialect if needed:
```
User: Generate query for SQL Server
```

---

## 🔄 Integration with Existing .claude System

### How Plugins Complement .claude/

**Your `.claude` system provides:**
- ✅ Blood Center domain knowledge
- ✅ Project-specific patterns (chapter validation, date handling)
- ✅ Custom workflows (`/validate-screen`)
- ✅ Team standards (coding-standards.md)

**WellSky plugins provide:**
- ✅ External tool integrations (JIRA, Snyk, Confluence)
- ✅ Automation (test generation, security scanning)
- ✅ Cross-project utilities
- ✅ WellSky-specific workflows

**Example Combined Workflow:**

```
Scenario: Fix bug from JIRA backlog

1. Fetch ticket:
   You: "Analyze MLT-12345"
   -> ws-atlassian plugin: Gets ticket details
   
2. Understand context:
   -> Your .claude/architecture.md: Project structure
   -> Your .claude/business-rules.md: Domain logic
   
3. Find related code:
   -> CLAUDE.md dynamic discovery: Finds affected files
   
4. Generate fix:
   -> bug-fix plugin: Suggests implementation
   -> Your .claude/coding-standards.md: Enforces patterns
   
5. Create tests:
   -> unit-gen plugin: Generates test file
   -> Your .claude/test-examples.md: AAA pattern template
   
6. Validate quality:
   You: "/validate-screen http://localhost:4200/donors"
   -> Your custom skill: 10-section quality check
   
7. Check accessibility:
   -> wcag-scan-fix plugin: WCAG compliance
   
8. Security scan:
   -> snyk-security plugin: Vulnerability check
   
9. Create PR:
   -> All checks pass, PR description auto-generated
   -> Links to MLT-12345 automatically
```

**Result:** 
- **Without plugins:** 3-4 hours (manual JIRA lookup, manual testing, manual security check)
- **With plugins:** 1-2 hours (automated ticket fetch, test gen, scanning)
- **Savings:** 50-60% time reduction

---

## 📊 Expected Time Savings

### Per Developer Per Month

| Activity | Before Plugins | With Plugins | Time Saved |
|----------|---------------|--------------|------------|
| JIRA ticket analysis | 30 min × 10 tickets = 5h | 10 min × 10 = 1.5h | **3.5h** |
| Unit test writing | 30 min × 20 files = 10h | 10 min × 20 = 3h | **7h** |
| Accessibility fixes | 40 min × 5 screens = 3h | 15 min × 5 = 1h | **2h** |
| Security scanning | 20 min × 4 scans = 1.5h | 5 min × 4 = 0.5h | **1h** |
| Documentation lookup | 10 min × 20 queries = 3h | 2 min × 20 = 0.5h | **2.5h** |
| **TOTAL** | **22.5 hours** | **6.5 hours** | **16 hours/month** |

**For 10 developers:** 160 hours/month saved ≈ **1 FTE**

**For 20 developers:** 320 hours/month saved ≈ **2 FTE**

---

## 🎯 Best Practices

### DO ✅

1. **Install plugins incrementally**
   - Start with 3-4 high-value plugins
   - Learn each before adding more
   - Measure time savings

2. **Combine with .claude system**
   - Use `/validate-screen` + `wcag-scan-fix` together
   - Let CLAUDE.md guide plugin behavior
   - Leverage both dynamic discovery AND automation

3. **Share learnings with team**
   - Document successful workflows
   - Create team-specific examples
   - Update `.claude/onboarding.md` with plugin tips

4. **Configure credentials properly**
   - Use environment variables (not hardcoded)
   - Store securely (1Password, .env files)
   - Rotate tokens regularly

5. **Run scans before PR**
   ```bash
   # Quality checklist before pushing
   /validate-screen http://localhost:4200/your-screen
   /wcag-scan http://localhost:4200/your-screen
   /plugin run snyk-security scan
   npm test
   npm run lint
   ```

### DON'T ❌

1. **Don't install all plugins at once**
   - Overwhelming to learn
   - Many won't apply to Blood Center app
   - Start small, expand gradually

2. **Don't replace .claude system**
   - Your custom patterns are valuable
   - Project-specific knowledge is irreplaceable
   - Plugins complement, not replace

3. **Don't skip verification**
   - Review plugin-generated code before committing
   - Test plugin suggestions thoroughly
   - Claude can make mistakes - you're still responsible

4. **Don't expose credentials**
   - Never commit JIRA tokens
   - Never share Snyk tokens in code
   - Use .env files (add to .gitignore)

5. **Don't blindly trust security fixes**
   - Review dependency updates
   - Check for breaking changes
   - Test after applying fixes

---

## 🐛 Troubleshooting

### Plugin Installation Issues

**Problem:** `/plugin install` fails with "marketplace not found"

**Solution:**
```bash
# Re-authenticate GitHub
gh auth login

# Verify marketplace access
gh repo view mediwareinc/wellsky-claude-code-plugins

# Re-add marketplace following:
# https://wellsky.atlassian.net/wiki/spaces/ME/pages/2513896473/
```

---

**Problem:** Plugin shows "❌ Loading error"

**Solution:**
```bash
# Uninstall and reinstall
/plugin uninstall plugin-name@wellsky-plugins
/plugin install plugin-name@wellsky-plugins

# Verify shared plugin is installed
/plugin install shared@wellsky-plugins
```

---

### Authentication Issues

**Problem:** JIRA plugin can't fetch tickets

**Solution:**
```bash
# Verify credentials
echo $JIRA_EMAIL
echo $JIRA_BASE_URL
# DO NOT echo $JIRA_API_TOKEN (keep secret)

# Test JIRA API manually
curl -u $JIRA_EMAIL:$JIRA_API_TOKEN \
  "$JIRA_BASE_URL/rest/api/2/issue/MLT-12345"

# If fails, regenerate token:
# https://id.atlassian.com/manage-profile/security/api-tokens
```

---

**Problem:** Snyk scan fails with authentication error

**Solution:**
```bash
# Verify Snyk token
snyk auth $SNYK_TOKEN

# Test Snyk CLI
snyk test

# If fails, get new token from Snyk dashboard
```

---

### Performance Issues

**Problem:** Plugin takes too long to respond

**Possible causes:**
1. Large JIRA ticket with many comments
2. Big codebase search
3. Network latency to APIs

**Solutions:**
```bash
# For JIRA: Be specific
Instead of: "Analyze all tickets in sprint"
Use: "Analyze MLT-12345"

# For code search: Limit scope
Instead of: "Find all components"
Use: "Find components in src/app/modules/donor-functions"

# Check network
ping wellsky.atlassian.net
```

---

## 📚 Additional Resources

### Official Documentation
- **WellSky Plugins Repo:** https://github.com/mediwareinc/wellsky-claude-code-plugins
- **Confluence Setup Guide:** https://wellsky.atlassian.net/wiki/spaces/ME/pages/2513896473/
- **Demo Video (30 min):** [SharePoint Link](https://wellskycorp.sharepoint.com/:v:/r/sites/QAToolingPractices/Shared%20Documents/General/AI-Agents/Claude%20Plugin/Claude%20Code%20Plugin.mp4)

### Internal Support
- **Slack:** #claude-code-support
- **Plugin Issues:** https://github.com/mediwareinc/wellsky-claude-code-plugins/issues
- **Questions:** Reach out to Engineering Enablement team

### Learning Path
1. **Week 1:** Install 3 core plugins, try basic commands
2. **Week 2:** Integrate into daily workflow, measure time savings
3. **Week 3:** Share learnings with team, create examples
4. **Week 4:** Add more plugins as needed, optimize workflow

---

## 🎓 Training Plan for Team

### 15-Minute Team Demo

**Agenda:**
1. **Why plugins** (2 min)
   - Time savings: 16h/month per dev
   - Automation vs manual work
   
2. **Live demo** (10 min)
   - Show bug-fix on real ticket
   - Show unit-gen creating tests
   - Show wcag-scan finding issues
   
3. **How to install** (3 min)
   - Show `/plugin install` command
   - Point to this guide

**Demo Script:**
```bash
# 1. Analyze JIRA ticket
You: "Analyze MLT-12345"
[Show ticket details, root cause, suggested fix]

# 2. Generate tests
You: "/unit-gen src/app/modules/donor-functions/donor-list.component.ts"
[Show generated tests with 90% coverage]

# 3. Check accessibility
You: "/wcag-scan http://localhost:4200/donor-list"
[Show WCAG violations and fixes]

# Questions?
```

### Self-Paced Learning

**Day 1: Setup** (30 min)
- [ ] Read "Quick Start Setup" section
- [ ] Install marketplace + 3 plugins
- [ ] Verify installation with `/plugin`

**Day 2: Try bug-fix** (1 hour)
- [ ] Pick a JIRA ticket from backlog
- [ ] Run: "Analyze [ticket]"
- [ ] Review suggestions
- [ ] Apply one fix

**Day 3: Try unit-gen** (1 hour)
- [ ] Pick a component without tests
- [ ] Run: `/unit-gen [component-path]`
- [ ] Review generated tests
- [ ] Customize and commit

**Day 4: Try wcag-scan-fix** (1 hour)
- [ ] Pick a screen you built
- [ ] Run: `/wcag-scan [url]`
- [ ] Review violations
- [ ] Apply fixes

**Day 5: Integrate into workflow** (ongoing)
- [ ] Use plugins for all new tickets
- [ ] Track time saved
- [ ] Share findings with team

---

## 📝 Quick Reference Card

**Print and keep near your desk:**

```
┌─────────────────────────────────────────────────────────────┐
│           WELLSKY PLUGINS QUICK REFERENCE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ANALYZE BUG:                                               │
│  > Analyze MLT-12345                                        │
│                                                             │
│  GENERATE TESTS:                                            │
│  > /unit-gen src/app/path/to/component.ts                  │
│                                                             │
│  CHECK ACCESSIBILITY:                                       │
│  > /wcag-scan http://localhost:4200/screen                 │
│                                                             │
│  SECURITY SCAN:                                             │
│  > /plugin run snyk-security scan                          │
│                                                             │
│  JIRA LOOKUP:                                               │
│  > What's in MLT-12345?                                     │
│                                                             │
│  LIST INSTALLED:                                            │
│  > /plugin                                                  │
│                                                             │
│  INSTALL NEW:                                               │
│  > /plugin install plugin-name@wellsky-plugins             │
│                                                             │
│  HELP:                                                      │
│  > Read .claude/wellsky-plugins-guide.md                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Success Metrics

**Track these to measure plugin effectiveness:**

### Individual Metrics
- Time to fix JIRA ticket (before vs after)
- Test coverage % (should increase)
- WCAG violations per screen (should decrease)
- Security vulnerabilities found (proactive vs reactive)

### Team Metrics
- PR first-pass rate (should increase)
- Code review time (should decrease)
- Accessibility defects from QA (should decrease)
- Security incidents (should decrease)

### Targets (3 months)
- ✅ 50% reduction in bug fix time
- ✅ 90%+ test coverage on new code
- ✅ Zero WCAG violations in new features
- ✅ Security scans before every PR

---

## 📞 Getting Help

**Questions about this guide:**
- Contact: Blood Center Tech Lead
- Slack: #blood-center-dev

**Plugin technical issues:**
- GitHub: https://github.com/mediwareinc/wellsky-claude-code-plugins/issues
- Slack: #claude-code-support

**JIRA/Confluence access:**
- Contact: Engineering Enablement team

**Snyk access:**
- Contact: Security team

---

## 🔄 Document Updates

**This guide will be updated:**
- Monthly: New plugin releases
- Quarterly: Usage patterns and best practices
- As needed: Team feedback and troubleshooting tips

**Last updated:** April 22, 2026
**Next review:** July 22, 2026

---

## 💡 Final Thoughts

**Remember:**

1. **Plugins are tools, not magic** - Still requires your judgment
2. **Start small** - 3 plugins, learn them well, expand later
3. **Combine with .claude** - Plugins + custom system = maximum value
4. **Measure results** - Track time savings to justify investment
5. **Share knowledge** - Help team members get up to speed

**The goal:** Spend less time on repetitive tasks, more time on creative problem-solving.

**Your .claude system taught Claude HOW to build Blood Center features.**
**WellSky plugins AUTOMATE the repetitive parts.**
**Together, they make you 2-3x more productive.**

Happy coding! 🚀
