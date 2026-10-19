---
tags:
  - table
  - DONSYS
---
# BC_PRNT_JOB_LIST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 37
**Last Analyzed**: 2025-10-03 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FILE_NAME | VARCHAR2(100) | Yes |  |  |
| 2 | PRINT_ID | VARCHAR2(100) | Yes |  |  |
| 3 | NO_COPIES | NUMBER | Yes |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_DATS | DATE | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
