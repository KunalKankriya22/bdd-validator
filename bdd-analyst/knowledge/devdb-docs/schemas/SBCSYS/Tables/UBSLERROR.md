---
tags:
  - table
  - SBCSYS
---
# UBSLERROR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1043
**Last Analyzed**: 2025-09-16 03:14:45
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ERROR_CODE | VARCHAR2(4) | No |  |  |
| 2 | ERROR_TYPE | VARCHAR2(1) | No |  |  |
| 3 | ERROR | VARCHAR2(70) | No |  |  |
| 4 | AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |

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
