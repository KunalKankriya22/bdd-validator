---
tags:
  - table
  - LTAPI
---
# DB_PACKAGE_LOCK

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 17
**Last Analyzed**: 2025-11-21 04:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PACKAGE_NAME | VARCHAR2(50) | Yes |  |  |
| 2 | FUNCTION_NAME | VARCHAR2(50) | Yes |  |  |
| 3 | LOCKED_ON | DATE | Yes |  |  |
| 4 | LOCKED_BY | VARCHAR2(30) | Yes |  |  |

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
