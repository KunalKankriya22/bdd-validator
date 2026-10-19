---
tags:
  - table
  - SBCSYS
---
# HOLDING_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 103011
**Last Analyzed**: 2025-09-16 03:14:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 5 | TEST_STATE | VARCHAR2(3) | Yes |  |  |
| 6 | MACHINE_ID | VARCHAR2(5) | Yes |  |  |
| 7 | MACHINE_FLAGS | VARCHAR2(2) | Yes |  |  |
| 8 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 9 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 10 | TEMP_RESULT_1 | VARCHAR2(4) | Yes |  |  |
| 11 | TEMP_RESULT_1_USER_ID | VARCHAR2(6) | Yes |  |  |
| 12 | TEMP_RESULT_2 | VARCHAR2(4) | Yes |  |  |
| 13 | TEMP_RESULT_2_USER_ID | VARCHAR2(6) | Yes |  |  |
| 14 | TB_ID | VARCHAR2(14) | No |  |  |
| 15 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 16 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 17 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 18 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 19 | RATIO | VARCHAR2(12) | Yes |  |  |
| 20 | RESULT_DATS | DATE | Yes |  |  |
| 21 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 22 | INSERT_DATS | DATE | Yes |  |  |
| 23 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 24 | AUDIT_KEY | NUMBER | No |  |  |
| 25 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 26 | HOLDING_STATUS | VARCHAR2(1) | Yes |  |  |
| 27 | TEST_MODE | VARCHAR2(1) | Yes |  |  |
| 28 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HOLDING_TESTS_IDX2 | NORMAL | NONUNIQUE | TEST_CHAPTER_ID, TEST_ID | VALID |
| HOLDING_TESTS_IDX_1 | NORMAL | NONUNIQUE | TB_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/HOLDING_TESTS_BEFORE_DELETE|HOLDING_TESTS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/HOLDING_TESTS_BEFORE_INSERT|HOLDING_TESTS_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/HOLDING_TESTS_BEFORE_UPDATE|HOLDING_TESTS_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
