---
tags:
  - table
  - UTIL
---
# USER_SESSION_INFO

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 18562
**Last Analyzed**: 2025-09-16 03:16:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_NAME | VARCHAR2(30) | Yes |  |  |
| 2 | LOGON_TIME | DATE | Yes |  |  |
| 3 | SESSION_ID | NUMBER | Yes |  |  |
| 4 | SERNO | NUMBER | Yes |  |  |
| 5 | REMARKS | VARCHAR2(200) | Yes |  |  |

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
