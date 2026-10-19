---
tags:
  - table
  - SFAPI
---
# API_SF_COMPONENTS_ARCH

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | COLL_DATE | DATE | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 4 | INSERT_DATE | DATE | No |  |  |
| 5 | RECORD_READ_DATE | DATE | Yes |  |  |
| 6 | STATUS | VARCHAR2(10) | Yes |  | it can take NEW, MODIFY, CONVERT, DELETE and REJECT |
| 7 | COMP_START_TIME | DATE | Yes |  |  |

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
