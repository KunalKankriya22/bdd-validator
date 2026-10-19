# Single Main Branch Deployment with Runtime Environment Detection

## Scenario

You have:
- **One branch**: `main` (no Dev/QA/Stage branches)
- **Multiple environments**: Dev, QA, Stage, Prod
- **Same artifact** deployed to all environments
- **Environment-specific variables** loaded at runtime

## How It Works

### 1. Build Once, Deploy Many

```
main branch → Build → version.json (build-time) → Artifact
                                                      ↓
                        ┌─────────────────────────────┼─────────────────────────────┐
                        ↓                             ↓                             ↓
                    Dev Deploy                    QA Deploy                   Stage Deploy
                        ↓                             ↓                             ↓
            environment.json (Dev)        environment.json (QA)        environment.json (Stage)
                        ↓                             ↓                             ↓
                Angular loads both files and combines them at runtime
```

### 2. Version Numbering

**Release Version Format**: `YYYY-Rn.m`
- `YYYY`: Current year (2026)
- `Rn`: Major release number (R1, R2, etc.)
- `m`: Minor increment (1, 2, 3...99)

**Auto-Rollover**: R1.99 → R2.1 (at 100 minor releases)

**Rules**:
- Every merge to `main` = new release version
- Same commit = same version across all environments
- Version is stamped at build time via git tag

**Example**:
```bash
# First PR merged to main
Tag: release/2026-R1.1
Version: 2026-R1.1

# Second PR merged to main  
Tag: release/2026-R1.2
Version: 2026-R1.2

# Deploy to Dev → uses 2026-R1.2
# Deploy to QA → uses 2026-R1.2 (same artifact)
# Deploy to Stage → uses 2026-R1.2 (same artifact)
```

---

## Implementation

### A. Pipeline Configuration

**File**: `azure-pipelines.yml`

```yaml
trigger:
  branches:
    include:
      - main  # Only trigger on main branch

pool:
  vmImage: 'ubuntu-latest'

variables:
  - name: BaseVersion
    value: '1.0.0'

stages:
  - stage: Build
    jobs:
      - job: BuildAndVersion
        steps:
          - checkout: self
            persistCredentials: true

          # Calculate Release Version (YYYY-Rn.m)
          - script: |
              set -e
              
              # Ensure all tags are fetched
              git fetch --tags --force
              
              CURRENT_YEAR=$(date -u +"%Y")
              
              # Check if this commit already has a release tag
              EXISTING_TAG=$(git tag --points-at HEAD | grep "^release/${CURRENT_YEAR}-R" || true)
              
              if [ -n "$EXISTING_TAG" ]; then
                # Reuse existing tag
                RELEASE_VERSION=$(echo "$EXISTING_TAG" | sed 's/release\///')
                echo "Existing release tag found: $RELEASE_VERSION"
              else
                # New commit - calculate next version
                LATEST_TAG=$(git tag -l "release/${CURRENT_YEAR}-R*.*" | sort -V | tail -1)
                
                if [ -z "$LATEST_TAG" ]; then
                  # First release of the year
                  MAJOR=1
                  MINOR=1
                else
                  # Parse and increment
                  VERSION_PART=$(echo "$LATEST_TAG" | sed "s/release\/${CURRENT_YEAR}-R//")
                  MAJOR=$(echo "$VERSION_PART" | cut -d. -f1)
                  MINOR=$(echo "$VERSION_PART" | cut -d. -f2)
                  
                  # Increment minor
                  MINOR=$((MINOR + 1))
                  
                  # Rollover at 100
                  if [ $MINOR -ge 100 ]; then
                    MAJOR=$((MAJOR + 1))
                    MINOR=1
                  fi
                fi
                
                RELEASE_VERSION="${CURRENT_YEAR}-R${MAJOR}.${MINOR}"
                
                # Create git tag
                git tag "release/${RELEASE_VERSION}"
                git push origin "release/${RELEASE_VERSION}"
                
                echo "Created new release tag: $RELEASE_VERSION"
              fi
              
              echo "##vso[task.setvariable variable=ReleaseVersion]$RELEASE_VERSION"
            displayName: 'Calculate Release Version'

          # Create version.json
          - script: |
              set -e
              
              # Get dynamic values
              PROJECT_NAME=$(node -p "require('./package.json').name")
              COMMIT_SHA=$(git rev-parse HEAD)
              COMMIT_SHORT=$(git rev-parse --short HEAD)
              TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
              
              # Parse BaseVersion
              IFS='.' read -r MAJOR MINOR PATCH <<< "$(BaseVersion)"
              
              # Build number (for internal tracking)
              BUILD_NUMBER="$(BaseVersion).$(Build.BuildId)"
              
              # App version (full semantic version with build)
              APP_VERSION="${BUILD_NUMBER}"
              
              # Create version.json
              cat > version.json << EOF
              {
                "version": "$BUILD_NUMBER",
                "lastUpdatedUtc": "$TIMESTAMP",
                "branch": "main",
                "buildNumber": "$BUILD_NUMBER",
                "buildId": "$(Build.BuildId)",
                "commit": "$COMMIT_SHA",
                "major": "$MAJOR",
                "minor": "$MINOR",
                "patch": "$PATCH",
                "uiVersion": "$(ReleaseVersion)",
                "releaseVersion": "$(ReleaseVersion)",
                "baseVersion": "$(BaseVersion)",
                "appVersion": "$APP_VERSION"
              }
              EOF
              
              cat version.json
            displayName: 'Create version.json'

          # Build Angular app
          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run build -- --configuration production
            displayName: 'Build Angular app'

          # Copy version.json to output
          - script: |
              PROJECT_NAME=$(node -p "require('./package.json').name")
              OUTPUT_PATH="dist/${PROJECT_NAME}/browser"
              
              if [ ! -d "$OUTPUT_PATH" ]; then
                echo "Error: Output path not found: $OUTPUT_PATH"
                exit 1
              fi
              
              cp version.json "$OUTPUT_PATH/version.json"
              echo "Copied version.json to $OUTPUT_PATH"
            displayName: 'Copy version.json to output'

          # Publish artifact (single artifact for all environments)
          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'dist'
              ArtifactName: 'angular-app'
              publishLocation: 'Container'
```

