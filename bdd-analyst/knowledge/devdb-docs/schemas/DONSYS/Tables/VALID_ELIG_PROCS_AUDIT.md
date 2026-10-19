---
tags:
  - table
  - DONSYS
---
# VALID_ELIG_PROCS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8540
**Last Analyzed**: 2025-09-16 03:14:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 6 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | CURR_DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | PREV_PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | DAYS_BETWEEN | NUMBER(4) | Yes |  |  |
| 10 | EFF_DATE | DATE | Yes |  |  |
| 11 | TERM_DATE | DATE | Yes |  |  |

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
