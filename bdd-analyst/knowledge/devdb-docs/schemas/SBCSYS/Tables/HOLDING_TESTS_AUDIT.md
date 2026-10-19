---
tags:
  - table
  - SBCSYS
---
# HOLDING_TESTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 319419
**Last Analyzed**: 2025-09-16 03:14:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 4 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | COLL_DATE | DATE | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 8 | TEST_STATE | VARCHAR2(3) | Yes |  |  |
| 9 | MACHINE_ID | VARCHAR2(5) | Yes |  |  |
| 10 | MACHINE_FLAGS | VARCHAR2(2) | Yes |  |  |
| 11 | RESULT_STATUS_1 | VARCHAR2(4) | Yes |  |  |
| 12 | RESULT_STATUS_2 | VARCHAR2(4) | Yes |  |  |
| 13 | TEMP_RESULT_1 | VARCHAR2(4) | Yes |  |  |
| 14 | TEMP_RESULT_1_USER_ID | VARCHAR2(6) | Yes |  |  |
| 15 | TEMP_RESULT_2 | VARCHAR2(4) | Yes |  |  |
| 16 | TEMP_RESULT_2_USER_ID | VARCHAR2(6) | Yes |  |  |
| 17 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 18 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 19 | TB_SEQ_NO | NUMBER(4) | Yes |  |  |
| 20 | WELL_NUMBER | VARCHAR2(4) | Yes |  |  |
| 21 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 22 | RATIO | VARCHAR2(12) | Yes |  |  |
| 23 | RESULT_DATS | DATE | Yes |  |  |
| 24 | RESULT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 25 | INSERT_DATS | DATE | Yes |  |  |
| 26 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 27 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 28 | HOLDING_STATUS | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HOLDING_TESTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
