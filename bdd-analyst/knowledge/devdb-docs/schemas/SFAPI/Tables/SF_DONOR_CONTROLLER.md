---
tags:
  - table
  - SFAPI
---
# SF_DONOR_CONTROLLER

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 159
**Last Analyzed**: 2025-10-15 03:00:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | UNDER_PROCESSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 5 | PROCESS_EVENT | VARCHAR2(20) | Yes |  | Name of the process that triggered the insert.  PROFILE, ELIGIBILITY, DONATION, PHYSICAL, NULL |
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

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| SF_API | PACKAGE | SFAPI |
