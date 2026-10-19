---
tags:
  - table
  - SBCSYS
---
# UTRS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 410575
**Last Analyzed**: 2026-05-17 11:00:14
**Partitioned**: NO

> [!quote] Created from Entity UTR by WADLEY on 16-APR-93

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
| 8 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 9 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 10 | CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | EDIT_RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 13 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 14 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 15 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 16 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 17 | RATIO | VARCHAR2(17) | Yes |  |  |
| 18 | RESULT_DATS | DATE | Yes |  |  |
| 19 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 20 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 21 | INSERT_DATS | DATE | No |  |  |
| 22 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 23 | AUDIT_KEY | NUMBER | No |  |  |
| 24 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 25 | EXTRACT_DATE | DATE | Yes |  |  |
| 26 | PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 27 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 28 | QC_TEST_FLAG | VARCHAR2(1) | Yes |  |  |
| 29 | QC_TEST_DATE | DATE | Yes |  |  |
| 30 | QC_TEST_USER | VARCHAR2(30) | Yes |  |  |
| 31 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 32 | REP_PROFILE_SET_ID | VARCHAR2(20) | Yes |  |  |
| 33 | VOID_CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | VOID_CANCEL_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| UTRS_UK | CHAPTER_ID, UNIT_ID, COLL_DATE, TEST_ID, TEST_SEQ_NO | DISABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| UTRS_IDXUNIT | NORMAL | NONUNIQUE | UNIT_ID | VALID |
| UTRS_IDX_2 | NORMAL | NONUNIQUE | TB_ID, TEST_ID | VALID |
| UTRS_IDX_3 | NORMAL | NONUNIQUE | COLL_DATE, TEST_ID | VALID |
| UTRS_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| UTRS_IDX_UI_VCI | NORMAL | NONUNIQUE | UNIT_ID, VOID_CANCEL_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/UTRS_AFTER_UPDATE|UTRS_AFTER_UPDATE]] — AFTER EACH ROW UPDATE (DISABLED)
- [[schemas/SBCSYS/Triggers/UTRS_AG_RESULT_INSERT|UTRS_AG_RESULT_INSERT]] — AFTER EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UTRS_AG_RESULT_UPDATE|UTRS_AG_RESULT_UPDATE]] — AFTER EACH ROW UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/UTRS_BEFORE_DELETE|UTRS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/UTRS_BEFORE_INSERT|UTRS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/UTRS_BEFORE_UPDATE|UTRS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/UTRS_SF_RESULT_UPDATE|UTRS_SF_RESULT_UPDATE]] — AFTER EACH ROW UPDATE (ENABLED)

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
