---
tags:
  - table
  - DONSYS
---
# VALID_ELIG_CELL_LOSS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 206
**Last Analyzed**: 2026-04-19 15:03:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(5) | Yes |  |  |
| 2 | CELL_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | MAXIMUM_LOSS | NUMBER(6) | Yes |  |  |
| 4 | DAYS_BETWEEN | NUMBER(6) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | AUDIT_INSERT_DATS | DATE | Yes |  |  |

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
