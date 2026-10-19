---
tags:
  - table
  - SBCSYS
---
# RGT_FINAL_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | RESULT_1 | VARCHAR2(4) | Yes |  |  |
| 5 | RESULT_2 | VARCHAR2(4) | Yes |  |  |
| 6 | RESULT_3 | VARCHAR2(4) | Yes |  |  |
| 7 | FINAL_RESULT | VARCHAR2(4) | Yes |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 9 | INSERT_DATS | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
