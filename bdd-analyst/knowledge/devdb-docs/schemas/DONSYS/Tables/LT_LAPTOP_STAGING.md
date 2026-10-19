---
tags:
  - table
  - DONSYS
---
# LT_LAPTOP_STAGING

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-10-25 03:00:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DATA_STRING | VARCHAR2(4000) | Yes |  |  |
| 2 | FILE_NAME | VARCHAR2(240) | Yes |  |  |
| 3 | TABLE_NAME | VARCHAR2(240) | Yes |  |  |
| 4 | DECRYPT_DATA_STRING | VARCHAR2(4000) | Yes |  |  |
| 5 | DECRYPT_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | PROCESS_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | LAPTOP_ID | VARCHAR2(10) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 10 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 11 | SESSION_ID | VARCHAR2(50) | Yes |  |  |

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
