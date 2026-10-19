---
tags:
  - table
  - SBCSYS
---
# TEST_BAND_HEADER

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 9828
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
| 8 | TECH1_USER | VARCHAR2(6) | No |  |  |
| 9 | TECH1_DATE | DATE | No |  |  |
| 10 | TECH2_USER | VARCHAR2(6) | Yes |  |  |
| 11 | TECH2_DATE | DATE | Yes |  |  |
| 12 | SUPER_USER | VARCHAR2(6) | Yes |  |  |
| 13 | SUPER_DATE | DATE | Yes |  |  |
| 14 | RECON_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | TECH1_INTP | VARCHAR2(5) | Yes |  |  |
| 16 | TECH2_INTP | VARCHAR2(5) | Yes |  |  |
| 17 | SUPER_INTP | VARCHAR2(5) | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 19 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 20 | TEST_TYPE | VARCHAR2(5) | No |  |  |
| 21 | CTRL_VAL | VARCHAR2(3) | Yes |  |  |
| 22 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TEST_TEST_BAND_HDR_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/TEST_BAND_DETAIL\|SBCSYS.TEST_BAND_DETAIL]] | HDR_TEST_BAND_DET_FK | UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID → UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID |

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| TEST_BAND_HDR_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_BAND_HDR_UK | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, TB_ID, TEST_ID, TB_SEQ_NO, TEST_CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_BAND_HEADER_BD|TEST_BAND_HEADER_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BAND_HEADER_BI|TEST_BAND_HEADER_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BAND_HEADER_BU|TEST_BAND_HEADER_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