---

### B. Runtime Environment Configuration

#### File Structure
```
src/assets/config/
  ├── environment.json          # Template (in source control)
  └── environment.dev.json      # Dev-specific (ignored in .gitignore)
  └── environment.qa.json       # QA-specific (ignored in .gitignore)
  └── environment.stage.json    # Stage-specific (ignored in .gitignore)
  └── environment.prod.json     # Prod-specific (ignored in .gitignore)
```

#### Template File
**File**: `src/assets/config/environment.json`

```json
{
  "environment": "local",
  "apiUrl": "http://localhost:3000/api"
}
```

#### Environment-Specific Files (Created During Deployment)

**Dev** (`environment.dev.json`):
```json
{
  "environment": "Dev",
  "apiUrl": "https://dev-api.bloodcenter.com/api"
}
```

**QA** (`environment.qa.json`):
```json
{
  "environment": "QA",
  "apiUrl": "https://qa-api.bloodcenter.com/api"
}
```

**Stage** (`environment.stage.json`):
```json
{
  "environment": "Stage",
  "apiUrl": "https://stage-api.bloodcenter.com/api"
}
```

**Prod** (`environment.prod.json`):
```json
{
  "environment": "Prod",
  "apiUrl": "https://api.bloodcenter.com/api"
}
```

---

### C. Deployment Process

Each environment deployment replaces `environment.json` with environment-specific config:

**Azure Pipeline Deployment Stage** (example for Dev):

```yaml
- stage: DeployDev
  dependsOn: Build
  variables:
    - group: Blood_Center_Dev  # Variable group for Dev
  jobs:
    - deployment: DeployToDev
      environment: 'Dev'
      strategy:
        runOnce:
          deploy:
            steps:
              - download: current
                artifact: angular-app

              # Replace environment.json with Dev config
              - script: |
                  cd $(Pipeline.Workspace)/angular-app
                  
                  # Create Dev environment.json
                  cat > browser/assets/config/environment.json << EOF
                  {
                    "environment": "Dev",
                    "apiUrl": "$(DevApiUrl)"
                  }
                  EOF
                  
                  echo "Environment config updated for Dev"
                displayName: 'Configure environment for Dev'

              # Deploy to Dev server
              - task: AzureWebApp@1
                inputs:
                  appName: '$(DevAppServiceName)'
                  package: '$(Pipeline.Workspace)/angular-app/browser'
```

**For QA/Stage/Prod**: Same pattern, just replace variable group and values.

---

### D. Angular Service Implementation

#### 1. Environment Detection Service

**File**: `src/app/shared/services/environment-detection.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface EnvironmentConfig {
  environment: string; // 'Dev' | 'QA' | 'Stage' | 'Prod' | 'local'
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class EnvironmentDetectionService {
  private http = inject(HttpClient);
  private cachedConfig: EnvironmentConfig | null = null;

  /**
   * Loads runtime environment configuration
   * This file is replaced during deployment
   */
  getEnvironmentConfig(): Observable<EnvironmentConfig> {
    if (this.cachedConfig) {
      return of(this.cachedConfig);
    }

    return this.http.get<EnvironmentConfig>('/assets/config/environment.json').pipe(
      map(config => {
        this.cachedConfig = config;
        return config;
      }),
      catchError(error => {
        console.error('Failed to load environment config:', error);
        const fallback: EnvironmentConfig = {
          environment: 'local',
          apiUrl: 'http://localhost:3000/api'
        };
        this.cachedConfig = fallback;
        return of(fallback);
      })
    );
  }

  getCurrentEnvironment(): string {
    return this.cachedConfig?.environment || 'unknown';
  }
}
```

#### 2. Enhanced Version Service

**File**: `src/app/shared/services/version.service.ts`

Update to include environment info:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { catchError, tap, shareReplay, map } from 'rxjs/operators';
import { EnvironmentDetectionService } from './environment-detection.service';

