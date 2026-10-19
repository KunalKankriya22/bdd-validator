---
tags:
  - table
  - SBCSYS
---
# PROFICIENCY_DATA

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | SCHL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 5 | EXPECTED_RESULT | VARCHAR2(4) | Yes |  |  |
| 6 | PT_BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 7 | CHECKIN_USER | VARCHAR2(6) | Yes |  |  |
| 8 | INSERT_DATS | DATE | Yes |  |  |
| 9 | REVIEW_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | REVIEW_DATE | DATE | Yes |  |  |
| 11 | REVIEW_USER_ID | VARCHAR2(6) | Yes |  |  |
| 12 | ABSORBANCE | VARCHAR2(10) | Yes |  |  |
| 13 | CONTRACT_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
