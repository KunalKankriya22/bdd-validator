---
tags:
  - table
  - DONSYS
---
# VALID_PROC_EXCLUSIONS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 181
**Last Analyzed**: 2026-04-22 03:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 2 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 3 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | EFF_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