export interface VersionInfo {
  version: string;
  lastUpdatedUtc: string;
  branch: string;
  buildNumber: string;
  buildId: string;
  commit: string;
  major: string;
  minor: string;
  patch: string;
  uiVersion: string;
  releaseVersion: string;
  baseVersion: string;
  appVersion: string;
  environment?: string; // Runtime environment
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentDetectionService);
  private versionInfo$: Observable<VersionInfo> | null = null;

  getVersionInfo(): Observable<VersionInfo> {
    if (!this.versionInfo$) {
      this.versionInfo$ = combineLatest([
        this.http.get<VersionInfo>('/version.json'),
        this.envService.getEnvironmentConfig()
      ]).pipe(
        map(([versionData, envConfig]) => ({
          ...versionData,
          environment: envConfig.environment
        })),
        catchError(error => {
          console.warn('Failed to load version info', error);
          return of(this.getLocalFallback());
        }),
        shareReplay(1)
      );
    }
    return this.versionInfo$;
  }

  private getLocalFallback(): VersionInfo {
    return {
      version: '1.0.0-Local',
      lastUpdatedUtc: new Date().toISOString(),
      branch: 'local',
      buildNumber: '1.0.0-Local',
      buildId: 'local',
      commit: 'local-development',
      major: '1',
      minor: '0',
      patch: '0',
      uiVersion: '2026-R1.1',
      releaseVersion: '2026-R1.1',
      baseVersion: '1.0.0',
      appVersion: '1.0.0-Local',
      environment: 'local'
    };
  }
}
```

#### 3. Footer Component

**File**: `src/app/modules/authentication/footer/auth-footer.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { VersionService } from '@shared/services/version.service';

@Component({
  selector: 'app-auth-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './auth-footer.component.html',
  styleUrl: './auth-footer.component.scss'
})
export class AuthFooterComponent implements OnInit {
  private versionService = inject(VersionService);
  
  version = 'Loading...';
  showDebugInfo = false;
  versionDetails: any = null;

  ngOnInit(): void {
    this.versionService.getVersionInfo().subscribe({
      next: (info) => {
        this.version = info.releaseVersion || info.uiVersion || 'Unknown';
        this.versionDetails = info;
      },
      error: (error) => {
        console.error('Failed to load version:', error);
        this.version = 'Unknown';
      }
    });
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }
}
```

**File**: `src/app/modules/authentication/footer/auth-footer.component.html`

```html
<footer class="auth-footer">
  <h3 class="auth-footer__title">{{ 'AUTH.FOOTER.TITLE' | translate }}</h3>
  
  <div class="auth-footer__contact">
    <span class="auth-footer__contact-item">{{ 'AUTH.FOOTER.PHONE' | translate }}</span>
    <span class="auth-footer__separator">|</span>
    <span class="auth-footer__contact-item">{{ 'AUTH.FOOTER.EMAIL' | translate }}</span>
  </div>
  
  <p class="auth-footer__copyright" (dblclick)="toggleDebugInfo()">
    {{ 'AUTH.FOOTER.VERSION' | translate: {version: version} }} | {{ 'AUTH.FOOTER.COPYRIGHT' | translate }}
  </p>

  <!-- Debug Info (shown on double-click) -->
  <div *ngIf="showDebugInfo && versionDetails" class="auth-footer__debug">
    <h4>Build Information</h4>
    <hr>
    <dl>
      <dt>Release:</dt>
      <dd>{{ versionDetails.releaseVersion }}</dd>
      
      <dt>Environment:</dt>
      <dd>{{ versionDetails.environment || 'Unknown' }}</dd>
      
      <dt>Build ID:</dt>
      <dd>{{ versionDetails.buildId }}</dd>
      
      <dt>Commit:</dt>
      <dd>{{ versionDetails.commit?.substring(0, 8) }}</dd>
      
      <dt>Branch:</dt>
      <dd>{{ versionDetails.branch }}</dd>
      
      <dt>Build Date:</dt>
      <dd>{{ versionDetails.lastUpdatedUtc | date: 'short' }}</dd>
    </dl>
  </div>
</footer>
```

---

### E. Variable Groups

Create variable groups in Azure DevOps for each environment:

**Blood_Center_Dev**:
- `DevApiUrl`: `https://dev-api.bloodcenter.com/api`
- `DevAppServiceName`: `blood-center-dev`

**Blood_Center_QA**:
- `QaApiUrl`: `https://qa-api.bloodcenter.com/api`
- `QaAppServiceName`: `blood-center-qa`

**Blood_Center_Stage**:
- `StageApiUrl`: `https://stage-api.bloodcenter.com/api`
- `StageAppServiceName`: `blood-center-stage`

**Blood_Center_Prod**:
- `ProdApiUrl`: `https://api.bloodcenter.com/api`
- `ProdAppServiceName`: `blood-center-prod`

---

## How Version Stays Consistent

### Scenario: Deploy Same Code to All Environments

```bash
# Main branch at commit abc123
# First deployment (Dev)
Build triggers → Creates tag: release/2026-R1.5
                 Artifact contains: version.json with releaseVersion: "2026-R1.5"

# Deploy to Dev
Takes artifact → Replaces environment.json with Dev config
Result: version.json shows "2026-R1.5" + environment shows "Dev"

# Deploy to QA (same artifact)
Takes artifact → Replaces environment.json with QA config
Result: version.json shows "2026-R1.5" + environment shows "QA"

# Deploy to Stage (same artifact)
Takes artifact → Replaces environment.json with Stage config
Result: version.json shows "2026-R1.5" + environment shows "Stage"
```

**Key Points**:
- `version.json` is created at BUILD time → Same for all environments
- `environment.json` is replaced at DEPLOY time → Different per environment
- Angular combines both at RUNTIME → Shows correct version + environment

---

## Testing Locally

1. **Create local environment config**:
```bash
# Already exists in src/assets/config/environment.json
{
  "environment": "local",
  "apiUrl": "http://localhost:3000/api"
}
```

