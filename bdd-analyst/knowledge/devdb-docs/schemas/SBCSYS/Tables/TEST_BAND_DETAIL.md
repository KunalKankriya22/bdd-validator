---
tags:
  - table
  - SBCSYS
---
# TEST_BAND_DETAIL

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 62532
**Last Analyzed**: 2025-09-16 03:14:41
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TB_ID | VARCHAR2(14) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | No |  |  |
| 6 | TB_SEQ_NO | NUMBER(4) | No |  |  |
| 7 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 8 | BAND_NAME | VARCHAR2(6) | No |  |  |
| 9 | TECH1_BAND_VAL | VARCHAR2(3) | Yes |  |  |
| 10 | TECH2_BAND_VAL | VARCHAR2(3) | Yes |  |  |
| 11 | SUPER_BAND_VAL | VARCHAR2(3) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 13 | BAND_SEQ | NUMBER(2) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | Yes |  |  |
| 15 | SUPER_INTENSITY | VARCHAR2(5) | Yes |  |  |
| 16 | TECH2_INTENSITY | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_TEST_BAND_DET_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID | [[schemas/SBCSYS/Tables/TEST_BAND_HEADER\|SBCSYS.TEST_BAND_HEADER]] (UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| TEST_BAND_DET_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID, BAND_NAME | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_BAND_DET_UK | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID, BAND_NAME | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_BAND_DETAIL_BD|TEST_BAND_DETAIL_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BAND_DETAIL_BI|TEST_BAND_DETAIL_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BAND_DETAIL_BU|TEST_BAND_DETAIL_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
