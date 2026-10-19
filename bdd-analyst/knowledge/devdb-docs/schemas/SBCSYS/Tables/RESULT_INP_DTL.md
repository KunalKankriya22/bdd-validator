---
tags:
  - table
  - SBCSYS
---
# RESULT_INP_DTL

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 32055
**Last Analyzed**: 2025-11-11 04:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_CODE | VARCHAR2(4) | No |  |  |
| 5 | UPLOAD_FLAG | CHAR(1) | Yes |  |  |
| 6 | ABSORBANCE | VARCHAR2(12) | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| HDR_RESULT_INP_DTL_FK | TB_ID, TEST_ID, CHAPTER_ID | [[schemas/SBCSYS/Tables/RESULT_INP_HDR\|SBCSYS.RESULT_INP_HDR]] (TB_ID, TEST_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| RESULT_INP_DTL_IDX_1 | NORMAL | NONUNIQUE | TB_ID, UNIT_ID, TEST_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
