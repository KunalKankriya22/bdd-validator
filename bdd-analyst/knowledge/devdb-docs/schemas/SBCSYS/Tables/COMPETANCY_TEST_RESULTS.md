---
tags:
  - table
  - SBCSYS
---
# COMPETANCY_TEST_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 266
**Last Analyzed**: 2025-09-16 03:14:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | TEST_MODE | VARCHAR2(1) | Yes |  |  |
| 4 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 5 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 6 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 7 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 9 | GROUP_NO | VARCHAR2(4) | Yes |  |  |
| 10 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 11 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 12 | RATIO | VARCHAR2(12) | Yes |  |  |
| 13 | RESULT_DATS | DATE | Yes |  |  |
| 14 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 15 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 16 | INSERT_DATS | DATE | No |  |  |
| 17 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPETANCY_TEST_RESULTS_IDX_1 | NORMAL | NONUNIQUE | TB_ID, TEST_CHAPTER_ID, UNIT_ID, TEST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
