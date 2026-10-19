---
tags:
  - table
  - SBCSYS
---
# CNF_QC_LOCK

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(20) | Yes |  |  |
| 2 | LOCK_LEVEL | VARCHAR2(1) | Yes |  |  |
| 3 | LOCK_VALUE | VARCHAR2(15) | Yes |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | Yes |  |  |

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
