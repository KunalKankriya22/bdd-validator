---
tags:
  - table
  - SFAPI
---
# SF_DONOR_CONTROLLER_ARCH

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 93429
**Last Analyzed**: 2025-06-01 23:07:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | UNDER_PROCESSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 5 | PROCESS_EVENT | VARCHAR2(20) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(50) | Yes |  |  |

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
