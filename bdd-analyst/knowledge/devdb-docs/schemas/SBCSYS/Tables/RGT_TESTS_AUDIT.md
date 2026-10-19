---
tags:
  - table
  - SBCSYS
---
# RGT_TESTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 3 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | TEST_SCHEDULE_STAT | VARCHAR2(1) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 9 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