2. **Create mock version.json in public folder**:
```bash
# Already exists in public/version.json
{
  "version": "1.0.0-Local.12345",
  "releaseVersion": "2026-R1.1",
  "branch": "local",
  "buildId": "12345",
  "commit": "local-development",
  "major": "1",
  "minor": "0",
  "patch": "0",
  "uiVersion": "2026-R1.1",
  "baseVersion": "1.0.0",
  "appVersion": "1.0.0-Local.12345"
}
```

3. **Run locally**:
```bash
npm start
```

4. **Test footer**:
- Login page should show version in footer
- Double-click version text to see debug info
- Should show "2026-R1.1" as release version
- Should show "local" as environment

---

---

## Complete Deployment Flow (Step-by-Step)

### Stage 1: Developer Creates PR

```bash
# Developer creates feature branch
git checkout -b feature/new-login
# ... makes changes ...
git commit -m "Add new login feature"
git push origin feature/new-login

# Creates PR to main branch
# PR #123 created: feature/new-login → main
```

**What happens**: Nothing yet. No versioning, no builds.

---

### Stage 2: PR Merged to Main

```bash
# PR #123 approved and merged
# Commit SHA: abc123def456
```

**Azure Pipeline Triggers**:

```
Trigger: main branch updated
Agent: ubuntu-latest
Commit: abc123def456

Step 1: Fetch all tags
  └─ git fetch --tags --force

Step 2: Calculate Release Version
  ├─ Current year: 2026
  ├─ Check if commit abc123def456 has tag: NO
  ├─ Find latest tag: release/2026-R1.4
  ├─ Parse: R1.4 → Major=1, Minor=4
  ├─ Increment: Minor=4+1=5
  ├─ New version: 2026-R1.5
  ├─ Create tag: git tag release/2026-R1.5
  └─ Push tag: git push origin release/2026-R1.5

Step 3: Create version.json
  ├─ Read package.json: name="blood-center-app"
  ├─ Get commit: abc123def456
  ├─ Get build ID: 2145800
  ├─ Generate timestamp: 2026-05-05T14:30:00Z
  └─ Create file:
      {
        "version": "1.0.0.2145800",
        "lastUpdatedUtc": "2026-05-05T14:30:00Z",
        "branch": "main",
        "buildNumber": "1.0.0.2145800",
        "buildId": "2145800",
        "commit": "abc123def456",
        "major": "1",
        "minor": "0",
        "patch": "0",
        "uiVersion": "2026-R1.5",
        "releaseVersion": "2026-R1.5",
        "baseVersion": "1.0.0",
        "appVersion": "1.0.0.2145800"
      }

Step 4: Build Angular App
  ├─ npm ci (install dependencies)
  ├─ npm run build --configuration production
  └─ Output: dist/blood-center-app/browser/

Step 5: Copy version.json
  └─ cp version.json dist/blood-center-app/browser/version.json

Step 6: Publish Artifact
  └─ Artifact name: angular-app
      Contents: dist/blood-center-app/browser/**
      
Artifact Structure:
  angular-app/
  ├── index.html
  ├── main.js
  ├── polyfills.js
  ├── styles.css
  ├── version.json  ← Build-time version
  └── assets/
      └── config/
          └── environment.json  ← Template (will be replaced)
```

**Result**: 
- Tag created: `release/2026-R1.5` pointing to commit `abc123def456`
- Artifact published with version `2026-R1.5` baked in

---

### Stage 3: Deploy to Dev Environment

**Azure Pipeline Deployment Stage**:

```
Stage: DeployDev
Environment: Dev
Variables: Blood_Center_Dev
  ├─ DevApiUrl = "https://dev-api.bloodcenter.com/api"
  └─ DevAppServiceName = "blood-center-dev"

Step 1: Download Artifact
  └─ Download: angular-app

Step 2: Replace environment.json (CRITICAL STEP)
  ├─ Navigate to artifact: angular-app/browser/assets/config/
  ├─ Delete template environment.json
  └─ Create NEW environment.json:
      {
        "environment": "Dev",
        "apiUrl": "https://dev-api.bloodcenter.com/api"
      }

Step 3: Deploy to Azure App Service
  ├─ App Service: blood-center-dev
  ├─ Package: angular-app/browser/
  └─ Deploy complete

Dev Server Now Has:
  ├── version.json (from build):
  │   {
  │     "releaseVersion": "2026-R1.5",
  │     "buildId": "2145800",
  │     "commit": "abc123def456",
  │     ...
  │   }
  └── assets/config/environment.json (replaced at deploy):
      {
        "environment": "Dev",
        "apiUrl": "https://dev-api.bloodcenter.com/api"
      }
```

**Dev URL**: `https://blood-center-dev.azurewebsites.net`

**User visits Dev site**:
```
1. Browser loads index.html
2. Angular app initializes
3. VersionService.getVersionInfo() called
   ├─ HTTP GET /version.json → 2026-R1.5
   ├─ EnvironmentDetectionService.getEnvironmentConfig()
   │   └─ HTTP GET /assets/config/environment.json → "Dev"
   └─ Combine both
4. Footer displays: "Version 2026-R1.5"
5. Double-click footer:
   Shows:
   - Release: 2026-R1.5
   - Environment: Dev
   - Build ID: 2145800
   - Commit: abc123de
```

---

### Stage 4: Deploy Same Code to QA Environment

**Same Artifact, Different Config**:

