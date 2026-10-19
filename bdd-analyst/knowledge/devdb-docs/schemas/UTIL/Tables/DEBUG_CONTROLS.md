---
tags:
  - table
  - UTIL
---
# DEBUG_CONTROLS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4
**Last Analyzed**: 2025-09-16 03:16:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | OBJECT_NAME | VARCHAR2(100) | No |  |  |
| 2 | OBJECT_TYPE | VARCHAR2(10) | No |  |  |
| 3 | DEBUG_MODE | VARCHAR2(1) | No |  |  |
| 4 | DEBUG_LEVEL | NUMBER | Yes |  |  |

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
