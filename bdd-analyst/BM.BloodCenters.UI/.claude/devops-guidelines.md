# DevOps & CI/CD Guidelines

## Azure DevOps Integration

### Pull Request Requirements

#### PR Template
Every PR must include:

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## AI Context Used
**Required**: Document which .claude/ files were referenced

- [ ] .claude/system-summary.md
- [ ] .claude/coding-standards.md
- [ ] .claude/api-contracts.md
- [ ] .claude/components.md
- [ ] .claude/business-rules.md
- [ ] .claude/test-patterns.md
- [ ] .claude/figma-guidelines.md
- [ ] Other: [specify]

## Checklist
- [ ] Code follows coding standards
- [ ] Reused existing components (checked .claude/components.md)
- [ ] API contracts defined with TypeScript interfaces
- [ ] Unit tests written (coverage ≥ 80%)
- [ ] All tests passing
- [ ] No TypeScript/linting errors
- [ ] Error handling implemented
- [ ] Responsive design (if UI changes)
- [ ] Accessibility considered
- [ ] Documentation updated (if needed)

## Testing
- [ ] Unit tests pass locally
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Tested in [environment]

## Screenshots (if UI changes)
[Add screenshots]

## Related Work Items
- [Link to Azure DevOps work item]

## Notes
[Any additional context, known limitations, or follow-up items]
```

#### Required PR Checks
- ✅ All Azure Pipelines must pass
- ✅ Code coverage meets threshold (80% overall, 90% new code)
- ✅ No linting errors
- ✅ At least 1 approval from code owner
- ✅ "AI Context Used" section completed

### Branch Strategy

#### Branch Naming
```
feature/[work-item-id]-brief-description
bugfix/[work-item-id]-brief-description
hotfix/[work-item-id]-brief-description
```

**Examples**:
- `feature/12345-user-management`
- `bugfix/67890-date-validation-error`
- `hotfix/11111-critical-security-fix`

#### Main Branches
- **`main`**: Production-ready code
- **`develop`**: Integration branch (if using GitFlow)
- **Feature branches**: Short-lived, deleted after merge

#### Commit Messages
```
[Type]: [Brief description]

[Optional detailed description]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `docs`: Documentation changes
- `style`: Formatting changes
- `chore`: Build/config changes

**Examples**:
```
feat: Add user management module with CRUD operations

Implemented user list, create, edit, and delete functionality
following coding standards and API contracts.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix: Resolve date formatting issue in user effective date

Used DateFieldValidationUtility to ensure consistent YYYY-MM-DD format
when sending dates to API.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CI/CD Pipeline

### Build Pipeline

#### Stages
1. **Install Dependencies**
   ```yaml
   - task: Npm@1
     displayName: 'npm install'
     inputs:
       command: 'install'
   ```

2. **Lint**
   ```yaml
   - task: Npm@1
     displayName: 'npm run lint'
     inputs:
       command: 'custom'
       customCommand: 'run lint'
   ```

3. **Unit Tests**
   ```yaml
   - task: Npm@1
     displayName: 'npm test'
     inputs:
       command: 'custom'
       customCommand: 'test -- --configuration=ci'
   ```

4. **Code Coverage**
   ```yaml
   - task: PublishCodeCoverageResults@1
     displayName: 'Publish Code Coverage'
     inputs:
       codeCoverageTool: 'Cobertura'
       summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
   ```

5. **Build**
   ```yaml
   - task: Npm@1
     displayName: 'npm run build'
     inputs:
       command: 'custom'
       customCommand: 'run build-$(environment)'
   ```

6. **Publish Artifacts**
   ```yaml
   - task: PublishBuildArtifacts@1
     displayName: 'Publish Build Artifacts'
     inputs:
       pathToPublish: '$(System.DefaultWorkingDirectory)/dist'
       artifactName: 'drop'
   ```

### Quality Gates

#### Enforced Gates
1. **Build Success**: All pipeline stages must pass
2. **Test Success**: 100% test pass rate
3. **Code Coverage**: 
   - Overall: ≥ 80%
   - New code: ≥ 90%
   - Critical paths: 100%
4. **Linting**: Zero errors, warnings acceptable if documented
5. **TypeScript Compilation**: Zero errors
6. **Code Review**: At least 1 approval

#### Coverage Reports
- **Format**: Cobertura XML
- **Location**: `coverage/cobertura-coverage.xml`
- **Published to**: Azure DevOps Code Coverage tab
- **Threshold**: Build fails if coverage drops below minimum

### Deployment Pipeline

#### Environments
1. **Development** (auto-deploy from `develop` branch)
2. **QA** (auto-deploy after approval)
3. **Staging** (auto-deploy after approval)
4. **Production** (manual deployment, requires approvals)

#### Environment Variables
Managed via Azure DevOps Library:
- API base URLs
- Feature flags
- Okta configuration
- Environment-specific settings

#### Deployment Steps
1. Download build artifacts
2. Replace environment-specific configs
3. Deploy to web server
4. Run smoke tests
5. Notify team

## AI-Assisted Development Enforcement

### Pre-Commit Validation

**Recommended Hook** (`.git/hooks/pre-commit`):
```bash
#!/bin/bash

