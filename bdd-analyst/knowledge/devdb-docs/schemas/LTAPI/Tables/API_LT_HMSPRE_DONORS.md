---
tags:
  - table
  - LTAPI
---
# API_LT_HMSPRE_DONORS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | DRIVE_DATE | DATE | No |  |  |
| 3 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | PROCEDURE_CODE | VARCHAR2(5) | No |  |  |
| 5 | NO_OF_DONORS | NUMBER | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | RECORD_STATUS | VARCHAR2(1) | Yes |  |  |
| 9 | EXT_REF_ID | VARCHAR2(15) | Yes |  |  |

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
