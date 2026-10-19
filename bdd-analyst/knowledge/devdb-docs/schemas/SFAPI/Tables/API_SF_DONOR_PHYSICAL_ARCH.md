---
tags:
  - table
  - SFAPI
---
# API_SF_DONOR_PHYSICAL_ARCH

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | PHYSICAL_CODE | VARCHAR2(10) | No |  |  |
| 4 | PHYSICAL_VALUE | VARCHAR2(10) | No |  |  |
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
