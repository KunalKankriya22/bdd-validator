---
tags:
  - table
  - SBCSYS
---
# UNIT_TEST_BASE_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 174085
**Last Analyzed**: 2025-09-16 03:15:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 3 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 4 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 5 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | COLL_DATE | DATE | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 9 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 10 | TEST_STATE | VARCHAR2(3) | Yes |  |  |
| 11 | TEST_MODE | VARCHAR2(1) | Yes |  |  |
| 12 | TEMP_RESULT_1 | VARCHAR2(4) | Yes |  |  |
| 13 | TEMP_RESULT_1_USER_ID | VARCHAR2(6) | Yes |  |  |
| 14 | TEMP_RESULT_2 | VARCHAR2(4) | Yes |  |  |
| 15 | TEMP_RESULT_2_USER_ID | VARCHAR2(6) | Yes |  |  |
| 16 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 17 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 18 | CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 19 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 21 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 22 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 23 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 24 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 25 | RATIO | VARCHAR2(17) | Yes |  |  |
| 26 | RESULT_DATS | DATE | Yes |  |  |
| 27 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 28 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 29 | INSERT_DATS | DATE | Yes |  |  |
| 30 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 31 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 32 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 33 | REP_PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_TEST_BASE_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
