# Azure DevOps REST API Reference

API reference for the `/fix-ado-tests` skill.

## Authentication

All requests require a Personal Access Token (PAT) with **Test Management (Read)** and **Build (Read)** scopes.

```bash
# Base64 encode ":PAT" (note the leading colon)
AUTH=$(echo -n ":$PAT" | base64)

# Use in requests
curl -s -H "Authorization: Basic $AUTH" "$URL"
```

## Base URL

```
https://dev.azure.com/mediwareis/BloodCenters/_apis
```

## Endpoints

### 1. Get Build Info

```
GET /build/builds/{buildId}?api-version=7.0
```

**Response (key fields):**
```json
{
  "id": 2231923,
  "buildNumber": "20260602.1",
  "status": "completed",
  "result": "failed",
  "sourceBranch": "refs/heads/Dev",
  "startTime": "2026-06-02T10:00:00Z",
  "finishTime": "2026-06-02T10:30:00Z"
}
```

### 2. Get Test Runs for a Build

**Primary method (by buildUri):**
```
GET /test/runs?buildUri=vstfs:///Build/Build/{buildId}&api-version=7.0
```

**Fallback (by date range):**
```
GET /test/runs?minLastUpdatedDate={YYYY-MM-DD}&maxLastUpdatedDate={YYYY-MM-DD}&api-version=7.0
```

**Response:**
```json
{
  "count": 1,
  "value": [
    {
      "id": 12345,
      "name": "Unit Tests",
      "totalTests": 30512,
      "passedTests": 30452,
      "unanalyzedTests": 60,
      "state": "Completed",
      "startedDate": "2026-06-02T10:15:00Z",
      "completedDate": "2026-06-02T10:25:00Z"
    }
  ]
}
```

### 3. Get Failed Test Results

```
GET /test/runs/{runId}/results?outcomes=Failed&api-version=7.0
```

**Response:**
```json
{
  "count": 60,
  "value": [
    {
      "id": 100001,
      "testCaseTitle": "should call addFacilityIdentifier when form is valid",
      "automatedTestName": "AddEditFacilityIdentifierComponent > Save - Add Mode > should call addFacilityIdentifier when form is valid",
      "outcome": "Failed",
      "errorMessage": "Expected spy addFacilityIdentifier to have been called.",
      "stackTrace": "Error: Expected spy addFacilityIdentifier to have been called.\n    at <Jasmine>\n    at UserContext.<anonymous> (src/app/modules/application-admin/.../add-edit-facility-identifier.spec.ts:373:52)",
      "durationInMs": 45.2
    }
  ]
}
```

### 4. Get Test Result Details (if stack trace is truncated)

```
GET /test/runs/{runId}/results/{resultId}?api-version=7.0
```

Returns the full test result including complete error message and stack trace.

## Parsing Test Results

### Extract Spec File Path from Stack Trace

Stack traces contain the spec file path:
```
at UserContext.<anonymous> (src/app/modules/.../file.spec.ts:373:52)
```

Regex pattern to extract:
```
\(src/app/.*?\.spec\.ts:\d+:\d+\)
```

### Extract Spec File from automatedTestName

The `automatedTestName` follows the pattern:
```
ComponentName > describe block > it block name
```

Map component name to spec file:
```bash
# Convert ComponentName to kebab-case file search
grep -r "class AddEditFacilityIdentifierComponent" src/app --include="*.ts" -l
# Then find the .spec.ts in the same directory
```

## Common ADO API Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | PAT expired or invalid | Generate new PAT from ADO User Settings |
| Empty test runs | `buildUri` format mismatch | Use date-range fallback query |
| Truncated error messages | API default limits | Fetch individual result by ID |
| Missing stack trace | Test runner didn't capture it | Use `automatedTestName` to find spec file |

## Rate Limits

Azure DevOps has a rate limit of ~200 requests per minute per user. For large builds, batch API calls and add a small delay between requests if needed.