```
Stage: DeployQA
Environment: QA
Variables: Blood_Center_QA
  ├─ QaApiUrl = "https://qa-api.bloodcenter.com/api"
  └─ QaAppServiceName = "blood-center-qa"

Step 1: Download SAME Artifact
  └─ Download: angular-app (build 2145800)
      Contains version.json with releaseVersion: "2026-R1.5"

Step 2: Replace environment.json
  └─ Create NEW environment.json:
      {
        "environment": "QA",
        "apiUrl": "https://qa-api.bloodcenter.com/api"
      }

Step 3: Deploy to QA App Service
  └─ App Service: blood-center-qa
```

**QA URL**: `https://blood-center-qa.azurewebsites.net`

**User visits QA site**:
```
Footer shows: "Version 2026-R1.5"  ← SAME VERSION
Double-click:
  - Release: 2026-R1.5           ← SAME
  - Environment: QA              ← DIFFERENT
  - Build ID: 2145800            ← SAME
  - Commit: abc123de             ← SAME
```

---

### Stage 5: Deploy Same Code to Stage Environment

**Same Artifact, Different Config**:

```
Stage: DeployStage
Environment: Stage
Variables: Blood_Center_Stage

Step 1: Download SAME Artifact
  └─ angular-app (build 2145800, version 2026-R1.5)

Step 2: Replace environment.json
  └─ {
       "environment": "Stage",
       "apiUrl": "https://stage-api.bloodcenter.com/api"
     }

Step 3: Deploy
  └─ App Service: blood-center-stage
```

**Result**:
```
Dev:   Version 2026-R1.5 | Environment: Dev
QA:    Version 2026-R1.5 | Environment: QA
Stage: Version 2026-R1.5 | Environment: Stage

Same code, same version, different environments!
```

---

### Stage 6: Next PR Merged

**Developer merges PR #124**:

```
Commit: xyz789abc123

Pipeline runs again:
  ├─ Find latest tag: release/2026-R1.5
  ├─ Increment: 5 + 1 = 6
  ├─ Create tag: release/2026-R1.6
  ├─ Build artifact with version 2026-R1.6
  └─ Deploy to environments

After Deployment:
  Dev:   2026-R1.6 (new)
  QA:    2026-R1.5 (old - not deployed yet)
  Stage: 2026-R1.5 (old - not deployed yet)

When you deploy artifact 2145850 (version R1.6) to QA:
  QA:    2026-R1.6 (now matches Dev)
  Stage: 2026-R1.5 (still old)
```

---

## Version Rollover Example

**Scenario: You've had 99 releases in 2026**

```
Current state:
  Latest tag: release/2026-R1.99

New PR merged:
  
Pipeline calculates:
  ├─ Parse R1.99: Major=1, Minor=99
  ├─ Increment: Minor=99+1=100
  ├─ Check rollover: 100 >= 100? YES
  ├─ Rollover: Major=1+1=2, Minor=1
  └─ New version: 2026-R2.1

Tag created: release/2026-R2.1

Next releases:
  2026-R2.2
  2026-R2.3
  ...
  2026-R2.99
  2026-R3.1  ← Next rollover
```

---

## File Contents in Detail

### 1. version.json (Build-Time)

**Location**: `/version.json` (root of deployed site)
**Created**: During build in Azure Pipeline
**Same across**: All environments (Dev/QA/Stage/Prod)

```json
{
  "version": "1.0.0.2145800",
  "lastUpdatedUtc": "2026-05-05T14:30:00Z",
  "branch": "main",
  "buildNumber": "1.0.0.2145800",
  "buildId": "2145800",
  "commit": "abc123def456789",
  "major": "1",
  "minor": "0",
  "patch": "0",
  "uiVersion": "2026-R1.5",
  "releaseVersion": "2026-R1.5",
  "baseVersion": "1.0.0",
  "appVersion": "1.0.0.2145800"
}
```

**Field Explanations**:
- `version`: Semantic version with build ID (1.0.0.2145800)
- `lastUpdatedUtc`: When build was created (ISO 8601)
- `branch`: Always "main" (source branch)
- `buildNumber`: Same as version
- `buildId`: Azure DevOps build ID (unique per build)
- `commit`: Full git commit SHA
- `major/minor/patch`: Base version components (from BaseVersion variable)
- `uiVersion`: User-facing release version (2026-R1.5)
- `releaseVersion`: Same as uiVersion (hierarchical format)
- `baseVersion`: Base semantic version (1.0.0)
- `appVersion`: Full version with build (1.0.0.2145800)

### 2. environment.json (Deploy-Time)

**Location**: `/assets/config/environment.json`
**Created**: During deployment (replaces template)
**Different per**: Environment (Dev/QA/Stage/Prod)

**Dev**:
```json
{
  "environment": "Dev",
  "apiUrl": "https://dev-api.bloodcenter.com/api"
}
```

**QA**:
```json
{
  "environment": "QA",
  "apiUrl": "https://qa-api.bloodcenter.com/api"
}
```

**Stage**:
```json
{
  "environment": "Stage",
  "apiUrl": "https://stage-api.bloodcenter.com/api"
}
```

**Prod**:
```json
{
  "environment": "Prod",
  "apiUrl": "https://api.bloodcenter.com/api"
}
```

---

## Angular Runtime Flow

### App Initialization

**File**: `src/main.ts` (optional enhancement)

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { VersionService } from './app/shared/services/version.service';

