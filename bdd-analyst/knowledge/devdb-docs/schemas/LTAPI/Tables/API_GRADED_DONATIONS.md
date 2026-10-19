---
tags:
  - table
  - LTAPI
---
# API_GRADED_DONATIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10
**Last Analyzed**: 2025-10-21 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 4 | GENDER | VARCHAR2(1) | Yes |  |  |
| 5 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 7 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 8 | SSN | NUMBER(9) | Yes |  |  |
| 9 | ACTIVE_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 14 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 15 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 16 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 17 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 18 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 19 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |

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
