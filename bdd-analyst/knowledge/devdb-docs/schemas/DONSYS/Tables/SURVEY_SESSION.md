---
tags:
  - table
  - DONSYS
---
# SURVEY_SESSION

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 722
**Last Analyzed**: 2025-09-16 03:14:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(40) | Yes |  |  |
| 2 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 3 | INSERT_DATE | DATE | Yes |  |  |
| 4 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 5 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |

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
