---
tags:
  - table
  - DONSYS
---
# LAPTOP_ID_DETAILS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:13:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LAPTOP_ID | VARCHAR2(10) | Yes |  |  |
| 2 | LT_TEMP_ID | VARCHAR2(10) | Yes |  |  |
| 3 | INSERT_DATE | DATE | Yes |  |  |
| 4 | COUNTER_VALUE | NUMBER | Yes |  |  |
| 5 | RESET_DATE | DATE | Yes |  |  |
| 6 | EXTRACT_IN_PROGRESS | VARCHAR2(1) | Yes |  |  |
| 7 | DOWNLOAD_ERROR_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | ERROR_MSG | VARCHAR2(1000) | Yes |  |  |

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