bootstrapApplication(AppComponent, appConfig)
  .then(appRef => {
    // Initialize version service on app startup
    const versionService = appRef.injector.get(VersionService);
    versionService.getVersionInfo().subscribe(info => {
      console.log('App initialized with version:', info.releaseVersion);
      console.log('Environment:', info.environment);
    });
  })
  .catch(err => console.error(err));
```

### Service Call Flow

```
User visits app
  ↓
AppComponent initializes
  ↓
AuthFooterComponent ngOnInit()
  ↓
versionService.getVersionInfo()
  ├─ HTTP GET /version.json
  │   ├─ Request: GET https://blood-center-dev.azurewebsites.net/version.json
  │   └─ Response: { "releaseVersion": "2026-R1.5", ... }
  │
  └─ envService.getEnvironmentConfig()
      ├─ Request: GET https://blood-center-dev.azurewebsites.net/assets/config/environment.json
      └─ Response: { "environment": "Dev", "apiUrl": "..." }
  ↓
combineLatest merges both responses
  ↓
Result: {
  releaseVersion: "2026-R1.5",
  buildId: "2145800",
  commit: "abc123def456",
  environment: "Dev",  ← Added from environment.json
  ... all other fields
}
  ↓
Footer displays:
  "Version 2026-R1.5"
  
Debug panel shows:
  Release: 2026-R1.5
  Environment: Dev
  Build ID: 2145800
  Commit: abc123de
```

---

## API Service Usage

You can also inject `EnvironmentDetectionService` in API services:

**File**: `src/app/core/services/api.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { EnvironmentDetectionService } from '@shared/services/environment-detection.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentDetectionService);

  get<T>(endpoint: string): Observable<T> {
    return this.envService.getEnvironmentConfig().pipe(
      switchMap(config => {
        const url = `${config.apiUrl}${endpoint}`;
        return this.http.get<T>(url);
      })
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.envService.getEnvironmentConfig().pipe(
      switchMap(config => {
        const url = `${config.apiUrl}${endpoint}`;
        return this.http.post<T>(url, data);
      })
    );
  }
}
```

**Usage**:
```typescript
// In any component or service
this.apiService.get<User[]>('/users')
  .subscribe(users => {
    // API call goes to correct environment automatically:
    // Dev: https://dev-api.bloodcenter.com/api/users
    // QA:  https://qa-api.bloodcenter.com/api/users
  });
```

---

## Variable Groups in Detail

### Azure DevOps Library → Variable Groups

**Blood_Center_Dev**:
```
Name: Blood_Center_Dev
Description: Dev environment configuration

Variables:
┌─────────────────────┬────────────────────────────────────────┬────────┐
│ Name                │ Value                                  │ Secret │
├─────────────────────┼────────────────────────────────────────┼────────┤
│ DevApiUrl           │ https://dev-api.bloodcenter.com/api    │   No   │
│ DevAppServiceName   │ blood-center-dev                       │   No   │
│ DevDbConnection     │ Server=dev-sql;Database=BloodCenter... │  Yes   │
│ DevOktaDomain       │ dev-12345.okta.com                     │   No   │
│ DevOktaClientId     │ 0oa1abc2def3ghi4jkl5                   │  Yes   │
└─────────────────────┴────────────────────────────────────────┴────────┘
```

**Blood_Center_QA**:
```
Name: Blood_Center_QA
Description: QA environment configuration

Variables:
┌─────────────────────┬────────────────────────────────────────┬────────┐
│ Name                │ Value                                  │ Secret │
├─────────────────────┼────────────────────────────────────────┼────────┤
│ QaApiUrl            │ https://qa-api.bloodcenter.com/api     │   No   │
│ QaAppServiceName    │ blood-center-qa                        │   No   │
│ QaDbConnection      │ Server=qa-sql;Database=BloodCenter...  │  Yes   │
│ QaOktaDomain        │ qa-12345.okta.com                      │   No   │
│ QaOktaClientId      │ 0oa6mno7pqr8stu9vwx0                   │  Yes   │
└─────────────────────┴────────────────────────────────────────┴────────┘
```

### Using in Pipeline

```yaml
- stage: DeployDev
  dependsOn: Build
  variables:
    - group: Blood_Center_Dev  # Load all variables from this group
  jobs:
    - deployment: DeployToDev
      steps:
        - script: |
            echo "Deploying to $(DevAppServiceName)"
            echo "API URL: $(DevApiUrl)"
            # These variables are now available:
            # $(DevApiUrl)
            # $(DevAppServiceName)
            # $(DevDbConnection) - marked as secret, won't echo
