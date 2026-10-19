---
tags:
  - table
  - DONSYS
---
# VALID_TEST_RESULTS_DON_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 999
**Last Analyzed**: 2025-09-16 03:14:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | RESULT_CODE | VARCHAR2(5) | Yes |  |  |
| 8 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | NOTIFICATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | ATTRIB_TABLE | VARCHAR2(30) | Yes |  |  |
| 11 | ATTRIB_CODE | VARCHAR2(5) | Yes |  |  |
| 12 | CONFIRM_TEST1 | VARCHAR2(10) | Yes |  |  |
| 13 | CONFIRM_TEST2 | VARCHAR2(10) | Yes |  |  |
| 14 | CONFIRM_TEST3 | VARCHAR2(10) | Yes |  |  |
| 15 | EFF_DATE | DATE | Yes |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |

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
