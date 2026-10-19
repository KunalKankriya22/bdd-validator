---
tags:
  - table
  - SBCSYS
---
# TEST_BATCH_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 49870
**Last Analyzed**: 2025-09-17 03:00:49
**Partitioned**: NO

> [!quote] Created from Entity TEST BATCH by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | GROUP_TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | FIRST_UNIT_ID | VARCHAR2(15) | No |  |  |
| 5 | LAST_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | REPEAT_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | START_WORK_NUMBER | NUMBER(4) | Yes |  |  |
| 8 | INSERT_DATS | DATE | No |  |  |
| 9 | USER_ID | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | NOTE_ID | NUMBER(10) | Yes |  |  |

## Primary Key

**TEST_BATCH_HDR_PK**: `TEST_CHAPTER_ID, TB_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/TEST_BATCH_DET\|SBCSYS.TEST_BATCH_DET]] | HDR_TEST_BATCH_DET_FK | TEST_CHAPTER_ID, TB_ID → TEST_CHAPTER_ID, TB_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_BATCH_HDR_IDX2 | NORMAL | NONUNIQUE | INSERT_DATS | VALID |
| TEST_BATCH_HDR_IDX_1 | NORMAL | UNIQUE | TB_ID, TEST_CHAPTER_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_BATCH_HDR_BD|TEST_BATCH_HDR_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BATCH_HDR_BI|TEST_BATCH_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/TEST_BATCH_HDR_BU|TEST_BATCH_HDR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