```

---

## Complete Pipeline YAML

**File**: `azure-pipelines.yml` (Full working version)

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  - name: BaseVersion
    value: '1.0.0'

stages:
  - stage: Build
    displayName: 'Build Angular Application'
    jobs:
      - job: BuildAndVersion
        displayName: 'Build and Create Version'
        steps:
          - checkout: self
            persistCredentials: true
            displayName: 'Checkout repository'

          - script: |
              set -e
              echo "Fetching all tags..."
              git fetch --tags --force
            displayName: 'Fetch Git Tags'

          - script: |
              set -e
              
              CURRENT_YEAR=$(date -u +"%Y")
              echo "Current year: $CURRENT_YEAR"
              
              # Check if this commit already has a release tag
              EXISTING_TAG=$(git tag --points-at HEAD | grep "^release/${CURRENT_YEAR}-R" || true)
              
              if [ -n "$EXISTING_TAG" ]; then
                # Reuse existing tag
                RELEASE_VERSION=$(echo "$EXISTING_TAG" | sed 's/release\///')
                echo "Existing release tag found: $RELEASE_VERSION"
              else
                # New commit - calculate next version
                echo "No existing tag found, calculating new version..."
                
                LATEST_TAG=$(git tag -l "release/${CURRENT_YEAR}-R*.*" | sort -V | tail -1)
                echo "Latest tag: $LATEST_TAG"
                
                if [ -z "$LATEST_TAG" ]; then
                  # First release of the year
                  MAJOR=1
                  MINOR=1
                  echo "First release of the year"
                else
                  # Parse and increment
                  VERSION_PART=$(echo "$LATEST_TAG" | sed "s/release\/${CURRENT_YEAR}-R//")
                  MAJOR=$(echo "$VERSION_PART" | cut -d. -f1)
                  MINOR=$(echo "$VERSION_PART" | cut -d. -f2)
                  
                  echo "Current version: R${MAJOR}.${MINOR}"
                  
                  # Increment minor
                  MINOR=$((MINOR + 1))
                  
                  # Rollover at 100
                  if [ $MINOR -ge 100 ]; then
                    MAJOR=$((MAJOR + 1))
                    MINOR=1
                    echo "Rollover detected: R${MAJOR}.${MINOR}"
                  fi
                fi
                
                RELEASE_VERSION="${CURRENT_YEAR}-R${MAJOR}.${MINOR}"
                
                # Create git tag
                echo "Creating tag: release/${RELEASE_VERSION}"
                git tag "release/${RELEASE_VERSION}"
                git push origin "release/${RELEASE_VERSION}"
                
                echo "Created new release tag: $RELEASE_VERSION"
              fi
              
              echo "##vso[task.setvariable variable=ReleaseVersion]$RELEASE_VERSION"
              echo "Release Version: $RELEASE_VERSION"
            displayName: 'Calculate Release Version'

          - script: |
              set -e
              
              # Get dynamic values
              PROJECT_NAME=$(node -p "require('./package.json').name")
              COMMIT_SHA=$(git rev-parse HEAD)
              COMMIT_SHORT=$(git rev-parse --short HEAD)
              TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
              
              echo "Project: $PROJECT_NAME"
              echo "Commit: $COMMIT_SHA"
              echo "Timestamp: $TIMESTAMP"
              
              # Parse BaseVersion
              IFS='.' read -r MAJOR MINOR PATCH <<< "$(BaseVersion)"
              
              # Build number
              BUILD_NUMBER="$(BaseVersion).$(Build.BuildId)"
              APP_VERSION="${BUILD_NUMBER}"
              
              # Create version.json
              cat > version.json << EOF
              {
                "version": "$BUILD_NUMBER",
                "lastUpdatedUtc": "$TIMESTAMP",
                "branch": "main",
                "buildNumber": "$BUILD_NUMBER",
                "buildId": "$(Build.BuildId)",
                "commit": "$COMMIT_SHA",
                "major": "$MAJOR",
                "minor": "$MINOR",
                "patch": "$PATCH",
                "uiVersion": "$(ReleaseVersion)",
                "releaseVersion": "$(ReleaseVersion)",
                "baseVersion": "$(BaseVersion)",
                "appVersion": "$APP_VERSION"
              }
              EOF
              
              echo "version.json created:"
              cat version.json
            displayName: 'Create version.json'

          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
            displayName: 'Install Node.js'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run build -- --configuration production
            displayName: 'Build Angular app'

          - script: |
              set -e
              
              PROJECT_NAME=$(node -p "require('./package.json').name")
              OUTPUT_PATH="dist/${PROJECT_NAME}/browser"
              
              echo "Checking output path: $OUTPUT_PATH"
              
              if [ ! -d "$OUTPUT_PATH" ]; then
                echo "Error: Output path not found: $OUTPUT_PATH"
                exit 1
              fi
              
              cp version.json "$OUTPUT_PATH/version.json"
              echo "Copied version.json to $OUTPUT_PATH"
              
              ls -la "$OUTPUT_PATH/version.json"
            displayName: 'Copy version.json to output'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'dist'
              ArtifactName: 'angular-app'
              publishLocation: 'Container'
            displayName: 'Publish build artifact'

  - stage: DeployDev
    displayName: 'Deploy to Dev'
    dependsOn: Build
    condition: succeeded()
    variables:
      - group: Blood_Center_Dev
    jobs:
      - deployment: DeployToDev
        displayName: 'Deploy to Dev Environment'
        environment: 'Dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: angular-app
                  displayName: 'Download build artifact'

                - script: |
                    set -e
                    
                    PROJECT_NAME=$(node -p "require('$(Pipeline.Workspace)/angular-app/package.json').name" || echo "blood-center-app")
                    APP_PATH="$(Pipeline.Workspace)/angular-app/${PROJECT_NAME}/browser"
                    
                    echo "App path: $APP_PATH"
                    
                    # Create environment.json for Dev
                    mkdir -p "$APP_PATH/assets/config"
                    
                    cat > "$APP_PATH/assets/config/environment.json" << EOF
                    {
                      "environment": "Dev",
                      "apiUrl": "$(DevApiUrl)"
                    }
                    EOF
                    
                    echo "Environment config created for Dev:"
                    cat "$APP_PATH/assets/config/environment.json"
                  displayName: 'Configure environment for Dev'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Subscription-Connection'
                    appType: 'webApp'
                    appName: '$(DevAppServiceName)'
                    package: '$(Pipeline.Workspace)/angular-app/*/browser'
                    deploymentMethod: 'auto'
                  displayName: 'Deploy to Azure App Service (Dev)'

  - stage: DeployQA
    displayName: 'Deploy to QA'
    dependsOn: Build
    condition: succeeded()
    variables:
      - group: Blood_Center_QA
    jobs:
      - deployment: DeployToQA
        displayName: 'Deploy to QA Environment'
        environment: 'QA'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: angular-app

                - script: |
                    set -e
                    
                    PROJECT_NAME=$(node -p "require('$(Pipeline.Workspace)/angular-app/package.json').name" || echo "blood-center-app")
                    APP_PATH="$(Pipeline.Workspace)/angular-app/${PROJECT_NAME}/browser"
                    
                    mkdir -p "$APP_PATH/assets/config"
                    
                    cat > "$APP_PATH/assets/config/environment.json" << EOF
                    {
                      "environment": "QA",
                      "apiUrl": "$(QaApiUrl)"
                    }
                    EOF
                    
                    echo "Environment config created for QA:"
                    cat "$APP_PATH/assets/config/environment.json"
                  displayName: 'Configure environment for QA'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Subscription-Connection'
                    appType: 'webApp'
                    appName: '$(QaAppServiceName)'
                    package: '$(Pipeline.Workspace)/angular-app/*/browser'
                    deploymentMethod: 'auto'
                  displayName: 'Deploy to Azure App Service (QA)'

  - stage: DeployStage
    displayName: 'Deploy to Stage'
    dependsOn: Build
    condition: succeeded()
    variables:
      - group: Blood_Center_Stage
    jobs:
      - deployment: DeployToStage
        displayName: 'Deploy to Stage Environment'
        environment: 'Stage'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: angular-app

                - script: |
                    set -e
                    
                    PROJECT_NAME=$(node -p "require('$(Pipeline.Workspace)/angular-app/package.json').name" || echo "blood-center-app")
                    APP_PATH="$(Pipeline.Workspace)/angular-app/${PROJECT_NAME}/browser"
                    
                    mkdir -p "$APP_PATH/assets/config"
                    
                    cat > "$APP_PATH/assets/config/environment.json" << EOF
                    {
                      "environment": "Stage",
                      "apiUrl": "$(StageApiUrl)"
                    }
                    EOF
                    
                    echo "Environment config created for Stage:"
                    cat "$APP_PATH/assets/config/environment.json"
                  displayName: 'Configure environment for Stage'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Subscription-Connection'
                    appType: 'webApp'
                    appName: '$(StageAppServiceName)'
                    package: '$(Pipeline.Workspace)/angular-app/*/browser'
                    deploymentMethod: 'auto'
                  displayName: 'Deploy to Azure App Service (Stage)'
```

