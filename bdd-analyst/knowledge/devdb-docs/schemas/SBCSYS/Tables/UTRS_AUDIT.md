---
tags:
  - table
  - SBCSYS
---
# UTRS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1110848
**Last Analyzed**: 2025-09-16 03:15:53
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
| 12 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 13 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 14 | CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 16 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 17 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 18 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 19 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 20 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 21 | RATIO | VARCHAR2(17) | Yes |  |  |
| 22 | RESULT_DATS | DATE | Yes |  |  |
| 23 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 24 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 25 | INSERT_DATS | DATE | Yes |  |  |
| 26 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 27 | EXTRACT_DATE | DATE | Yes |  |  |
| 28 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 29 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 30 | QC_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 31 | QC_TEST_DATE | DATE | Yes |  |  |
| 32 | QC_TEST_USER | VARCHAR2(30) | Yes |  |  |
| 33 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 34 | REP_PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 35 | VOID_CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 36 | VOID_CANCEL_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UTRS_AUDIT_IDX1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
