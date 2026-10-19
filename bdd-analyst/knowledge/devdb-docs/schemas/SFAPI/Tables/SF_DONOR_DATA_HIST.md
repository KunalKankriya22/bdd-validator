---
tags:
  - table
  - SFAPI
---
# SF_DONOR_DATA_HIST

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 61987
**Last Analyzed**: 2025-09-30 03:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | DATE_SENT | DATE | Yes |  |  |
| 3 | INSERT_DATE | DATE | Yes |  |  |
| 4 | MISC_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | COMMENTS | VARCHAR2(500) | Yes |  |  |

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
