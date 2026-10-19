---
tags:
  - table
  - SBCSYS
---
# TEST_BATCH_CONTROLS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1529
**Last Analyzed**: 2025-09-16 03:14:42
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | CUT_OFF_VALUE | VARCHAR2(6) | Yes |  |  |
| 5 | REF_RESULT | VARCHAR2(4) | Yes |  |  |
| 6 | REF_RATIO | VARCHAR2(12) | Yes |  |  |
| 7 | REF_CONTROL | VARCHAR2(15) | Yes |  |  |
| 8 | REF_ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 9 | INSERT_DATS | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DET_TEST_BATCH_CNTRL_FK | TEST_CHAPTER_ID, TB_ID, TEST_ID | [[schemas/SBCSYS/Tables/TEST_BATCH_DET\|SBCSYS.TEST_BATCH_DET]] (TEST_CHAPTER_ID, TB_ID, TEST_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_BATCH_CONTROLS_IDX1 | NORMAL | NONUNIQUE | TB_ID, TEST_CHAPTER_ID, TEST_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_BATCH_CONTROLS_BD|TEST_BATCH_CONTROLS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BATCH_CONTROLS_BI|TEST_BATCH_CONTROLS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BATCH_CONTROLS_BU|TEST_BATCH_CONTROLS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
