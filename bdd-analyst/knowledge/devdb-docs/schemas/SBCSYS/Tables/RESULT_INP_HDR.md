---
tags:
  - table
  - SBCSYS
---
# RESULT_INP_HDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 236
**Last Analyzed**: 2025-11-22 04:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | FILE_NAME | VARCHAR2(30) | No |  |  |
| 4 | RECEIVED_DATE | DATE | Yes |  |  |
| 5 | UPDATE_FLAG | CHAR(1) | Yes |  |  |
| 6 | FILE_TYPE | VARCHAR2(1) | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | No |  |  |

## Primary Key

**RESULT_INP_HDR_PK**: `TB_ID, TEST_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/RESULT_INP_DTL\|SBCSYS.RESULT_INP_DTL]] | HDR_RESULT_INP_DTL_FK | TB_ID, TEST_ID, CHAPTER_ID → TB_ID, TEST_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESULT_INP_HDR_IDX_2 | NORMAL | NONUNIQUE | FILE_NAME | VALID |
| RESULT_INP_HDR_PK | NORMAL | UNIQUE | TB_ID, TEST_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
