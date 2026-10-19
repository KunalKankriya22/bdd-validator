---
tags:
  - table
  - SBCSYS
---
# PT_BATCH_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 56
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BATCH_ID | VARCHAR2(14) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | TEST_ID | VARCHAR2(10) | No |  |  |
| 5 | TEST_SEQ_NO | NUMBER(2) | No |  |  |
| 6 | EXP_RESULT | VARCHAR2(4) | Yes |  |  |
| 7 | EXP_ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 8 | EXP_CUT_OFF | VARCHAR2(6) | Yes |  |  |
| 9 | REVIEWED_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | REVIEWED_USER | VARCHAR2(6) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |
| 12 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |

## Primary Key

**PT_BATCH_DET_PK**: `BATCH_ID, UNIT_ID, CHAPTER_ID, TEST_ID, TEST_SEQ_NO`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PT_BATCH_DET_IDX_1 | NORMAL | UNIQUE | BATCH_ID, UNIT_ID, CHAPTER_ID, TEST_ID, TEST_SEQ_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
