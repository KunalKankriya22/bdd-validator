# Git Workflow & Common Mistakes

**Smart git practices to prevent issues junior developers commonly encounter.**

---

## 🚨 Critical: Clean Working Directory = Safe Commits

### The Abandoned Changes Problem (Very Common)

**What happens:**
1. Developer tries a change to fix something (e.g., modifies `user.service.ts`)
2. The change doesn't work
3. Developer moves on to work on something else
4. **Forgets the file is still modified**
5. Later commits accidentally include the abandoned/broken change

**Real Examples:**

**Example 1: Abandoned Experiment**
```bash
# Morning: Try to add caching to user service
# Edit user.service.ts, add caching logic
# Test it → doesn't work, seems to cause issues
# Mentally abandon the idea, start working on feature B

# Afternoon: Working on feature B
git add src/feature-b/
git commit -m "feat: Add feature B"

# OOPS: user.service.ts is ALSO committed with broken caching!
```

**Example 2: The Package.json Incident**
```bash
# Try to add a dependency for testing
npm install some-package
# Test it → doesn't help, decide not to use it
# Move on to other work

# Later: Commit feature work
git add .
git commit -m "feat: Add new feature"

# OOPS: package.json AND package-lock.json committed!
# Now CI/CD breaks because that test package is in production build
```

**Example 3: Debugging Console.logs**
```bash
# Add console.log() statements to debug an issue
# Figure out the problem
# Fix it, but forget to remove console.logs
# Commit the fix → console.logs go to production
```

