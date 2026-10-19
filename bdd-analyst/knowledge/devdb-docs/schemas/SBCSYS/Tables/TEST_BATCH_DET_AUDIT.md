---
tags:
  - table
  - SBCSYS
---
# TEST_BATCH_DET_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 84313
**Last Analyzed**: 2025-09-16 03:14:43
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | Yes |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | TEST_KIT_ID | VARCHAR2(14) | Yes |  |  |
| 5 | TEST_TYPE | VARCHAR2(1) | Yes |  |  |
| 6 | CUT_OFF_VALUE | VARCHAR2(6) | Yes |  |  |
| 7 | REF_RESULT | VARCHAR2(4) | Yes |  |  |
| 8 | REF_RATIO | VARCHAR2(6) | Yes |  |  |
| 9 | REF_CONTROL | VARCHAR2(7) | Yes |  |  |
| 10 | REF_ABSORBANCE | VARCHAR2(6) | Yes |  |  |
| 11 | STATION_NO | VARCHAR2(3) | Yes |  |  |
| 12 | RECONCILE_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | RECONCILE_DATE | DATE | Yes |  |  |
| 14 | RECONCILE_USER_ID | VARCHAR2(6) | Yes |  |  |
| 15 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 16 | REVIEW_DATE | DATE | Yes |  |  |
| 17 | PARM_TYPE | VARCHAR2(5) | Yes |  |  |
| 18 | PARM_CHECK_FLAG | VARCHAR2(1) | Yes |  |  |
| 19 | PARM_CHECK_DATE | DATE | Yes |  |  |
| 20 | PARM_CHECK_USER_ID | VARCHAR2(6) | Yes |  |  |
| 21 | RUN_ID | VARCHAR2(14) | Yes |  |  |
| 22 | REVIEW_USER_ID | VARCHAR2(6) | Yes |  |  |
| 23 | KIT_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 24 | AUDIT_KEY | NUMBER | Yes |  |  |
| 25 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 26 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
