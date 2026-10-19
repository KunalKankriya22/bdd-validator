---
tags:
  - table
  - SBCSYS
---
# RGT_TEST_MATRIX_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 47
**Last Analyzed**: 2025-09-16 03:14:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | CBC_TEST_ID | VARCHAR2(10) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
