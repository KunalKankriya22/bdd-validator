---
tags:
  - table
  - SFAPI
---
# SF_LAB_CONTROLLER_ARCH

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 22344
**Last Analyzed**: 2025-07-24 03:00:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | UNDER_PROCESSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 5 | PROCESS_EVENT | VARCHAR2(20) | No |  |  |
| 6 | STATUS | VARCHAR2(10) | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(50) | Yes |  |  |

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
