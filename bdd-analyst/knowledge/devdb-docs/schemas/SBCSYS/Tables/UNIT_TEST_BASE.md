---
tags:
  - table
  - SBCSYS
---
# UNIT_TEST_BASE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 6516
**Last Analyzed**: 2025-09-16 03:15:47
**Partitioned**: NO

> [!quote] Created from Entity UNIT TEST BASE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TEST_SEQ_NO | NUMBER(2) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | No |  |  |
| 6 | TEST_STATE | VARCHAR2(3) | Yes |  |  |
| 7 | TEST_MODE | VARCHAR2(1) | Yes |  |  |
| 8 | TEMP_RESULT_1 | VARCHAR2(4) | Yes |  |  |
| 9 | TEMP_RESULT_1_USER_ID | VARCHAR2(6) | Yes |  |  |
| 10 | TEMP_RESULT_2 | VARCHAR2(4) | Yes |  |  |
| 11 | TEMP_RESULT_2_USER_ID | VARCHAR2(6) | Yes |  |  |
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
| 25 | INSERT_DATS | DATE | No |  |  |
| 26 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 27 | AUDIT_KEY | NUMBER | No |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 30 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 31 | REP_PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 32 | VOID_CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 33 | VOID_CANCEL_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UNIT_TEST_BASE_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, TEST_ID, TEST_SEQ_NO | VALID |
| UNIT_TEST_BASE_IDX_2 | NORMAL | NONUNIQUE | TB_ID, TEST_ID | VALID |
| UNIT_TEST_BASE_IDX_3 | NORMAL | NONUNIQUE | COLL_DATE, TEST_ID | VALID |
| UNIT_TEST_BASE_IDX_4 | NORMAL | NONUNIQUE | TEST_ID | VALID |
| UNIT_TEST_BASE_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| UNIT_TEST_BASE_IDX_UI_VCI | NORMAL | NONUNIQUE | UNIT_ID, VOID_CANCEL_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/UNIT_TEST_BASE_BEFORE_DELETE|UNIT_TEST_BASE_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_TEST_BASE_BEFORE_INSERT|UNIT_TEST_BASE_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UNIT_TEST_BASE_BEFORE_UPDATE|UNIT_TEST_BASE_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| UNIT_TESTS | VIEW | SBCSYS |