# Check if .claude/ context was used for TypeScript changes
ts_changed=$(git diff --cached --name-only | grep '\.ts$' | wc -l)

if [ $ts_changed -gt 0 ]; then
  echo "TypeScript files changed. Did you follow .claude/ standards?"
  echo "Required reading:"
  echo "  - .claude/coding-standards.md"
  echo "  - .claude/components.md (check for reusable components)"
  echo ""
  read -p "Confirm you followed standards (y/n): " confirm
  
  if [ "$confirm" != "y" ]; then
    echo "Commit cancelled. Please review .claude/ documentation."
    exit 1
  fi
fi

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Fix errors before committing."
  exit 1
fi

# Run tests
npm test -- --configuration=ci
if [ $? -ne 0 ]; then
  echo "Tests failed. Fix tests before committing."
  exit 1
fi

echo "Pre-commit checks passed!"
```

### PR Review Checklist

**For Reviewers**:
```markdown
## Code Review Checklist

### AI Context Compliance
- [ ] PR author documented which .claude/ files were used
- [ ] Code follows documented coding standards
- [ ] No duplicate components (checked against .claude/components.md)
- [ ] API integration follows .claude/api-contracts.md
- [ ] Tests follow .claude/test-patterns.md

### Code Quality
- [ ] No TypeScript `any` types
- [ ] Proper error handling
- [ ] Observable subscriptions managed
- [ ] Forms validated correctly
- [ ] API constants used (no hardcoded URLs)
- [ ] Dates formatted as YYYY-MM-DD

### Testing
- [ ] Unit tests present for all new code
- [ ] Tests follow AAA pattern
- [ ] Coverage meets threshold
- [ ] All tests passing

### Documentation
- [ ] Code is self-documenting or has comments
- [ ] Complex logic explained
- [ ] .claude/ docs updated if needed

### Deployment
- [ ] No breaking changes (or documented)
- [ ] Environment configs considered
- [ ] Database migrations (if any) included
```

## Monitoring & Alerts

### Application Insights
- **Frontend errors**: Logged to Azure Application Insights
- **Performance**: Track page load times, API response times
- **Usage**: Monitor feature adoption

### Key Metrics
- Build success rate
- Test pass rate
- Code coverage trend
- Deployment frequency
- Mean time to recovery (MTTR)
- AI context usage compliance rate

### Alerts
- Build failures (notify team immediately)
- Coverage drops below threshold
- Production errors spike
- Performance degradation

## Rollback Strategy

### Automated Rollback Triggers
- Critical errors detected in production
- Health check failures
- Performance degradation > 50%

### Manual Rollback Process
1. Identify problematic deployment
2. Revert to previous artifact
3. Redeploy previous version
4. Verify health checks
5. Notify team
6. Root cause analysis
7. Fix and redeploy

### Rollback Commands
```bash
# Azure CLI
az webapp deployment source config-zip \
  --resource-group [rg-name] \
  --name [app-name] \
  --src [previous-artifact.zip]
