---
tags:
  - table
  - VISTA
---
# CG_REF_CODES

**Schema**: [[schemas/VISTA/VISTA|VISTA]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16
**Last Analyzed**: 2025-09-26 03:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RV_DOMAIN | VARCHAR2(100) | No |  |  |
| 2 | RV_LOW_VALUE | VARCHAR2(240) | No |  |  |
| 3 | RV_HIGH_VALUE | VARCHAR2(240) | Yes |  |  |
| 4 | RV_ABBREVIATION | VARCHAR2(240) | Yes |  |  |
| 5 | RV_MEANING | VARCHAR2(240) | Yes |  |  |

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
