---
tags:
  - table
  - LTAPI
---
# API_SPONSORS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | NAME | VARCHAR2(50) | No |  |  |
| 4 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 5 | TERRITORY_ID | VARCHAR2(10) | No |  |  |
| 6 | CATEGORY | VARCHAR2(5) | No |  |  |
| 7 | STATUS | VARCHAR2(5) | No |  |  |
| 8 | LOB | VARCHAR2(5) | Yes |  |  |
| 9 | EMPLOYEE_BASE | NUMBER(8) | Yes |  |  |
| 10 | PARENT_SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 11 | SPONSOR_RATING | VARCHAR2(5) | Yes |  |  |
| 12 | LOCATION_ID | VARCHAR2(10) | No |  |  |
| 13 | OLD_SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 14 | CONV_SPONSOR_ID | VARCHAR2(10) | Yes |  |  |
| 15 | EFF_DATE | DATE | No |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |
| 17 | INSERT_DATE | DATE | No |  |  |
| 18 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 19 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |
| 21 | EXT_APPL_ID | VARCHAR2(15) | Yes |  |  |
| 22 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 23 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 24 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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
