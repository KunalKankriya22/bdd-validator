---
tags:
  - table
  - LTAPI
---
# API_DRIVE_HOURLY_DETAILS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LT_DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 2 | EXT_REF_ID | VARCHAR2(15) | Yes |  |  |
| 3 | DRIVE_DATE | DATE | Yes |  |  |
| 4 | HOUR_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | TOT_DON_COUNTS | NUMBER | Yes |  |  |
| 6 | TOT_HH_COUNTS | NUMBER | Yes |  |  |
| 7 | TOT_PHLEPO_COUNTS | NUMBER | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | PROCESS_STATUS | VARCHAR2(1) | Yes |  |  |
| 10 | TOT_PF_COUNTS | NUMBER | Yes |  |  |

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
