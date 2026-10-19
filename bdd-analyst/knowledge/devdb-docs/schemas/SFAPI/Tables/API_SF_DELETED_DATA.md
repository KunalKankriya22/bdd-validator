---
tags:
  - table
  - SFAPI
---
# API_SF_DELETED_DATA

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 416
**Last Analyzed**: 2025-07-30 03:00:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | DELETE_API_TABLE | VARCHAR2(30) | No |  |  |
| 4 | DELETE_REASON | VARCHAR2(50) | No |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | RECORD_READ_DATE | DATE | Yes |  |  |

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
