---
tags:
  - table
  - UTIL
---
# INSTITUTION_TABLES

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 41
**Last Analyzed**: 2025-09-16 03:16:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TABLE_NAME | VARCHAR2(50) | No |  |  |
| 2 | INSERT_DATE | DATE | No |  |  |
| 3 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 4 | AUDIT_KEY | NUMBER | No |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |

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
