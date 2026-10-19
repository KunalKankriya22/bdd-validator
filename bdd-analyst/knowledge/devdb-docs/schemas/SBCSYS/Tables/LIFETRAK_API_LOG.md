---
tags:
  - table
  - SBCSYS
---
# LIFETRAK_API_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1683
**Last Analyzed**: 2025-09-16 03:14:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EXTERNAL_ID | VARCHAR2(500) | Yes |  |  |
| 2 | INTERNAL_ID | VARCHAR2(15) | Yes |  |  |
| 3 | LOG_TEXT | VARCHAR2(500) | Yes |  |  |
| 4 | SOURCE_ID | VARCHAR2(500) | Yes |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

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
