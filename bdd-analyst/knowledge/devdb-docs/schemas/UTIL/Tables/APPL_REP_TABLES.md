---
tags:
  - table
  - UTIL
---
# APPL_REP_TABLES

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 183
**Last Analyzed**: 2025-09-16 03:16:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPLICATION | VARCHAR2(10) | No |  |  |
| 2 | OWNER | VARCHAR2(30) | No |  |  |
| 3 | TABLE_NAME | VARCHAR2(30) | No |  |  |
| 4 | WHERE_CLAUSE | VARCHAR2(2000) | Yes |  |  |
| 5 | TYPE | VARCHAR2(1) | Yes |  |  |
| 6 | LAST_MODIFY_DATE | DATE | Yes |  |  |
| 7 | ALWAYS_LOCAL | VARCHAR2(1) | Yes |  |  |
| 8 | INIT_EXT | NUMBER | Yes |  |  |

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
