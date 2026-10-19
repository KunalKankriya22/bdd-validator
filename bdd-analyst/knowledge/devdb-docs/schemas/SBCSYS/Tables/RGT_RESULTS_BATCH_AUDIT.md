---
tags:
  - table
  - SBCSYS
---
# RGT_RESULTS_BATCH_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1014
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | RESULT_BATCH_ID | VARCHAR2(15) | Yes |  |  |
| 3 | PARM_ID | VARCHAR2(15) | Yes |  |  |
| 4 | EXTRACT_DATE | DATE | Yes |  |  |
| 5 | EXTRACT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 6 | BATCH_STATUS_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | UNIT_COUNT | NUMBER(6) | Yes |  |  |
| 8 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 9 | UNDER_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | RESULT_TYPE | VARCHAR2(1) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 13 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 14 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
