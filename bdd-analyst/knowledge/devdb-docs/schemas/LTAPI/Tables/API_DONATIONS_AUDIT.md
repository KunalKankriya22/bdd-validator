---
tags:
  - table
  - LTAPI
---
# API_DONATIONS_AUDIT

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4696
**Last Analyzed**: 2025-10-21 03:00:23
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | Yes |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 4 | USER_ID | VARCHAR2(6) | Yes |  |  |
| 5 | ACTION_CODE | VARCHAR2(1) | Yes |  |  |
| 6 | COLUMN_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | OLD_VALUE | VARCHAR2(240) | Yes |  |  |
| 8 | NEW_VALUE | VARCHAR2(240) | Yes |  |  |
| 9 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
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

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONATIONS_AUDIT_IDX1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
