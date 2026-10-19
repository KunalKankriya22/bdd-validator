---
tags:
  - table
  - SBCSYS
---
# TEST_VOIDS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2386
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | TEST_STATE | VARCHAR2(3) | Yes |  |  |
| 7 | TEST_MODE | VARCHAR2(1) | Yes |  |  |
| 8 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 9 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 10 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 12 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 13 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 14 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 15 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 16 | RATIO | VARCHAR2(17) | Yes |  |  |
| 17 | RESULT_DATS | DATE | Yes |  |  |
| 18 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 19 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 20 | INSERT_DATS | DATE | Yes |  |  |
| 21 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 22 | VOID_TYPE | VARCHAR2(1) | Yes |  |  |
| 23 | VOID_REASON_CODE | VARCHAR2(4) | Yes |  |  |
| 24 | VOID_DATS | DATE | Yes |  |  |
| 25 | VOID_USER_ID | VARCHAR2(6) | Yes |  |  |
| 26 | AUDIT_KEY | NUMBER | Yes |  |  |
| 27 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 28 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
