---
tags:
  - table
  - SBCSYS
---
# VALID_ERRORS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 282
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ERROR_CODE | VARCHAR2(4) | Yes |  |  |
| 2 | ERROR_TYPE | VARCHAR2(1) | Yes |  |  |
| 3 | ERROR | VARCHAR2(70) | Yes |  |  |
| 4 | AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | AUDIT_KEY | NUMBER(10) | Yes |  |  |
| 6 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 7 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
