---
tags:
  - table
  - SBCSYS
---
# USER_ERROR_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3263
**Last Analyzed**: 2026-05-23 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INSERT_DATS | DATE | No |  |  |
| 2 | USER_ID | VARCHAR2(6) | No |  |  |
| 3 | PROGRAM_NAME | VARCHAR2(8) | No |  |  |
| 4 | ERROR_CODE | VARCHAR2(4) | No |  |  |
| 5 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 6 | COLL_DATE | DATE | Yes |  |  |
| 7 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 8 | COMPONENT_PREFIX | VARCHAR2(2) | Yes |  |  |
| 9 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 10 | ERROR_MSG | VARCHAR2(500) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| USER_ERROR_LOG_IDX_1 | NORMAL | NONUNIQUE | INSERT_DATS, USER_ID, PROGRAM_NAME, ERROR_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
