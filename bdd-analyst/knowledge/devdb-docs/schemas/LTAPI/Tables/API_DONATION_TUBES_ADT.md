---
tags:
  - table
  - LTAPI
---
# API_DONATION_TUBES_ADT

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER(38) | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | ACTION_CODE | VARCHAR2(1) | No |  |  |
| 6 | COLUMN_NAME | VARCHAR2(50) | No |  |  |
| 7 | OLD_VALUE | VARCHAR2(240) | Yes |  |  |
| 8 | NEW_VALUE | VARCHAR2(240) | Yes |  |  |
| 9 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 10 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 11 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 12 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 13 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 14 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 15 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

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
