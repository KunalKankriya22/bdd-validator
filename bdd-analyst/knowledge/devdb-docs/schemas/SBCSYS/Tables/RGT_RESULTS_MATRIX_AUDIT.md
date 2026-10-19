---
tags:
  - table
  - SBCSYS
---
# RGT_RESULTS_MATRIX_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 35
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_STATUS | VARCHAR2(4) | No |  |  |
| 5 | CBC_RESULT_STATUS | VARCHAR2(4) | No |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 7 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 8 | EFF_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 13 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
