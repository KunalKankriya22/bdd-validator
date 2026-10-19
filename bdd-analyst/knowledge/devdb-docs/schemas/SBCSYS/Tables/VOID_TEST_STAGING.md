---
tags:
  - table
  - SBCSYS
---
# VOID_TEST_STAGING

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 667
**Last Analyzed**: 2025-09-16 03:16:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | TEST_SEQ | NUMBER(2) | Yes |  |  |
| 5 | RESULT_CODE | VARCHAR2(4) | Yes |  |  |
| 6 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 7 | FIRST_VOID_USER | VARCHAR2(30) | Yes |  |  |
| 8 | FIRST_VOID_DATE | DATE | Yes |  |  |
| 9 | SECOND_VOID_USER | VARCHAR2(30) | Yes |  |  |
| 10 | SECOND_VOID_DATE | DATE | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 14 | VOID_MODE | VARCHAR2(10) | Yes |  |  |

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
