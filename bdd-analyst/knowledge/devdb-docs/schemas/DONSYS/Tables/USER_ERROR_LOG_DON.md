---
tags:
  - table
  - DONSYS
---
# USER_ERROR_LOG_DON

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INSERT_DATE | DATE | No |  |  |
| 2 | USER_ID | VARCHAR2(6) | No |  |  |
| 3 | PROGRAM_NAME | VARCHAR2(30) | No |  |  |
| 4 | ERROR_CODE | VARCHAR2(6) | No |  |  |
| 5 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | COLL_DATE | DATE | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | COMPONENT_PREFIX | NUMBER(2) | Yes |  |  |
| 9 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 10 | ERROR_MSG | VARCHAR2(500) | Yes |  |  |

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
