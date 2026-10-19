---
tags:
  - table
  - UTIL
---
# INTERFACE_LOG_FAILURE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 51
**Last Analyzed**: 2025-09-16 03:16:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 2 | ID_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | ID_VALUE | VARCHAR2(15) | Yes |  |  |
| 4 | ACTION_CODE | VARCHAR2(1) | Yes |  |  |
| 5 | ERROR_CODE | NUMBER | Yes |  |  |
| 6 | ERROR_TEXT | VARCHAR2(100) | Yes |  |  |
| 7 | ERROR_LOCN | VARCHAR2(30) | Yes |  |  |
| 8 | INTERFACE_DATE | DATE | Yes |  |  |
| 9 | HOST_DATE | DATE | Yes |  |  |

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
