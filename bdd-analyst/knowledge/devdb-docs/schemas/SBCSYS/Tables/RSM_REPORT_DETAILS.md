---
tags:
  - table
  - SBCSYS
---
# RSM_REPORT_DETAILS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3580
**Last Analyzed**: 2025-09-16 03:14:37
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_PARM_ID | VARCHAR2(20) | Yes |  |  |
| 2 | REPORT_ID | VARCHAR2(20) | Yes |  |  |
| 3 | USER_ID | VARCHAR2(30) | Yes |  |  |
| 4 | CLIENT_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TESTED_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | COLL_DATE | DATE | Yes |  |  |
| 7 | TEST_ID_1 | VARCHAR2(10) | Yes |  |  |
| 8 | RESULT_ID_1 | VARCHAR2(10) | Yes |  |  |
| 9 | TEST_ID_2 | VARCHAR2(10) | Yes |  |  |
| 10 | RESULT_ID_2 | VARCHAR2(10) | Yes |  |  |
| 11 | TEST_ID_3 | VARCHAR2(10) | Yes |  |  |
| 12 | RESULT_ID_3 | VARCHAR2(10) | Yes |  |  |
| 13 | TEST_ID_4 | VARCHAR2(10) | Yes |  |  |
| 14 | RESULT_ID_4 | VARCHAR2(10) | Yes |  |  |
| 15 | TEST_ID_5 | VARCHAR2(10) | Yes |  |  |
| 16 | RESULT_ID_5 | VARCHAR2(10) | Yes |  |  |
| 17 | TEST_ID_6 | VARCHAR2(10) | Yes |  |  |
| 18 | RESULT_ID_6 | VARCHAR2(10) | Yes |  |  |
| 19 | TEST_ID_7 | VARCHAR2(10) | Yes |  |  |
| 20 | RESULT_ID_7 | VARCHAR2(10) | Yes |  |  |
| 21 | TEST_ID_8 | VARCHAR2(10) | Yes |  |  |
| 22 | RESULT_ID_8 | VARCHAR2(10) | Yes |  |  |
| 23 | TEST_ID_9 | VARCHAR2(10) | Yes |  |  |
| 24 | RESULT_ID_9 | VARCHAR2(10) | Yes |  |  |
| 25 | TEST_ID_10 | VARCHAR2(10) | Yes |  |  |
| 26 | RESULT_ID_10 | VARCHAR2(10) | Yes |  |  |
| 27 | TEST_ID_11 | VARCHAR2(10) | Yes |  |  |
| 28 | RESULT_ID_11 | VARCHAR2(10) | Yes |  |  |
| 29 | TEST_ID_12 | VARCHAR2(10) | Yes |  |  |
| 30 | RESULT_ID_12 | VARCHAR2(10) | Yes |  |  |
| 31 | TEST_ID_13 | VARCHAR2(10) | Yes |  |  |
| 32 | RESULT_ID_13 | VARCHAR2(10) | Yes |  |  |
| 33 | TEST_ID_14 | VARCHAR2(10) | Yes |  |  |
| 34 | RESULT_ID_14 | VARCHAR2(10) | Yes |  |  |
| 35 | TEST_ID_15 | VARCHAR2(10) | Yes |  |  |
| 36 | RESULT_ID_15 | VARCHAR2(10) | Yes |  |  |
| 37 | REACTIVE_FLAG | VARCHAR2(10) | Yes |  |  |
| 38 | INSERT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RSM_REPORT_DETAILS_IDX1_RPI | NORMAL | NONUNIQUE | RESULT_PARM_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
