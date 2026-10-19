---
tags:
  - table
  - SBCSYS
---
# TEST_BATCH_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 37638
**Last Analyzed**: 2025-09-16 03:14:42
**Partitioned**: NO

> [!quote] Created from Entity TEST BATCH DET by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
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

## Primary Key

**TEST_BATCH_DET_PK**: `TEST_CHAPTER_ID, TB_ID, TEST_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_TEST_BATCH_DET_FK | TEST_CHAPTER_ID, TB_ID | [[schemas/SBCSYS/Tables/TEST_BATCH_HDR\|SBCSYS.TEST_BATCH_HDR]] (TEST_CHAPTER_ID, TB_ID) | NO ACTION |
| TEST_TEST_BATCH_DET_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/TEST_BATCH_CONTROLS\|SBCSYS.TEST_BATCH_CONTROLS]] | DET_TEST_BATCH_CNTRL_FK | TEST_CHAPTER_ID, TB_ID, TEST_ID → TEST_CHAPTER_ID, TB_ID, TEST_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_BATCH_DET_IDX_1 | NORMAL | UNIQUE | TB_ID, TEST_CHAPTER_ID, TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_BATCH_DET_BD|TEST_BATCH_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BATCH_DET_BI|TEST_BATCH_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BATCH_DET_BU|TEST_BATCH_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