**Why it's dangerous:**
- ❌ Introduces bugs (abandoned code that didn't work)
- ❌ Breaks CI/CD (package.json, config files)
- ❌ Confusion in PR review (unrelated changes)
- ❌ Hard to debug later (why was this change made?)
- ❌ Can't easily revert just the good parts

---

### The Golden Rule: Keep Your Working Directory Clean

**ALWAYS know what's modified in your working directory.**

```bash
# Start of every work session
git status

# Before starting new task
git status

# Before taking a break
git status

# Before committing
git status

# Before switching branches
git status
```

**If you see modified files you don't remember changing:**
```bash
git diff <file>    # What changed?

# Ask yourself:
# "Do I need this change?"
# "Is this related to what I'm committing?"
# "Did I abandon this earlier?"

# If abandoned/unwanted:
git checkout -- <file>    # Revert it

# If wanted but separate concern:
git stash                 # Save for later
git stash save "attempted caching feature"
```

---

### The Right Workflow

**✅ GOOD: Clean as you go**
```bash
# Try something
# Edit files

# If it doesn't work:
git status                        # What did I change?
git checkout -- user.service.ts   # Revert immediately
# OR
git stash save "caching attempt - didn't work"

# Now working directory is clean
# Start next task with clean slate
```

**❌ BAD: Leave files modified**
```bash
# Try something
# Edit files

# If it doesn't work:
# Just mentally abandon it
# Move on to next task
# (files stay modified)

# Later: "Why is this file showing up in my commit??"
```

---

### How to Prevent This (Multiple Strategies)

#### Strategy 1: Frequent `git status`

Make it a habit:
```bash
# Before every commit
git status

# Review EVERY file listed
# "Why is this file modified?"
# "Do I need this change?"
```

#### Strategy 2: Use `git add -p` (Interactive)

```bash
# Instead of: git add .
# Use: git add -p

# Git shows each change and asks:
# "Stage this hunk? [y,n,q,a,d,e,?]"

# Forces you to review EVERY change
# Catch abandoned experiments immediately
```

#### Strategy 3: Clean Before Commits

```bash
# Before committing, check for unwanted changes
git diff

# If you see something you abandoned:
git checkout -- <file>

# OR move it to stash for later
git stash save "experiment - review later"
```

#### Strategy 4: Commit Often (Small Commits)

```bash
# Don't wait until end of day
# Commit every logical change

# Good: Multiple small commits
git commit -m "fix: User validation"
git commit -m "refactor: Extract user service"
git commit -m "feat: Add user profile"

# Bad: One giant commit
git commit -m "lots of changes"  # Easy to include abandoned code
```

#### Strategy 5: Use Branches for Experiments

```bash
# Trying something risky?
git checkout -b experiment/caching
# Make changes
# Test

# If it doesn't work:
git checkout main
git branch -D experiment/caching

# Clean! No abandoned files in main branch
```

---

### Smart Pre-Commit Routine

**Run this EVERY time before committing:**

```bash
# 1. What's modified?
git status --short

# 2. Review ALL diffs
git diff

# 3. For each modified file, ask:
# - "Why did I change this?"
# - "Is this related to my commit?"
# - "Did I abandon this earlier?"

# 4. Clean up unwanted changes
git checkout -- <abandoned-file>
# OR
git stash save "feature-name - work in progress"

# 5. Now stage only intentional changes
git add src/specific/files

# 6. Review what's staged
git diff --cached

# 7. Commit
git commit -m "descriptive message"
```

---

## ✅ Pre-Commit Checklist (MANDATORY)

Run this before EVERY commit:

```bash
# 1. Check what's changed
git status --short

# 2. Review ALL diffs
git diff --cached

# 3. Verify no unrelated files
# Look for:
# - package.json (unless you're intentionally adding dependencies)
# - package-lock.json (only commit if package.json changed)
# - .env files (NEVER commit these)
# - node_modules/ (should be in .gitignore)
# - dist/ or build/ folders (should be in .gitignore)
# - IDE config (.vscode/, .idea/) unless team-shared

# 4. Run tests
npm test

# 5. Run linter
npm run lint

# 6. Build succeeds
ng build --configuration=production
```

**If any of these fail, fix before committing.**

---

## 🔍 Common Mistakes Junior Developers Make

### 1. Committing Unrelated Changes

**❌ Wrong:**
```bash
# Working on feature A, but also fixed a typo in file B
git add .
git commit -m "feat: Add feature A"
# Now feature A commit includes unrelated typo fix
```

**✅ Correct:**
```bash
# Commit related changes separately
git add src/feature-a/
git commit -m "feat: Add feature A"

git add src/other-file.ts
git commit -m "fix: Fix typo in other-file"
```

---

### 2. Not Reviewing Staged Changes

**❌ Wrong:**
```bash
git add .           # Blindly stage everything
git commit -m "..."
# Commits IDE config, .env files, package.json accidentally
```

**✅ Correct:**
```bash
git add -A          # Stage all changes
git diff --cached   # REVIEW what's staged
# See package.json? Was that intentional?
git reset HEAD package.json   # Unstage if not

git commit -m "..."
```

---

### 3. Committing package.json Without package-lock.json

**❌ Wrong:**
```bash
git add package.json
git commit -m "Add new dependency"
# package-lock.json not committed → CI fails
```

**✅ Correct:**
```bash
# When package.json changes, ALWAYS commit package-lock.json too
git add package.json package-lock.json
git commit -m "feat: Add lodash dependency"
```

---

### 4. Committing Secrets

**❌ Wrong:**
```bash
# .env file with API keys
git add .env
git commit -m "Add environment config"
# SECURITY BREACH - secrets now in git history forever
```

**✅ Correct:**
```bash
# Ensure .gitignore blocks secrets
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
echo "**/secrets/" >> .gitignore

git add .gitignore
git commit -m "chore: Ignore environment files"

# Create .env.example instead (no real values)
cp .env .env.example
# Replace real values with placeholders
# API_KEY=your-api-key-here
git add .env.example
git commit -m "docs: Add environment example"
```

---

### 5. Not Pulling Before Pushing

**❌ Wrong:**
```bash
git commit -m "..."
git push
# Error: Updates were rejected (remote has changes you don't have)
```

**✅ Correct:**
```bash
git fetch origin
git pull origin main --rebase
# Resolve conflicts if any
git commit -m "..."
git push origin main
```

---

### 6. Force Pushing to Shared Branches

**❌ NEVER DO THIS:**
```bash
git push --force origin main
# Overwrites team's work - EXTREMELY DANGEROUS
```

**✅ Correct:**
```bash
# For your feature branch ONLY (not main/dev):
git push --force-with-lease origin feature-branch
# Safer: fails if remote has commits you don't know about

# For main/dev branches:
# NEVER force push. Ever.
```

---

### 7. Committing Large Files

**❌ Wrong:**
```bash
git add public/assets/video.mp4  # 500MB file
git commit -m "Add demo video"
# Makes repo huge, slows down clones
```

**✅ Correct:**
```bash
# Use Git LFS for large files
git lfs track "*.mp4"
git add .gitattributes
git commit -m "chore: Track videos with LFS"

git add public/assets/video.mp4
git commit -m "docs: Add demo video"

# Or better: host large files externally (S3, CDN)
```

---

## 🛡️ Safety Commands (Use These Often)

### Before Committing

```bash
# See what will be committed
git diff --cached --name-only

# See full diff of staged changes
git diff --cached

# See diff of specific file
git diff --cached src/app/app.component.ts

# Unstage a file
git reset HEAD <file>

# Unstage all files
git reset HEAD .

# Discard changes (CAREFUL - can't undo)
git checkout -- <file>
```

### After Committing (But Before Pushing)

```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes (CAREFUL)
git reset --hard HEAD~1

# Amend last commit (add more changes)
git add <forgotten-file>
git commit --amend --no-edit

# Change last commit message
git commit --amend -m "New message"
```

### After Pushing (Oops!)

```bash
# If you pushed something wrong to YOUR feature branch:
git reset --hard HEAD~1
git push --force-with-lease origin feature-branch

# If you pushed to main/dev:
# 1. Create revert commit (safer)
git revert HEAD
git push origin main

# 2. Or ask team lead for help
# DON'T force push to main
```

---

## 📋 Smart Workflow for This Project

### Daily Workflow

```bash
# Start of day
git checkout main
git pull origin main
git checkout -b feature/MLT-1234-description

# Work...
# Make changes

# Checkpoint (commit often)
git add src/specific/files
git diff --cached    # REVIEW!
git commit -m "WIP: Add user form"

# More work...

# Before final push
npm test             # Must pass
npm run lint         # Must pass
ng build --configuration=production  # Must succeed

git diff main...HEAD --name-only | grep package.json
# If package.json shows up, ask yourself:
# "Did I intentionally add/remove dependencies?"
# If NO: git checkout main -- package.json

# Push
git push origin feature/MLT-1234-description

# Create PR
gh pr create --fill
```

---

## 🎯 Smart Questions to Ask Yourself

**Before git add:**
- "Are these ALL related changes?"
- "Did I accidentally modify package.json?"
- "Are there any .env or secrets files?"

**Before git commit:**
- "Have I reviewed git diff --cached?"
- "Do tests pass?"
- "Does linter pass?"
- "Is my commit message descriptive?"

**Before git push:**
- "Did I pull latest changes?"
- "Is this going to the right branch?"
- "Have I tested this locally?"

---

## 🚨 Emergency: I Committed Secrets!

**If you committed passwords/API keys/secrets:**

```bash
# 1. IMMEDIATELY rotate the exposed credentials
# (Change passwords, regenerate API keys)

# 2. If NOT pushed yet:
git reset --hard HEAD~1
# Re-commit without secrets

# 3. If ALREADY pushed:
# Option A: Rewrite history (if team approves)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin main --force

# Option B: Use BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# 4. Notify team and security team
# 5. Consider exposed credentials compromised
```

**Prevention is better:** Use .gitignore and pre-commit hooks.

---

## 🎓 Pro Tips

### Use Git Aliases

```bash
# Add to ~/.gitconfig
[alias]
  st = status --short
  df = diff
  dfc = diff --cached
  co = checkout
  br = branch
  ci = commit
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --oneline --graph --decorate --all
  
# Usage:
git st        # Instead of git status --short
git dfc       # Instead of git diff --cached
```

### Use Pre-Commit Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for package.json changes
if git diff --cached --name-only | grep -q "package.json"; then
  if ! git diff --cached --name-only | grep -q "package-lock.json"; then
    echo "Error: package.json changed but package-lock.json not staged"
    exit 1
  fi
fi

# Check for secrets
if git diff --cached | grep -i "api_key\|password\|secret"; then
  echo "Warning: Possible secret detected!"
  echo "Review changes carefully"
  exit 1
fi

npm test
npm run lint
```

---

## 📚 Additional Resources

- [Git Best Practices](https://sethrobertson.github.io/GitBestPractices/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write Good Commit Messages](https://chris.beams.io/posts/git-commit/)

---

**For quick reference:** See [quick-reference.md](quick-reference.md) Pre-Commit Checklist  
**For onboarding:** See [onboarding.md](onboarding.md) Common Mistakes section
