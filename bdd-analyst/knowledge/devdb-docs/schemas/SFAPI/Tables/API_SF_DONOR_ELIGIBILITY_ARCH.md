---
tags:
  - table
  - SFAPI
---
# API_SF_DONOR_ELIGIBILITY_ARCH

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | ELIG_PROC_CODE | VARCHAR2(5) | No |  |  |
| 3 | ELIG_STATUS | VARCHAR2(1) | Yes |  |  |
| 4 | NEXT_ELIG_DATE | DATE | Yes |  |  |
| 5 | DEFERRAL_REASON | VARCHAR2(100) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | RECORD_READ_DATE | DATE | Yes |  |  |

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
