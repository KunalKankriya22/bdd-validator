---
tags:
  - table
  - LTAPI
---
# API_LOCATIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LOCATION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LOCATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | LOCATION_NAME | VARCHAR2(50) | No |  |  |
| 5 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 6 | SITE_DIRECTIONS | VARCHAR2(1000) | Yes |  |  |
| 7 | TRAVEL_TIME | NUMBER(3) | Yes |  |  |
| 8 | TRAVEL_DISTANCE | NUMBER(6,2) | Yes |  |  |
| 9 | CONV_LOCATION_ID | VARCHAR2(10) | Yes |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | EXT_APPL_ID | VARCHAR2(50) | No |  |  |
| 15 | OPEN_TIME | DATE | Yes |  |  |
| 16 | CLOSE_TIME | DATE | Yes |  |  |
| 17 | FDA_LICENSE_DATE | DATE | Yes |  |  |
| 18 | SITE_MANAGER | VARCHAR2(6) | Yes |  |  |
| 19 | EFF_DATE | DATE | No |  |  |
| 20 | TERM_DATE | DATE | Yes |  |  |
| 21 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 22 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 23 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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