```

## Security Scanning

### Tools Integrated
1. **npm audit**: Dependency vulnerability scanning
2. **SonarQube**: Code quality and security analysis
3. **OWASP Dependency Check**: Known vulnerabilities

### Pipeline Integration
```yaml
- task: Npm@1
  displayName: 'npm audit'
  inputs:
    command: 'custom'
    customCommand: 'audit --audit-level=moderate'
  continueOnError: false
```

### Security Requirements
- No high/critical vulnerabilities in dependencies
- No secrets in code (use Azure Key Vault)
- HTTPS enforced
- Auth tokens properly managed
- Input sanitization implemented

## Performance Testing

### Lighthouse CI
Run Lighthouse audits in CI:
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

### Bundle Size Analysis
- Monitor bundle size trends
- Alert if bundle grows > 10%
- Use webpack-bundle-analyzer

## Documentation Requirements

### Required Documentation Updates
When making changes, update relevant docs:
- **API changes**: Update `.claude/api-contracts.md`
- **New components**: Update `.claude/components.md`
- **Standards changes**: Update `.claude/coding-standards.md`
- **Business logic**: Update `.claude/business-rules.md`

### README.md Updates
Keep project README current with:
- Getting started instructions
- Environment setup
- Build commands
- Testing commands
- Deployment process

## Team Workflows

### Daily Development
1. Pull latest changes from `main`
2. Create feature branch
3. Read relevant `.claude/` context files
4. Implement changes following standards
5. Write unit tests
6. Run tests locally
7. Commit with proper message
8. Push branch
9. Create PR with completed template
10. Address review feedback
11. Merge after approval

### Code Review Workflow
1. Reviewer assigned automatically
2. Check "AI Context Used" section
3. Verify coding standards followed
4. Review tests
5. Check for reusable component usage
6. Approve or request changes
7. Merge to main (squash commits)

### Release Workflow
1. Create release branch from `main`
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Create release tag
5. Deploy to staging
6. QA approval
7. Deploy to production
8. Monitor for issues
9. Create GitHub release with notes

## Continuous Improvement

### Metrics Review (Monthly)
- **Token usage**: Track AI token consumption
- **Rework rate**: Measure code changes after PR merge
- **Test coverage**: Trend analysis
- **Build time**: Optimize if increasing
- **Deployment frequency**: Aim to increase
- **Context compliance**: % of PRs with documented context usage

### Process Improvements
- Collect feedback on `.claude/` effectiveness
- Update documentation based on common questions
- Add new prompt templates as patterns emerge
- Refine quality gates based on metrics

### Documentation Maintenance
- Monthly review of `.claude/` files
- Remove outdated information
- Add new patterns discovered
- Improve clarity based on feedback

## Best Practices Summary

### DO
✅ Document AI context usage in every PR
✅ Run tests locally before pushing
✅ Follow branch naming conventions
✅ Write meaningful commit messages
✅ Add Co-Authored-By for AI assistance
✅ Meet all quality gates
✅ Update documentation when needed
✅ Review `.claude/` files before starting work
✅ Use PR template completely

### DON'T
❌ Skip quality gates
❌ Commit directly to `main`
❌ Merge without approval
❌ Deploy without testing
❌ Ignore failing tests
❌ Skip documentation updates
❌ Bypass AI context documentation
❌ Create PRs without work item links
❌ Leave TODO comments without tickets

## Support & Resources

### Documentation
- `.claude/` folder - AI governance system
- `README.md` - Project setup
- Azure DevOps Wiki - Team processes

### Contacts
- **Build issues**: DevOps team
- **Code standards**: Tech leads
- **Azure pipeline**: Platform team
- **Security**: Security team

### Tools
- Azure DevOps: Project management, CI/CD
- SonarQube: Code quality
- Application Insights: Monitoring
- GitHub: Source control
