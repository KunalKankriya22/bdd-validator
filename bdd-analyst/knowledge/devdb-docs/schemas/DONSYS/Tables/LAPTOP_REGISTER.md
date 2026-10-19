---
tags:
  - table
  - DONSYS
---
# LAPTOP_REGISTER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 118
**Last Analyzed**: 2026-04-09 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LAPTOP_ID | VARCHAR2(6) | Yes |  |  |
| 2 | LT_TEMP_ID | VARCHAR2(10) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 6 | CURRENT_SEQ | NUMBER | Yes |  |  |
| 7 | INCREMENT_BY | NUMBER | Yes |  |  |
| 8 | REFRESH_DATE | DATE | Yes |  |  |
| 9 | COL_1 | VARCHAR2(500) | Yes |  |  |
| 10 | COL_2 | VARCHAR2(500) | Yes |  |  |
| 11 | COL_3 | VARCHAR2(500) | Yes |  |  |
| 12 | COL_4 | VARCHAR2(500) | Yes |  |  |
| 13 | COL_5 | VARCHAR2(500) | Yes |  |  |

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
