---
tags:
  - table
  - DONSYS
---
# ONLINE_STATUS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 149925
**Last Analyzed**: 2025-11-14 04:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | Yes |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 4 | USER_ID | VARCHAR2(6) | Yes |  |  |
| 5 | ACTION_CODE | VARCHAR2(1) | Yes |  |  |
| 6 | COLUMN_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | OLD_VALUE | VARCHAR2(240) | Yes |  |  |
| 8 | NEW_VALUE | VARCHAR2(240) | Yes |  |  |

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
