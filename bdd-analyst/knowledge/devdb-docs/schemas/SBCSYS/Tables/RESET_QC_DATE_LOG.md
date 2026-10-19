---
tags:
  - table
  - SBCSYS
---
# RESET_QC_DATE_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 587
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 3 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | PREV_QC_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | PREV_QC_TEST_DATE | DATE | Yes |  |  |
| 8 | PREV_RESULTS_QC_DATE | DATE | Yes |  |  |
| 9 | PREV_RESULTS_QC_USER | VARCHAR2(6) | Yes |  |  |
| 10 | INSERT_DATE | DATE | Yes |  |  |
| 11 | ACTION_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
