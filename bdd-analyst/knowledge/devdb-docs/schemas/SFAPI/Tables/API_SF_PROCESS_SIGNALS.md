---
tags:
  - table
  - SFAPI
---
# API_SF_PROCESS_SIGNALS

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3869
**Last Analyzed**: 2025-11-23 00:04:39
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | DONOR_ARRIVED_TIME | DATE | Yes |  |  |
| 4 | SCREENING_START_TIME | DATE | Yes |  |  |
| 5 | SCREENING_END_TIME | DATE | Yes |  |  |
| 6 | DONATION_START_TIME | DATE | Yes |  |  |
| 7 | DONATION_END_TIME | DATE | Yes |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | RECORD_READ_DATE | DATE | Yes |  |  |

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
