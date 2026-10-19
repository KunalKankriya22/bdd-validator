---
module: Lab/Distribution
sub_module: "Confirmatory Sample Management"
title: "Confirmatory Release Test Results (CNRQC)"
mnemonic: cfiresqc
tags:
  - screen
  - lab-distribution
  - confirmatory-sample-management
  - cnrqc
---

# cfiresqc — Confirmatory Release Test Results (CNRQC)

**Module:** [[Lab/Distribution]] > [[Confirmatory Sample Management]]

## Purpose
Review test results on submitted samples and release test series/test ID for results extraction.

## Database Tables

- [[SBCSYS.CNF_QC_UNITS]] — temp session table populated by compute_qc()
- [[UTRS]] — test results, QC flag/date/user updated at commit
- [[CNF_QC_LOCK]] — concurrency lock table
- [[RGT_CONFIRM_SKIP_SAMPLES]] — SQC/RQC skip management

## Dropdown/LOV Sources

- [[MASTER_CODES]] — TRGID (test series), TSTGP (test groups)
- [[RGT_CONFIRM_SKIP_SAMPLES]]
- [[UNITS]]
- [[UTRS]]
- [[VALID_SERIES_TEST_CONFIG]] — test series validation
- [[VALID_TESTS]] — test ID validation

## Opens/Navigates To

- [[geqsamp]] — Samples Query (SAMPQ)
- [[tsqhldts]] — Holds Query (HOLDQ)

## Key Legacy Behaviors (FMB Analysis)

### Chapter Handling
- **compute_qc() is called with chapter_id = NULL** (FMB line 292, MLT 858)
- Units load from ALL chapters, not just logged-in chapter
- LOV queries (RG_TS_ID, RG_TEST_ID) also have NO chapter filter

### Grid Row Grouping
- Each grid row = one entry in cnf_qc_units (unit + test_series or unit + test_id)
- Multiple sequences of same test_id are grouped into ONE grid row
- Same unit can appear multiple times if it has multiple test series

### QC Flag Rules
- Y = only allowed when qc_reason = 'OK'
- N = user sets, or auto-set for non-OK units
- Reconcile All: OK units -> Y, non-OK units -> N

### Commit Behavior
- QC=Y with no pending results: sets qc_test_date = SYSDATE
- QC=N: calls insert_skip_samples (SQC reason)
- QC=Y: calls update_skip_samples (resets SQC skip)
- Always calls update_utrs
- If any unit QC=N: shows confirmation dialog
- After commit: generates exception log, clears temp tables and lock

## E2E Testing Bugs Found

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Modern app filters by logged-in chapter; legacy loads ALL chapters (chapter_id=NULL) | High | Open |
| 2 | Modern app shows 4 units (OBK only); legacy shows 11 (OBK+DAL) | High | Open |
