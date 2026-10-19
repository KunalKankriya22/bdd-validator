---
tags:
  - table
  - DONSYS
---
# PROGRAM_ERRORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 931
**Last Analyzed**: 2026-05-16 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 2 | MODULE_ID | VARCHAR2(30) | No |  |  |
| 3 | STATEMENT_ID | NUMBER(3) | Yes |  |  |
| 4 | ITEM_ID | VARCHAR2(30) | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | ERROR_MSG | VARCHAR2(500) | No |  |  |

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
