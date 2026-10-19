---
tags:
  - table
  - SBCSYS
---
# RGT_CONTRACT_RATES

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
| 3 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 4 | TESTING_CHARGES | NUMBER(9,2) | Yes |  |  |
| 5 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |

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
