---
tags:
  - table
  - SBCSYS
---
# TEST_VOIDS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10995
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

> [!quote] Created from Entity TEST VOID by WADLEY on 16-APR-93

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
| 20 | INSERT_DATS | DATE | No |  |  |
| 21 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 22 | VOID_TYPE | VARCHAR2(1) | No |  |  |
| 23 | VOID_REASON_CODE | VARCHAR2(4) | No |  |  |
| 24 | VOID_DATS | DATE | No |  |  |
| 25 | VOID_USER_ID | VARCHAR2(6) | No |  |  |
| 26 | AUDIT_KEY | NUMBER | Yes |  |  |
| 27 | VOID_CANCEL_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TEST_TEST_VOIDS_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_VOIDS_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, TEST_ID, TEST_SEQ_NO | VALID |
| TEST_VOIDS_IDX_2 | NORMAL | NONUNIQUE | VOID_DATS | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_VOIDS_BD|TEST_VOIDS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_VOIDS_BI|TEST_VOIDS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_VOIDS_BU|TEST_VOIDS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
