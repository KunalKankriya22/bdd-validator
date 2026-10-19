---
tags:
  - table
  - LTAPI
---
# API_DONOR_CONSENTS_ADT

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 127
**Last Analyzed**: 2025-05-03 03:01:01
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
| 9 | OLD_BLOB | BLOB | Yes |  |  |
| 10 | NEW_BLOB | BLOB | Yes |  |  |
| 11 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 12 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 13 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 14 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 15 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 16 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 17 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| NEW_BLOB | SYS_LOB0000079901C00010$$ | BC_DATA | YES | NO |
| OLD_BLOB | SYS_LOB0000079901C00009$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