---

## Troubleshooting

### Issue 1: version.json not found (404)

**Problem**: Angular app shows "Failed to load version.json"

**Check**:
```bash
# In build output, verify file exists
ls -la dist/blood-center-app/browser/version.json

# In deployed app, visit:
https://blood-center-dev.azurewebsites.net/version.json
```

**Fix**: Ensure `Copy version.json to output` step runs successfully

---

### Issue 2: Environment always shows "local"

**Problem**: Deployed app shows environment as "local" instead of "Dev"

**Check**:
```bash
# Visit:
https://blood-center-dev.azurewebsites.net/assets/config/environment.json

# Should show:
{"environment": "Dev", "apiUrl": "..."}

# NOT:
{"environment": "local", "apiUrl": "http://localhost:3000/api"}
```

**Fix**: Verify deployment stage runs `Configure environment` step

---

### Issue 3: Version increments on every build

**Problem**: Version shows R1.6, then R1.7, then R1.8 for same commit

**Cause**: Tag not pushed to origin

**Check**:
```bash
# In pipeline, look for:
git push origin release/2026-R1.5

# If this fails, tags aren't saved
```

**Fix**: Ensure `persistCredentials: true` in checkout step

---

### Issue 4: Different versions across environments

**Problem**: Dev shows R1.5, QA shows R1.6

**Cause**: Different artifacts deployed

**Check**: Build IDs in version.json
```
Dev:  buildId: "2145800"
QA:   buildId: "2145850"  ← Different build!
```

**Fix**: Deploy same artifact to all environments (don't rebuild)

---

## Summary

| Aspect | Solution |
|--------|----------|
| **Branch Strategy** | Single `main` branch for all environments |
| **Versioning** | YYYY-Rn.m format (2026-R1.1, R1.2, etc.) with auto-rollover at R1.100 → R2.1 |
| **Build** | Build once → Create version.json with release tag |
| **Deploy** | Deploy same artifact → Replace environment.json per environment |
| **Runtime** | Angular loads both files and combines them |
| **Consistency** | Same commit = same release version across all environments |
| **Environment Detection** | Runtime config file replaced during deployment |

This approach gives you:
- ✅ Single source of truth (main branch)
- ✅ Same version across environments for same code
- ✅ Runtime environment detection
- ✅ Clean versioning with auto-rollover
- ✅ No branch management overhead
- ✅ Build once, deploy many
- ✅ Clear separation of build-time vs deploy-time config
