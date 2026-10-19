---
tags:
  - table
  - SBCSYS
---
# ABORH_CONTROLS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TB_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | QC_UNIT_ID | VARCHAR2(15) | No |  |  |
| 5 | GROUP_NO | VARCHAR2(4) | Yes |  |  |
| 6 | SAMPLE_NO | VARCHAR2(4) | Yes |  |  |
| 7 | EXPECTED_ABO | VARCHAR2(4) | Yes |  |  |
| 8 | INSERT_DATS | DATE | No |  |  |
| 9 | QC_DATE | DATE | Yes |  |  |
| 10 | QC_USER_ID | VARCHAR2(6) | Yes |  |  |
| 11 | QC_ACCEPTABLE | VARCHAR2(1) | Yes |  |  |
| 12 | QC_REVIEW_ACCEPTABLE | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ABORH_CONTROLS_IDX_1 | NORMAL | UNIQUE | TB_ID, TEST_ID, TEST_CHAPTER_ID, GROUP_NO, SAMPLE_NO | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
