---
tags:
  - table
  - SBCSYS
---
# RGT_RESULT_PARMS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2127
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 3 | RESULT_PARM_ID | VARCHAR2(20) | Yes |  |  |
| 4 | FROM_DATE | DATE | Yes |  |  |
| 5 | TO_DATE | DATE | Yes |  |  |
| 6 | INSERT_DATS | DATE | Yes |  |  |
| 7 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 8 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 9 | UNIT_LIST | VARCHAR2(1) | Yes |  |  |
| 10 | STAT_TESTS | VARCHAR2(1) | Yes |  |  |
| 11 | RESULT_TYPE | VARCHAR2(1) | Yes |  |  |
| 12 | OTHER_BATCHES | VARCHAR2(1) | Yes |  |  |
| 13 | UNIT_COUNT | NUMBER(6) | Yes |  |  |
| 14 | UNDER_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | RE_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |
| 17 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 18 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
